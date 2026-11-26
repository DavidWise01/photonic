'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),b=require('./blind-witness.cjs'),q=require('./external-reproduction.cjs');
const pair=()=>{const k=crypto.generateKeyPairSync('ed25519');return {privateKey:k.privateKey,publicKey:k.publicKey.export({type:'spki',format:'pem'})};};
const ws=[pair(),pair(),pair()],co=pair(),h=x=>x.repeat(64);
const sign=(k,p)=>crypto.sign(null,p,k.privateKey).toString('base64');
const c={sourceCommit:'a'.repeat(40),wasmSha256:h('b'),manifestSha256:h('c'),registryHead:h('d'),registrySequence:3,transitionHead:h('0'),transitionCount:0,challenge:h('e')};
const reference={sourceCommit:c.sourceCommit,wasmSha256:c.wasmSha256,toolchainSha256:h('1'),executionLogSha256:h('2'),abi:83,codons:552960,stages:4423680,updates:161280,returns:2880,conservation:true,traceSha256:h('3')};
const registry=ws.map((k,i)=>({id:'W'+i,ancestry:'root'+i,publicKey:k.publicKey})),coordinator={ancestry:'coordinator',publicKey:co.publicKey};
function fixture(changes={}){
 const reports=ws.map((_,i)=>({...reference,id:'W'+i,executionLogSha256:h(String(i+4)),...(changes[i]||{})}));
 const reveals=reports.map((r,i)=>({id:r.id,observation:q.digest(r),salt:h(String(i+7))}));
 const seals=reveals.map((r,i)=>{const s={id:r.id,commitment:b.commitment(c,r.id,r.observation,r.salt)};s.signature=sign(ws[i],b.sealPayload(c,s));return s;});
 const p=b.barrierPayload(c,seals),barrier={digest:crypto.createHash('sha256').update(p).digest('hex'),signature:sign(co,p)};
 reveals.forEach((r,i)=>r.signature=sign(ws[i],b.revealPayload(c,r,barrier.digest)));
 return {reports,reveals,seals,barrier};
}
function run(f=fixture(),ref=reference,ctx=c){const r=q.compare(ctx,f.seals,f.barrier,f.reveals,registry,coordinator,f.reports,ref);assert.equal(r.releaseAuthority,'HOLD');return r;}
assert.equal(run().status,'EXACT_BINARY_AND_SEMANTIC_MATCH');
assert.equal(run(fixture({1:{toolchainSha256:h('f')}})).status,'EXACT_BINARY_AND_SEMANTIC_MATCH');
assert.equal(run(fixture({1:{wasmSha256:h('f')}})).status,'SEMANTIC_MATCH_BINARY_VARIANCE');
assert.equal(run(fixture({1:{traceSha256:h('f')}})).status,'SEMANTIC_DISAGREEMENT');
assert.equal(run(fixture({1:{returns:2879}})).status,'SEMANTIC_DISAGREEMENT');
assert.equal(run(fixture({1:{sourceCommit:'f'.repeat(40)}})).status,'SOURCE_DISAGREEMENT');
const f=fixture();
const cases=[
 ['missing reports',{...f,reports:f.reports.slice(0,2)},reference,c,'INCOMPLETE_REPORTS'],
 ['duplicate reports',{...f,reports:[f.reports[0],f.reports[0],f.reports[2]]},reference,c,'INCOMPLETE_REPORTS'],
 ['changed report after reveal',{...f,reports:[{...f.reports[0],returns:2879},...f.reports.slice(1)]},reference,c,'UNBOUND_REPORT'],
 ['invalid report digest',fixture({1:{executionLogSha256:'bad'}}),reference,c,'UNBOUND_REPORT'],
 ['invalid reference',f,{...reference,conservation:false},c,'INVALID_REFERENCE'],
 ['foreign reference',f,{...reference,wasmSha256:h('f')},c,'INVALID_REFERENCE'],
 ['missing barrier',{...f,barrier:null},reference,c,'INVALID_BARRIER'],
 ['stale context',f,reference,{...c,challenge:h('f')},'INVALID_SEAL']
];
for(const [n,x,r,ctx,reason] of cases){const result=run(x,r,ctx);assert.equal(result.status,'HOLD',n);assert.equal(result.reason,reason,n);console.log('REJECTED '+n);}
console.log('SYNTHETIC ONLY: 6 classification controls and 8 rejection cases. No external execution attested.');
