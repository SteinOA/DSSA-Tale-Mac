const test=require('node:test'),assert=require('node:assert/strict');
const {exportText,createDocx}=require('../../src/helpers/nbDocument');
const source='[01:02] Kari: Hei på deg.\n[01:04] Taler 2: Eg kjem i morgon.\nTema: Budsjett';
test('export metadata options are independent and do not change source',()=>{
 assert.equal(exportText(source),'Hei på deg.\nEg kjem i morgon.\nTema: Budsjett');
 assert.equal(exportText(source,{includeSpeakers:true}),'Kari: Hei på deg.\nTaler 2: Eg kjem i morgon.\nTema: Budsjett');
 assert.equal(exportText(source,{includeTimestamps:true}),'[01:02] Hei på deg.\n[01:04] Eg kjem i morgon.\nTema: Budsjett');
 assert.equal(exportText(source,{includeTimestamps:true,includeSpeakers:true}),source);
});
test('plain prose and Norwegian characters survive exports',()=>{
 const text='Dette er norsk: æøå.\nIngen taleretikett.';
 assert.equal(exportText(text),text);
 const doc=createDocx(text+'\n<test> &');
 assert.equal(doc.readUInt32LE(0),0x04034b50);assert.ok(doc.includes(Buffer.from('æøå')));assert.ok(doc.includes(Buffer.from('&lt;test&gt; &amp;')));
});
