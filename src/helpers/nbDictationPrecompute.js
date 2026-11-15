// Optional per-recording optimization only. Callers MUST retain their normal final
// normalization/chunking path and use lookup only on its exact 28-second chunks.
const { createHash } = require('node:crypto');
const { getPcm16WavData, slicePcm16Wav } = require('./nbAudioChunks');
const WINDOW_BYTES = 28 * 32000;
function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  throw new TypeError('Precompute settings must contain only JSON values');
}
function settingsKey(settings) {
  if (!settings || typeof settings.model !== 'string' || !settings.model ||
      typeof settings.language !== 'string' || !settings.language || !settings.decoder) {
    throw new TypeError('Explicit model identity, language and complete decoder settings required');
  }
  return canonical(settings);
}
function key(pcm, settings) {
  return createHash('sha256').update(settings).update('\0').update(pcm).digest('hex');
}
class NbDictationPrecompute {
  constructor({ normalize, transcribe, maxSnapshotBytes = 128 * 1024 * 1024, maxEntries = 64 } = {}) {
    if (typeof normalize !== 'function' || typeof transcribe !== 'function') throw new TypeError('Callbacks required');
    if (!Number.isSafeInteger(maxSnapshotBytes) || maxSnapshotBytes < 1 || !Number.isSafeInteger(maxEntries) || maxEntries < 1) throw new TypeError('Invalid cache limits');
    Object.assign(this, { normalize, transcribe, maxSnapshotBytes, maxEntries });
    this.session = null;
    this.running = null;
  }
  begin(settings) {
    const serialized = settingsKey(settings);
    this.cancel();
    const token = Symbol('dictation');
    this.session = { token, serialized, settings: structuredClone(settings), cache: new Map(), inFlight: new Map(), pending: null, controller: new AbortController(), accepting: true };
    return token;
  }
  offer(token, originalWebm) {
    const s = this.session;
    if (!s || s.token !== token || !s.accepting || !Buffer.isBuffer(originalWebm) || originalWebm.length > this.maxSnapshotBytes || !originalWebm.length) return false;
    // Copy: MediaRecorder snapshot ownership stays with the caller. Newest wins.
    s.pending = Buffer.from(originalWebm);
    this._schedule();
    return true;
  }
  _schedule() {
    if (this.running || !this.session?.pending) return;
    const job = this._run();
    this.running = job;
    job.finally(() => { this.running = null; this._schedule(); });
  }
  async _run() {
    const s = this.session;
    const active = () => this.session === s && !s.controller.signal.aborted;
    while (active() && s.pending) {
      const input = s.pending; s.pending = null;
      try {
        const wav = await this.normalize(input, { signal: s.controller.signal });
        if (!active() || !s.accepting) return;
        const pcm = getPcm16WavData(wav);
        // One second of already captured trailing audio protects incomplete
        // container tails. Exact matching at finalization remains mandatory.
        const completed = Math.max(0, Math.floor((pcm.length - 32000) / WINDOW_BYTES));
        for (let i = 0; i < completed && active() && s.accepting; i++) {
          const chunk = pcm.subarray(i * WINDOW_BYTES, (i + 1) * WINDOW_BYTES);
          const id = key(chunk, s.serialized);
          if (s.cache.has(id)) continue;
          if (s.cache.size >= this.maxEntries) break;
          const request = Promise.resolve().then(() => this.transcribe(slicePcm16Wav(wav, i * 28, (i + 1) * 28), structuredClone(s.settings), { signal: s.controller.signal }));
          s.inFlight.set(id, request);
          let result;
          try { result = await request; } finally { s.inFlight.delete(id); }
          if (!active()) return;
          if (result && typeof result.text === 'string' && result.error == null) s.cache.set(id, structuredClone(result));
        }
      } catch {
        // Optimization failure is a cache miss, never a failed final dictation.
        // A later snapshot can retry; never log audio/transcript contents.
      }
    }
  }
  async lookup(token, normalizedWav, settings) {
    const s = this.session;
    if (!s || s.token !== token) return undefined;
    try {
      const pcm = getPcm16WavData(normalizedWav);
      if (pcm.length !== WINDOW_BYTES) return undefined;
      const id = key(pcm, settingsKey(settings));
      const value = s.cache.has(id) ? s.cache.get(id) : await s.inFlight.get(id);
      if (this.session !== s || s.controller.signal.aborted || !value || typeof value.text !== 'string' || value.error != null) return undefined;
      return value === undefined ? undefined : structuredClone(value);
    } catch { return undefined; }
  }
  finish(token) {
    const s = this.session;
    if (!s || s.token !== token) return;
    s.accepting = false; s.pending = null;
  }
  cancel(token) {
    if (token !== undefined && this.session?.token !== token) return;
    if (this.session) { this.finish(this.session.token); this.session.controller.abort(); this.session.cache.clear(); this.session = null; }
  }
  // Test/lifecycle coordination only; lookup waits only for its exact in-flight key.
  async idle() { while (this.running) await this.running; }
}
module.exports = { NbDictationPrecompute };
