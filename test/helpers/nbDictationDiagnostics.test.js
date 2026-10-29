const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { recordTiming, readTiming } = require("../../src/helpers/nbDictationDiagnostics");

async function sandbox(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nb-timing-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test("timing persists only finite bounded metrics and boolean success, never content", async t => {
  const root = await sandbox(t);
  await recordTiming(root, "pipeline", {
    audioDurationMs: 86400000, transcriptionProcessingDurationMs: 0,
    reasoningProcessingDurationMs: 12.5, roundTripDurationMs: 86400001,
    pasteMs: -1, activationMs: NaN, dispatchMs: Infinity,
    textLength: "20", outputTextLength: 40, success: false,
    transcript: "PRIVATE", audio: "PRIVATE", device: "PRIVATE", appName: "PRIVATE", at: "PRIVATE",
  });
  const result = await readTiming(root);
  assert.match(result.pipeline.at, /^\d{4}-\d\d-\d\dT.*Z$/);
  const { at, ...metrics } = result.pipeline;
  assert.deepEqual(metrics, { audioDurationMs: 86400000, transcriptionProcessingDurationMs: 0,
    reasoningProcessingDurationMs: 12.5, outputTextLength: 40, success: false });
  const raw = await fs.readFile(path.join(root, "dictation-timing.json"), "utf8");
  assert.equal(raw.includes("PRIVATE"), false);
  if (process.platform !== "win32") assert.equal((await fs.stat(path.join(root, "dictation-timing.json"))).mode & 0o777, 0o600);
});

test("concurrent writes preserve latest of both kinds, read waits, and leaves no temporary files", async t => {
  const root = await sandbox(t);
  const writes = [];
  for (let i = 0; i < 30; i++) {
    writes.push(recordTiming(root, "pipeline", { textLength: i }));
    writes.push(recordTiming(root, "paste", { pasteMs: i, activationMs: 3, dispatchMs: 4, success: true }));
  }
  const result = await readTiming(root);
  await Promise.all(writes);
  assert.equal(result.pipeline.textLength, 29);
  assert.equal(result.paste.pasteMs, 29);
  assert.equal(result.paste.activationMs, 3);
  assert.equal(result.paste.dispatchMs, 4);
  assert.equal(result.paste.success, true);
  assert.deepEqual((await fs.readdir(root)).sort(), ["dictation-timing.json"]);
});

test("missing/corrupt files recover and old unapproved data is removed on rewrite", async t => {
  const root = await sandbox(t);
  assert.deepEqual(await readTiming(root), {});
  const file = path.join(root, "dictation-timing.json");
  await fs.writeFile(file, "broken");
  assert.deepEqual(await readTiming(root), {});
  await recordTiming(root, "paste", { success: "yes" });
  assert.equal(Object.hasOwn((await readTiming(root)).paste, "success"), false);
  await fs.writeFile(file, JSON.stringify({ pipeline: { at: new Date().toISOString(), textLength: 4, text: "PRIVATE" }, paste: { at: "PRIVATE" }, secret: "PRIVATE" }));
  await recordTiming(root, "paste", { pasteMs: 5 });
  assert.equal((await readTiming(root)).pipeline.textLength, 4);
  assert.equal((await fs.readFile(file, "utf8")).includes("PRIVATE"), false);
  await assert.rejects(recordTiming(root, "PRIVATE", {}), /kind/);
});

test("a failed write does not poison the queue and metadata is snapshotted", async t => {
  const root = await sandbox(t);
  const file = path.join(root, "dictation-timing.json");
  await fs.mkdir(file);
  await assert.rejects(recordTiming(root, "paste", { pasteMs: 1 }));
  await fs.rmdir(file);
  const meta = { pasteMs: 2 };
  const pending = recordTiming(root, "paste", meta);
  meta.pasteMs = 999;
  await pending;
  assert.equal((await readTiming(root)).paste.pasteMs, 2);
});
