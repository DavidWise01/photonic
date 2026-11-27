'use strict';
// EO004: controlled SIGKILL of our own test child; no automatic stale-lock removal.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn,spawnSync}=require('node:child_process'),readline=require('node:readline');
const {observe,inspect}=require('./journal-checkpoint.cjs');
const bin=path.resolve(process.argv[2]),dir=fs.mkdtempSync(path.join(os.tmpdir(),'photon-eo004-')),p=path.join(dir,'journal'),lock=p+'.observe.lock';
const id='b'.repeat(64),hash=(...b)=>crypto.createHash('sha256').update(Buffer.concat(b)).digest('hex');
const retained={journalId:id,count:0,head:hash(Buffer.from('PHOTON16:journal:v2\0'),Buffer.from(id,'hex'))};
(async()=>{
 const child=spawn(bin,['hold',p],{stdio:['pipe','pipe','inherit']});
 const exited=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
 const rl=readline.createInterface({input:child.stdout});
 const timer=setTimeout(()=>child.kill('SIGKILL'),15000);
 try{
  assert.equal((await rl[Symbol.asyncIterator]().next()).value,'READY');
  const before=fs.readFileSync(p),lockBefore=fs.readFileSync(lock);
  assert.equal(before.length,38);
  const checkpoint=inspect(before,id,retained);assert.equal(checkpoint.count,1);assert.equal(checkpoint.terminal,false);
  assert.equal(child.kill('SIGKILL'),true);assert.deepEqual(await exited,{code:null,signal:'SIGKILL'});
  assert.deepEqual(fs.readFileSync(p),before);assert.deepEqual(fs.readFileSync(lock),lockBefore);
  assert.throws(()=>observe(p,id,checkpoint),{code:'EEXIST'});
  for(const mode of ['inspect','create']){
   const r=spawnSync(bin,[mode,p],{encoding:'utf8',timeout:5000});assert.ifError(r.error);assert.equal(r.signal,null);assert.notEqual(r.status,0);
  }
  assert.deepEqual(fs.readFileSync(p),before);assert.deepEqual(fs.readFileSync(lock),lockBefore);
  const torn=Buffer.concat([before,Buffer.from([2])]);assert.throws(()=>inspect(torn,id,checkpoint));
  const altered=Buffer.from(before);altered[37]=1;assert.throws(()=>inspect(altered,id,checkpoint));
  assert.throws(()=>inspect(before.subarray(0,20),id,checkpoint));
  const receipt=inspect(fs.readFileSync(p),id,checkpoint);assert.equal(receipt.head,checkpoint.head);
  console.log(JSON.stringify({status:'INTERRUPTED_JOURNAL_FAIL_CLOSED',termination:'SIGKILL',retainedCount:1,bytes:before.length,sha256:hash(before),retainedHead:checkpoint.head,staleLockPreserved:true,tornRejected:true,alteredRejected:true,rollbackRejected:true,recoveryAuthority:'HOLD',releaseAuthority:'HOLD'}));
 }finally{clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');await exited.catch(()=>{});rl.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
