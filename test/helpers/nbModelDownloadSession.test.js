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
