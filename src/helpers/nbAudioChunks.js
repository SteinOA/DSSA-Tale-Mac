// MIT. NB-Whisper is trained on 30-second windows. Keep long recordings below
// that window to avoid skipped speech in the bundled backend.
function getPcm16WavData(wav) {
  if (!Buffer.isBuffer(wav) || wav.length < 12 ||
      wav.toString("ascii", 0, 4) !== "RIFF" || wav.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Expected normalized WAV audio");
  }
  let fmt, pcm;
  for (let offset = 12; offset + 8 <= wav.length;) {
    const tag = wav.toString("ascii", offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    if (tag === "fmt ") fmt = wav.subarray(offset + 8, offset + 8 + size);
    // FFmpeg's streaming WAV header uses an unknown data length. Bound it by
    // the actual buffer, just as for a conventional finite RIFF data chunk.
    if (tag === "data") { pcm = wav.subarray(offset + 8, Math.min(wav.length, offset + 8 + size)); break; }
    offset += 8 + size + (size % 2);
  }
  if (!fmt || fmt.length < 16 || !pcm || pcm.length % 2 ||
      fmt.readUInt16LE(0) !== 1 || fmt.readUInt16LE(2) !== 1 ||
      fmt.readUInt32LE(4) !== 16000 || fmt.readUInt16LE(14) !== 16) {
    throw new Error("Expected 16 kHz mono PCM16 WAV");
  }
  return pcm;
}

function wrapPcm16Wav(data) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4); header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(16000, 24); header.writeUInt32LE(32000, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function splitPcm16Wav(wav, seconds = 28) {
  const pcm = getPcm16WavData(wav);
  const limit = Math.floor(seconds * 32000 / 2) * 2;
  if (!Number.isFinite(limit) || limit < 2) throw new Error("Invalid audio window duration");
  if (pcm.length <= limit) return [wav];
  const chunks = [];
  for (let offset = 0; offset < pcm.length; offset += limit) {
    chunks.push(wrapPcm16Wav(pcm.subarray(offset, offset + limit)));
  }
  return chunks;
}

function slicePcm16Wav(wav, start, end) {
  const pcm = getPcm16WavData(wav);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error("Invalid audio range");
  const a = Math.min(pcm.length, Math.max(0, Math.floor(start * 16000)) * 2);
  const b = Math.min(pcm.length, Math.max(a, Math.ceil(end * 16000) * 2));
  return wrapPcm16Wav(pcm.subarray(a, b));
}

function isSilentPcm16Wav(wav) {
  const pcm = getPcm16WavData(wav);
  if (!pcm.length) return true;
  let sumSquares = 0, peak = 0;
  for (let offset = 0; offset < pcm.length; offset += 2) {
    const sample = pcm.readInt16LE(offset) / 0x7fff;
    sumSquares += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  const rms = Math.sqrt(sumSquares / (pcm.length / 2));
  const { MEETING_MIC_SILENCE_RMS, MEETING_MIC_SILENCE_PEAK } = require("./meetingMicGate");
  return rms < MEETING_MIC_SILENCE_RMS && peak < MEETING_MIC_SILENCE_PEAK;
}

module.exports = { splitPcm16Wav, slicePcm16Wav, getPcm16WavData, isSilentPcm16Wav };
