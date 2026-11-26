'use strict';
const crypto=require('node:crypto');
const custody=require('./custody-registry.cjs');
const transitions=require('./custodian-transition.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const hex=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const fingerprint=p=>{const k=crypto.createPublicKey(p);if(k.asymmetricKeyType!=='ed25519')throw Error('wrong key type');return sha(k.export({type:'spki',format:'der'}));};
const payload=r=>Buffer.from(JSON.stringify(['PHOTON16:independent-custody:v1',r.registryId,r.registryHead,r.registrySequence,r.transitionHead,r.transitionCount,r.witnessId,r.ancestry,r.keyFingerprint,r.custodyDigest,r.auditorId,r.controlRoots,r.challenge]));
function qualify(events,rotations,retained,receipt,trust,challenge,observations,auditors,producerControlRoots){
 const hold=reason=>({status:'HOLD',reason,authenticated:0,independence:'UNVERIFIED',releaseAuthority:'HOLD'});
 try{
  // The trust configuration, auditor registry and control-root inventory are external inputs, not candidate fields.
  if(!Array.isArray(auditors)||auditors.length===0||!Array.isArray(producerControlRoots)||producerControlRoots.length===0)return hold('MISSING_EXTERNAL_CONTROL_ANCHOR');
  const checkpoint=transitions.advance(events,rotations,retained,receipt,trust,challenge);
  const state=custody.replay(events,trust.custodian,trust.producerRoots,checkpoint.head,rotations);
  if(!Array.isArray(observations)||observations.length!==3)return hold('THREE_OBSERVATIONS_REQUIRED');
  const roots=new Set(producerControlRoots),witnessIds=new Set(),witnessRoots=new Set(),auditorIds=new Set(),auditorKeys=new Set(),witnessKeys=new Set(state.registry.map(e=>fingerprint(e.publicKey)));
  const forbiddenKeys=new Set([fingerprint(trust.custodian.publicKey),...rotations.map(r=>fingerprint(r.newKey)),...witnessKeys]);
  for(const r of observations){
   if(!r||r.registryId!==checkpoint.registryId||r.registryHead!==checkpoint.head||r.registrySequence!==checkpoint.sequence||r.transitionHead!==checkpoint.transitionHead||r.transitionCount!==checkpoint.transitionCount||r.challenge!==challenge)return hold('STALE_OBSERVATION');
   const entry=state.registry.find(e=>e.id===r.witnessId),auditor=auditors.find(e=>e.id===r.auditorId);
   if(!entry||entry.ancestry!==r.ancestry||fingerprint(entry.publicKey)!==r.keyFingerprint||witnessIds.has(entry.id)||witnessRoots.has(entry.ancestry))return hold('WITNESS_IDENTITY_REJECTED');
   const last=events.filter(e=>e.id===entry.id).at(-1);
   if(!hex(r.custodyDigest)||!last||last.custodyDigest!==r.custodyDigest)return hold('CUSTODY_DIGEST_MISMATCH');
   if(!auditor||auditorIds.has(auditor.id)||!Array.isArray(auditor.controlRoots)||!auditor.controlRoots.length)return hold('AUDITOR_IDENTITY_REJECTED');
   const fp=fingerprint(auditor.publicKey);
   if(forbiddenKeys.has(fp)||auditorKeys.has(fp))return hold('AUDITOR_KEY_COLLISION');
   if(!Array.isArray(r.controlRoots)||!r.controlRoots.length||r.controlRoots.some(x=>typeof x!=='string'||!x.length)||new Set(r.controlRoots).size!==r.controlRoots.length)return hold('CONTROL_ROOTS_MISSING');
   const group=new Set([...r.controlRoots,...auditor.controlRoots]);
   for(const root of group)if(roots.has(root))return hold('SHARED_CONTROL_ROOT');
   if(!crypto.verify(null,payload(r),crypto.createPublicKey(auditor.publicKey),Buffer.from(r.signature,'base64')))return hold('ATTESTATION_SIGNATURE_REJECTED');
   for(const root of group)roots.add(root);
   witnessIds.add(entry.id);witnessRoots.add(entry.ancestry);auditorIds.add(auditor.id);auditorKeys.add(fp);
  }
  return {status:'DECLARED_ANCESTRY_DISJOINT',authenticated:3,checkpoint,independence:'UNVERIFIED',releaseAuthority:'HOLD'};
 }catch{return hold('CUSTODY_QUALIFICATION_REJECTED');}
}
module.exports={qualify,payload,fingerprint};
