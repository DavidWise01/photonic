/* PHOTON-16 v0.24 — causal calibrated uncertainty, classical analogues only.
   Appends separate SHA-256 evidence, never mutates earlier modules. */
(()=>{'use strict';
const $=id=>document.getElementById(id),S=window.PHOTON_MEMORY21,P=window.PHOTON_PREDICT23,Z='0'.repeat(64);
const cp=x=>JSON.parse(JSON.stringify(x)),hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(n=>n.toString(16).padStart(2,'0')).join('');
let rows=[],epochs=[],head=Z,locked=null,busy=false;
const modes=['nominal','pulse','accumulating','late','persistent'];
function config(){return {count:+$('v24-count').value,min:1,max:4,mode:$('v24-mode').value,intent:$('v24-intent').value,calibration:+$('v24-cal').value,coverage:+$('v24-cover').value}}
function valid(c){return Number.isInteger(c.count)&&c.count>=2&&c.count<=12&&modes.includes(c.mode)&&['approve','reject'].includes(c.intent)&&Number.isInteger(c.calibration)&&c.calibration>=2&&c.calibration<=6&&[.8,.9,.95].includes(c.coverage)}
function quantile(vals,level){const sorted=vals.slice().sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.ceil((sorted.length+1)*level)-1)]}
function predict(history){
 if(!history.length)return null;
 if(history.length===1)return history[0].faults;
 const a=history.at(-2).faults,b=history.at(-1).faults;
 return Math.max(0,Math.round(b+(b-a)));
}
function interval(pred,errors,c){
 // Empirical absolute-error interval; uncalibrated until at least c.calibration
 // earlier predictions have resolved. No distribution-free coverage guarantee.
 if(pred===null||errors.length<c.calibration)return {status:'UNCALIBRATED',lower:null,upper:null,radius:null};
 const radius=quantile(errors.slice(-c.calibration),c.coverage);
 return {status:'CALIBRATED',lower:Math.max(0,pred-radius),upper:pred+radius,radius};
}
function simulate(c,gated=true){
 let memory=[],window=c.min,history=[],errors=[],observations=[],summaries=[];
 for(let g=0;g<c.count;g++){
  const forecast=predict(history),bound=interval(forecast,errors,c);
  // Contract only if the ENTIRE confidence interval implies high risk.
  // If uncertainty crosses 20 faults, no predictive authority is granted.
  const permitted=gated&&bound.status==='CALIBRATED'&&bound.lower>=20;
  const applied=permitted?Math.max(c.min,window-1):window;
  memory=memory.slice(-applied);
  const run=S.simulate(g,memory,{count:c.count,window:applied,mode:c.mode,intent:c.intent});
  const s=run.summary;
  const next=s.decision==='REJECT'?c.min:s.faults<=2?Math.min(c.max,applied+1):s.faults>=20?Math.max(c.min,applied-1):applied;
  const outgoing=s.decision==='REJECT'?[]:[...memory,s.terminal].slice(-next);
  // Update calibration only AFTER the forecasted generation is observed.
  const err=forecast===null?null:Math.abs(s.faults-forecast);
  const complete={generation:g,faults:s.faults};
  observations.push(...run.observations);
  summaries.push({generation:g,forecast,interval:bound,calibrationCount:errors.length,permitted,
    windowBefore:window,windowApplied:applied,windowAfter:next,
    observedFaults:s.faults,absoluteError:err,contained:bound.status==='CALIBRATED'?s.faults>=bound.lower&&s.faults<=bound.upper:null,
    decision:s.decision,intent:c.intent,internal:s.internal,external:s.external,
    memoryBefore:cp(memory),memoryAfter:cp(outgoing),recoveries:cp(s.recoveries)});
  history.push(complete);if(err!==null)errors.push(err);
  memory=outgoing;window=next;
 }
 return {observations,summaries};
}
async function run(){
 if(busy)return;const c=config();if(!valid(c)){$('v24-status').textContent='INVALID SETTINGS';return}
 busy=true;locked=cp(c);rows=[];epochs=[];head=Z;$('v24-run').disabled=true;
 try{
  const result=simulate(c);
  for(let g=0;g<c.count;g++){
   for(const observation of result.observations.slice(g*360,(g+1)*360)){
    const data={...observation,previousHash:head},h=await hash(data);rows.push({...data,hash:h});head=h;
   }
   epochs.push({...result.summaries[g],head,entryCount:rows.length});draw();await new Promise(resolve=>setTimeout(resolve,0));
  }
  const v=await verify();$('v24-status').textContent=(v.ok?'PASS':'FAIL')+' · '+v.checked+' chained observations'+(v.errors.length?' · '+v.errors.slice(0,2).join(', '):'');
 }catch(e){$('v24-status').textContent='ERROR · '+e.message}finally{busy=false;$('v24-run').disabled=false}
}
async function verify(evidence=cp(rows),checkpoints=cp(epochs),claimedHead=head,c=locked){
 if(!c||!valid(c))return {ok:false,checked:0,errors:['no valid locked configuration']};
 const reference=simulate(c),errors=[];let prev=Z;
 if(evidence.length>c.count*360)errors.push('overflow');
 for(let i=0;i<evidence.length;i++){
  const item=evidence[i],expected=reference.observations[i];
  if(!expected){errors.push('unexpected observation '+i);break}
  for(const k of Object.keys(expected))if(item[k]!==expected[k])errors.push('observation '+i+':'+k);
  if(item.previousHash!==prev)errors.push('parent '+i);
  const {hash:d,...data}=item;if(await hash(data)!==d)errors.push('digest '+i);
  prev=d;
 }
 if(prev!==claimedHead)errors.push('head mismatch');
 if(checkpoints.length!==Math.floor(evidence.length/360))errors.push('checkpoint count');
 for(let g=0;g<checkpoints.length;g++){
  const item=checkpoints[g],expected=reference.summaries[g];
  if(!expected){errors.push('unexpected checkpoint '+g);continue}
  for(const k of Object.keys(expected))if(JSON.stringify(item[k])!==JSON.stringify(expected[k]))errors.push('checkpoint '+g+':'+k);
  if(item.head!==evidence[(g+1)*360-1]?.hash||item.entryCount!==(g+1)*360)errors.push('checkpoint parent '+g);
  if(item.internal!==144||item.external!==216)errors.push('clock '+g);
  if(item.decision==='REJECT'&&item.memoryAfter.length)errors.push('state leak '+g);
  if(item.permitted&&!(item.interval.status==='CALIBRATED'&&item.interval.lower>=20))errors.push('unsafe permission '+g);
  if(item.interval.status==='CALIBRATED'&&item.calibrationCount<c.calibration)errors.push('early calibration '+g);
 }
 return {ok:!errors.length,complete:evidence.length===c.count*360,checked:evidence.length,errors};
}
function checkCases(){
 const c=config();if(!valid(c))return {ok:false};
 const result=modes.map(mode=>{
  const a=simulate({...c,mode},true),b=simulate({...c,mode},false);
  return {mode,permitted:a.summaries.filter(x=>x.permitted).length,covered:a.summaries.filter(x=>x.contained!==null).length,
    actualCoverage:a.summaries.filter(x=>x.contained!==null).length?a.summaries.filter(x=>x.contained===true).length/a.summaries.filter(x=>x.contained!==null).length:null,
    changed:a.summaries.some((x,i)=>x.windowApplied!==b.summaries[i].windowApplied),
    safe:a.summaries.every(x=>!x.permitted||(x.interval.status==='CALIBRATED'&&x.interval.lower>=20))&&a.summaries.every(x=>x.internal===144&&x.external===216&&x.memoryAfter.length<=x.windowAfter&&(x.decision!=='REJECT'||x.memoryAfter.length===0))};
 });
 const ok=result.every(x=>x.safe);$('v24-status').textContent=(ok?'PASS':'FAIL')+' · '+result.map(x=>x.mode+':'+x.permitted+' gated changes').join(' · ');
 return {ok,result};
}
async function tamper(){if(!rows.length){$('v24-status').textContent='RUN BEFORE CHALLENGE';return}const altered=cp(rows);altered[Math.floor(rows.length/2)].qed=0;const check=await verify(altered,cp(epochs),head,locked);$('v24-status').textContent=check.ok?'FAIL · altered copy accepted':'PASS · altered copy detected'}
function exportLedger(){const data={schema:'PHOTON16-v24-predictive-calibration',claim:'empirical intervals only; no guaranteed coverage',configuration:locked||config(),epochs:cp(epochs),observations:cp(rows),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v24-calibrated.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function draw(){
 const c=locked||config(),eligible=epochs.filter(x=>x.interval.status==='CALIBRATED'),contained=eligible.filter(x=>x.contained===true);
 $('v24-counts').textContent=epochs.length+'/'+c.count+' generations · '+rows.length+'/'+(c.count*360)+' ticks';
 $('v24-gates').textContent=epochs.filter(x=>x.permitted).length+' contractions authorized';
 $('v24-cover-result').textContent=eligible.length?contained.length+'/'+eligible.length+' empirical coverage':'UNCALIBRATED';
 $('v24-head').textContent=head.slice(0,20)+'…';
 $('v24-log').textContent=epochs.map(x=>'G'+x.generation+' · forecast '+(x.forecast===null?'—':x.forecast)+' · interval '+(x.interval.status==='CALIBRATED'?'['+x.interval.lower+','+x.interval.upper+']':'UNAVAILABLE')+' · observed '+x.observedFaults+' · W'+x.windowBefore+'→'+x.windowApplied+'→'+x.windowAfter+' · '+(x.permitted?'PREDICTION AUTHORIZED':'NO PREDICTIVE ACTION')).join('\n')||'No calibrated generations yet.';
 const canvas=$('v24-canvas'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 ctx.fillStyle='#071525';ctx.fillRect(0,0,w,h);ctx.font='13px monospace';ctx.fillStyle='#dcecff';ctx.fillText('FORECAST / UNCERTAINTY INTERVAL / ACTUAL FAILURES',24,23);
 if(!epochs.length)return;
 const vmax=Math.max(25,...epochs.map(x=>Math.max(x.observedFaults,x.interval.upper||0,x.forecast||0)));
 const base=h-32,top=38,y=v=>base-(v/vmax)*(base-top),step=(w-60)/c.count;
 ctx.strokeStyle='#ba7c57';ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(25,y(20));ctx.lineTo(w-20,y(20));ctx.stroke();ctx.setLineDash([]);
 epochs.forEach((x,i)=>{const cx=34+(i+.5)*step;
  if(x.interval.status==='CALIBRATED'){ctx.strokeStyle='#a797ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,y(x.interval.lower));ctx.lineTo(cx,y(x.interval.upper));ctx.stroke()}
  ctx.fillStyle='#fba36b';ctx.beginPath();ctx.arc(cx,y(x.observedFaults),5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#dcecff';ctx.fillText('G'+i,cx-10,h-10);
 });
}
$('v24-run').onclick=run;$('v24-tests').onclick=checkCases;$('v24-verify').onclick=async()=>{const r=await verify();$('v24-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' observations · '+r.errors.slice(0,2).join(', ')};
$('v24-tamper').onclick=tamper;$('v24-export').onclick=exportLedger;
['v24-count','v24-mode','v24-intent','v24-cal','v24-cover'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){locked=null;rows=[];epochs=[];head=Z;draw()}}));
window.PHOTON_CALIBRATION24={simulate,interval,predict,verify,checkCases,ledger:()=>cp(rows),checkpoints:()=>cp(epochs)};
draw();
})();