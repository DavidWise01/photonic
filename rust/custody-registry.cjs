'use strict';
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const key=p=>{const k=crypto.createPublicKey(p);assert.equal(k.asymmetricKeyType,'ed25519');return k;};
const fingerprint=p=>sha(key(p).export({type:'spki',format:'der'}));
const payload=e=>Buffer.from(JSON.stringify(['PHOTON16:custody:v1',e.sequence,e.previous,e.action,e.id,e.ancestry,e.publicKey,e.custodyDigest]));
const verify=(p,e,s)=>typeof s==='string'&&crypto.verify(null,payload(e),key(p),Buffer.from(s,'base64'));
const head=e=>sha(Buffer.from(JSON.stringify([payload(e).toString('base64'),e.custodianSignature,e.possessionSignature,e.previousSignature||null])));
function replay(events,externalCustodian,producerRoots,expectedHead){
 // A separately authenticated custodian and checkpoint must be supplied by the caller.
 assert.ok(externalCustodian&&hex(expectedHead),'missing external custody anchor');
 assert.ok(!producerRoots.includes(externalCustodian.ancestry),'producer custodian');
 const entries=new Map(),usedRoots=new Set(),usedKeys=new Set([fingerprint(externalCustodian.publicKey)]);
 let previous='0'.repeat(64);
 for(let i=0;i<events.length;i++){
  const e=events[i];assert.equal(e.sequence,i+1);assert.equal(e.previous,previous);assert.ok(hex(e.custodyDigest));assert.ok(typeof e.id==='string'&&e.id.length&&typeof e.ancestry==='string'&&e.ancestry.length);
  assert.ok(e.ancestry!==externalCustodian.ancestry&&!producerRoots.includes(e.ancestry));assert.ok(verify(externalCustodian.publicKey,e,e.custodianSignature),'custodian signature');
  const old=entries.get(e.id);
  if(e.action==='ENROLL'){
   assert.ok(!old&&!usedRoots.has(e.ancestry),'duplicate identity or root');
   const fp=fingerprint(e.publicKey);assert.ok(!usedKeys.has(fp),'duplicate key');assert.ok(verify(e.publicKey,e,e.possessionSignature),'possession');
   usedRoots.add(e.ancestry);usedKeys.add(fp);entries.set(e.id,{id:e.id,ancestry:e.ancestry,publicKey:e.publicKey,active:true});
  }else if(e.action==='ROTATE'){
   assert.ok(old&&old.active&&old.ancestry===e.ancestry);const fp=fingerprint(e.publicKey);assert.ok(!usedKeys.has(fp),'reused key');assert.ok(verify(old.publicKey,e,e.previousSignature),'old key');assert.ok(verify(e.publicKey,e,e.possessionSignature),'new key');usedKeys.add(fp);entries.set(e.id,{...old,publicKey:e.publicKey});
  }else if(e.action==='REVOKE'){
   assert.ok(old&&old.active&&old.ancestry===e.ancestry&&old.publicKey===e.publicKey);entries.set(e.id,{...old,active:false});
  }else throw Error('unknown action');
  previous=head(e);
 }
 assert.equal(previous,expectedHead,'external checkpoint mismatch');
 return {registry:[...entries.values()].filter(e=>e.active),head:previous,events:events.length,custody:'SIGNATURES_VALID',independence:'UNVERIFIED',releaseAuthority:'HOLD'};
}
module.exports={replay,payload,head};
