'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),q=require('./blind-witness.cjs');
const pair=()=>{const k=crypto.generateKeyPairSync('ed25519');return {privateKey:k.privateKey,publicKey:k.publicKey.export({type:'spki',format:'pem'})};};
const ws=[pair(),pair(),pair()],co=pair();
const sign=(k,p)=>crypto.sign(null,p,k.privateKey).toString('base64');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const c={sourceCommit:'a'.repeat(40),wasmSha256:'b'.repeat(64),manifestSha256:'c'.repeat(64),registryHead:'d'.repeat(64),registrySequence:3,transitionHead:'0'.repeat(64),transitionCount:0,challenge:'e'.repeat(64)};
const registry=ws.map((w,i)=>({id:'W'+i,ancestry:'root'+i,publicKey:w.publicKey})),coordinator={ancestry:'coordinator',publicKey:co.publicKey};
function fixture(observations=['1','1','1'],salts=['2','3','4']){
 const reveals=ws.map((w,i)=>({id:'W'+i,observation:observations[i].repeat(64),salt:salts[i].repeat(64)}));
 const seals=reveals.map((r,i)=>{const s={id:r.id,commitment:q.commitment(c,r.id,r.observation,r.salt)};s.signature=sign(ws[i],q.sealPayload(c,s));return s;});
 const p=q.barrierPayload(c,seals),barrier={digest:sha(p),signature:sign(co,p)};
 for(let i=0;i<3;i++)reveals[i].signature=sign(ws[i],q.revealPayload(c,reveals[i],barrier.digest));
 return {seals,barrier,reveals};
}
const f=fixture(),run=(x=f,reg=registry,coord=coordinator,context=c)=>q.qualify(context,x.seals,x.barrier,x.reveals,reg,coord);
assert.equal(run().status,'COMMITTED_AGREEMENT');assert.equal(run().blindAcquisition,'UNVERIFIED');assert.equal(run().releaseAuthority,'HOLD');
const disagree=run(fixture(['1','1','5']));assert.equal(disagree.status,'COMMITTED_DISAGREEMENT');assert.equal(disagree.observations.length,3);assert.equal(disagree.releaseAuthority,'HOLD');
assert.equal(run({...f,seals:[...f.seals].reverse()}).status,'COMMITTED_AGREEMENT');
const cases=[
 ['missing seals',{...f,seals:f.seals.slice(0,2)},'INCOMPLETE_SEALS'],
 ['duplicate seals',{...f,seals:[f.seals[0],f.seals[0],f.seals[2]]},'INCOMPLETE_SEALS'],
 ['tampered seal',{...f,seals:[{...f.seals[0],commitment:'f'.repeat(64)},...f.seals.slice(1)]},'INVALID_SEAL'],
 ['missing barrier',{...f,barrier:null},'INVALID_BARRIER'],
 ['incorrect barrier digest',{...f,barrier:{...f.barrier,digest:'f'.repeat(64)}},'INVALID_BARRIER'],
 ['incorrect barrier signer',{...f,barrier:{...f.barrier,signature:sign(ws[0],q.barrierPayload(c,f.seals))}},'INVALID_BARRIER'],
 ['missing reveals',{...f,reveals:f.reveals.slice(0,2)},'INCOMPLETE_REVEALS'],
 ['duplicate reveals',{...f,reveals:[f.reveals[0],f.reveals[0],f.reveals[2]]},'INCOMPLETE_REVEALS'],
 ['changed observation',{...f,reveals:[{...f.reveals[0],observation:'f'.repeat(64)},...f.reveals.slice(1)]},'INVALID_OPENING'],
 ['changed salt',{...f,reveals:[{...f.reveals[0],salt:'f'.repeat(64)},...f.reveals.slice(1)]},'INVALID_OPENING'],
 ['wrong reveal signature',{...f,reveals:[{...f.reveals[0],signature:f.reveals[1].signature},...f.reveals.slice(1)]},'INVALID_OPENING'],
 ['reused salts',fixture(['1','1','1'],['2','2','4']),'REUSED_SALT']
];
function reject(name,r,reason){assert.equal(r.status,'HOLD',name);assert.equal(r.reason,reason,name);assert.equal(r.releaseAuthority,'HOLD');console.log('REJECTED '+name);}
for(const [n,x,r] of cases)reject(n,run(x),r);
reject('missing trust',run(f,[]),'MISSING_TRUST');
reject('shared ancestry',run(f,registry.map((e,i)=>i===1?{...e,ancestry:registry[0].ancestry}:e)),'SHARED_TRUST');
reject('shared coordinator key',run(f,registry,{...coordinator,publicKey:ws[0].publicKey}),'SHARED_TRUST');
reject('stale context',run(f,registry,coordinator,{...c,challenge:'f'.repeat(64)}),'INVALID_SEAL');
console.log('SYNTHETIC ONLY: 3 controls and 16 rejection cases. Actual acquisition isolation unverified.');
