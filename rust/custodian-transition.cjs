'use strict';
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const custody=require('./custody-registry.cjs'),temporal=require('./temporal-witness.cjs');
const {fingerprint}=require('./checkpoint-freshness.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hex=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const transitionPayload=t=>Buffer.from(JSON.stringify(['PHOTON16:custodian-transition:v1',t.ancestry,t.sequence,t.head,t.oldKey,t.newKey]));
const transitionHead=ts=>ts.reduce((h,t)=>sha(Buffer.from(JSON.stringify([h,transitionPayload(t).toString('base64'),t.oldSignature,t.newSignature]))),'0'.repeat(64));
const receiptPayload=r=>Buffer.from(JSON.stringify(['PHOTON16:checkpoint:v2',r.registryId,r.sequence,r.head,r.transitionCount,r.transitionHead,r.previousSequence,r.previousHead,r.previousTransitionCount,r.previousTransitionHead,r.challenge,r.custodianFingerprint]));
function advance(events,transitions,retained,receipt,trust,challenge){
 assert.ok(retained&&trust&&hex(challenge)&&hex(retained.head)&&hex(retained.transitionHead));
 assert.equal(retained.registryId,trust.registryId);assert.equal(receipt.registryId,trust.registryId);
 for(const n of [retained.sequence,retained.transitionCount,receipt.sequence,receipt.transitionCount])assert.ok(Number.isSafeInteger(n)&&n>=0);
 assert.ok(receipt.sequence>=retained.sequence&&receipt.transitionCount>=retained.transitionCount,'rollback');
 assert.equal(receipt.previousSequence,retained.sequence);assert.equal(receipt.previousHead,retained.head);
 assert.equal(receipt.previousTransitionCount,retained.transitionCount);assert.equal(receipt.previousTransitionHead,retained.transitionHead);
 assert.equal(receipt.challenge,challenge);assert.equal(events.length,receipt.sequence);assert.equal(transitions.length,receipt.transitionCount);
 assert.equal(retained.sequence?custody.head(events[retained.sequence-1]):'0'.repeat(64),retained.head);
 assert.equal(transitionHead(transitions.slice(0,retained.transitionCount)),retained.transitionHead);
 assert.equal(transitionHead(transitions),receipt.transitionHead);
 assert.ok(transitions.slice(retained.transitionCount).every(t=>t.sequence>=retained.sequence),'retroactive transition');
 assert.ok(transitions.slice(0,retained.transitionCount).every(t=>t.sequence<=retained.sequence),'invalid retained transition');
 const state=custody.replay(events,trust.custodian,trust.producerRoots,receipt.head,transitions);
 assert.equal(receipt.custodianFingerprint,fingerprint(state.currentCustodianKey));
 assert.ok(crypto.verify(null,receiptPayload(receipt),crypto.createPublicKey(state.currentCustodianKey),Buffer.from(receipt.signature,'base64')),'current custodian receipt signature');
 return {registryId:trust.registryId,sequence:state.events,head:state.head,transitionCount:transitions.length,transitionHead:receipt.transitionHead,custodianFingerprint:receipt.custodianFingerprint,status:'LOGICAL_CHECKPOINT_VALID',releaseAuthority:'HOLD',wallClock:'UNVERIFIED'};
}
function qualifyCurrent(candidate,records,events,transitions,retained,receipt,trust,challenge){
 try{const next=advance(events,transitions,retained,receipt,trust,challenge);return {...temporal.qualify(candidate,records,events,{custodian:trust.custodian,producerRoots:trust.producerRoots,sequence:next.sequence,head:next.head,transitions}),checkpoint:next};}catch{return {status:'HOLD',reason:'CHECKPOINT_REJECTED',releaseAuthority:'HOLD',authenticated:0};}
}
module.exports={advance,qualifyCurrent,transitionPayload,transitionHead,receiptPayload};
