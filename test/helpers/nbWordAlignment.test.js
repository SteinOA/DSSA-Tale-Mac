const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {readAlignmentConfig,languageKey,alignWords}=require('../../src/helpers/nbWordAlignment');
test('Bokmal and Nynorsk require their own configured alignment model; no silent cross-language substitution',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'dssa-align-cfg-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const model=path.join(root,'nn');await fs.mkdir(model);await fs.writeFile(path.join(model,'dssa-alignment-manifest.json'),'{}');await fs.writeFile(path.join(root,'dssa-community-engine.json'),JSON.stringify({alignmentPythonPath:process.execPath,alignmentModels:{nn:model}}));
 assert.equal(languageKey('nb'),'no');assert.equal(readAlignmentConfig(root,'no'),null);assert.equal(readAlignmentConfig(root,'nn').modelPath,model);
 await assert.rejects(alignWords(root,'/not-read.wav',{text:'Original',segments:[]},'no'),/No alignment model/);
});
