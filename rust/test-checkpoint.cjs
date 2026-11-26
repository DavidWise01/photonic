'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),custody=require('./custody-registry.cjs'),cp=require('./checkpoint-freshness.cjs');
const pair=()=>{const k=crypto.generateKeyPairSync('ed25519');return {privateKey:k.privateKey,publicKey:k.publicKey.export({type:'spki',format:'pem'})};};
const cust=pair(),w=pair(),other=pair();
const sign=(k,p)=>crypto.sign(null,p,k.privateKey).toString('base64');
const zero='0'.repeat(64),challenge='1'.repeat(64),trust={registryId:'synthetic-registry',custodian:{ancestry:'external-custodian',publicKey:cust.publicKey},producerRoots:['repository-ci']};
function enroll(previous,sequence,id,k){const e={previous,sequence,action:'ENROLL',id,ancestry:'root-'+id,publicKey:k.publicKey,custodyDigest:'a'.repeat(64)};e.custodianSignature=sign(cust,custody.payload(e));e.possessionSignature=sign(k,custody.payload(e));return e;}
const e1=enroll(zero,1,'W1',w),e2=enroll(custody.head(e1),2,'W2',other),events=[e1,e2];
const retained={registryId:trust.registryId,sequence:1,head:custody.head(e1)};
function receipt(overrides={},k=cust){const r={registryId:trust.registryId,sequence:2,head:custody.head(e2),previousSequence:retained.sequence,previousHead:retained.head,challenge,custodianFingerprint:cp.fingerprint(cust.publicKey),...overrides};r.signature=sign(k,cp.payload(r));return r;}
const valid=receipt();const next=cp.advance(events,retained,valid,trust,challenge);assert.equal(next.sequence,2);assert.equal(next.wallClock,'UNVERIFIED');assert.equal(next.releaseAuthority,'HOLD');
const same=receipt({sequence:1,head:retained.head});assert.equal(cp.advance([e1],retained,same,trust,challenge).head,retained.head);
const cases=[
 ['rollback',[],receipt({sequence:0,head:zero}),retained,trust,challenge],
 ['wrong registry',events,receipt({registryId:'other'}),retained,trust,challenge],
 ['wrong challenge',events,valid,retained,trust,'2'.repeat(64)],
 ['incorrect predecessor',events,receipt({previousHead:zero}),retained,trust,challenge],
 ['incorrect predecessor sequence',events,receipt({previousSequence:0}),retained,trust,challenge],
 ['wrong signing key',events,receipt({},other),retained,trust,challenge],
 ['wrong fingerprint',events,receipt({custodianFingerprint:cp.fingerprint(other.publicKey)}),retained,trust,challenge],
 ['truncated history',[e1],valid,retained,trust,challenge],
 ['forked prefix',events,receipt({previousHead:'3'.repeat(64)}),{...retained,head:'3'.repeat(64)},trust,challenge],
 ['wrong final head',events,receipt({head:'4'.repeat(64)}),retained,trust,challenge],
 ['missing retained anchor',events,valid,null,trust,challenge],
 ['missing challenge',events,valid,retained,trust,null]
];
for(const [n,e,r,a,t,c] of cases){assert.throws(()=>cp.advance(e,a,r,t,c),undefined,n);console.log('REJECTED '+n);}
assert.equal(cp.qualifyCurrent({},[],events,retained,valid,trust,challenge).reason,'INVALID_CANDIDATE');
assert.equal(cp.qualifyCurrent({},[],events,retained,valid,trust,'2'.repeat(64)).reason,'CHECKPOINT_REJECTED');
console.log('SYNTHETIC ONLY: two checkpoint controls, twelve rejection cases and two composition checks. No trusted UTC or external custody established.');
