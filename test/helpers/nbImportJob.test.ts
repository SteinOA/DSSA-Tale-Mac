import test from 'node:test';
import assert from 'node:assert/strict';
import {createNbImportJob,importIsRunning} from '../../src/utils/nbImportJob';
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>resolve=r);return {promise,resolve};}
const file={name:'Samtale.mp3',arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
const options={model:'nb-large-full',language:'no',separateSpeakers:false};
test('job outlives view unsubscribe/remount, exposes truthful phases and saves exactly one note',async()=>{
 const job=createNbImportJob(),decode=deferred<any>(),saved:any[]=[];let calls=0;
 const api={transcribeLocalWhisper:async(_b:any,o:any)=>{calls++;assert.deepEqual(o,{model:'nb-large-full',language:'no'});return decode.promise;},saveNote:async(...args:any[])=>{saved.push(args);return {success:true,note:{id:7}};},updateNote:async()=>({success:true})};
 const phases:string[]=[];const unsubscribe=job.subscribe(()=>phases.push(job.getSnapshot().phase));const running=job.start(file,options,api);await Promise.resolve();assert.equal(job.getSnapshot().phase,'transcribing');unsubscribe();
 assert.equal(await job.start(file,options,api),false);assert.equal(calls,1);
 const seen:string[]=[];job.subscribe(()=>seen.push(job.getSnapshot().phase));assert.equal(importIsRunning(job.getSnapshot()),true);decode.resolve({success:true,text:'Dette er hele samtalen.'});await running;
 assert.deepEqual(phases,['reading','transcribing']);assert.deepEqual(seen,['saving','complete']);assert.equal(saved.length,1);assert.equal(saved[0][1],'Dette er hele samtalen.');assert.equal(job.getSnapshot().saved?.noteId,7);assert.equal(job.getSnapshot().text,'Dette er hele samtalen.');assert.equal(importIsRunning(job.getSnapshot()),false);assert.ok(job.getSnapshot().finishedAt);
});
test('save failure preserves full text; next job does not inherit prior error',async()=>{
 const job=createNbImportJob();let fail=true;const api={transcribeLocalWhisper:async()=>({success:true,text:'Behold alle ordene.'}),saveNote:async()=>{if(fail)throw Error('disk full');return {success:true,note:{id:8}};},updateNote:async()=>({success:true})};
 await job.start(file,options,api);assert.equal(job.getSnapshot().phase,'error');assert.equal(job.getSnapshot().text,'Behold alle ordene.');assert.equal(job.getSnapshot().error,'disk full');fail=false;await job.start(file,options,api);assert.equal(job.getSnapshot().phase,'complete');assert.equal(job.getSnapshot().error,'');assert.equal(job.getSnapshot().id,2);
});
test('speaker import persists original timing and speaker identifiers, numbering only display names',async()=>{
 const job=createNbImportJob();let update:any;
 const api={getPathForFile:()=>'/local/test.mp3',diarizeAudioFile:async()=>({success:true,segments:[{start:2,end:5,speaker:'speaker_9',text:'Første stemme.'},{start:6,end:9,speaker:'speaker_1',text:'Andre stemme.'}]}),saveNote:async()=>({success:true,note:{id:9}}),updateNote:async(_id:any,data:any)=>{update=data;return {success:true};}};
 await job.start(file,{...options,separateSpeakers:true},api);assert.match(job.getSnapshot().text,/\[0:02\] Taler 1: Første stemme/);const original=JSON.parse(update.transcript);assert.equal(original[0].speaker,'speaker_9');assert.equal(original[0].timestamp,2);assert.equal(original[0].end,5);assert.equal(original[1].speakerName,'Taler 2');
});
test('no speech completes without empty note; failed engine remains explicit failed job',async()=>{
 const job=createNbImportJob();const api={transcribeLocalWhisper:async()=>({success:false,message:'No audio detected'}),saveNote:async()=>assert.fail('no empty note')};await job.start(file,options,api);assert.equal(job.getSnapshot().phase,'complete');assert.equal(job.getSnapshot().saved,null);
 await job.start(file,options,{...api,transcribeLocalWhisper:async()=>({success:false,error:'engine stopped'})});assert.equal(job.getSnapshot().phase,'error');assert.equal(job.getSnapshot().error,'engine stopped');
});

test('disk import never reads the file into renderer memory and filters other job progress',async()=>{
 const job=createNbImportJob();let notify:any;let finish:any;let removed=false;let saved=0;
 const api:any={getPathForFile:()=>'/audio/long.mp3',onNbAudioImportProgress:(cb:any)=>{notify=cb;return()=>{removed=true;};},nbImportAudioFile:(_path:string,opts:any)=>{notify({}, {requestId:'other',phase:'transcribing',completedChunks:9,totalChunks:10});assert.equal(job.getSnapshot().completedChunks,0);notify({}, {requestId:opts.requestId,phase:'transcribing',completedChunks:2,totalChunks:10,resumedChunks:2});return new Promise(r=>finish=r);},saveNote:async()=>{saved++;return {success:true,note:{id:1}};},updateNote:async()=>({success:true})};
 const pending=job.start({name:'long.mp3',arrayBuffer:async()=>{throw new Error('must not read full file');}},{model:'nb-large',language:'nn',separateSpeakers:false},api);
 assert.equal(job.getSnapshot().completedChunks,2);assert.equal(job.getSnapshot().sourceAudio?.bytes,undefined);assert.equal(job.getSnapshot().sourceAudio?.path,'/audio/long.mp3');
 finish({success:true,text:'Eg kjem i morgon.'});await pending;assert.equal(saved,1);assert.equal(removed,true);assert.equal(job.getSnapshot().phase,'complete');
});
test('disk cancellation waits for backend acknowledgement and does not save a partial note',async()=>{
 const job=createNbImportJob();let finish:any;let cancelled='';
 const api:any={getPathForFile:()=>'/audio/long.mp3',nbImportAudioFile:()=>new Promise(r=>finish=r),nbCancelAudioImport:async(id:string)=>{cancelled=id;},saveNote:async()=>{throw new Error('must not save cancelled import');}};
 const pending=job.start({name:'long.mp3',arrayBuffer:async()=>{throw new Error('no read');}},{model:'nb-large',language:'nn',separateSpeakers:false},api);
 await job.cancel(api);assert.equal(cancelled,job.getSnapshot().requestId);assert.equal(job.getSnapshot().cancelRequested,true);assert.equal(importIsRunning(job.getSnapshot()),true);
 finish({success:false,cancelled:true});await pending;assert.equal(job.getSnapshot().phase,'cancelled');assert.equal(importIsRunning(job.getSnapshot()),false);
});

test('turning history off during disk transcription keeps text but creates no note',async()=>{
 const job=createNbImportJob();const result=deferred<any>();let history=true;let saves=0;
 const api:any={getPathForFile:()=>'/audio/private.mov',nbImportAudioFile:()=>result.promise,saveNote:async()=>{saves++;return {success:true,note:{id:1}};},updateNote:async()=>({success:true})};
 const pending=job.start(file,{...options,getHistoryEnabled:()=>history},api);
 history=false;result.resolve({success:true,text:'Privat samtale.'});await pending;
 assert.equal(saves,0);assert.equal(job.getSnapshot().text,'Privat samtale.');assert.equal(job.getSnapshot().saved,null);assert.equal(job.getSnapshot().phase,'complete');
});
test('history disabled also prevents automatic notes on legacy import',async()=>{
 const job=createNbImportJob();let saves=0;
 await job.start(file,{...options,saveHistory:false},{transcribeLocalWhisper:async()=>({success:true,text:'Tekst utan historikk.'}),saveNote:async()=>{saves++;}});
 assert.equal(saves,0);assert.equal(job.getSnapshot().text,'Tekst utan historikk.');
});

test('a timed speaker import survives navigation, keeps ASR 100 separate and reports partial assignment',async()=>{
 const job=createNbImportJob();let notify:any,finish:any;let removed=false;
 const api:any={getPathForFile:()=>'/public/nynorsk.wav',onNbAudioImportProgress:(cb:any)=>{notify=cb;return()=>removed=true;},nbImportAudioFile:(_p:any,o:any)=>{assert.equal(o.speakerEngine,'community-1');notify({requestId:o.requestId,phase:'converting',step:'channels'});notify({requestId:o.requestId,phase:'transcribing',completedChunks:2,totalChunks:2,completedSeconds:48,totalSeconds:48});assert.equal(job.getSnapshot().stageLabel,'');notify({requestId:o.requestId,phase:'diarizing',step:'loading',completedSeconds:0,totalSeconds:48});return new Promise(r=>finish=r);}};
 const done=job.start({name:'DSSA test nynorsk.wav',arrayBuffer:async()=>{throw Error('No full renderer buffer');}},{model:'nb-large',language:'nn',separateSpeakers:true,speakerEngine:'community-1',saveHistory:false},api);
 assert.equal(job.getSnapshot().phase,'diarizing');assert.equal(job.getSnapshot().completedSeconds,0);let renders=0;const leave=job.subscribe(()=>renders++);leave();
 finish({success:true,text:'Eg kjem. Me ventar.',segments:[{text:'Eg kjem.',start:0,end:1,speaker:'speaker_0'},{text:'Me ventar.',start:2,end:3}],diarizationWarning:true});await done;
 assert.equal(job.getSnapshot().phase,'complete');assert.match(job.getSnapshot().text,/Ukjend talar/);assert.ok(job.getSnapshot().warning);assert.equal(job.getSnapshot().language,'nn');assert.equal(job.getSnapshot().completedSeconds,48);assert.equal(renders,0);assert.equal(removed,true);
});
