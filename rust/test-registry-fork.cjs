'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const c=require('./custody-registry.cjs'),t=require('./custodian-transition.cjs'),{fingerprint}=require('./checkpoint-freshness.cjs'),{compare}=require('./registry-fork.cjs');
const pair=()=>{const k=crypto.generateKeyPairSync('ed25519');return {privateKey:k.privateKey,publicKey:k.publicKey.export({type:'spki',format:'pem'})};};
const cust=pair(),w=pair(),u=pair(),v=pair(),k1=pair(),k2=pair(),z='0'.repeat(64),challenge='a'.repeat(64);
const sign=(k,p)=>crypto.sign(null,p,k.privateKey).toString('base64');
const trust={registryId:'synthetic-fork',custodian:{ancestry:'custody',publicKey:cust.publicKey},producerRoots:['repository-ci']};
function enroll(sequence,previous,id,k,issuer=cust){const e={sequence,previous,action:'ENROLL',id,ancestry:'root-'+id,publicKey:k.publicKey,custodyDigest:'b'.repeat(64)};e.custodianSignature=sign(issuer,c.payload(e));e.possessionSignature=sign(k,c.payload(e));return e;}
const e1=enroll(1,z,'W1',w),h1=c.head(e1),e2=enroll(2,h1,'W2',u),f2=enroll(2,h1,'W3',v),e3=enroll(3,c.head(e2),'W3',v);
const retained={registryId:trust.registryId,sequence:1,head:h1,transitionCount:0,transitionHead:z};
function rotation(k){const r={ancestry:'custody',sequence:1,head:h1,oldKey:cust.publicKey,newKey:k.publicKey};r.oldSignature=sign(cust,t.transitionPayload(r));r.newSignature=sign(k,t.transitionPayload(r));return r;}
function branch(events,transitions=[],issuer=cust,nonce=challenge){const r={registryId:trust.registryId,sequence:events.length,head:c.head(events.at(-1)),transitionCount:transitions.length,transitionHead:t.transitionHead(transitions),previousSequence:1,previousHead:h1,previousTransitionCount:0,previousTransitionHead:z,challenge:nonce,custodianFingerprint:fingerprint(issuer.publicKey)};r.signature=sign(issuer,t.receiptPayload(r));return {events,transitions,receipt:r};}
const a=branch([e1,e2]),b=branch([e1,f2]),long=branch([e1,e2,e3]),short=branch([e1]),r1=branch([e1],[rotation(k1)],k1),r2=branch([e1],[rotation(k2)],k2);
const run=(x,y,ca=challenge,cb=challenge)=>{const result=compare(x,y,retained,trust,ca,cb);assert.equal(result.releaseAuthority,'HOLD');assert.equal(result.selected,null);return result;};
assert.equal(run(a,a).status,'IDENTICAL_HISTORY');
assert.equal(run(a,long).direction,'A_TO_B');assert.equal(run(long,a).direction,'B_TO_A');
assert.equal(run(short,r1).status,'COMPATIBLE_EXTENSION');
const fork=run(a,b);assert.equal(fork.status,'AUTHENTICATED_FORK');assert.equal(fork.evidence.length,2);assert.equal(fork.conflictDigest,run(b,a).conflictDigest);
assert.equal(run(long,b).status,'AUTHENTICATED_FORK');
assert.equal(run(r1,r2).status,'AUTHENTICATED_FORK');
const mixed=branch([e1,enroll(2,h1,'W2',u,k1)],r1.transitions,k1);assert.equal(run(r1,mixed).status,'COMPATIBLE_EXTENSION');assert.equal(run(a,mixed).status,'AUTHENTICATED_FORK');
assert.equal(run(a,{...b,receipt:{...b.receipt,signature:'invalid'}}).status,'INVALID_BRANCH');
assert.equal(run(a,b,'c'.repeat(64)).status,'INVALID_BRANCH');
const nonce='d'.repeat(64);assert.equal(run(a,branch([e1,e2],[],cust,nonce),challenge,nonce).status,'IDENTICAL_HISTORY');
console.log('SYNTHETIC ONLY: 13 fork/extension/identity assertions; no release authority.');
