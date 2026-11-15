import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {nbModelDownloadProgress} from "../../src/utils/nbModelDownloadProgress";

test("actual preload listener delivers the Qwen 4B payload as second argument",()=>{
 const source=fs.readFileSync(new URL("../../preload.js",import.meta.url),"utf8");
 const start=source.indexOf("const registerListener =");
 const end=source.indexOf("contextBridge.exposeInMainWorld",start);
 let listener:any;
 const context:any={ipcRenderer:{on(_channel:string,fn:any){listener=fn;},removeListener(){}}};
 vm.runInNewContext(source.slice(start,end)+"\nglobalThis.register=registerListener;",context);
 let progress:any;
 context.register("model-download-progress")((...args:any[])=>{progress=nbModelDownloadProgress(args[0],args[1]);});
 const payload={modelId:"qwen3.5-4b-q4_k_m",progress:81,downloadedSize:2440552524,totalSize:3013027808};
 listener({sender:{},ports:[]},payload);
 assert.equal(progress.progress,81);
 assert.equal(progress.downloadedSize,payload.downloadedSize);
 assert.equal(progress.totalSize,payload.totalSize);
 listener({}, {...payload,type:"complete",progress:100});
 assert.equal(progress.type,"complete");assert.equal(progress.progress,100);
 listener({}, {...payload,type:"error",code:"NETWORK_ERROR",error:"test"});
 assert.equal(progress.type,"error");assert.equal(progress.code,"NETWORK_ERROR");
});
test("payload-only emitters work and Electron events never masquerade as zero progress",()=>{
 assert.equal(nbModelDownloadProgress({sender:{}}),null);
 assert.equal(nbModelDownloadProgress({modelId:"qwen",downloadedSize:20,totalSize:40})?.progress,50);
});
