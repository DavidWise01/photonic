'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const custody=require('./custody-registry.cjs'),temporal=require('./temporal-witness.cjs');
const pair=()=>{const p=crypto.generateKeyPairSync('ed25519');return {privateKey:p.privateKey,publicKey:p.publicKey.export({type:'spki',format:'pem'})};};
const cust=pair(),keys=[pair(),pair(),pair()],replacement=pair();
const candidate={status:'STAGED_BUNDLE_PASS',sourceCommit:'a'.repeat(40),wasmSha256:'b'.repeat(64),manifestSha256:'c'.repeat(64)};
const sign=(k,p)=>crypto.sign(null,p,k.privateKey).toString('base64');
const events=[];
function event(action,i,k,old){const e={sequence:events.length+1,previous:events.length?custody.head(events.at(-1)):'0'.repeat(64),action,id:'W'+i,ancestry:'root'+i,publicKey:k.publicKey,custodyDigest:'d'.repeat(64)};e.custodianSignature=sign(cust,custody.payload(e));e.possessionSignature=sign(k,custody.payload(e));if(old)e.previousSignature=sign(old,custody.payload(e));events.push(e);}
function anchor(){return {custodian:{ancestry:'external-custodian',publicKey:cust.publicKey},producerRoots:['repository-ci'],head:custody.head(events.at(-1)),sequence:events.length};}
function records(a,ks){return ks.map((k,i)=>{const r={...candidate,registryHead:a.head,registrySequence:a.sequence,witnessId:'W'+i,ancestry:'root'+i,observation:'REPRODUCED_AND_EXECUTED'};r.signature=sign(k,temporal.payload(r));return r;});}
const q=(r,e=events,a=anchor(),c=candidate)=>temporal.qualify(c,r,e,a);
const reject=(name,r,reason)=>{assert.equal(r.status,'HOLD',name);assert.equal(r.reason,reason,name);assert.equal(r.releaseAuthority,'HOLD');console.log('REJECTED '+name);};
for(let i=0;i<3;i++)event('ENROLL',i,keys[i]);
const prior=anchor(),oldRecords=records(prior,keys);
assert.equal(q(oldRecords).status,'CURRENT_SIGNATURES_VALID');
event('ROTATE',0,replacement,keys[0]);
const current=anchor(),fresh=records(current,[replacement,keys[1],keys[2]]);
const good=q(fresh);assert.equal(good.status,'CURRENT_SIGNATURES_VALID');assert.equal(good.releaseAuthority,'HOLD');
reject('old checkpoint observations',q(oldRecords),'STALE_REGISTRY');
reject('old checkpoint history',q(oldRecords,events.slice(0,3),current),'CUSTODY_REPLAY_REJECTED');
reject('old key signs current checkpoint',q(records(current,keys)),'SIGNATURE_REJECTED');
reject('missing external anchor',q(fresh,events,null),'MISSING_EXTERNAL_ANCHOR');
reject('sequence mismatch',q(fresh,events,{...current,sequence:3}),'SEQUENCE_MISMATCH');
reject('duplicate witness',q([fresh[0],fresh[0],fresh[2]]),'DUPLICATE_ROOT');
reject('incomplete witnesses',q(fresh.slice(0,2)),'THREE_ROOTS_REQUIRED');
reject('different binary',q([{...fresh[0],wasmSha256:'e'.repeat(64)},...fresh.slice(1)]),'OBSERVATION_MISMATCH');
reject('unqualified candidate',q(fresh,events,current,{...candidate,status:'HOLD'}),'INVALID_CANDIDATE');
event('REVOKE',1,keys[1]);const revoked=anchor();
reject('revoked key at current checkpoint',q(records(revoked,[replacement,keys[1],keys[2]])),'INACTIVE_OR_UNKNOWN_WITNESS');
console.log('SYNTHETIC ONLY: 2 positive controls, 10 rejection cases; external independence and release authority remain HOLD.');
