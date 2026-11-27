'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),readline=require('node:readline');
const {bind,assess}=require('./journal-liveness.cjs');
const {observeOwner}=require('./journal-owner.cjs');
const bin=path.resolve(process.argv[2]),dir=fs.mkdtempSync(path.join(os.tmpdir(),'photon-or006-')),p=path.join(dir,'journal'),lock=p+'.observe.lock',id='c'.repeat(64);
const {privateKey,publicKey}=crypto.generateKeyPairSync('ed25519');
(async()=>{
 const child=spawn(bin,['hold',p],{stdio:['pipe','pipe','inherit']});
 const exited=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
 const rl=readline.createInterface({input:child.stdout}),timer=setTimeout(()=>child.kill('SIGKILL'),15000);
 const check=(receipt,reason)=>assert.deepEqual(assess(p,receipt,publicKey),{reason,recoveryAuthority:'HOLD'});
 try{
  assert.equal((await rl[Symbol.asyncIterator]().next()).value,'READY');
  const bytes=fs.readFileSync(p),r=bind(p,id,child.pid,privateKey);
  check(r,'LIVE_DESCRIPTOR');
  assert.throws(()=>bind(p,id,process.pid,privateKey),/does not hold/);
  check({...r,pid:process.pid},'INVALID_SIGNATURE');
  const unrelated=observeOwner(p,id,process.pid,privateKey);
  check(unrelated,'DESCRIPTOR_NOT_OBSERVED');
  child.kill('SIGKILL');assert.deepEqual(await exited,{code:null,signal:'SIGKILL'});
  check(r,'PROCESS_ABSENT');assert.deepEqual(fs.readFileSync(p),bytes);
  // Replace the lock only inside this disposable fixture, preserving original inode.
  fs.renameSync(lock,lock+'.original');fs.writeFileSync(lock,'replacement',{flag:'wx'});
  check(r,'LOCK_CHANGED');fs.unlinkSync(lock);fs.renameSync(lock+'.original',lock);
  check(r,'PROCESS_ABSENT');assert.deepEqual(fs.readFileSync(p),bytes);
  console.log(JSON.stringify({status:'OR006_LIVENESS_PASS',liveDescriptor:true,unrelatedProcessRejected:true,signatureTamperingRejected:true,absentProcessObserved:true,lockReplacementRejected:true,recoveryAuthority:'HOLD'}));
 }finally{clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');await exited.catch(()=>{});rl.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
