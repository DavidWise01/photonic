'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inspect,observe}=require('./journal-checkpoint.cjs');
const id='a'.repeat(64),magic=Buffer.from('PHOTON16-JOURNAL-V1\n');
const genesis={journalId:id,count:0,head:crypto.createHash('sha256').update(Buffer.from('PHOTON16:journal:v2\0')).update(Buffer.from(id,'hex')).digest('hex')};
function row(i,s=i-1,o=0){const b=Buffer.alloc(18);b.writeBigUInt64LE(BigInt(i));b.writeBigUInt64LE(BigInt(i-1),8);b[16]=s;b[17]=o;return b;}
const bytes=(...rows)=>Buffer.concat([magic,...rows]);
const one=bytes(row(1)),two=bytes(row(1),row(2));
const anchor=inspect(one,id,genesis);assert.equal(anchor.count,1);assert.equal(inspect(two,id,anchor).count,2);
assert.equal(inspect(bytes(...Array.from({length:6},(_,i)=>row(i+1))),id,genesis).terminal,true);
const rejects=[
 ['rollback',magic,id,anchor],
 ['torn',Buffer.concat([two,Buffer.from([1])]),id,anchor],
 ['wrong journal',two,'b'.repeat(64),anchor],
 ['changed prefix',bytes(row(1,0,1)),id,anchor],
 ['invalid stage',bytes(row(1,6)),id,genesis],
 ['invalid observation',bytes(row(1,0,3)),id,genesis],
 ['invalid sequence',bytes(row(2)),id,genesis],
 ['post terminal',bytes(row(1,0,1),row(2)),id,genesis],
 ['missing anchor',two,id,null],
 ['wrong header',Buffer.from('wrong'),id,genesis]
];
for(const [name,b,j,a] of rejects)assert.throws(()=>inspect(b,j,a),undefined,name);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'photon-oi006-'));try{const p=path.join(dir,'journal');fs.writeFileSync(p,two);assert.equal(observe(p,id,anchor).releaseAuthority,'HOLD');assert.deepEqual(fs.readFileSync(p),two);fs.writeFileSync(p+'.observe.lock','existing');assert.throws(()=>observe(p,id,anchor));assert.equal(fs.readFileSync(p+'.observe.lock','utf8'),'existing');}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('OI006: prefix controls, 10 rejection cases and cooperative observer lock controls; external custody unverified.');
