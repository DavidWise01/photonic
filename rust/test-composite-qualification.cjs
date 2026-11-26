'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const c=require('./custody-registry.cjs'),t=require('./custodian-transition.cjs'),q=require('./independent-custody.cjs'),b=require('./blind-witness.cjs'),r=require('./external-reproduction.cjs'),l=require('./verify-live-pages.cjs'),g=require('./qualification-gate.cjs');
const h=x=>crypto.createHash('sha256').update(x).digest('hex'),z='0'.repeat(64),sign=(k,p)=>crypto.sign(null,p,k.privateKey).toString('base64');
const pair=()=>{const k=crypto.generateKeyPairSync('ed25519');return {privateKey:k.privateKey,publicKey:k.publicKey.export({type:'spki',format:'pem'})};};
function fixture(){
 const cust=pair(),ws=[pair(),pair(),pair()],as=[pair(),pair(),pair()],co=pair(),challenge='a'.repeat(64),comparisonChallenge='b'.repeat(64),sourceCommit='c'.repeat(40);
 const trust={registryId:'synthetic-v3',custodian:{ancestry:'custodian',publicKey:cust.publicKey},producerRoots:['producer']};
 const events=[];
 for(let i=0;i<3;i++){const e={sequence:i+1,previous:i?c.head(events.at(-1)):z,action:'ENROLL',id:'W'+i,ancestry:'root'+i,publicKey:ws[i].publicKey,custodyDigest:h('custody'+i)};e.custodianSignature=sign(cust,c.payload(e));e.possessionSignature=sign(ws[i],c.payload(e));events.push(e);}
 const retained={registryId:trust.registryId,sequence:0,head:z,transitionCount:0,transitionHead:z};
 function receipt(nonce){const x={registryId:trust.registryId,sequence:3,head:c.head(events.at(-1)),transitionCount:0,transitionHead:z,previousSequence:0,previousHead:z,previousTransitionCount:0,previousTransitionHead:z,challenge:nonce,custodianFingerprint:q.fingerprint(cust.publicKey)};x.signature=sign(cust,t.receiptPayload(x));return x;}
 const current=receipt(challenge),auditors=as.map((k,i)=>({id:'A'+i,publicKey:k.publicKey,controlRoots:['auditor'+i]}));
 const observations=ws.map((k,i)=>{const x={registryId:trust.registryId,registryHead:current.head,registrySequence:3,transitionHead:z,transitionCount:0,witnessId:'W'+i,ancestry:'root'+i,keyFingerprint:q.fingerprint(k.publicKey),custodyDigest:events[i].custodyDigest,auditorId:'A'+i,controlRoots:['witness'+i],challenge};x.signature=sign(as[i],q.payload(x));return x;});
 // Minimal valid WASM is deliberately NOT the PHOTON processor.
 const files=Object.fromEntries(l.names.map(n=>[n,Buffer.from('synthetic '+n)]));
 files['photon16.wasm']=Buffer.from('0061736d01000000','hex');
 const wasmSha256=h(files['photon16.wasm']);
 files.SOURCE_COMMIT=Buffer.from(sourceCommit);
 files.REPRODUCTION=Buffer.from('build-a '+wasmSha256+'\nbuild-b '+wasmSha256);
 files.QUALIFICATION=Buffer.from('native-tests=PASS\nwasm-verifier=PASS\nsame-runner-reproduction=PASS\nbrowser-acceptance=PASS');
 files['BROWSER_ACCEPTANCE.json']=Buffer.from(JSON.stringify({sourceCommit,wasmSha256,servedHashes:Array(3).fill(wasmSha256),errors:[],failed:[]}));
 files.RELEASE_SHA256SUMS=Buffer.from(l.names.map(n=>h(files[n])+'  '+n).join('\n')+'\n');
 const expected={sourceCommit,wasmSha256,manifestSha256:h(files.RELEASE_SHA256SUMS)};
 const reference={sourceCommit,wasmSha256,toolchainSha256:h('toolchain'),executionLogSha256:h('log'),abi:83,codons:552960,stages:4423680,updates:161280,returns:2880,conservation:true,traceSha256:h('synthetic trace')};
 const context={...expected,registryHead:current.head,registrySequence:3,transitionHead:z,transitionCount:0,challenge};
 const reports=ws.map((_,i)=>({...reference,id:'W'+i,executionLogSha256:h('log'+i)}));
 const reveals=reports.map((x,i)=>({id:x.id,observation:r.digest(x),salt:h('salt'+i)}));
 const seals=reveals.map((x,i)=>{const y={id:x.id,commitment:b.commitment(context,x.id,x.observation,x.salt)};y.signature=sign(ws[i],b.sealPayload(context,y));return y;});
 const bp=b.barrierPayload(context,seals),barrier={digest:h(bp),signature:sign(co,bp)};
 reveals.forEach((x,i)=>x.signature=sign(ws[i],b.revealPayload(context,x,barrier.digest)));
 return {bundle:{protocol:g.PROTOCOL,events,transitions:[],receipt:current,observations,seals,barrier,reveals,reports,files,comparison:{events,transitions:[],receipt:receipt(comparisonChallenge)}},external:{protocol:g.PROTOCOL,trust,retained,challenge,comparisonChallenge,auditors,producerControlRoots:['producer-control'],coordinator:{ancestry:'coordinator',publicKey:co.publicKey},expected,reference}};
}
if(require.main===module){
 const f=fixture(),result=g.qualify(f.bundle,f.external);
 assert.equal(result.status,'COMPOSED_EVIDENCE_MATCH',JSON.stringify(result));assert.equal(result.releaseAuthority,'HOLD');assert.equal(result.independence,'UNVERIFIED');assert.equal(result.liveRetrieval,'UNVERIFIED');
 console.log('SYNTHETIC COMPOSITE MATCH ONLY: real signatures; placeholder WASM and declared telemetry; no operational execution or independent custody.');
}
module.exports={fixture};
