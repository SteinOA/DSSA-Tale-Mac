const path = require("path");
let cached;
function load() {
  if (process.platform !== "darwin") return null;
  if (cached !== undefined) return cached;
  const roots = [process.resourcesPath, path.join(__dirname, "../..", "resources")].filter(Boolean);
  let error;
  for (const root of roots) {
    try { cached = require(path.join(root, "bin", "macos-native-paste.node")); return cached; }
    catch (err) { error = err; }
  }
  // An unavailable native component is a packaging error, not a request for
  // broader system permissions. Never silently switch to AppleScript.
  cached = null;
  require("./debugLogger").error("Native paste component unavailable", { code: error?.code });
  return null;
}
function status() {
  const native = load();
  if (!native) return { trusted: false, canPost: false, nativeAvailable: false };
  return { ...native.status(), nativeAvailable: true };
}
function paste(expectedPid = 0) {
  const native = load();
  if (!native) throw Object.assign(new Error("Innlimingskomponenten mangler. Installer DSSA Tale på nytt fra DMG-filen."), {code:"NATIVE_PASTE_UNAVAILABLE"});
  return native.paste(expectedPid || 0);
}
function verify(finalCheck = true) {
  return load()?.verify?.(finalCheck) || "unverified";
}
function openTestDocument(file) {
  const native = load();
  if (!native?.openTestDocument) throw new Error("Testkomponenten mangler.");
  return native.openTestDocument(file);
}
async function activateTarget(pid) {
  const native = load();
  if (!(pid > 0) || !native?.activateTarget) return false;
  const current = native.status();
  if (current.frontmostPid === pid && !current.ownKeyWindow) return true;
  if (!native.activateTarget(pid)) return false;
  // One short focus hand-off, never a ladder of multi-second script calls.
  const deadline = Date.now() + 300;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 25));
    const current = native.status();
    if (current.frontmostPid === pid && !current.ownKeyWindow) return true;
  }
  return false;
}
module.exports = { status, paste, verify, openTestDocument, activateTarget };
