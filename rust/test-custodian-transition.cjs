'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const c=require('./custody-registry.cjs'),t=require('./custodian-transition.cjs'),{fingerprint}=require('./checkpoint-freshness.cjs');
const pair=()=>{const p=crypto.generateKeyPairSync('ed25519');return {privateKey:p.privateKey,publicKey:p.publicKey.export({type:'spki',format:'pem'})};};
const old=pair(),next=pair(),w1=pair(),w2=pair(),bad=pair(),zero='0'.repeat(64),challenge='a'.repeat(64);
const sign=(k,p)=>crypto.sign(null,p,k.privateKey).toString('base64');
const trust={registryId:'synthetic',custodian:{ancestry:'external',publicKey:old.publicKey},producerRoots:['repository-ci']};
function event(sequence,previous,id,k,cust){const e={sequence,previous,action:'ENROLL',id,ancestry:'root-'+id,publicKey:k.publicKey,custodyDigest:'b'.repeat(64)};e.custodianSignature=sign(cust,c.payload(e));e.possessionSignature=sign(k,c.payload(e));return e;}
const e1=event(1,zero,'W1',w1,old),h1=c.head(e1);
function transition(over={},a=old,b=next){const r={ancestry:'external',sequence:1,head:h1,oldKey:old.publicKey,newKey:next.publicKey,...over};r.oldSignature=sign(a,t.transitionPayload(r));r.newSignature=sign(b,t.transitionPayload(r));return r;}
const tr=transition(),e2=event(2,h1,'W2',w2,next),events=[e1,e2],ts=[tr];
const retained={registryId:'synthetic',sequence:1,head:h1,transitionCount:0,transitionHead:zero};
function receipt(es=events,trs=ts,prev=retained,over={},k=next){const r={registryId:'synthetic',sequence:es.length,head:es.length?c.head(es.at(-1)):zero,transitionCount:trs.length,transitionHead:t.transitionHead(trs),previousSequence:prev.sequence,previousHead:prev.head,previousTransitionCount:prev.transitionCount,previousTransitionHead:prev.transitionHead,challenge,custodianFingerprint:fingerprint(k.publicKey),...over};r.signature=sign(k,t.receiptPayload(r));return r;}
const good=t.advance(events,ts,retained,receipt(),trust,challenge);assert.equal(good.custodianFingerprint,fingerprint(next.publicKey));assert.equal(good.releaseAuthority,'HOLD');
const same=t.advance([e1],ts,retained,receipt([e1]),trust,challenge);assert.equal(same.sequence,1);assert.equal(same.transitionCount,1);
const advanced={...good};
const reject=(name,fn)=>{assert.throws(fn,undefined,name);console.log('REJECTED '+name);};
reject('retired receipt key',()=>t.advance(events,ts,retained,receipt(events,ts,retained,{},old),trust,challenge));
reject('retired event key',()=>{const es=[e1,event(2,h1,'W2',w2,old)];t.advance(es,ts,retained,receipt(es),trust,challenge);});
for(const [name,x] of [['wrong old signature',transition({},bad,next)],['wrong new signature',transition({},old,bad)],['wrong ancestry',transition({ancestry:'other'})],['wrong head',transition({head:zero})],['reused witness key',transition({newKey:w1.publicKey},old,w1)],['retroactive rotation',transition({sequence:0,head:zero})]])reject(name,()=>t.advance(events,[x],retained,receipt(events,[x]),trust,challenge));
reject('transition rollback',()=>t.advance([e1],[],advanced,receipt([e1],[],advanced,{},old),trust,challenge));
reject('transition stripped at same registry sequence',()=>t.advance([e1],[],same,receipt([e1],[],same,{},old),trust,challenge));
reject('wrong transition head',()=>t.advance(events,ts,retained,receipt(events,ts,retained,{transitionHead:zero}),trust,challenge));
reject('wrong challenge',()=>t.advance(events,ts,retained,receipt(),trust,'c'.repeat(64)));
console.log('SYNTHETIC ONLY: 2 controls and 12 rejection cases; authority HOLD.');
