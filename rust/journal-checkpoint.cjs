'use strict';
// OI-006: cryptographic sidecar over immutable V1 journal bytes; no rewrite/recovery authority.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const magic=Buffer.from('PHOTON16-JOURNAL-V1\n');
const hash=(...parts)=>crypto.createHash('sha256').update(Buffer.concat(parts)).digest();
const hex=b=>b.toString('hex');
function inspect(bytes,journalId,retained){
 assert.ok(Buffer.isBuffer(bytes)&&bytes.subarray(0,magic.length).equals(magic),'header');
 assert.match(journalId,/^[a-f0-9]{64}$/);
 assert.equal((bytes.length-magic.length)%18,0,'torn record');
 const count=(bytes.length-magic.length)/18;assert.ok(count<=6,'record bound');
 let head=hash(Buffer.from('PHOTON16:journal:v2\0'),Buffer.from(journalId,'hex')),cursor=0,terminal=false;
 const heads=[hex(head)];
 for(let i=0;i<count;i++){
  const row=bytes.subarray(magic.length+i*18,magic.length+(i+1)*18);
  assert.equal(row.readBigUInt64LE(0),BigInt(i+1));assert.equal(row.readBigUInt64LE(8),BigInt(i));
  assert.ok(!terminal&&row[16]<6&&row[17]<3,'invalid transition');
  terminal=row[16]!==cursor||row[17]!==0||++cursor===6;
  head=hash(Buffer.from('PHOTON16:record:v2\0'),head,row);heads.push(hex(head));
 }
 assert.ok(retained&&retained.journalId===journalId,'external checkpoint required');
 assert.ok(Number.isSafeInteger(retained.count)&&retained.count>=0&&retained.count<=count,'rollback');
 assert.equal(heads[retained.count],retained.head,'retained prefix mismatch');
 return {journalId,count,head:hex(head),status:'RETAINED_PREFIX_MATCH',terminal,releaseAuthority:'HOLD',externalCustody:'UNVERIFIED'};
}
function observe(path,journalId,retained){
 // Cooperative exclusion only. Never remove another process's lock or repair bytes.
 const lock=path+'.observe.lock';const fd=fs.openSync(lock,'wx',0o600);
 try{return inspect(fs.readFileSync(path),journalId,retained);}
 finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
module.exports={inspect,observe};
