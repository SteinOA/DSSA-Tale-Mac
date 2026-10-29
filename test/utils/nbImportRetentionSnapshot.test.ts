import test from 'node:test';
import assert from 'node:assert/strict';
import {nbImportRetentionSnapshot as snapshot} from '../../src/utils/nbImportRetentionSnapshot';
const policy=(status:any,mode?:string):any=>({status,appVersion:'1.9.11',policy:mode?{dataRetention:{localHistoryMode:mode}}:null});
test('unresolved policy blocks checkpoints without purging existing history',()=>{
 for(const status of ['loading','error']) assert.deepEqual(snapshot(policy(status),true,30),{synced:false,enabled:false,retentionDays:30});
 assert.equal(snapshot(policy('managed'),true,30).synced,false);
});
test('stable policies and explicit opt-outs are distinguished from unresolved policy',()=>{
 for(const status of ['idle','unmanaged'])assert.deepEqual(snapshot(policy(status),true,7),{synced:true,enabled:true,retentionDays:7});
 assert.equal(snapshot(policy('managed','always_off'),true,7).enabled,false);
 assert.equal(snapshot(policy('managed','always_on'),false,7).enabled,true);
 assert.deepEqual(snapshot(policy('loading'),false,7),{synced:true,enabled:false,retentionDays:7});
 assert.equal(snapshot(policy('loading','always_on'),false,7).synced,false);
});
