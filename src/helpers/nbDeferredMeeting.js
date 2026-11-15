// MIT, DSSA Tale contributors. Keep recorded PCM on disk until transcription.
const fs = require("fs");
const path = require("path");

class NBDeferredMeeting {
  constructor({ root } = {}) {
    this.root = root || require("./safeTempDir").getSafeTempDir();
    this.directory = null;
    this.queue = [];
    this.sequence = 0;
    this.drainPromise = null;
  }

  get pendingCount() { return this.queue.length; }
  get pendingBytes() { return this.queue.reduce((sum, item) => sum + item.size, 0); }

  enqueue(source, buffer, timestamp = Date.now()) {
    if (!["mic", "system"].includes(source)) throw new Error("Invalid meeting audio source");
    if (!Buffer.isBuffer(buffer)) throw new Error("Expected PCM Buffer");
    if (!Number.isFinite(timestamp)) throw new Error("Invalid capture timestamp");
    if (!buffer.length) return;
    if (!this.directory) {
      fs.mkdirSync(this.root, { recursive: true });
      this.directory = fs.mkdtempSync(path.join(this.root, "dssa-meeting-"));
    }
    const file = path.join(this.directory, `${this.sequence++}-${source}.pcm`);
    // A failed write leaves the caller's in-memory buffer intact: queue metadata
    // is committed only after the audio has reached the filesystem.
    fs.writeFileSync(file, buffer, { mode: 0o600 });
    this.queue.push({ file, source, timestamp, size: buffer.length });
  }

  drain(consume) {
    if (this.drainPromise) return this.drainPromise;
    this.drainPromise = Promise.resolve().then(async () => {
      while (this.queue.length) {
        const item = this.queue[0];
        const buffer = fs.readFileSync(item.file);
        await consume({ source: item.source, buffer, timestamp: item.timestamp });
        // Preserve failed chunks for a retry; remove only once consumption succeeds.
        fs.unlinkSync(item.file);
        this.queue.shift();
      }
    }).finally(() => { this.drainPromise = null; });
    return this.drainPromise;
  }

  clear() {
    if (this.drainPromise) throw new Error("Cannot clear a meeting spool while it is being read");
    if (this.directory) fs.rmSync(this.directory, { recursive: true, force: true });
    this.directory = null;
    this.queue = [];
  }
}

module.exports = NBDeferredMeeting;
