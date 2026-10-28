const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
test("output choice persists and missing devices never silently reroute", async () => {
  const saved = new Map();
  global.localStorage = { getItem: k => saved.get(k), setItem: (k,v) => saved.set(k,v) };
  try {
    const source = fs.readFileSync(path.join(__dirname,"../../src/utils/nbAudioOutput.js"),"utf8");
    const url = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
    const output = await import(url);
    output.saveAudioOutput("usb-speaker", "My speaker");
    const reloaded = await import(url + "#reload");
    assert.deepEqual(reloaded.getAudioOutput(), {deviceId:"usb-speaker",label:"My speaker"});
    const calls = [];
    await assert.rejects(output.applyAudioOutput({setSinkId:async id=>{calls.push(id);throw new Error("missing");}}),/missing/);
    assert.deepEqual(calls,["usb-speaker"]);
    assert.equal(output.getAudioOutput().deviceId,"usb-speaker");
    await assert.rejects(output.applyAudioOutput({}),/standardutgang/);
    output.saveAudioOutput("", "");
    await output.applyAudioOutput({setSinkId: async id=>calls.push(id)});
    assert.equal(calls[1], "");
    await output.applyAudioOutput({});
  } finally { delete global.localStorage; }
});
