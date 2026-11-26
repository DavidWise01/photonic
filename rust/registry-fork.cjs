'use strict';
const crypto=require('node:crypto');
const custody=require('./custody-registry.cjs');
const transition=require('./custodian-transition.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const zero='0'.repeat(64);
function compare(a,b,retained,trust,challengeA,challengeB){
 const verify=(x,c)=>{try{return transition.advance(x.events,x.transitions,retained,x.receipt,trust,c);}catch{return null;}};
 const A=verify(a,challengeA),B=verify(b,challengeB);
 const base={releaseAuthority:'HOLD',independentWitness:'UNVERIFIED',selected:null};
 if(!A||!B)return {...base,status:'INVALID_BRANCH',valid:[!!A,!!B]};
 const prefix=(x,y)=>{
  if(x.events.length>y.events.length||x.transitions.length>y.transitions.length)return false;
  if((x.events.length?custody.head(y.events[x.events.length-1]):zero)!==(x.events.length?custody.head(x.events.at(-1)):zero))return false;
  if(transition.transitionHead(y.transitions.slice(0,x.transitions.length))!==transition.transitionHead(x.transitions))return false;
  // A newly appended rotation cannot change the signing authority of an already observed event.
  return y.transitions.slice(x.transitions.length).every(t=>t.sequence>=x.events.length);
 };
 const ab=prefix(a,b),ba=prefix(b,a);
 if(ab&&ba)return {...base,status:'IDENTICAL_HISTORY',heads:[A,B]};
 if(ab||ba)return {...base,status:'COMPATIBLE_EXTENSION',direction:ab?'A_TO_B':'B_TO_A',heads:[A,B]};
 const evidence=[{checkpoint:A,branch:a},{checkpoint:B,branch:b}].map(x=>({digest:sha(JSON.stringify(x)),...x})).sort((x,y)=>x.digest.localeCompare(y.digest));
 return {...base,status:'AUTHENTICATED_FORK',evidence,conflictDigest:sha(JSON.stringify(evidence.map(x=>x.digest)))};
}
module.exports={compare};
