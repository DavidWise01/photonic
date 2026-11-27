'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn,spawnSync}=require('node:child_process'),readline=require('node:readline');
const {observe}=require('./journal-checkpoint.cjs');
const bin=path.resolve(process.argv[2]),dir=fs.mkdtempSync(path.join(os.tmpdir(),'photon-eo003-')),p=path.join(dir,'journal'),lock=p+'.observe.lock';
const id='a'.repeat(64),head=crypto.createHash('sha256').update(Buffer.from('PHOTON16:journal:v2\0')).update(Buffer.from(id,'hex')).digest('hex'),retained={journalId:id,count:0,head};
function run(mode,file=p){const r=spawnSync(bin,[mode,file],{encoding:'utf8',timeout:5000});assert.ifError(r.error);assert.equal(r.signal,null);return r;}
(async()=>{
 const child=spawn(bin,['hold',p],{stdio:['pipe','pipe','inherit']});
 const exited=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
 const rl=readline.createInterface({input:child.stdout});const iter=rl[Symbol.asyncIterator]();
 const timer=setTimeout(()=>child.kill('SIGKILL'),15000);
 try{
  assert.equal((await iter.next()).value,'READY');
  const initial=fs.readFileSync(p);assert.equal(initial.length,38);assert.ok(fs.existsSync(lock));
  assert.throws(()=>observe(p,id,retained),{code:'EEXIST'});
  assert.notEqual(run('inspect').status,0);assert.notEqual(run('create').status,0);
  assert.deepEqual(fs.readFileSync(p),initial);assert.ok(fs.existsSync(lock));
  child.stdin.end('RELEASE\n');assert.equal((await iter.next()).value,'RELEASED');
  assert.deepEqual(await exited,{code:0,signal:null});assert.ok(!fs.existsSync(lock));
  const final=fs.readFileSync(p);assert.equal(final.length,128);assert.deepEqual(final.subarray(0,initial.length),initial);
  const receipt=observe(p,id,retained);assert.equal(receipt.count,6);assert.equal(receipt.terminal,true);assert.equal(receipt.releaseAuthority,'HOLD');assert.deepEqual(fs.readFileSync(p),final);
  // Node owns the same lock primitive while native processes try to enter.
  const fd=fs.openSync(lock,'wx',0o600);
  try{assert.notEqual(run('inspect').status,0);assert.deepEqual(fs.readFileSync(p),final);assert.ok(fs.existsSync(lock));}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
  const fresh=path.join(dir,'fresh'),fd2=fs.openSync(fresh+'.observe.lock','wx',0o600);
  try{assert.notEqual(run('create',fresh).status,0);assert.ok(!fs.existsSync(fresh));}finally{fs.closeSync(fd2);fs.unlinkSync(fresh+'.observe.lock');}
  const replay=run('inspect');assert.equal(replay.status,0);assert.equal(replay.stdout.trim(),'6');
  console.log(JSON.stringify({status:'COOPERATIVE_CROSS_PROCESS_PASS',writerBlocksObserver:true,nodeLockBlocksNative:true,prefixPreserved:true,records:6,releaseAuthority:'HOLD'}));
 }finally{clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');await exited.catch(()=>{});rl.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
