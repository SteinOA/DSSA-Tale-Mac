import { test } from "node:test";
import assert from "node:assert/strict";
import { createNbHotkeyStartup } from "../../src/helpers/nbHotkeyStartup";

function fixture(enabled = true) {
  const state = { desired: "Control+Command+Down", active: "Command+Shift+Space" as string | null, shown: "Command+Shift+Space", status: {} as any, calls: [] as string[], success: true };
  const reconcile = createNbHotkeyStartup({ enabled, getDesired: () => state.desired,
    getActive: async () => state.active,
    update: async key => { state.calls.push(key); if (state.success) state.active = key; return { success: state.success, message: "Occupied" }; },
    setActive: key => { state.shown = key; }, setStatus: status => { state.status = status; },
  });
  return { state, reconcile };
}
test("saved Mac NB preference registers atomically and confirms active", async () => {
  const {state,reconcile}=fixture(); await Promise.all([reconcile(),reconcile()]);
  assert.deepEqual(state.calls,[state.desired]); assert.equal(state.shown,state.desired); assert.equal(state.status.status,"registered");
  await reconcile(); assert.equal(state.calls.length,1);
});
test("registration failure retains desired and old active; no repeated fallback", async () => {
  const {state,reconcile}=fixture(); state.success=false; await reconcile(); await reconcile();
  assert.equal(state.desired,"Control+Command+Down"); assert.equal(state.shown,"Command+Shift+Space");
  assert.deepEqual(state.status,{status:"failed",desiredKey:state.desired,message:"Occupied"}); assert.equal(state.calls.length,1);
});
test("backend not ready waits until active event calls reconciliation", async () => {
  const {state,reconcile}=fixture(); state.active=null; await reconcile();
  assert.equal(state.status.status,"waiting"); assert.equal(state.calls.length,0);
  state.active="Command+Shift+Space"; await reconcile(); assert.equal(state.status.status,"registered");
});
test("disabled platforms and already matching shortcuts never register", async () => {
  const off=fixture(false); await off.reconcile(); assert.deepEqual(off.state.calls,[]);
  const same=fixture(); same.state.active=same.state.desired; await same.reconcile(); assert.deepEqual(same.state.calls,[]);
});
test("successful IPC without matching backend active is not reported registered", async () => {
  let status: any; let shown="old";
  const reconcile=createNbHotkeyStartup({enabled:true,getDesired:()=>"new",getActive:async()=>"old",
    update:async()=>({success:true}),setActive:key=>{shown=key;},setStatus:value=>{status=value;}});
  await reconcile(); assert.equal(status.status,"failed"); assert.equal(shown,"old");
});
test("manual preference changed during IPC is never overwritten", async () => {
  let desired="new"; let status:any; let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  const reconcile=createNbHotkeyStartup({enabled:true,getDesired:()=>desired,getActive:async()=>"old",
    update:async()=>{await gate;return{success:false};},setActive:()=>{},setStatus:value=>{status=value;}});
  const pending=reconcile(); await Promise.resolve(); desired="manual"; release(); await pending;
  assert.equal(desired,"manual"); assert.notEqual(status.status,"failed");
});
