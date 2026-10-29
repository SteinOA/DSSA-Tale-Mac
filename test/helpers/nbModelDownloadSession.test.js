const test = require("node:test");
const assert = require("node:assert/strict");
const { isCuratedModelUrl, allowsModelDownloadRequest } = require("../../src/helpers/nbModelDownloadSession");
const url = "https://huggingface.co/bartowski/Qwen_Qwen3.5-2B-GGUF/resolve/main/Qwen_Qwen3.5-2B-Q4_K_M.gguf";
test("only exact curated model entrypoints receive the isolated transport", () => {
  assert.equal(isCuratedModelUrl(url), true);
  for (const other of [url+"?anything",url.replace("2B-Q4_K_M", "2B-Q8_0"),"https://api.openai.com/v1/audio/transcriptions"]) assert.equal(isCuratedModelUrl(other),false);
});
test("download policy permits GET model/CDN redirects but blocks uploads and unrelated hosts", () => {
  for(const target of [url,"https://us.aws.cdn.hf.co/blob?signature=example","https://cas-bridge.xethub.hf.co/blob"]) {
    assert.equal(allowsModelDownloadRequest({url:target,method:"GET"}),true);
    assert.equal(allowsModelDownloadRequest({url:target,method:"POST"}),false);
  }
  for(const target of ["https://api.openai.com/v1/audio/transcriptions","https://huggingface.co/other/model","http://us.aws.cdn.hf.co/blob","https://us.aws.cdn.hf.co.evil.example/blob","https://user:pass@us.aws.cdn.hf.co/blob"]) assert.equal(allowsModelDownloadRequest({url:target,method:"GET"}),false);
});
test('both NB Large variants use immutable revision URLs and checksum-pinned isolated routes',()=>{
 const registry=require('../../src/models/modelRegistryData.json');
 for(const id of ['nb-large','nb-large-full']){const model=registry.whisperModels[id];assert.match(model.downloadUrl,/\/resolve\/[a-f0-9]{40}\//);assert.match(model.sha256,/^[a-f0-9]{64}$/);assert.ok(model.expectedSizeBytes>1e9);assert.equal(isCuratedModelUrl(model.downloadUrl),true);assert.equal(isCuratedModelUrl(model.downloadUrl.replace(/\/resolve\/[^/]+\//,'/resolve/main/')),false);assert.equal(allowsModelDownloadRequest({method:'POST',url:model.downloadUrl}),false);}
});
test('diarization transport only admits exact pinned release entrypoints and GET release CDN',()=>{
 const models=require('../../src/models/nbDiarizationManifest.json');for(const id of ['archive','embedding','vad'])assert.equal(isCuratedModelUrl(models[id].url),true);
 assert.equal(allowsModelDownloadRequest({method:'GET',url:'https://release-assets.githubusercontent.com/github-production-release-asset/example'}),true);
 for(const url of ['https://github.com/k2-fsa/sherpa-onnx/releases/download/other/model.onnx','https://release-assets.githubusercontent.com.evil.test/blob','https://api.github.com/repos/k2-fsa/sherpa-onnx'])assert.equal(allowsModelDownloadRequest({method:'GET',url}),false);
 assert.equal(allowsModelDownloadRequest({method:'POST',url:'https://release-assets.githubusercontent.com/blob'}),false);
});
