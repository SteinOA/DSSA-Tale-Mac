const path = require("path");
let addon;
function load() {
  if (addon) return addon;
  for (const root of [process.resourcesPath, path.join(__dirname,"../..","resources")].filter(Boolean)) {
    try { addon = require(path.join(root,"bin","macos-native-audio.node")); return addon; } catch {}
  }
  throw new Error("Lydkomponenten mangler. Installer siste DSSA Tale-pakke på nytt.");
}
function listOutputs() { return load().listOutputs(); }
function playTone(uid,kind) {
  if (typeof uid !== "string" || uid.length > 1024 || !["test","start","stop"].includes(kind)) throw new Error("Ugyldig lydvalg.");
  return load().playTone(uid,kind);
}
module.exports={listOutputs,playTone};
