/* PHOTON-16 v0.19 · observational 360-tick coupled-field stress model
   QED/QCD-inspired CLASSICAL analogies only; no claims of fundamental QFT simulation.
   Additive: does not modify v0.13 optical model, v0.17, or v0.18 ledgers. */
(()=>{'use strict';
const $=id=>document.getElementById(id), P=window.PHOTON_TIME16, HEX='0'.repeat(64);
let records=[],events=[],head=HEX,running=false,scenario='mixed',result=null;
const clone=v=>JSON.parse(JSON.stringify(v));
const sha=async o=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(o))))).map(n=>n.toString(16).padStart(2,'0')).join('');
const gate={qed:0.75,qcd:0.90};
const presets={
 mixed:[{tick:60,phase:1.6,color:0},{tick:180,phase:0,color:1.1},{tick:300,phase:1.4,color:1.25}],
 nominal:[],
 unrecovered:[{tick:300,phase:2.6,color:2.5}],
 phase:[{tick:180,phase:2,color:0}],
 color:[{tick:180,phase:0,color:1.7}]
};
const scenarioOptions=Object.keys(presets);
function sample(t,mode='mixed'){
 if(!Number.isInteger(t)||t<0||t>=360||!scenarioOptions.includes(mode))throw new RangeError('invalid tick/scenario');
 // Decaying response to scheduled impulsive disturbances, with no foreknowledge in feedback.
 let phase=Math.sin(t*.051)*.06,color=Math.cos(t*.043)*.025;
 for(const e of presets[mode])if(t>=e.tick){const age=t-e.tick;phase+=e.phase*Math.exp(-age/16);color+=e.color*Math.exp(-age/18)}
 // Unit-amplitude two-field coherence and centered RGB residual surrogate.
 const qed=(1+Math.cos(phase))/2;
 const qcd=Math.max(0,1-Math.abs(color)*.22);
 const p=P.at(t);
 return {tick:t,sector:Math.floor(t/120),quad:Math.floor((t%120)/30),
 phase:p.id,role:p.role,side:p.side,vm:p.vm,nibble:p.nibble,
 qed:Number(qed.toFixed(9)),qcd:Number(qcd.toFixed(9)),
 qedPass:qed>=gate.qed,qcdPass:qcd>=gate.qcd,
 passed:qed>=gate.qed&&qcd>=gate.qcd,
 event:presets[mode].some(e=>e.tick===t)?'DRIFT_INJECTED':null};
}
function decide(rows){
 const final=rows[359];
 if(!final)return {status:'INCOMPLETE',reason:'no final boundary'};
 // Temporal holdout: last five measured frames must each pass both gates.
 const tail=rows.slice(-5);
 return {status:tail.length===5&&tail.every(r=>r.passed)?'APPROVE':'REJECT',
 reason:'Factory C: last five observed gate results, no future readings',terminalTick:359,observations:tail.length};
}
function getSummary(){
 const internal=records.filter(x=>x.side==='internal'),external=records.filter(x=>x.side==='external');
 return {ticks:records.length,internal:internal.length,external:external.length,
 gatePasses:records.filter(x=>x.passed).length,qedFailures:records.filter(x=>!x.qedPass).length,qcdFailures:records.filter(x=>!x.qcdPass).length,
 injected:records.filter(x=>x.event).map(x=>x.tick),decision:records.length===360?decide(records):{status:'INCOMPLETE'},
 head,scenario};
}
async function run(mode=$('v19-scenario').value){
 if(running)return;running=true;$('v19-run').disabled=true;
 try{scenario=mode;records=[];events=[];head=HEX;result=null;
  for(let t=0;t<360;t++){
   const observation=sample(t,mode),record={...observation,previousHash:head};
   const h=await sha(record);records.push({...record,hash:h});head=h;
   if(observation.event)events.push({tick:t,kind:observation.event});
   if(t%60===59){render();await new Promise(resolve=>setTimeout(resolve,0))}
  }
  result=await verify();
  render();
 }catch(e){$('v19-status').textContent='ERROR · '+e.message}
 finally{running=false;$('v19-run').disabled=false}
}
async function verify(rows=clone(records),claimedHead=head,mode=scenario){
 const errors=[];let prev=HEX,internal=0,external=0;
 if(rows.length>360)errors.push('overlong ledger');
 for(let i=0;i<rows.length;i++){
  const row=rows[i],expect=sample(i,mode);
  for(const key of Object.keys(expect))if(row[key]!==expect[key])errors.push('observation mismatch '+i+':'+key);
  if(row.side==='internal')internal++;else if(row.side==='external')external++;else errors.push('unknown side '+i);
  if(row.previousHash!==prev)errors.push('parent mismatch '+i);
  const {hash,...payload}=row;
  if(await sha(payload)!==hash)errors.push('digest mismatch '+i);
  prev=hash;
 }
 if(prev!==claimedHead)errors.push('head mismatch');
 if(rows.length===360&&(internal!==144||external!==216))errors.push('2/5 3/5 clock mismatch');
 return {ok:!errors.length,complete:rows.length===360,checked:rows.length,internal,external,errors,decision:rows.length===360?decide(rows):null};
}
function chart(){
 const c=$('v19-chart'),ctx=c.getContext('2d'),w=c.width,h=c.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#081424';ctx.fillRect(0,0,w,h);
 const left=48,top=22,bottom=h-38,right=w-18,ww=right-left,hh=bottom-top;
 const x=t=>left+t/359*ww,y=v=>bottom-v*hh;
 ctx.strokeStyle='#324d68';ctx.lineWidth=1;
 for(const v of [0,.25,.5,.75,1]){ctx.beginPath();ctx.moveTo(left,y(v));ctx.lineTo(right,y(v));ctx.stroke();ctx.fillStyle='#bad1e6';ctx.font='11px monospace';ctx.fillText(v.toFixed(2),6,y(v)+4)}
 for(const p of P.phases.slice(1)){const xp=x(p.start);ctx.strokeStyle='#46617e';ctx.beginPath();ctx.moveTo(xp,top);ctx.lineTo(xp,bottom);ctx.stroke()}
 for(const e of presets[scenario]){const xp=x(e.tick);ctx.strokeStyle='#ff8c5d';ctx.beginPath();ctx.moveTo(xp,top);ctx.lineTo(xp,bottom);ctx.stroke()}
 for(const [key,color,threshold] of [['qed','#55eed4',gate.qed],['qcd','#ac93ff',gate.qcd]]){
 ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();records.forEach((r,i)=>{const xx=x(r.tick),yy=y(r[key]);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.stroke();
 ctx.setLineDash([4,5]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y(threshold));ctx.lineTo(right,y(threshold));ctx.stroke();ctx.setLineDash([])}
 ctx.fillStyle='#d6eaff';ctx.font='12px monospace';ctx.fillText('QED-style visibility / QCD-style neutrality over 360 ticks',left,15);
 ctx.fillText('0',left,bottom+20);ctx.fillText('120',x(120)-15,bottom+20);ctx.fillText('240',x(240)-15,bottom+20);ctx.fillText('359',right-27,bottom+20);
}
function render(){
 const s=getSummary();$('v19-ticks').textContent=s.ticks+'/360';
 $('v19-internal').textContent=s.internal+'/144';$('v19-external').textContent=s.external+'/216';
 $('v19-failures').textContent=(s.qedFailures+s.qcdFailures)+' gate failures';
 $('v19-vote').textContent=s.decision.status;
 $('v19-head').textContent=head.slice(0,20)+'…';
 $('v19-events').textContent=s.injected.length?'DRIFT EVENTS · '+s.injected.join(', '):'DRIFT EVENTS · NONE';
 $('v19-status').textContent=result?(result.ok?'PASS':'FAIL')+' · SHA-256 replay '+result.checked+'/360'+(result.errors.length?' · '+result.errors.slice(0,3).join(', '):''):
 s.ticks?'RUNNING · collecting causal observations':'READY · run scenario';
 chart();
}
async function tamper(){
 if(records.length===0){$('v19-status').textContent='RUN THE CYCLE FIRST';return}
 const altered=clone(records);altered[Math.floor(altered.length/2)].qed=.123456789;
 const r=await verify(altered,head,scenario);
 $('v19-status').textContent=r.ok?'FAIL · tamper accepted':'PASS · cloned-field mutation detected: '+r.errors.slice(0,2).join(', ');
}
async function cases(){
 if(running)return;const outcomes=[];
 for(const mode of scenarioOptions){
  const rows=Array.from({length:360},(_,t)=>sample(t,mode));
  const d=decide(rows),fail=rows.filter(x=>!x.passed).length;
  outcomes.push({mode,finalVote:d.status,failTicks:fail,internal:rows.filter(x=>x.side==='internal').length,external:rows.filter(x=>x.side==='external').length});
 }
 const ok=outcomes.every(x=>x.internal===144&&x.external===216)&&outcomes.find(x=>x.mode==='nominal')?.finalVote==='APPROVE'&&outcomes.find(x=>x.mode==='unrecovered')?.finalVote==='REJECT';
 $('v19-status').textContent=(ok?'PASS':'FAIL')+' · scenario dry-runs · '+outcomes.map(x=>x.mode+':'+x.finalVote+'('+x.failTicks+' faults)').join(' · ');
 return {ok,outcomes};
}
function exportData(){
 const payload={schema:'PHOTON16-v19-coupled-field',model:'classical analogies only',scenario,thresholds:gate,summary:getSummary(),events:clone(events),ledger:clone(records)};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v19-coupled-field.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('v19-run').onclick=()=>run();$('v19-verify').onclick=async()=>{result=await verify();render()};$('v19-tamper').onclick=tamper;$('v19-cases').onclick=cases;$('v19-export').onclick=exportData;
$('v19-scenario').onchange=()=>{if(!running){scenario=$('v19-scenario').value;records=[];events=[];head=HEX;result=null;render()}};
window.PHOTON_COUPLED19={sample,verify,run,cases,summary:getSummary,ledger:()=>clone(records)};
render();
})();