const fs = require('node:fs/promises');
const { constants } = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DAY = 86400000;
const hash = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const number = (value) => Number.isFinite(value) && value >= 0;
function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  }
  throw new Error('Invalid checkpoint identity');
}
function identityKey(identity) {
  const { sourceSha256, sourceBytes, model, language, decoder, pcm, chunks } = identity || {};
  if (!sha(sourceSha256) || !number(sourceBytes) || !sha(model?.sha256) ||
      !number(model?.stat?.size) || !number(model?.stat?.mtimeMs) || !number(model?.stat?.ino) ||
      typeof language !== 'string' || !/^[a-zA-Z-]{2,16}$/.test(language) ||
      !decoder || typeof decoder !== 'object' || !pcm || !chunks ||
      pcm.sampleRate !== 16000 || pcm.channels !== 1 || pcm.bitsPerSample !== 16 ||
      !Number.isSafeInteger(pcm.normalizedSamples) || pcm.normalizedSamples < 0 ||
      !Number.isSafeInteger(chunks.windowSamples) || chunks.windowSamples < 1 ||
      !Number.isSafeInteger(chunks.stepSamples) || chunks.stepSamples < 1 ||
      chunks.stepSamples > chunks.windowSamples) throw new Error('Invalid checkpoint identity');
  const encoded = canonical(identity);
  if (encoded.length > 65536) throw new Error('Oversized checkpoint identity');
  return hash(encoded);
}

/** Private, optional disk cache. All I/O failures fail closed without failing transcription. */
function createStore({ root, getPolicy, now = Date.now }) {
  const base = path.resolve(root);
  let queue = Promise.resolve();
  function serial(action, fallback) {
    const pending = queue.then(action).catch(() => fallback);
    queue = pending.then(() => undefined);
    return pending;
  }
  async function safeDirectory(dir, create = false) {
    // Reject symlinks in every existing ancestor, not only the leaf cache folder.
    const segments = path.resolve(dir).split(path.sep).filter(Boolean);
    let current = path.parse(dir).root;
    for (const segment of segments) {
      current = path.join(current, segment);
      let stat;
      try { stat = await fs.lstat(current); } catch (error) {
        if (error.code !== 'ENOENT' || !create) throw error;
        await fs.mkdir(current, { mode: 0o700 });
        stat = await fs.lstat(current);
      }
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe checkpoint directory');
    }
    if (dir === base || dir.startsWith(base + path.sep)) await fs.chmod(dir, 0o700);
  }
  async function purgeInternal() {
    await safeDirectory(base);
    for (const name of await fs.readdir(base)) {
      // Only this store's opaque job directories; never arbitrary siblings.
      if (/^[a-f0-9]{64}$/.test(name)) await fs.rm(path.join(base, name), { recursive: true, force: true });
    }
  }
  async function policy() {
    const value = await getPolicy();
    // Unknown policy on startup must neither reuse nor erase previous work.
    if (value?.synced !== true) return 0;
    if (value.enabled !== true || !number(value.retentionDays)) {
      await purgeInternal().catch(() => {});
      return 0;
    }
    // The existing history preference uses zero for keep forever; checkpoints
    // still have a hard privacy/storage cap of seven days.
    return (value.retentionDays === 0 ? 7 : Math.min(7, value.retentionDays)) * DAY;
  }
  async function read(file) {
    const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || stat.size > 16 * 1024 * 1024) throw new Error('Invalid checkpoint file');
      return await handle.readFile('utf8');
    } finally { await handle.close(); }
  }
  async function atomic(file, data) {
    const temp = `${file}.${crypto.randomBytes(12).toString('hex')}.tmp`;
    let handle;
    try {
      handle = await fs.open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      await handle.writeFile(data);
      await handle.sync();
      await handle.close(); handle = null;
      await fs.rename(temp, file);
      const directory = await fs.open(path.dirname(file), constants.O_RDONLY);
      try { await directory.sync(); } finally { await directory.close(); }
    } finally {
      if (handle) await handle.close().catch(() => {});
      await fs.unlink(temp).catch(() => {});
    }
  }
  async function load(dir, key, ttl) {
    await safeDirectory(dir);
    const manifest = JSON.parse(await read(path.join(dir, 'manifest.json')));
    if (manifest.version !== 1 || manifest.key !== key || !number(manifest.createdAt) ||
        now() < manifest.createdAt || now() - manifest.createdAt >= ttl ||
        !Array.isArray(manifest.parts) || manifest.parts.length > 100000 || !manifest.parts.every(sha)) throw new Error('Invalid checkpoint manifest');
    return manifest;
  }
  async function sweep(ttl) {
    await safeDirectory(base, true);
    for (const name of await fs.readdir(base)) {
      if (!/^[a-f0-9]{64}$/.test(name)) continue;
      const dir = path.join(base, name);
      try { await load(dir, name, ttl); }
      catch { await fs.rm(dir, { recursive: true, force: true }); }
    }
  }
  return {
    purge: () => serial(purgeInternal, false),
    open: (identity) => serial(async () => {
      const key = identityKey(identity);
      const ttl = await policy();
      if (!ttl) return inert();
      await sweep(ttl);
      const dir = path.join(base, key);
      await safeDirectory(dir, true);
      let manifest;
      try { manifest = await load(dir, key, ttl); }
      catch { manifest = { version: 1, key, createdAt: now(), parts: [] }; await atomic(path.join(dir, 'manifest.json'), JSON.stringify(manifest)); }
      let closed = false;
      async function usable() {
        const currentTTL = await policy();
        if (closed || !currentTTL) return false;
        try { manifest = await load(dir, key, currentTTL); }
        catch {
          // Expired or corrupt state is discarded even during an ongoing import.
          await safeDirectory(base);
          await fs.rm(dir, { recursive: true, force: true });
          closed = true;
          return false;
        }
        return true;
      }
      async function prefix() {
        const results = [];
        for (let index = 0; index < manifest.parts.length; index++) {
          try {
            const data = await read(path.join(dir, `${index}.json`));
            if (hash(data) !== manifest.parts[index]) break;
            results.push(JSON.parse(data));
          } catch { break; }
        }
        return results;
      }
      return {
        readPrefix: () => serial(async () => (await usable()) ? prefix() : [], []),
        save: (index, result) => serial(async () => {
          if (!(await usable()) || !Number.isSafeInteger(index) || index < 0) return false;
          const valid = await prefix();
          if (index !== valid.length) return false;
          const data = JSON.stringify(result);
          if (!data || Buffer.byteLength(data) > 16 * 1024 * 1024) return false;
          await atomic(path.join(dir, `${index}.json`), data);
          manifest.parts = manifest.parts.slice(0, index).concat(hash(data));
          await atomic(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
          return true;
        }, false),
        complete: () => serial(async () => {
          closed = true;
          await safeDirectory(base);
          await fs.rm(dir, { recursive: true, force: true });
          return true;
        }, false),
        close: () => { closed = true; },
      };
    }, inert()),
  };
}
function inert() { return { readPrefix: async () => [], save: async () => false, complete: async () => false, close() {} }; }
module.exports = { createStore, identityKey };
