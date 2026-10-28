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
    await assert.rejects(output.audioOutputStep("resume",()=>new Promise(()=>{}),10), error=>error.name === "TimeoutError" && error.stage === "resume");
    await assert.rejects(output.audioOutputStep("setSinkId",()=>{const error=new Error("Permission denied");error.name="NotAllowedError";throw error;}), error=>error.name === "NotAllowedError" && error.message.includes("Permission denied") && error.stage === "setSinkId");
    output.saveAudioOutput("old-web-id","Old choice");
    const nativeCalls=[];
    global.window={electronAPI:{nbAudioOutputs:async()=>[],nbPlayAudioTest:async uid=>{nativeCalls.push(uid);return {success:true};},nbPlayAudioCue:async(kind,uid)=>{nativeCalls.push([kind,uid]);return {success:true};}}};
    assert.equal(output.getAudioOutput().deviceId,"legacy-web:old-web-id");
    await assert.rejects(output.testAudioOutput(),/Velg høyttaler på nytt/);
    assert.equal(nativeCalls.length,0);
    output.saveAudioOutput("BuiltInSpeakerDevice","Mac mini");
    await output.testAudioOutput();
    await output.playNativeAudioCue("start");
    assert.deepEqual(nativeCalls,["BuiltInSpeakerDevice",["start","BuiltInSpeakerDevice"]]);
    assert.equal(JSON.parse(saved.get("nbAudioOutput")).deviceId,"old-web-id");
  } finally { delete global.localStorage; delete global.window; }
});
