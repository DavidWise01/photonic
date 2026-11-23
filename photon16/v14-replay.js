/* PHOTON-16 v0.14 — independent read-only replay auditor. Additive; does not change v0.13. */
(()=>{'use strict';
const $=id=>document.getElementById(id), C=window.PHOTON_CLOCK13, H=window.PHOTON_HOME12;
const text=id=>$(id), seed='0'.repeat(64);
const hash=async obj=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(obj))))).map(x=>x.toString(16).padStart(2,'0')).join('');
function replayAddresses(rows){
 let errors=[], covered=new Set(), expected=0;
 for(const row of rows){
  const t=row.tick;if(t!==expected)errors.push('tick order '+expected);
  if(!Number.isInteger(t)||t<0||t>=360){errors.push('invalid tick '+t);continue}
  const sector=Math.floor(t/120),quad=Math.floor((t%120)/30),within=t%30;
  const offset=(sector*4+quad)*128,start=offset+Math.floor(within*128/30),end=offset+Math.floor((within+1)*128/30);
  if(row.sector!==sector||row.quad!==quad||row.start!==start||row.end!==end)errors.push('schedule '+t);
  if(!Array.isArray(row.agents)||row.agents.length!==end-start){errors.push('agent count '+t);continue}
  row.agents.forEach((a,i)=>{let addr=start+i,local=addr-offset;
   if(a.address!==addr||a.sector!==sector||a.quad!==quad||a.domain!==Math.floor(local/16)||a.agent!==local%16)errors.push('address map '+t+':'+i);
   if(covered.has(a.address))errors.push('duplicate '+a.address);covered.add(a.address);
  });expected++;
 }
 if(rows.length===360&&covered.size!==1536)errors.push('coverage');
 return {ok:errors.length===0,errors,rows:rows.length,addresses:covered.size,complete:rows.length===360&&covered.size===1536};
}
async function replayObservations(rows,head){
 let errors=[],prev=seed;
 for(let i=0;i<rows.length;i++){
  let r=rows[i],copy={...r};delete copy.hash;
  if(r.tick!==i||r.previousHash!==prev)errors.push('parent/tick '+i);
  if(await hash(copy)!==r.hash)errors.push('SHA-256 '+i);
  if(r.detectorReads!==8||r.inputPower!==1||r.outputPower!==1)errors.push('budget/energy '+i);
  if(r.sector!==Math.floor(i/120)||r.quad!==Math.floor((i%120)/30))errors.push('hierarchy '+i);
  const sector=Math.floor(i/120),quad=Math.floor((i%120)/30),w=i%30,offset=(sector*4+quad)*128;
  if(r.agentStart!==offset+Math.floor(w*128/30)||r.agentEnd!==offset+Math.floor((w+1)*128/30))errors.push('range '+i);
  prev=r.hash;
 }
 if(prev!==head)errors.push('head mismatch');
 return {ok:!errors.length,errors,rows:rows.length,measurements:rows.length*8,head:prev};
}
const presentation=(result)=>{text('v14-status').textContent=result.ok?'PASS · independent replay':'FAIL · '+result.errors.slice(0,8).join(' · ');
 text('v14-clock').textContent=result.clock.rows+'/360';
 text('v14-addresses').textContent=result.clock.addresses+'/1536';
 text('v14-chain').textContent=result.observations.rows+'/360';
 text('v14-measure').textContent=String(result.observations.measurements);
 text('v14-errors').textContent=String(result.errors.length);
 text('v14-log').textContent=JSON.stringify({auditor:'v0.14',utc:new Date().toISOString(),...result},null,2);
};
async function audit(){const clock=replayAddresses(C.ledger()),observations=await replayObservations(H.ledger(),H.summary().head),errors=[...clock.errors,...observations.errors];
 const result={ok:errors.length===0&&clock.complete&&observations.rows===360,clock,observations,errors};
 presentation(result);return result;
}
async function tamper(){const rows=H.ledger();if(!rows.length){text('v14-status').textContent='Run v0.13 first';return}
 const head=H.summary().head,pristine=await replayObservations(rows,head),mutated=structuredClone(rows);mutated[Math.floor(mutated.length/2)].closedMSE+=0.000001;
 const challenged=await replayObservations(mutated,head),detected=pristine.ok&&!challenged.ok;
 text('v14-status').textContent=detected?'PASS · tampered clone detected; live ledger untouched':'FAIL · mutation escaped detection';
 text('v14-log').textContent=JSON.stringify({test:'single-field mutation of cloned observation',originalAccepted:pristine.ok,mutatedAccepted:challenged.ok,detected,errors:challenged.errors},null,2);
 return detected;
}
function download(){const payload={schema:'PHOTON16-v14-independent-snapshot',clock:C.ledger(),observations:H.ledger(),head:H.summary().head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v14-replay-snapshot.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('v14-audit').onclick=()=>audit().catch(e=>{text('v14-status').textContent='ERROR · '+e.message});
$('v14-tamper').onclick=()=>tamper().catch(e=>{text('v14-status').textContent='ERROR · '+e.message});
$('v14-export').onclick=download;
window.PHOTON_REPLAY14={replayAddresses,replayObservations,audit,tamper};
})();