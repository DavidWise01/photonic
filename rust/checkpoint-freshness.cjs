'use strict';
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const {replay,head}=require('./custody-registry.cjs');
const temporal=require('./temporal-witness.cjs');
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const fingerprint=p=>{const k=crypto.createPublicKey(p);assert.equal(k.asymmetricKeyType,'ed25519');return crypto.createHash('sha256').update(k.export({type:'spki',format:'der'})).digest('hex');};
const payload=c=>Buffer.from(JSON.stringify(['PHOTON16:checkpoint:v1',c.registryId,c.sequence,c.head,c.previousSequence,c.previousHead,c.challenge,c.custodianFingerprint]));
function advance(events,retained,receipt,trust,challenge){
 // retained, trust and a newly issued challenge must come from external custody.
 assert.ok(retained&&trust&&hex(challenge)&&hex(retained.head),'missing external anchor');
 assert.ok(typeof trust.registryId==='string'&&trust.registryId.length>0);
 assert.equal(retained.registryId,trust.registryId);assert.equal(receipt.registryId,trust.registryId);
 assert.ok(Number.isSafeInteger(retained.sequence)&&retained.sequence>=0);
 assert.ok(Number.isSafeInteger(receipt.sequence)&&receipt.sequence>=retained.sequence,'rollback');
 assert.equal(receipt.previousSequence,retained.sequence);assert.equal(receipt.previousHead,retained.head);
 assert.equal(receipt.challenge,challenge);assert.ok(hex(receipt.head));
 assert.equal(receipt.custodianFingerprint,fingerprint(trust.custodian.publicKey));
 assert.ok(crypto.verify(null,payload(receipt),crypto.createPublicKey(trust.custodian.publicKey),Buffer.from(receipt.signature,'base64')),'checkpoint signature');
 assert.equal(events.length,receipt.sequence);
 assert.equal(retained.sequence===0?'0'.repeat(64):head(events[retained.sequence-1]),retained.head,'retained prefix mismatch');
 const state=replay(events,trust.custodian,trust.producerRoots,receipt.head);
 return {registryId:trust.registryId,sequence:state.events,head:state.head,status:'LOGICAL_CHECKPOINT_VALID',wallClock:'UNVERIFIED',releaseAuthority:'HOLD'};
}
function qualifyCurrent(candidate,records,events,retained,receipt,trust,challenge){
 try{const next=advance(events,retained,receipt,trust,challenge);return {...temporal.qualify(candidate,records,events,{custodian:trust.custodian,producerRoots:trust.producerRoots,sequence:next.sequence,head:next.head}),checkpoint:next};}
 catch{return {status:'HOLD',reason:'CHECKPOINT_REJECTED',authenticated:0,releaseAuthority:'HOLD'};}
}
module.exports={advance,payload,fingerprint,qualifyCurrent};
