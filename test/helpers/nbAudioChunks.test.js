const test = require('node:test');
const assert = require('node:assert/strict');
const {splitPcm16Wav} = require('../../src/helpers/nbAudioChunks');
function wave(seconds) {
 const pcm=Buffer.alloc(seconds*32000);
 for(let i=0;i<pcm.length/2;i++) pcm.writeInt16LE(Math.round(12000*Math.sin(i/13)),i*2);
 const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(16000,24);header.writeUInt32LE(32000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
 return Buffer.concat([header,pcm]);
}
test('long recording retains every PCM sample across valid 28-second windows',()=>{
 const input=wave(85);const chunks=splitPcm16Wav(input);assert.equal(chunks.length,4);
 assert.ok(chunks.every(c=>c.length<=44+28*32000));
 assert.deepEqual(Buffer.concat(chunks.map(c=>c.subarray(44))),input.subarray(44));
 for(const c of chunks) assert.equal(c.readUInt32LE(40),c.length-44);
});
test('short dictation stays byte-for-byte unchanged',()=>{const input=wave(12);assert.deepEqual(splitPcm16Wav(input),[input]);});
test('invalid audio fails instead of silently losing samples',()=>{assert.throws(()=>splitPcm16Wav(Buffer.from('broken audio')));});
