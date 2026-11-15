const fs = require("fs").promises;
const path = require("path");
const { randomUUID } = require("crypto");

const queues = new Map();
const fields = [
  "audioDurationMs", "transcriptionProcessingDurationMs", "reasoningProcessingDurationMs",
  "roundTripDurationMs", "pasteMs", "textLength", "outputTextLength", "activationMs", "dispatchMs",
];
const maxValue = 24 * 60 * 60 * 1000;

function location(userDataPath) {
  if (typeof userDataPath !== "string" || !userDataPath.trim()) throw new TypeError("User data path required");
  return path.join(path.resolve(userDataPath), "dictation-timing.json");
}

function sanitize(meta, at) {
  const result = { at };
  if (!meta || typeof meta !== "object") return result;
  for (const key of fields) {
    const value = meta[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= maxValue) result[key] = value;
  }
  if (typeof meta.success === "boolean") result.success = meta.success;
  return result;
}

async function readFile(file) {
  let parsed;
  try { parsed = JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) return {};
    throw error;
  }
  const result = {};
  for (const kind of ["pipeline", "paste"]) {
    const record = parsed?.[kind];
    // Reconstruct a valid timestamp instead of retaining arbitrary stored strings.
    if (!record || typeof record.at !== "string") continue;
    const time = Date.parse(record.at);
    if (!Number.isFinite(time)) continue;
    result[kind] = sanitize(record, new Date(time).toISOString());
  }
  return result;
}

async function recordTiming(userDataPath, kind, meta) {
  if (kind !== "pipeline" && kind !== "paste") throw new TypeError("Invalid timing kind");
  const file = location(userDataPath);
  // Snapshot the allowlisted values before waiting: callers may reuse their object.
  const record = sanitize(meta, new Date().toISOString());
  const previous = queues.get(file) || Promise.resolve();
  const pending = previous.catch(() => {}).then(async () => {
    const records = await readFile(file);
    records[kind] = record;
    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(records, null, 2) + "\n", { flag: "wx", mode: 0o600 });
      await fs.rename(temporary, file);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  });
  queues.set(file, pending);
  try { await pending; }
  finally { if (queues.get(file) === pending) queues.delete(file); }
}

async function readTiming(userDataPath) {
  const file = location(userDataPath);
  await (queues.get(file) || Promise.resolve()).catch(() => {});
  return readFile(file);
}

module.exports = { recordTiming, readTiming };
