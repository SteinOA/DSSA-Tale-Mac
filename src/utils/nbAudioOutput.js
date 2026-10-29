// App-local playback selection. Never changes the macOS default audio device.
const KEY = "nbAudioOutput";
const NATIVE_KEY = "nbNativeAudioOutput";
const nativeAPI = () => typeof window !== "undefined" && window.electronAPI?.nbAudioOutputs && window.electronAPI?.nbPlayAudioTest ? window.electronAPI : null;
export async function audioOutputStep(stage, operation, timeoutMs = 4000) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => { timer = setTimeout(() => {
        const error = new Error("Lydutgangen svarte ikke innen tidsfristen.");
        error.name = "TimeoutError";
        reject(error);
      }, timeoutMs); }),
    ]);
  } catch (error) {
    const wrapped = new Error(`${stage}: ${error?.name || "Error"} – ${error?.message || String(error)}`);
    wrapped.name = error?.name || "Error";
    wrapped.stage = stage;
    throw wrapped;
  } finally { clearTimeout(timer); }
}
export function getAudioOutput() {
  try {
    const native = nativeAPI();
    const stored = localStorage.getItem(native ? NATIVE_KEY : KEY);
    if (native && !stored) {
      const previous = JSON.parse(localStorage.getItem(KEY) || "null");
      if (previous?.deviceId) return {deviceId:"legacy-web:"+previous.deviceId,label:previous.label || "Velg høyttaler på nytt"};
    }
    const value = JSON.parse(stored || "null");
    if (value && typeof value.deviceId === "string") return value;
  } catch { /* First start or invalid saved value. */ }
  return { deviceId: "", label: "" };
}
export function saveAudioOutput(deviceId, label) {
  localStorage.setItem(nativeAPI() ? NATIVE_KEY : KEY, JSON.stringify({ deviceId, label }));
}
export async function applyAudioOutput(target) {
  const { deviceId } = getAudioOutput();
  if (typeof target.setSinkId !== "function") {
    if (deviceId) throw new Error("Denne avspilleren støtter ikke valgt høyttaler. Velg Mac-ens standardutgang.");
    return;
  }
  // Reapply even for system default, including when switching back from a device.
  // A missing device fails explicitly: never erase the saved choice or silently reroute.
  await audioOutputStep("Velg lydutgang (setSinkId)", () => target.setSinkId(deviceId));
}
export async function playNativeAudioCue(kind) {
  const api = nativeAPI();
  if (!api) return false;
  const {deviceId} = getAudioOutput();
  if (deviceId.startsWith("legacy-web:")) throw new Error("Velg høyttaler på nytt i lydinnstillingene. Det gamle valget er beholdt.");
  const result = await audioOutputStep("CoreAudio",()=>kind === "test" ? api.nbPlayAudioTest(deviceId) : api.nbPlayAudioCue(kind,deviceId),6000);
  if (!result?.success) throw new Error(result?.error || "CoreAudio kunne ikke spille lyden.");
  return true;
}
export async function testAudioOutput() {
  if (await playNativeAudioCue("test")) return;
  const context = new AudioContext();
  try {
    // Request playback within the click gesture, before awaiting device selection.
    const pendingResume = context.resume();
    const resumed = audioOutputStep("Start lydmotor (resume)", () => pendingResume)
      .then(() => null, error => error);
    await applyAudioOutput(context);
    const resumeError = await resumed;
    if (resumeError) throw resumeError;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 523.25;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.03);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.4);
    oscillator.connect(gain); gain.connect(context.destination);
    await audioOutputStep("Spill testtone", () => new Promise(resolve => { oscillator.onended = resolve; oscillator.start(); oscillator.stop(context.currentTime + 0.45); }));
  } finally {
    // Cleanup must neither leave the button stuck nor obscure the original failure.
    try { await audioOutputStep("Lukk lydmotor", () => context.close(), 1000); } catch { /* bounded cleanup */ }
  }
}
