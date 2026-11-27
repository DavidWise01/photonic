'use strict';
// OR005: signed observer receipt, not a lock acquisition or reclamation capability.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function procIdentity(pid){
 assert.ok(Number.isSafeInteger(pid)&&pid>0);
 const stat=fs.readFileSync('/proc/'+pid+'/stat','utf8');
 const end=stat.lastIndexOf(')');assert.ok(end>0);
 const fields=stat.slice(end+2).trim().split(/\s+/);
 assert.match(fields[19],/^\d+$/);
 return {pid,startTicks:fields[19],bootId:fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim()};
}
function payload(r){return Buffer.from(JSON.stringify(['PHOTON16:owner:v1',r.journalId,r.prefixSha256,r.lockDevice,r.lockInode,r.pid,r.startTicks,r.bootId]));}
function observeOwner(path,journalId,pid,key){
 assert.match(journalId,/^[a-f0-9]{64}$/);
 const lock=fs.statSync(path+'.observe.lock',{bigint:true});
 const r={journalId,prefixSha256:hash(fs.readFileSync(path)),lockDevice:String(lock.dev),lockInode:String(lock.ino),...procIdentity(pid)};
 return {...r,signature:crypto.sign(null,payload(r),key).toString('base64')};
}
function verifyReceipt(r,key){try{return crypto.verify(null,payload(r),key,Buffer.from(r.signature,'base64'));}catch{return false;}}
module.exports={procIdentity,observeOwner,verifyReceipt};
