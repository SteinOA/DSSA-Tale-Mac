const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");
const os=require("os");
const path=require("path");
const {ConversationMirror,text}=require("../../src/helpers/nbConversationMirror");
const note={id:1,title:"../../other",transcript:JSON.stringify([
  {text:"Tema: norsk språk.",timestamp:1700000000000,speaker:"speaker_0",speakerName:"Ola"},
  {text:"Ja.\nNeste linje.",timestamp:1700000065000,speaker:"speaker_1"},
])};
test("speaker numbers follow encounter order rather than internal IDs",()=>{
  const segments=[{text:"Første",speaker:"speaker_7",speakerName:"Taler 1",speakerIsPlaceholder:true},{text:"Andre",speaker:"cluster-b"},{text:"Tredje",speaker:"speaker_0"},{text:"Igjen",speaker:"speaker_7"}];
  assert.equal(text({transcript:JSON.stringify(segments)},{},{includeSpeakers:true}),"Taler 1: Første\n\nTaler 2: Andre\n\nTaler 3: Tredje\n\nTaler 1: Igjen");
  assert.match(text({transcript:JSON.stringify(segments)},{speaker_7:"Kari"},{includeSpeakers:true}),/^Kari: Første/);
});
test("conversation export omits only structured labels, preserves words and source",()=>{
  const original=note.transcript;
  assert.equal(text(note),"Tema: norsk språk.\n\nJa.\nNeste linje.");
  assert.equal(text(note,{speaker_1:"Kari"},{includeTimestamps:true,includeSpeakers:true}),"[00:00:00] Ola: Tema: norsk språk.\n\n[00:01:05] Kari: Ja.\nNeste linje.");
  assert.equal(text(note,{}, {includeSpeakers:true}).startsWith("Ola: Tema:"),true);
  assert.equal(text(note,{}, {includeTimestamps:true}).startsWith("[00:00:00] Tema:"),true);
  assert.equal(note.transcript,original);
  assert.equal(text({transcript:JSON.stringify([{text:"Hei",speaker:"cluster-a"},{text:"Ja",speaker:"cluster-b"},{text:"Takk",speaker:"cluster-a"}])},{},{includeSpeakers:true}),"Taler 1: Hei\n\nTaler 2: Ja\n\nTaler 1: Takk");
});
test("mirror isolates IDs, atomically updates one file, skips empty notes and deletes only own file",()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"nb-mirror-test-"));
  try {
    const mirror=new ConversationMirror(root);
    assert.equal(mirror.write({id:3,transcript:"[]"}),null);
    assert.throws(()=>mirror.file("../outside"),/ID/);
    const one=mirror.write(note);
    const two=mirror.write({...note,id:2});
    mirror.write({...note,transcript:JSON.stringify([{text:"Oppdatert."}])});
    assert.match(fs.readFileSync(one,"utf8"),/Oppdatert/);
    assert.match(fs.readFileSync(two,"utf8"),/norsk språk/);
    assert.deepEqual(fs.readdirSync(root).sort(),["samtale-1.txt","samtale-2.txt"]);
    assert.throws(()=>mirror.write({...note,transcript:"not-json"}),/transkripsjon/);
    assert.match(fs.readFileSync(one,"utf8"),/Oppdatert/);
    mirror.remove(1);
    assert.deepEqual(fs.readdirSync(root),["samtale-2.txt"]);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test("clearing a transcript removes its stale text mirror without touching other conversations",()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"nb-mirror-clear-"));
  try {
    const mirror=new ConversationMirror(root);
    const other=mirror.write({...note,id:2});
    const original=fs.readFileSync(other,"utf8");
    for (const transcript of [null,"", "[]",JSON.stringify([{text:" \n\t"}])]) {
      const own=mirror.write(note);
      assert.equal(fs.existsSync(own),true);
      assert.equal(mirror.write({...note,transcript}),null);
      assert.equal(fs.existsSync(own),false);
      assert.equal(fs.readFileSync(other,"utf8"),original);
    }
    const own=mirror.write(note);
    for(const transcript of ["not-json","null","{}"]){
      assert.throws(()=>mirror.write({...note,transcript}));
      assert.equal(fs.readFileSync(own,"utf8"),original);
    }
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
