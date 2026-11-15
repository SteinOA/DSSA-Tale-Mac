const { createAbortError } = require('./abortError');
// Cooperative priority at complete decoder-window boundaries. Never preempts
// an active native decode: abandoning its HTTP socket does not stop the engine.
class NbWhisperQueue {
  constructor() { this.pending = []; this.active = false; }
  run(work, { priority = 'interactive', signal } = {}) {
    if (signal?.aborted) return Promise.reject(createAbortError('Whisper job cancelled'));
    return new Promise((resolve, reject) => {
      const job = { work, priority, signal, resolve, reject, abort: null };
      job.abort = () => {
        const index = this.pending.indexOf(job);
        if (index < 0) return;
        this.pending.splice(index, 1);
        signal.removeEventListener('abort', job.abort);
        reject(createAbortError('Whisper job cancelled'));
      };
      signal?.addEventListener('abort', job.abort, { once: true });
      this.pending.push(job);
      this._drain();
    });
  }
  async _drain() {
    if (this.active) return;
    this.active = true;
    while (this.pending.length) {
      let index = this.pending.findIndex(job => job.priority !== 'background');
      if (index < 0) index = 0;
      const job = this.pending.splice(index, 1)[0];
      job.signal?.removeEventListener('abort', job.abort);
      try {
        if (job.signal?.aborted) throw createAbortError('Whisper job cancelled');
        const result = await job.work();
        if (job.signal?.aborted) throw createAbortError('Whisper job cancelled');
        job.resolve(result);
      } catch (error) { job.reject(error); }
    }
    this.active = false;
  }
}
module.exports = { NbWhisperQueue };
