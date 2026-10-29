const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createStore, identityKey } = require('../../src/helpers/nbFileCheckpoint');
const identity = () => ({ sourceSha256: 'a'.repeat(64), sourceBytes: 100,
  model: { sha256: 'b'.repeat(64), stat: { size: 300, mtimeMs: 100, ino: 12 } },
  language: 'nn', decoder: { beamSize: 5 },
  pcm: { sampleRate: 16000, channels: 1, bitsPerSample: 16, normalizedSamples: 500000 },
  chunks: { windowSamples: 448000, stepSamples: 440000 } });
async function setup(t) {
  const parent = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'nb-checkpoint-')));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'private-cache');
  let policy = { synced: true, enabled: true, retentionDays: 7 };
  let time = 1000;
  const store = createStore({ root, getPolicy: () => policy, now: () => time });
  return { root, parent, store, setPolicy: (p) => { policy = p; }, setTime: (v) => { time = v; } };
}
test('durable ordered chunks survive reopen; private modes; completion deletes', async (t) => {
  const { root, store } = await setup(t);
  const session = await store.open(identity());
  assert.deepEqual(await session.readPrefix(), []);
  assert.equal(await session.save(1, { text: 'gap' }), false);
  assert.deepEqual(await Promise.all([session.save(0, { text: 'eg' }), session.save(1, { text: 'ikkje' })]), [true,true]);
  session.close();
  const reopened = await store.open(identity());
  assert.deepEqual(await reopened.readPrefix(), [{text:'eg'}, {text:'ikkje'}]);
  const dir = path.join(root, identityKey(identity()));
  assert.equal((await fs.stat(dir)).mode & 0o777, 0o700);
  for (const filename of await fs.readdir(dir)) assert.equal((await fs.stat(path.join(dir,filename))).mode & 0o777, 0o600);
  assert.equal(await reopened.complete(), true);
  assert.deepEqual(await fs.readdir(root), []);
});
test('corrupt or missing middle chunk stops reuse and allows safe replacement', async (t) => {
  const { root, store } = await setup(t);
  const session = await store.open(identity());
  for (let i=0;i<3;i++) await session.save(i,{text:String(i)});
  const dir = path.join(root,identityKey(identity()));
  await fs.writeFile(path.join(dir,'1.json'),'{"text":"tampered"}');
  assert.deepEqual(await session.readPrefix(), [{text:'0'}]);
  assert.equal(await session.save(1,{text:'replacement'}),true);
  assert.deepEqual(await session.readPrefix(), [{text:'0'},{text:'replacement'}]);
  await fs.unlink(path.join(dir,'0.json'));
  assert.deepEqual(await session.readPrefix(), []);
});
test('all decoding identity dimensions invalidate reuse and malicious input is inert', async (t) => {
  const {store} = await setup(t);
  const initial = identity();
  await (await store.open(initial)).save(0,{text:'original'});
  for (const modify of [x=>x.language='no', x=>x.model.stat.mtimeMs++, x=>x.model.sha256='c'.repeat(64), x=>x.sourceSha256='d'.repeat(64), x=>x.decoder.beamSize=1,x=>x.chunks.stepSamples--]) {
    const changed=identity();modify(changed);
    assert.deepEqual(await (await store.open(changed)).readPrefix(),[]);
  }
  for (const value of [null,{}, {...identity(),sourceSha256:'../../escape'}, {...identity(),language:'../../nn'}]) {
    const session=await store.open(value);
    assert.equal(await session.save(0,{text:'bad'}),false);
  }
});
test('unsynced policy blocks access without deletion; known disabled policy purges', async (t) => {
  const {store,root,setPolicy} = await setup(t);
  const session=await store.open(identity());await session.save(0,{text:'private'});
  setPolicy({synced:false,enabled:true,retentionDays:7});
  assert.deepEqual(await session.readPrefix(),[]);
  assert.equal(await session.save(1,{text:'no'}),false);
  assert.equal((await fs.readdir(root)).length,1);
  setPolicy({synced:true,enabled:false,retentionDays:7});
  assert.equal(await (await store.open(identity())).save(0,{text:'no'}),false);
  assert.deepEqual(await fs.readdir(root),[]);
});
test('expiry capped at seven days and shorter history honoured', async (t) => {
  const {store,setPolicy,setTime} = await setup(t);
  await (await store.open(identity())).save(0,{text:'old'});
  setTime(1000+7*86400000);
  setPolicy({synced:true,enabled:true,retentionDays:99});
  assert.deepEqual(await (await store.open(identity())).readPrefix(),[]);
  await (await store.open(identity())).save(0,{text:'new'});
  setPolicy({synced:true,enabled:true,retentionDays:1});
  setTime(1000+8*86400000);
  assert.deepEqual(await (await store.open(identity())).readPrefix(),[]);
});
test('symlink directories/files never read or overwrite external target; disk errors are inert', async (t) => {
  const {store,root,parent} = await setup(t);
  const external=path.join(parent,'outside');await fs.mkdir(external);
  const victim=path.join(external,'victim');await fs.writeFile(victim,'keep');
  await fs.symlink(external,root);
  assert.equal(await (await store.open(identity())).save(0,{text:'bad'}),false);
  assert.deepEqual(await fs.readdir(external),['victim']);
  await fs.unlink(root);
  const session=await store.open(identity());await session.save(0,{text:'safe'});
  const chunk=path.join(root,identityKey(identity()),'0.json');
  await fs.unlink(chunk);await fs.symlink(victim,chunk);
  assert.deepEqual(await session.readPrefix(),[]);
  assert.equal(await session.save(0,{text:'replacement'}),true);
  assert.equal(await fs.readFile(victim,'utf8'),'keep');
  await store.purge();await fs.rmdir(root);await fs.writeFile(root,'not a directory');
  assert.deepEqual(await session.readPrefix(),[]);
  assert.equal(await session.save(1,{text:'bad'}),false);
  assert.equal(await (await store.open(identity())).save(0,{}),false);
});
test('mid-job shorter retention deletes expired state; serialization errors preserve previous chunks', async (t) => {
  const {store,root,setPolicy,setTime}=await setup(t);
  const session=await store.open(identity());
  await session.save(0,{text:'good'});
  const circular={};circular.self=circular;
  assert.equal(await session.save(1,circular),false);
  assert.deepEqual(await session.readPrefix(),[{text:'good'}]);
  setPolicy({synced:true,enabled:true,retentionDays:0.25});
  setTime(1000+0.25*86400000);
  assert.deepEqual(await session.readPrefix(),[]);
  assert.deepEqual(await fs.readdir(root),[]);
});
test('symlink ancestor and corrupt manifest cannot escape containment', async (t) => {
  const {store,root,parent}=await setup(t);
  const outside=path.join(parent,'actual');await fs.mkdir(outside);
  const alias=path.join(parent,'alias');await fs.symlink(outside,alias);
  const redirected=createStore({root:path.join(alias,'cache'),getPolicy:()=>({synced:true,enabled:true,retentionDays:7})});
  assert.equal(await (await redirected.open(identity())).save(0,{}),false);
  assert.deepEqual(await fs.readdir(outside),[]);
  await (await store.open(identity())).save(0,{text:'old'});
  await fs.writeFile(path.join(root,identityKey(identity()),'manifest.json'),'{');
  assert.deepEqual(await (await store.open(identity())).readPrefix(),[]);
  assert.deepEqual(await fs.readdir(outside),[]);
});

test('keep forever history still allows reuse for at most seven days', async (t) => {
 const {store,setPolicy,setTime}=await setup(t);
 setPolicy({synced:true,enabled:true,retentionDays:0});
 await (await store.open(identity())).save(0,{text:'saved'});
 assert.deepEqual(await (await store.open(identity())).readPrefix(),[{text:'saved'}]);
 setTime(1000+7*86400000);
 assert.deepEqual(await (await store.open(identity())).readPrefix(),[]);
});
