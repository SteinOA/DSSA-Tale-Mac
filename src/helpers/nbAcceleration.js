const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function accelerationMode(value) {
  return ["auto", "metal", "cpu"].includes(value) ? value : "auto";
}

// The optional helper was built with M4-native instructions. Unknown chips
// always retain the existing portable engine; arm64 alone is not sufficient.
function selectCoreMLBinary({ roots = [], mode = process.env.NB_ACCELERATION,
  platform = process.platform, arch = process.arch,
  cpuModel = os.cpus()[0]?.model || "", exists = fs.existsSync, cpuOnly = false } = {}) {
  if (platform !== "darwin" || arch !== "arm64" || cpuOnly ||
      mode !== "auto" || !/^Apple M4(?: Pro| Max)?$/.test(cpuModel)) return null;
  for (const root of roots.filter(Boolean)) {
    const binary = path.join(root, "bin", "whisper-server-coreml-darwin-arm64");
    const full = path.join(root, "nb-models", "ggml-nb-large-full-encoder.mlmodelc", "model.mil");
    const q5 = path.join(root, "nb-models", "ggml-nb-large-encoder.mlmodelc", "model.mil");
    if (exists(binary) && exists(full) && exists(q5)) return binary;
  }
  return null;
}

module.exports = { accelerationMode, selectCoreMLBinary };
