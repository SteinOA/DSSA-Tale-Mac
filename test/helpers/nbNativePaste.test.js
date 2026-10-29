const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const file = require.resolve("../../src/helpers/clipboard");
const originalLoad = Module._load;
const originalExitListeners = new Set(process.listeners("exit"));

function setup({ trusted = true, failure = null, verification = "verified" } = {}) {
  const state = { trusted, failure, text: "Previous clipboard", posted: [], spawns: 0 };
  const native = { paste(pid) {
    if (state.failure) throw Object.assign(new Error(state.failure), { code: state.failure });
    state.posted.push(pid); return {posted:true,method:"session-command-v",targetPid:pid};
  }, verify() { return Array.isArray(verification) ? verification.shift() || "verified" : verification; } };
  Module._load = function(request, parent, isMain) {
    if (request === "electron") return {
      app: { getName: () => "DSSA Tale" },
      clipboard: { writeText: text => { state.text = text; } },
      systemPreferences: { isTrustedAccessibilityClient: () => state.trusted },
    };
    if (request === "./nbNativePaste") return native;
    if (request === "./debugLogger") return { debug() {}, info() {}, error() {}, warn() {} };
    if (request === "child_process") return { ...require("node:child_process"), spawn() {
      state.spawns++; throw new Error("Subprocess paste must not be used by DSSA Tale");
    } };
    return originalLoad.call(this, request, parent, isMain);
  };
  delete require.cache[file];
  const Manager = require(file);
  const manager = new Manager();
  manager.resolveFastPasteBinary = () => "/legacy-helper";
  manager._captureClipboardSnapshot = () => null;
  manager.showAccessibilityDialog = () => {};
  return { state, manager };
}
test.afterEach(() => {
  Module._load = originalLoad; delete require.cache[file];
  for (const fn of process.listeners("exit")) if (!originalExitListeners.has(fn)) process.removeListener("exit", fn);
});

test("DSSA Tale posts through its own process, forwards captured target and avoids helpers", async () => {
  const {state, manager} = setup();
  const result=await manager.pasteMacOS(null, { expectedTargetPid: 4321 });
  assert.deepEqual(state.posted, [4321]); assert.equal(state.spawns, 0);
  assert.equal(result.method,"session-command-v");
  assert.equal(result.targetPid,4321);
  assert.equal(result.dispatched,true);
  assert.equal(result.verification,"verified");
});
test("a new Accessibility grant is rechecked without waiting for the old denial cache", async () => {
  const {state, manager} = setup({trusted:false});
  assert.equal(await manager.checkAccessibilityPermissions(), false);
  state.trusted = true;
  assert.equal(await manager.checkAccessibilityPermissions(), true);
});
test("permission denial keeps dictated text and does not attempt a bypass", async () => {
  const {state, manager} = setup({trusted:false});
  await assert.rejects(manager._pasteText("Norsk tekst æøå", {restoreClipboard:false}), /permissions required/);
  assert.equal(state.text, "Norsk tekst æøå");
  assert.equal(state.posted.length, 0); assert.equal(state.spawns, 0);
});
test("native target errors remain visible and preserve text without AppleScript fallback", async () => {
  const {state, manager} = setup({failure:"TARGET_CHANGED"});
  await assert.rejects(manager._pasteText("Behold denne teksten", {restoreClipboard:false}), /TARGET_CHANGED/);
  assert.equal(state.text, "Behold denne teksten"); assert.equal(state.spawns, 0);
});
test("clipboard restore is scheduled only after native paste accepted the shortcut", async () => {
  const {state, manager} = setup();
  let restored = false;
  manager._restoreClipboardAfterDelay = () => {
    assert.equal(state.posted.length, 1); restored = true; return Promise.resolve();
  };
  const result = await manager.pasteMacOS({text:"Previous clipboard"});
  await result.restoreComplete; assert.equal(restored, true);
});
test("unchanged receiving field reports failure and keeps text without a duplicate retry", async () => {
  const {state, manager} = setup({verification:"unchanged"});
  manager._saveClipboard = () => ({text:"Old clipboard"});
  manager._restoreClipboardAfterDelay = () => { throw new Error("Must retain dictated text"); };
  await assert.rejects(manager._pasteText("Behold teksten", {restoreClipboard:true}), {code:"PASTE_NOT_CONFIRMED"});
  assert.equal(state.text, "Behold teksten");
  assert.equal(state.posted.length, 1);
});
test("a receiver without readable Accessibility text retains the new clipboard", async () => {
  const {manager} = setup({verification:"unverified"});
  manager._restoreClipboardAfterDelay = () => { throw new Error("Must retain dictated text"); };
  const result = await manager.pasteMacOS({text:"Old clipboard"});
  assert.equal(result.verification, "unverified");
  await result.restoreComplete;
});

test("a slower editor can confirm the single paste after its first unchanged AX snapshot", async () => {
  const {state, manager} = setup({verification:["unchanged","verified"]});
  const result = await manager.pasteMacOS(null, {expectedTargetPid:4321});
  assert.equal(result.verification,"verified");
  assert.deepEqual(state.posted,[4321],"Wait for the receiver without sending duplicate text");
});
