/* PHOTON-16 v0.17: append-only six-turn decision machine.
 * Simulation policy only: not autonomous factory authorization.
 * Each transition commits its full data + previous hash via SHA-256.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),P=window.PHOTON_TIME16,N=window.PHOTON_NIBBLE15;
const phases=P.phases;
let rows=[],head='0'.repeat(64),choice='approve',domain=0,busy=false;
const copy=x=>JSON.parse(JSON.stringify(x));
async function sha(data){const bytes=new TextEncoder().encode(JSON.stringify(data));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('')}
function expected(i){return phases[i]}
function stageData(i){
 const p=expected(i),base={index:i,role:p.role,vm:p.vm,nibble:p.nibble,side:p.side,start:p.start,end:p.endExclusive-1,domain,addresses:Array.from({length:4},(_,j)=>domain*16+p.nibble*4+j),choice,kind:''};
 if(i===0)return {...base,kind:'user_intent',finding:'User A declared a choice'};
 if(i===1)return {...base,kind:'factory_review',finding:'Factory A acknowledged input and recorded nibble ownership'};
 if(i===2)return {...base,kind:'user_checkpoint',finding:'User A retained the declared choice after Factory A'};
 if(i===3)return {...base,kind:'factory_review',finding:'Factory B acknowledged input and recorded nibble ownership'};
 if(i===4)return {...base,kind:'user_checkpoint',finding:'User A retained the declared choice after Factory B'};
 return {...base,kind:'factory_final_vote',finding:'Factory C final vote recorded as a simulated policy result',vote:choice==='approve'?'approve':'reject'};
}
async function append(){
 if(busy||rows.length>=6)return;busy=true;try{
  const data=stageData(rows.length);
  const record={...data,previousHash:head};
  const hash=await sha(record);
  rows.push({...record,hash});head=hash;
  $('v17-choice').disabled=true;$('v17-domain').disabled=true;
  show();
 }catch(e){$('v17-status').textContent='ERROR · '+e.message}finally{busy=false}
}
function reset(){if(busy)return;rows=[];head='0'.repeat(64);choice=$('v17-choice').value;domain=Number($('v17-domain').value);$('v17-choice').disabled=false;$('v17-domain').disabled=false;show()}
async function verify(snapshot=copy(rows),claimedHead=head){
 const errors=[],seen=new Set(),intTicks=phases.filter(p=>p.side==='internal').reduce((a,p)=>a+p.length,0),extTicks=phases.filter(p=>p.side==='external').reduce((a,p)=>a+p.length,0);
 let prev='0'.repeat(64);
 for(let i=0;i<snapshot.length;i++){
  const r=snapshot[i],p=expected(i);
  if(!p){errors.push('excess turn '+i);break}
  if(r.index!==i||r.role!==p.role||r.vm!==p.vm||r.nibble!==p.nibble||r.side!==p.side||r.start!==p.start||r.end!==p.endExclusive-1)errors.push('role/time '+i);
  if(r.domain!==domain||r.choice!==choice)errors.push('choice/domain changed '+i);
  const addresses=Array.from({length:4},(_,j)=>domain*16+p.nibble*4+j);
  if(JSON.stringify(r.addresses)!==JSON.stringify(addresses))errors.push('address '+i);
  for(const a of addresses){const mapped=N.decode(a);if(mapped.vm!==p.vm||mapped.nibble!==p.nibble)errors.push('nibble '+i)}
  if(r.previousHash!==prev)errors.push('parent '+i);
  const {hash,...data}=r;if(await sha(data)!==hash)errors.push('digest '+i);
  if(i===5&&r.vote!==(choice==='approve'?'approve':'reject'))errors.push('final policy '+i);
  seen.add(r.role+'_'+i);prev=hash;
 }
 if(prev!==claimedHead)errors.push('head mismatch');
 if(intTicks!==144||extTicks!==216)errors.push('time split');
 if(snapshot.length===6&&snapshot[5].kind!=='factory_final_vote')errors.push('missing final vote');
 return {ok:errors.length===0,complete:snapshot.length===6,turns:snapshot.length,internalTicks:intTicks,externalTicks:extTicks,errors,head:prev};
}
function show(){
 $('v17-turn').textContent=rows.length+' / 6';
 $('v17-state').textContent=rows.length===6?'CLOSED · FACTORY C '+rows[5].vote.toUpperCase():rows.length?'OPEN · NEXT '+phases[rows.length].role:'READY · USER A';
 $('v17-head').textContent=head.slice(0,16)+'…';
 $('v17-next').textContent=rows.length===5?'CAST FACTORY C FINAL VOTE':rows.length===6?'CYCLE CLOSED':'ADVANCE '+phases[rows.length].role;
 $('v17-next').disabled=rows.length>=6;
 $('v17-ledger').textContent=rows.length?rows.map(x=>'['+x.index+'] T'+x.start+'–'+x.end+' · '+x.role+' / VM'+(x.vm+1)+' N'+x.nibble+' · '+x.kind+' · '+x.hash.slice(0,13)+'…').join('\n'):'No decision evidence yet. Select a user choice and advance.';
}
function exportSnapshot(){
 const payload={schema:'PHOTON16-v17-temporal-vote',simulation:true,domain,choice,phases:copy(phases),records:copy(rows),head};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='photon16-v17-vote-ledger.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('v17-next').onclick=append;$('v17-reset').onclick=reset;
$('v17-verify').onclick=async()=>{try{const r=await verify();$('v17-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.turns+'/6 chained turns'+(r.complete?' · complete':' · incomplete')+(r.errors.length?' · '+r.errors.join(', '):'')}catch(e){$('v17-status').textContent='ERROR '+e.message}};
$('v17-challenge').onclick=async()=>{if(!rows.length){$('v17-status').textContent='Record a turn before challenging';return}const altered=copy(rows);altered[0].choice=altered[0].choice==='approve'?'reject':'approve';const checked=await verify(altered,head);$('v17-status').textContent=checked.ok?'FAIL · alteration undetected':'PASS · modified copy rejected ('+checked.errors.slice(0,2).join(', ')+')'};
$('v17-export').onclick=exportSnapshot;
$('v17-choice').onchange=v=>{choice=$('v17-choice').value;show()};
$('v17-domain').onchange=()=>{domain=Number($('v17-domain').value);show()};
for(let d=0;d<96;d++){const o=document.createElement('option');o.value=d;o.textContent='Domain '+d;$('v17-domain').appendChild(o)}
window.PHOTON_VOTE17={verify,ledger:()=>copy(rows),head:()=>head,reset,append};
show();
})();