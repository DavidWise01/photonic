'use strict';
const crypto=require('node:crypto');
const DOMAIN='PHOTON16:external-witness:v1';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const payload=(r)=>Buffer.from(JSON.stringify([DOMAIN,r.sourceCommit,r.wasmSha256,r.manifestSha256,r.witnessId,r.ancestry,r.observation]));
// The trust registry MUST come from outside the candidate evidence bundle.
// No production keys are enrolled by the repository or its CI.
function assess(candidate,records,registry,producerRoots){
 const hold=reason=>({status:'HOLD',reason,authenticated:0});
 if(!registry.length)return hold('NO_EXTERNAL_TRUST_ROOTS');
 if(!['sourceCommit','wasmSha256','manifestSha256'].every(k=>typeof candidate[k]==='string'&&new RegExp(k==='sourceCommit'?'^[a-f0-9]{40}$':'^[a-f0-9]{64}$').test(candidate[k])))return hold('INVALID_CANDIDATE');
 const ids=new Set(),roots=new Set(),keys=new Set(),accepted=[];
 for(const r of records){
  const entry=registry.find(x=>x.id===r.witnessId);
  if(!entry||r.ancestry!==entry.ancestry||producerRoots.includes(entry.ancestry))return hold('UNTRUSTED_OR_PRODUCER_ANCESTRY');
  if(ids.has(entry.id)||roots.has(entry.ancestry))return hold('DUPLICATE_ANCESTRY');
  if(!['sourceCommit','wasmSha256','manifestSha256'].every(k=>r[k]===candidate[k])||r.observation!=='REPRODUCED_AND_EXECUTED')return hold('OBSERVATION_MISMATCH');
  try{
   const key=crypto.createPublicKey(entry.publicKey);
   if(key.asymmetricKeyType!=='ed25519')return hold('INVALID_KEY_TYPE');
   const fingerprint=digest(key.export({type:'spki',format:'der'}));
   if(keys.has(fingerprint))return hold('DUPLICATE_KEY');
   if(typeof r.signature!=='string'||!crypto.verify(null,payload(r),key,Buffer.from(r.signature,'base64')))return hold('INVALID_SIGNATURE');
   keys.add(fingerprint);ids.add(entry.id);roots.add(entry.ancestry);accepted.push(entry.id);
  }catch{return hold('INVALID_SIGNATURE_OR_KEY');}
 }
 if(accepted.length!==3)return hold('THREE_DISTINCT_ROOTS_REQUIRED');
 // Cryptographic validation cannot establish real-world independence.
 return {status:'SIGNATURES_VALID',authenticated:3,witnesses:accepted,independentWitness:'UNVERIFIED',releaseAuthority:'HOLD'};
}
function domains(staged){
 return {schema:'photon16-authority-domains-v1',sourceCommit:staged.sourceCommit,wasmSha256:staged.wasmSha256,manifestSha256:staged.manifestSha256,sourceIntegrity:staged.status==='STAGED_BUNDLE_PASS'?'INTERNAL_PASS':'HOLD',executionReproducibility:staged.status==='STAGED_BUNDLE_PASS'?'SAME_RUNNER_REPORTED_PASS':'HOLD',externalWitness:assess(staged,[],[],['repository-ci']),releaseAuthority:'HOLD',liveDeployment:'UNVERIFIED'};
}
module.exports={assess,payload,domains};
if(require.main===module){const fs=require('node:fs'),path=require('node:path');const root=process.argv[2]||'verified';const report=domains(JSON.parse(fs.readFileSync(path.join(root,'ADJUDICATION.json'),'utf8')));fs.writeFileSync(path.join(root,'AUTHORITY.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
