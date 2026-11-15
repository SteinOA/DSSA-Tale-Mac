import test from "node:test";
import assert from "node:assert/strict";
import { importedConversation, saveImportedConversation } from "../../src/utils/nbImportedConversation";
import { parseTranscriptSegments } from "../../src/utils/parseTranscriptSegments";

test("plain import preserves words without inventing speakers or times",()=>{
 const note=importedConversation("/tmp/Samtale med Kari.m4a","  Hei, dette er bokmål.\nNeste linje.  ");
 assert.equal(note.title,"Samtale med Kari");
 const [segment]=parseTranscriptSegments(note.transcript);
 assert.equal(segment.text,"Hei, dette er bokmål.\nNeste linje.");
 assert.equal(segment.timestamp,undefined);assert.equal(segment.speaker,undefined);
});
test("plain transcription survives empty or blank segment metadata",async()=>{
 for(const parts of [[],[{text:"  "}]]) {
   const conversation=importedConversation("opptak.m4a","Bevar disse ordene.",parts);
   assert.equal(conversation.content,"Bevar disse ordene.");
   assert.equal(conversation.segments.length,1);
   assert.equal(conversation.segments[0].timestamp,undefined);
   let saved="";
   const api={saveNote:async(_title:string,content:string)=>{saved=content;return {success:true,note:{id:12}};},updateNote:async()=>({success:true})};
   assert.equal((await saveImportedConversation(api,"opptak.m4a","Bevar disse ordene.",parts))?.complete,true);
   assert.equal(saved,"Bevar disse ordene.");
 }
});
test("diarized import preserves real offsets and speaker IDs across serialization",()=>{
 const note=importedConversation("samtale.mp3","",[{start:12.25,end:15.5,speaker:"speaker_7",text:"Eg heiter Kari."},{start:18,end:19,speaker:"speaker_2",text:"Hei."},{start:21,speaker:"speaker_7",text:"Takk."}]);
 const segments=parseTranscriptSegments(note.transcript);
 assert.deepEqual(segments.map(s=>s.timestamp),[12.25,18,21]);
 assert.deepEqual(segments.map(s=>s.speaker),["speaker_7","speaker_2","speaker_7"]);
 assert.deepEqual(segments.map(s=>s.speakerName),["Taler 1","Taler 2","Taler 1"]);
 assert(segments.every(s=>s.speakerIsPlaceholder&&s.speakerStatus==="provisional"));
 assert.equal(JSON.parse(note.transcript)[0].end,15.5);
});
test("successful import creates one meeting note then stores transcript for mirror/export",async()=>{
 const calls:any[]=[];
 const api={saveNote:async(...args:any[])=>{calls.push(args);return {success:true,note:{id:8}}},updateNote:async(...args:any[])=>{calls.push(args);return {success:true}}};
 assert.deepEqual(await saveImportedConversation(api,"Møte.wav","Hei"),{noteId:8,title:"Møte",complete:true});
 assert.equal(calls[0][1],"Hei");assert.equal(calls[0][2],"meeting");assert.equal(calls[0][3],"Møte.wav");
 assert.equal(parseTranscriptSegments(calls[1][1].transcript)[0].text,"Hei");
});
test("failed metadata save keeps readable note and does not create a duplicate",async()=>{
 let saves=0;
 const api={saveNote:async()=>{saves++;return {success:true,note:{id:9}}},updateNote:async()=>{throw new Error("disk");}};
 assert.equal((await saveImportedConversation(api,"test.wav","behold meg"))?.complete,false);
 assert.equal(saves,1);
 await assert.rejects(saveImportedConversation({...api,saveNote:async()=>({success:false,error:"disk"})},"test.wav","tekst"),/disk/);
 assert.equal(await saveImportedConversation(api,"empty.wav","   "),null);
 assert.equal(saves,1);
});
