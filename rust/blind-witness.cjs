'use strict';
const crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hex=(x,n=64)=>typeof x==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(x);
const bytes=x=>Buffer.from(JSON.stringify(x));
const context=c=>[c.sourceCommit,c.wasmSha256,c.manifestSha256,c.registryHead,c.registrySequence,c.transitionHead,c.transitionCount,c.challenge];
const commitment=(c,id,observation,salt)=>sha(bytes(['PHOTON16:blind-opening:v1',context(c),id,observation,salt]));
const sealPayload=(c,r)=>bytes(['PHOTON16:blind-seal:v1',context(c),r.id,r.commitment]);
const barrierPayload=(c,seals)=>bytes(['PHOTON16:blind-barrier:v1',context(c),seals.map(r=>[r.id,r.commitment,r.signature]).sort((a,b)=>a[0].localeCompare(b[0]))]);
const revealPayload=(c,r,barrierDigest)=>bytes(['PHOTON16:blind-reveal:v1',context(c),barrierDigest,r.id,r.observation,r.salt]);
function verify(key,p,s){try{const k=crypto.createPublicKey(key);return k.asymmetricKeyType==='ed25519'&&typeof s==='string'&&crypto.verify(null,p,k,Buffer.from(s,'base64'));}catch{return false;}}
function qualify(c,seals,barrier,reveals,registry,coordinator){
 const hold=reason=>({status:'HOLD',reason,releaseAuthority:'HOLD'});
 try{
  // Registry and coordinator must be supplied from independently retained custody.
  if(!c||!hex(c.sourceCommit,40)||![c.wasmSha256,c.manifestSha256,c.registryHead,c.transitionHead,c.challenge].every(x=>hex(x))||![c.registrySequence,c.transitionCount].every(x=>Number.isSafeInteger(x)&&x>=0))return hold('INVALID_CONTEXT');
  if(!Array.isArray(registry)||registry.length!==3||!coordinator)return hold('MISSING_TRUST');
  const ids=new Set(),roots=new Set(),keys=new Set();
  const fp=p=>{const k=crypto.createPublicKey(p);if(k.asymmetricKeyType!=='ed25519')throw Error('key type');return sha(k.export({type:'spki',format:'der'}));};
  const coordinatorKey=fp(coordinator.publicKey);
  for(const e of registry){const k=fp(e.publicKey);if(!e.id||!e.ancestry||ids.has(e.id)||roots.has(e.ancestry)||keys.has(k)||k===coordinatorKey||e.ancestry===coordinator.ancestry)return hold('SHARED_TRUST');ids.add(e.id);roots.add(e.ancestry);keys.add(k);}
  if(!Array.isArray(seals)||seals.length!==3||new Set(seals.map(r=>r.id)).size!==3)return hold('INCOMPLETE_SEALS');
  for(const r of seals){const e=registry.find(x=>x.id===r.id);if(!e||!hex(r.commitment)||!verify(e.publicKey,sealPayload(c,r),r.signature))return hold('INVALID_SEAL');}
  const bp=barrierPayload(c,seals),bd=sha(bp);
  if(!barrier||barrier.digest!==bd||!verify(coordinator.publicKey,bp,barrier.signature))return hold('INVALID_BARRIER');
  if(!Array.isArray(reveals)||reveals.length!==3||new Set(reveals.map(r=>r.id)).size!==3)return hold('INCOMPLETE_REVEALS');
  for(const r of reveals){const e=registry.find(x=>x.id===r.id),s=seals.find(x=>x.id===r.id);if(!e||!s||!hex(r.observation)||!hex(r.salt)||commitment(c,r.id,r.observation,r.salt)!==s.commitment||!verify(e.publicKey,revealPayload(c,r,bd),r.signature))return hold('INVALID_OPENING');}
  if(new Set(reveals.map(r=>r.salt)).size!==3)return hold('REUSED_SALT');
  const agreement=new Set(reveals.map(r=>r.observation)).size===1;
  return {status:agreement?'COMMITTED_AGREEMENT':'COMMITTED_DISAGREEMENT',barrierDigest:bd,observations:reveals.map(r=>({id:r.id,digest:r.observation})),blindAcquisition:'UNVERIFIED',independence:'UNVERIFIED',releaseAuthority:'HOLD'};
 }catch{return hold('INVALID_EVIDENCE');}
}
module.exports={qualify,commitment,sealPayload,barrierPayload,revealPayload};
