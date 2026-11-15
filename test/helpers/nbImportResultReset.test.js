const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../src/components/NBControlPanel.tsx'),'utf8');
test('actual import reset effect clears stale result once per new running job',()=>{
 const effect=source.match(/const displayedImportId = useRef\(0\);\s*useEffect\(\(\) => \{([\s\S]*?)\}, \[importJob.id, importing\]\);/);
 assert.ok(effect,'per-job result reset effect');
 const state={text:'previous transcript',audio:{path:'old.mp3'},message:'complete'};
 const context={displayedImportId:{current:0},importJob:{id:2},importing:true,setText:v=>state.text=v,setSourceAudio:v=>state.audio=v,setMessage:v=>state.message=v};
 const apply=()=>vm.runInNewContext('(function(){'+effect[1]+'})()',context);
 apply();assert.deepEqual(state,{text:'',audio:null,message:''});
 state.text='manual edit';apply();assert.equal(state.text,'manual edit','same job / navigation keeps current text');
 context.importing=false;apply();assert.equal(state.text,'manual edit');
 context.importJob.id=3;context.importing=true;apply();assert.equal(state.text,'');
});
test('copy and every export control are unavailable during import',()=>{
 for(const label of ['Kopier teksten','Lagre som Word-dokument','Lagre som PDF','Lagre som tekstfil','Lagre lydfil']){
  const button=[...source.matchAll(/<button\b[\s\S]*?<\/button>/g)].find(m=>m[0].includes('ui("'+label+'")'));
  assert.ok(button,label);assert.match(button[0],/disabled=\{[^}]*importing[^}]*\}/,label);
 }
});
