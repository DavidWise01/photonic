'use strict';
// OR006: read-only Linux descriptor binding. Never unlink or reclaim a lock.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {procIdentity,observeOwner,verifyReceipt}=require('./journal-owner.cjs');
const same=(a,b)=>a.pid===b.pid&&a.startTicks===b.startTicks&&a.bootId===b.bootId;
function holdsDescriptor(r){
 for(const fd of fs.readdirSync('/proc/'+r.pid+'/fd')){
  try{const s=fs.statSync('/proc/'+r.pid+'/fd/'+fd,{bigint:true});if(String(s.dev)===r.lockDevice&&String(s.ino)===r.lockInode)return true;}catch(e){if(e.code!=='ENOENT')throw e;}
 }return false;
}
function bind(path,id,pid,key){
 const r=observeOwner(path,id,pid,key);
 assert.ok(holdsDescriptor(r),'process does not hold observed lock descriptor');
 assert.ok(same(r,procIdentity(pid)),'process identity changed');
 const s=fs.statSync(path+'.observe.lock',{bigint:true});
 assert.equal(String(s.dev),r.lockDevice);assert.equal(String(s.ino),r.lockInode);
 return r;
}
function assess(path,r,key){
 const hold=reason=>({reason,recoveryAuthority:'HOLD'});
 if(!verifyReceipt(r,key))return hold('INVALID_SIGNATURE');
 try{
  const s=fs.statSync(path+'.observe.lock',{bigint:true});
  if(String(s.dev)!==r.lockDevice||String(s.ino)!==r.lockInode)return hold('LOCK_CHANGED');
  if(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')!==r.prefixSha256)return hold('PREFIX_CHANGED');
  if(fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim()!==r.bootId)return hold('BOOT_CHANGED');
  let current;try{current=procIdentity(r.pid);}catch(e){return hold(e.code==='ENOENT'?'PROCESS_ABSENT':'LIVENESS_UNKNOWN');}
  if(!same(r,current))return hold('PROCESS_IDENTITY_CHANGED');
  return hold(holdsDescriptor(r)?'LIVE_DESCRIPTOR':'DESCRIPTOR_NOT_OBSERVED');
 }catch{return hold('OBSERVATION_UNAVAILABLE');}
}
module.exports={bind,assess};
