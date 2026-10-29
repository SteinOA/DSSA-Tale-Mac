const { session } = require("electron");
const registry = require("../models/modelRegistryData.json");

// Only the four checksum-pinned, optional NB language models get a network
// transport. Other downloads keep the default (offline) session policy.
const curatedIds = new Set([
  "qwen2.5-1.5b-instruct-q5_k_m", "qwen3.5-2b-q4_k_m",
  "qwen3.5-4b-q4_k_m", "qwen3-8b-q4_k_m",
]);
const curatedUrls = new Set(registry.localProviders.flatMap(provider => provider.models)
  .filter(model => curatedIds.has(model.id) && model.sha256 && model.verifiedSizeBytes)
  .map(model => `https://huggingface.co/${model.hfRepo}/resolve/main/${model.fileName}`));

function isCuratedModelUrl(url) {
  return curatedUrls.has(url);
}

function allowsModelDownloadRequest(details) {
  if (details.method !== "GET") return false;
  try {
    const url = new URL(details.url);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
    if (isCuratedModelUrl(details.url)) return true;
    // Hugging Face redirects GGUF blobs to these signed content-delivery hosts.
    return url.hostname === "cdn-lfs.huggingface.co" ||
      url.hostname === "cas-bridge.xethub.hf.co" ||
      url.hostname.endsWith(".cdn.hf.co");
  } catch { return false; }
}

let downloadSession;
function getModelDownloadSession(url) {
  if (!isCuratedModelUrl(url)) return undefined;
  if (!downloadSession) {
    // No persist: prefix, browser windows, user cookies or cloud-provider access.
    downloadSession = session.fromPartition("nb-curated-model-downloads", { cache: false });
    downloadSession.webRequest.onBeforeRequest((details, callback) => {
      callback({ cancel: !allowsModelDownloadRequest(details) });
    });
  }
  return downloadSession;
}

module.exports = { isCuratedModelUrl, allowsModelDownloadRequest, getModelDownloadSession };
