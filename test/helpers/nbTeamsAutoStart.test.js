const test=require("node:test"),assert=require("node:assert/strict"),Module=require("node:module"),{EventEmitter}=require("node:events");
const modulePath=require.resolve("../../src/helpers/meetingDetectionEngine");
function loadEngine(){
 const original=Module._load;delete require.cache[modulePath];
 Module._load=function(request,parent,isMain){
  if(request==="electron")return {shell:{openExternal:async()=>{}}};
  if(request==="./debugLogger")return {info(){},warn(){},debug(){},error(){}};
  if(request==="./windowBroadcast")return {broadcastToWindows(){}};
  if(request==="./meetingJoinUrl")return {getMeetingJoinUrl:()=>null};
  return original.call(this,request,parent,isMain);
 };
 try{return require(modulePath);}finally{Module._load=original;}
}
function fixture({enabled=true,pids=[42],resolve=async ids=>ids,notifications=true}={}){
 const Engine=loadEngine(),audio=new EventEmitter(),processes=new EventEmitter();
 audio.getExternalCaptureProcessIds=()=>pids;
 const shown=[],started=[];
 const wm={notificationPrefs:{notificationsEnabled:notifications},isMeetingInputAllowed:()=>true,showMeetingNotification:x=>shown.push(x)};
 const prefs={autoTeams:enabled};
 const engine=new Engine({getActiveMeetingState:()=>({upcomingEvents:[]})},processes,audio,wm,{},
  {readPreferences:()=>prefs,resolveTeamsCaptureProcesses:resolve});
 engine.handleNotificationResponse=async(id,action)=>{started.push({id,action});engine.activeDetections.clear();};
 return {engine,audio,wm,prefs,shown,started,setPids:(next)=>{pids=next;}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test("Teams path matching excludes generic browser, unrelated process and lookalike directory",()=>{
 const {isTeamsExecutable}=loadEngine();
 assert.equal(isTeamsExecutable("/Applications/Microsoft Teams.app/Contents/MacOS/MSTeams"),true);
 assert.equal(isTeamsExecutable("/Applications/Microsoft Teams.app/Contents/Frameworks/Teams Helper.app/Contents/MacOS/Teams Helper"),true);
 for(const path of ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","/tmp/Microsoft Teams.app-fake/Contents/tool","/Applications/Other.app/Contents/MacOS/teams"]){assert.equal(isTeamsExecutable(path),false);}
});
test("auto-start needs opt-in and active Teams microphone ownership",async()=>{
 const original=process.platform;Object.defineProperty(process,"platform",{value:"darwin",configurable:true});
 try{
  for(const opts of [{enabled:false},{pids:[]},{resolve:async()=>[]}]){
   const f=fixture(opts);f.engine._handleDetection("audio","sustained-audio",{});await tick();assert.equal(f.started.length,0);assert.equal(f.shown.length,1);
  }
  const f=fixture();f.engine._handleDetection("audio","sustained-audio",{});await tick();assert.equal(f.started.length,1);assert.equal(f.shown.length,0);
 }finally{Object.defineProperty(process,"platform",{value:original,configurable:true});}
});
test("Teams auto-start works with notification bubbles disabled, but unrelated capture stays silent",async()=>{
 const original=process.platform;Object.defineProperty(process,"platform",{value:"darwin",configurable:true});
 try{
  const f=fixture({notifications:false});f.engine.preferences.audioDetection=false;f.engine._handleDetection("audio","sustained-audio",{});await tick();assert.equal(f.started.length,1);assert.equal(f.shown.length,0);
  const unrelated=fixture({notifications:false,resolve:async()=>[]});unrelated.engine._handleDetection("audio","sustained-audio",{});await tick();assert.equal(unrelated.started.length,0);assert.equal(unrelated.shown.length,0);assert.equal(unrelated.engine.activeDetections.size,0);
 }finally{Object.defineProperty(process,"platform",{value:original,configurable:true});}
});
test("ownership loss, preference change, onboarding, and concurrent recording prevent a late auto-start",async()=>{
 const original=process.platform;Object.defineProperty(process,"platform",{value:"darwin",configurable:true});
 try{
  for(const mutate of [f=>f.setPids([]),f=>{f.prefs.autoTeams=false;},f=>{f.wm.isMeetingInputAllowed=()=>false;},f=>{f.engine._userRecording=true;}]){
   let release;const f=fixture({resolve:()=>new Promise(resolve=>{release=resolve;})});f.engine._handleDetection("audio","sustained-audio",{});mutate(f);release([42]);await tick();assert.equal(f.started.length,0);
  }
 }finally{Object.defineProperty(process,"platform",{value:original,configurable:true});}
});
test("Teams opt-in does not auto-start calendar reminders or other platforms",async()=>{
 const original=process.platform;
 try{
  Object.defineProperty(process,"platform",{value:"darwin",configurable:true});
  const f=fixture();f.engine._handleDetection("calendar","meeting",{event:{start_time:new Date().toISOString()}});await tick();assert.equal(f.started.length,0);
  Object.defineProperty(process,"platform",{value:"win32",configurable:true});
  const windows=fixture();windows.engine._handleDetection("audio","sustained-audio",{});await tick();assert.equal(windows.started.length,0);
 }finally{Object.defineProperty(process,"platform",{value:original,configurable:true});}
});
