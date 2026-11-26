'use strict';
const crypto=require('node:crypto');
const {replay}=require('./custody-registry.cjs');
const hex=(s,n)=>typeof s==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(s);
const payload=r=>Buffer.from(JSON.stringify(['PHOTON16:temporal-witness:v2',r.sourceCommit,r.wasmSha256,r.manifestSha256,r.registryHead,r.registrySequence,r.witnessId,r.ancestry,r.observation]));
function qualify(candidate,records,events,anchor){
 const hold=reason=>({status:'HOLD',reason,authenticated:0,releaseAuthority:'HOLD'});
 // Anchor must be obtained independently, never extracted from candidate or records.
 if(!anchor||!hex(anchor.head,64)||!Number.isSafeInteger(anchor.sequence)||anchor.sequence<0||!Array.isArray(anchor.producerRoots)||!anchor.producerRoots.length)return hold('MISSING_EXTERNAL_ANCHOR');
 if(!candidate||candidate.status!=='STAGED_BUNDLE_PASS'||!hex(candidate.sourceCommit,40)||!hex(candidate.wasmSha256,64)||!hex(candidate.manifestSha256,64))return hold('INVALID_CANDIDATE');
 let state;
 try{state=replay(events,anchor.custodian,anchor.producerRoots,anchor.head,anchor.transitions||[]);if(state.events!==anchor.sequence)return hold('SEQUENCE_MISMATCH');}catch{return hold('CUSTODY_REPLAY_REJECTED');}
 if(!Array.isArray(records)||records.length!==3)return hold('THREE_ROOTS_REQUIRED');
 const seen=new Set(),roots=new Set(),keys=new Set();
 for(const r of records){
  if(!r||r.registryHead!==state.head||r.registrySequence!==state.events)return hold('STALE_REGISTRY');
  if(!['sourceCommit','wasmSha256','manifestSha256'].every(k=>r[k]===candidate[k])||r.observation!=='REPRODUCED_AND_EXECUTED')return hold('OBSERVATION_MISMATCH');
  const entry=state.registry.find(x=>x.id===r.witnessId);
  if(!entry||entry.ancestry!==r.ancestry)return hold('INACTIVE_OR_UNKNOWN_WITNESS');
  if(seen.has(entry.id)||roots.has(entry.ancestry))return hold('DUPLICATE_ROOT');
  try{const k=crypto.createPublicKey(entry.publicKey);const fp=k.export({type:'spki',format:'der'}).toString('hex');if(keys.has(fp)||k.asymmetricKeyType!=='ed25519'||typeof r.signature!=='string'||!crypto.verify(null,payload(r),k,Buffer.from(r.signature,'base64')))return hold('SIGNATURE_REJECTED');keys.add(fp);}catch{return hold('SIGNATURE_REJECTED');}
  seen.add(entry.id);roots.add(entry.ancestry);
 }
 return {status:'CURRENT_SIGNATURES_VALID',authenticated:3,registryHead:state.head,registrySequence:state.events,independence:'UNVERIFIED',releaseAuthority:'HOLD'};
}
module.exports={qualify,payload};
