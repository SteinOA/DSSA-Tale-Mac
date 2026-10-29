import test from 'node:test';import assert from 'node:assert/strict';
import {mergeWhisperDownloadProgress as merge,selectedWhisperReady as ready,whisperVerificationModel as verification} from '../../src/utils/nbWhisperDownloadStatus';
test('real Whisper progress payload updates selected NB model and does not mark 100 percent ready prematurely',()=>{
 const models=[{model:'nb-large',downloaded:true}];
 const result=merge(models,{type:'progress',model:'nb-large-full',percentage:81,downloaded_bytes:810,total_bytes:1000});
 assert.equal(result[1].downloadProgress,81);assert.equal(result[1].downloadedBytes,810);assert.equal(result[1].totalBytes,1000);
 assert.equal(ready(result,'nb-large',true),true);assert.equal(ready(result,'nb-large-full',true),false);
 assert.equal(ready(merge(result,{type:'progress',model:'nb-large-full',percentage:100}),'nb-large-full',true),false);
 assert.equal(ready([{model:'nb-large-full',downloaded:true,isDownloading:false}],'nb-large-full',true),true);
});
test('unknown models and unchecked or downloading files do not allow onboarding completion',()=>{
 const models=[{model:'nb-large-full',downloaded:true,isDownloading:true}];
 assert.equal(merge(models,{type:'progress',model:'tiny',percentage:50}),models);
 assert.equal(ready(models,'nb-large-full',true),false);
 assert.equal(ready([{model:'nb-large-full',downloaded:true}],'nb-large-full',false),false);
 assert.equal(ready([{model:'tiny',downloaded:true}],'tiny',true),false);
});

test('verification stays visible until matching model completion and ignores unrelated model events',()=>{
 let current=verification('',{type:'verifying',model:'nb-large-full',percentage:100});
 assert.equal(current,'nb-large-full');
 assert.equal(verification(current,{type:'complete',model:'nb-large'}),current);
 assert.equal(verification(current,{type:'verifying',model:'tiny'}),current);
 for(const type of ['complete','error','cancelled'])assert.equal(verification(current,{type,model:'nb-large-full'}),'');
});
