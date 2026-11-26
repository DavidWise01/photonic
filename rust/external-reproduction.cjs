'use strict';
const crypto=require('node:crypto'),blind=require('./blind-witness.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const hex=(x,n=64)=>typeof x==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(x);
const fields=['abi','codons','stages','updates','returns','conservation','traceSha256'];
const semantic=r=>sha(JSON.stringify(['PHOTON16:semantic:v1',...fields.map(k=>r[k])]));
const digest=r=>sha(JSON.stringify(['PHOTON16:reproduction:v1',r.sourceCommit,r.wasmSha256,r.toolchainSha256,r.executionLogSha256,semantic(r)]));
function valid(r){return r&&hex(r.sourceCommit,40)&&[r.wasmSha256,r.toolchainSha256,r.executionLogSha256,r.traceSha256].every(x=>hex(x))&&['abi','codons','stages','updates','returns'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)&&typeof r.conservation==='boolean';}
function compare(c,seals,barrier,reveals,registry,coordinator,reports,reference){
 const hold=reason=>({status:'HOLD',reason,releaseAuthority:'HOLD'});
 try{
  const transcript=blind.qualify(c,seals,barrier,reveals,registry,coordinator);
  if(transcript.status==='HOLD')return hold(transcript.reason);
  if(!valid(reference)||reference.sourceCommit!==c.sourceCommit||reference.wasmSha256!==c.wasmSha256||reference.abi!==83||reference.codons!==552960||reference.stages!==4423680||reference.updates!==161280||reference.returns!==2880||reference.conservation!==true)return hold('INVALID_REFERENCE');
  if(!Array.isArray(reports)||reports.length!==3||new Set(reports.map(r=>r.id)).size!==3)return hold('INCOMPLETE_REPORTS');
  const rows=[];
  for(const opening of transcript.observations){
   const r=reports.find(x=>x.id===opening.id);
   if(!valid(r)||digest(r)!==opening.digest)return hold('UNBOUND_REPORT');
   rows.push({id:r.id,sourceMatch:r.sourceCommit===reference.sourceCommit,binaryMatch:r.wasmSha256===reference.wasmSha256,semanticMatch:semantic(r)===semantic(reference),toolchainMatch:r.toolchainSha256===reference.toolchainSha256,logDigest:r.executionLogSha256,reportDigest:opening.digest});
  }
  const status=rows.some(r=>!r.sourceMatch)?'SOURCE_DISAGREEMENT':rows.some(r=>!r.semanticMatch)?'SEMANTIC_DISAGREEMENT':rows.every(r=>r.binaryMatch)?'EXACT_BINARY_AND_SEMANTIC_MATCH':'SEMANTIC_MATCH_BINARY_VARIANCE';
  return {status,rows,barrierDigest:transcript.barrierDigest,acquisition:'UNVERIFIED',independence:'UNVERIFIED',releaseAuthority:'HOLD'};
 }catch{return hold('INVALID_REPRODUCTION_EVIDENCE');}
}
module.exports={compare,digest,semantic};
