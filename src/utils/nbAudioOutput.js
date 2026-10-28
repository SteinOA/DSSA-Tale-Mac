// App-local playback selection. Never changes the macOS default audio device.
const KEY = "nbAudioOutput";
export function getAudioOutput() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    if (value && typeof value.deviceId === "string") return value;
  } catch { /* First start or invalid saved value. */ }
  return { deviceId: "", label: "" };
}
export function saveAudioOutput(deviceId, label) {
  localStorage.setItem(KEY, JSON.stringify({ deviceId, label }));
}
export async function applyAudioOutput(target) {
  const { deviceId } = getAudioOutput();
  if (typeof target.setSinkId !== "function") {
    if (deviceId) throw new Error("Denne avspilleren støtter ikke valgt høyttaler. Velg Mac-ens standardutgang.");
    return;
  }
  // Reapply even for system default, including when switching back from a device.
  // A missing device fails explicitly: never erase the saved choice or silently reroute.
  await target.setSinkId(deviceId);
}
export async function testAudioOutput() {
  const context = new AudioContext();
  try {
    await applyAudioOutput(context);
    await context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 523.25;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.03);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.4);
    oscillator.connect(gain); gain.connect(context.destination);
    await new Promise(resolve => { oscillator.onended = resolve; oscillator.start(); oscillator.stop(context.currentTime + 0.45); });
  } finally { await context.close(); }
}
