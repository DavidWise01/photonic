'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const c=require('./custody-registry.cjs'),t=require('./custodian-transition.cjs'),q=require('./independent-custody.cjs');
const pair=()=>{const k=crypto.generateKeyPairSync('ed25519');return {privateKey:k.privateKey,publicKey:k.publicKey.export({type:'spki',format:'pem'})};};
const cust=pair(),ws=[pair(),pair(),pair()],as=[pair(),pair(),pair()],z='0'.repeat(64),challenge='a'.repeat(64);
const sign=(k,p)=>crypto.sign(null,p,k.privateKey).toString('base64');
const trust={registryId:'synthetic',custodian:{ancestry:'custody',publicKey:cust.publicKey},producerRoots:['repository-ci']};
const events=[];for(let i=0;i<3;i++){const e={sequence:i+1,previous:i?c.head(events.at(-1)):z,action:'ENROLL',id:'W'+i,ancestry:'root'+i,publicKey:ws[i].publicKey,custodyDigest:String(i+1).repeat(64)};e.custodianSignature=sign(cust,c.payload(e));e.possessionSignature=sign(ws[i],c.payload(e));events.push(e);}
const retained={registryId:'synthetic',sequence:0,head:z,transitionCount:0,transitionHead:z};
const receipt={registryId:'synthetic',sequence:3,head:c.head(events.at(-1)),transitionCount:0,transitionHead:z,previousSequence:0,previousHead:z,previousTransitionCount:0,previousTransitionHead:z,challenge,custodianFingerprint:q.fingerprint(cust.publicKey)};receipt.signature=sign(cust,t.receiptPayload(receipt));
const auditors=as.map((k,i)=>({id:'A'+i,publicKey:k.publicKey,controlRoots:['auditor-control-'+i]}));
const obs=ws.map((k,i)=>{const r={registryId:'synthetic',registryHead:receipt.head,registrySequence:3,transitionHead:z,transitionCount:0,witnessId:'W'+i,ancestry:'root'+i,keyFingerprint:q.fingerprint(k.publicKey),custodyDigest:events[i].custodyDigest,auditorId:'A'+i,controlRoots:['witness-control-'+i],challenge};r.signature=sign(as[i],q.payload(r));return r;});
const run=(o=obs,a=auditors,p=['producer-control'])=>q.qualify(events,[],retained,receipt,trust,challenge,o,a,p);
const good=run();assert.equal(good.status,'DECLARED_ANCESTRY_DISJOINT');assert.equal(good.authenticated,3);assert.equal(good.independence,'UNVERIFIED');assert.equal(good.releaseAuthority,'HOLD');
function changed(i,delta,k=as[i]){const o=obs.map(r=>({...r}));Object.assign(o[i],delta);o[i].signature=sign(k,q.payload(o[i]));return o;}
const tests=[
 ['missing external registry',()=>run(obs,[]),'MISSING_EXTERNAL_CONTROL_ANCHOR'],
 ['missing producer roots',()=>run(obs,auditors,[]),'MISSING_EXTERNAL_CONTROL_ANCHOR'],
 ['incomplete observations',()=>run(obs.slice(0,2)),'THREE_OBSERVATIONS_REQUIRED'],
 ['stale checkpoint',()=>run(changed(1,{registrySequence:2})),'STALE_OBSERVATION'],
 ['stale challenge',()=>run(changed(1,{challenge:z})),'STALE_OBSERVATION'],
 ['wrong witness key',()=>run(changed(1,{keyFingerprint:z})),'WITNESS_IDENTITY_REJECTED'],
 ['wrong custody digest',()=>run(changed(1,{custodyDigest:z})),'CUSTODY_DIGEST_MISMATCH'],
 ['duplicate witness',()=>run([obs[0],obs[0],obs[2]]),'WITNESS_IDENTITY_REJECTED'],
 ['duplicate auditor',()=>run(changed(1,{auditorId:'A0'},as[0])),'AUDITOR_IDENTITY_REJECTED'],
 ['auditor uses witness key',()=>run(changed(1,{},ws[1]),auditors.map((a,i)=>i===1?{...a,publicKey:ws[1].publicKey}:a)),'AUDITOR_KEY_COLLISION'],
 ['shared producer control',()=>run(changed(1,{controlRoots:['producer-control']})),'SHARED_CONTROL_ROOT'],
 ['shared witness control',()=>run(changed(1,{controlRoots:['witness-control-0']})),'SHARED_CONTROL_ROOT'],
 ['shared auditor control',()=>run(obs,auditors.map((a,i)=>i===1?{...a,controlRoots:['auditor-control-0']}:a)),'SHARED_CONTROL_ROOT'],
 ['missing control inventory',()=>run(changed(1,{controlRoots:[]})),'CONTROL_ROOTS_MISSING'],
 ['invalid signature',()=>run(changed(1,{},as[0])),'ATTESTATION_SIGNATURE_REJECTED']
];
for(const [name,f,reason] of tests){const r=f();assert.equal(r.status,'HOLD',name);assert.equal(r.reason,reason,name);assert.equal(r.releaseAuthority,'HOLD');console.log('REJECTED '+name);}
console.log('SYNTHETIC ONLY: 1 positive control and 15 rejection scenarios. Real-world independence unverified.');
