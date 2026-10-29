const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const verified = new Map();
function cancelled(signal) {
  if (signal?.aborted) throw Object.assign(new Error('Download cancelled'), { name: 'AbortError', isAbort: true, code: 'DOWNLOAD_CANCELLED' });
}
async function verifyModel(file, config, signal) {
  cancelled(signal);
  const stat = await fs.promises.stat(file);
  if (!stat.isFile() || stat.size !== config.size) throw Object.assign(new Error('NB-modellen har feil filstørrelse.'), { code: 'DOWNLOAD_CORRUPTED' });
  const identity = [file, stat.dev, stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs, config.sha256].join(':');
  if (verified.has(identity)) return stat;
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) { cancelled(signal); hash.update(chunk); }
  cancelled(signal);
  const after = await fs.promises.stat(file);
  if (hash.digest('hex') !== config.sha256 || after.ino !== stat.ino || after.size !== stat.size || after.mtimeMs !== stat.mtimeMs || after.ctimeMs !== stat.ctimeMs)
    throw Object.assign(new Error('NB-modellen bestod ikke SHA-256-kontrollen.'), { code: 'DOWNLOAD_CORRUPTED' });
  if (verified.size > 16) verified.clear();
  verified.set(identity, true);
  return stat;
}
async function downloadVerifiedModel(config, destination, { download, signal, onProgress, onVerifying } = {}) {
  if (!/^[a-f0-9]{64}$/.test(config.sha256 || '') || !Number.isSafeInteger(config.size)) throw new Error('Missing pinned model identity');
  cancelled(signal);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  // A requested download can repair a corrupt file. Keep it untouched until
  // the replacement is complete and verified; never replace a valid model.
  let original = null;
  if (fs.existsSync(destination)) {
    original = await fs.promises.stat(destination);
    try { return await verifyModel(destination, config, signal); }
    catch (error) { if (error.code !== 'DOWNLOAD_CORRUPTED') throw error; }
  }
  const staging = `${destination}.download-${crypto.randomUUID()}`;
  try {
    await download(config.url, staging, { signal, expectedSize: config.size, onProgress });
    cancelled(signal); onVerifying?.();
    const stat = await verifyModel(staging, config, signal);
    cancelled(signal);
    if (original) {
      // Another process may have repaired/replaced the target while downloading.
      try { return await verifyModel(destination, config, signal); }
      catch (error) { if (error.code !== 'DOWNLOAD_CORRUPTED') throw error; }
      const current = await fs.promises.stat(destination);
      if (['dev','ino','size','mtimeMs','ctimeMs'].some(key => current[key] !== original[key])) {
        throw Object.assign(new Error('Modellfilen ble endret under nedlastingen. Prøv igjen.'), { code: 'MODEL_CHANGED' });
      }
      cancelled(signal);
      await fs.promises.rename(staging, destination);
      return stat;
    }
    try { await fs.promises.link(staging, destination); }
    catch (error) { if (error.code !== 'EEXIST') throw error; return await verifyModel(destination, config, signal); }
    return stat;
  } finally {
    await Promise.all([staging, staging + '.tmp'].map(file => fs.promises.unlink(file).catch(() => {})));
  }
}
module.exports = { verifyModel, downloadVerifiedModel };
