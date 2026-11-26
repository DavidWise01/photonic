'use strict';
const transition=require('./custodian-transition.cjs');
const registry=require('./custody-registry.cjs');
const forks=require('./registry-fork.cjs');
const custody=require('./independent-custody.cjs');
const reproduce=require('./external-reproduction.cjs');
const live=require('./verify-live-pages.cjs');
const PROTOCOL='PHOTON16:qualification:v3';
function qualify(bundle,external){
 const hold=(reason,detail)=>({protocol:PROTOCOL,status:'HOLD',reason,detail,releaseAuthority:'HOLD'});
 try{
  if(!bundle||bundle.protocol!==PROTOCOL)return hold('PROTOCOL_DOWNGRADE_OR_UNKNOWN');
  if(!external||external.protocol!==PROTOCOL)return hold('MISSING_EXTERNAL_POLICY');
  const {trust,retained,challenge,auditors,producerControlRoots,coordinator,expected,reference}=external;
  const {events,transitions,receipt,observations,seals,barrier,reveals,reports,files,comparison}=bundle;
  if(!expected||!reference||!comparison)return hold('INCOMPLETE_EXTERNAL_COMPARISON');
  const checkpoint=transition.advance(events,transitions,retained,receipt,trust,challenge);
  // The comparison challenge must be independently supplied, never read from the second receipt.
  const fork=forks.compare({events,transitions,receipt},comparison,retained,trust,challenge,external.comparisonChallenge);
  if(fork.status==='AUTHENTICATED_FORK')return hold('AUTHENTICATED_FORK',fork);
  if(fork.status!=='IDENTICAL_HISTORY'&&!(fork.status==='COMPATIBLE_EXTENSION'&&fork.direction==='B_TO_A'))return hold('CHECKPOINT_COMPARISON_REJECTED',fork);
  const ancestry=custody.qualify(events,transitions,retained,receipt,trust,challenge,observations,auditors,producerControlRoots);
  if(ancestry.status!=='DECLARED_ANCESTRY_DISJOINT')return hold('CUSTODY_REJECTED',ancestry);
  const state=registry.replay(events,trust.custodian,trust.producerRoots,checkpoint.head,transitions);
  const ids=new Set(observations.map(r=>r.witnessId));
  const witnesses=state.registry.filter(r=>ids.has(r.id));
  const context={sourceCommit:expected.sourceCommit,wasmSha256:expected.wasmSha256,manifestSha256:expected.manifestSha256,registryHead:checkpoint.head,registrySequence:checkpoint.sequence,transitionHead:checkpoint.transitionHead,transitionCount:checkpoint.transitionCount,challenge};
  const artifact=live.verify(files,expected);
  const reproduction=reproduce.compare(context,seals,barrier,reveals,witnesses,coordinator,reports,reference);
  if(reproduction.status!=='EXACT_BINARY_AND_SEMANTIC_MATCH')return hold('REPRODUCTION_REJECTED',reproduction);
  return {protocol:PROTOCOL,status:'COMPOSED_EVIDENCE_MATCH',checkpoint,artifact,reproduction,independence:'UNVERIFIED',liveRetrieval:'UNVERIFIED',releaseAuthority:'HOLD'};
 }catch(e){return hold('QUALIFICATION_REJECTED',e.message);}
}
module.exports={PROTOCOL,qualify};
