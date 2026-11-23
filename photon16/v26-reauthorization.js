/* PHOTON-16 v0.26: post-shift reauthorization.
   Synthetic classical signal analogies only; no QED/QCD physics solver.
   Fresh forecast errors must be generated AFTER detection of a regime change.
   Historical pre-shift errors remain evidence but cannot authorize recovery. */
(()=>{'use strict';
const $=id=>document.getElementById(id),MODEL=window.PHOTON_MEMORY21,ZERO='0'.repeat(64);
const clone=x=>JSON.parse(JSON.stringify(x));
const digest=async obj=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(obj))))).map(b=>b.toString(16).padStart(2,'0')).join('');
const MODES=['nominal','pulse','accumulating','late','persistent'];
let ledger=[],generations=[],head=ZERO,busy=false,locked=null;
function options(){return {count:+$('v26-count').value,shift:+$('v26-shift').value,before:$('v26-before').value,after:$('v26-after').value,intent:$('v26-intent').value,required:+$('v26-required').value}}
function valid(c){return c&&Number.isInteger(c.count)&&c.count>=6&&c.count<=12&&Number.isInteger(c.shift)&&c.shift>=1&&c.shift<c.count&&MODES.includes(c.before)&&MODES.includes(c.after)&&['approve','reject'].includes(c.intent)&&[2,3,4].includes(c.required)}
function forecast(history){if(!history.length)return null;if(history.length===1)return history[0].faults;const a=history.at(-2).faults,b=history.at(-1).faults;return Math.max(0,Math.round(2*b-a))}
function compute(c){
 let history=[],memory=[],window=1,tailErrors=[],shiftDetected=false,detectedAt=null,postErrors=[],successStreak=0,authorized=false,revocations=0;
 const rows=[],summaries=[];
 for(let g=0;g<c.count;g++){
  const regime=g<c.shift?c.before:c.after;
  const pred=forecast(history),usingFresh=shiftDetected&&postErrors.length>=c.required;
  // Causal pre-generation authorization: cannot inspect the pending generation.
  const mayAct=authorized&&usingFresh;
  const applied=mayAct&&pred!==null&&pred>=20?Math.max(1,window-1):window;
  const incoming=memory.slice(-applied);
  const experiment=MODEL.simulate(g,incoming,{count:c.count,window:applied,mode:regime,intent:c.intent});
  const observation=experiment.summary,actual=observation.faults;
  const absoluteError=pred===null?null:Math.abs(actual-pred);
  const previousReference=tailErrors.length>=2?Math.max(2,...tailErrors.slice(-3)):8;
  // The changed regime is not assumed detectable at its boundary.
  // Detection only occurs after the generation is measured.
  const detectedNow=!shiftDetected&&g>=c.shift&&absoluteError!==null&&absoluteError>previousReference;
  if(detectedNow){shiftDetected=true;detectedAt=g;postErrors=[];successStreak=0;authorized=false;revocations++}
  // All later errors are fresh, but the error used to trigger detection is
  // excluded from recovery calibration. Require bounded errors and
  // an uninterrupted streak of well-predicted post-detection generations.
  const freshEligible=shiftDetected&&g>detectedAt&&absoluteError!==null;
  if(freshEligible){
   postErrors.push({generation:g,error:absoluteError});
   const good=absoluteError<=4;
   successStreak=good?successStreak+1:0;
   if(!good)authorized=false;
   if(postErrors.length>=c.required&&successStreak>=c.required)authorized=true;
  }
  if(absoluteError!==null)tailErrors.push(absoluteError);
  history.push({generation:g,faults:actual});
  const nextWindow=observation.decision==='REJECT'?1:actual<=2?Math.min(4,applied+1):actual>=20?Math.max(1,applied-1):applied;
  const outgoing=observation.decision==='REJECT'?[]:[...incoming,observation.terminal].slice(-nextWindow);
  summaries.push({generation:g,regime,shiftBoundary:g===c.shift,forecast:pred,actualFaults:actual,absoluteError,
   priorErrorThreshold:previousReference,detectedNow,detectedAt,shiftDetected,postErrorGenerations:postErrors.map(x=>x.generation),
   goodStreak:successStreak,authorizedForNext:authorized,permissionUsed:mayAct,
   windowIn:window,windowApplied:applied,windowOut:nextWindow,decision:observation.decision,
   carryIn:clone(incoming),carryOut:clone(outgoing),internal:observation.internal,external:observation.external,intent:c.intent});
  rows.push(...experiment.observations);window=nextWindow;memory=outgoing;
 }
 return {rows,summaries,detectedAt,revocations};
}
async function run(){
 if(busy)return;const c=options();if(!valid(c)){$('v26-status').textContent='INVALID CONFIGURATION';return}
 busy=true;locked=clone(c);ledger=[];generations=[];head=ZERO;$('v26-run').disabled=true;
 try{
  const expected=compute(c);
  for(let g=0;g<c.count;g++){
   for(const item of expected.rows.slice(g*360,(g+1)*360)){
    const payload={...item,previousHash:head},h=await digest(payload);ledger.push({...payload,hash:h});head=h;
   }
   generations.push({...expected.summaries[g],head,entryCount:ledger.length});render();
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  const v=await verify();$('v26-status').textContent=(v.ok?'PASS':'FAIL')+' · '+v.checked+' hashed ticks'+(v.errors.length?' · '+v.errors.slice(0,3).join(', '):'');
 }catch(e){$('v26-status').textContent='ERROR · '+e.message}finally{busy=false;$('v26-run').disabled=false}
}
async function verify(rows=clone(ledger),summaries=clone(generations),claimedHead=head,c=locked){
 if(!valid(c))return {ok:false,checked:0,errors:['no valid run']};
 const target=compute(c),errors=[];let previous=ZERO;
 if(rows.length>c.count*360)errors.push('excess records');
 for(let i=0;i<rows.length;i++){
  const row=rows[i],expected=target.rows[i];if(!expected){errors.push('unexpected row '+i);break}
  for(const k of Object.keys(expected))if(row[k]!==expected[k])errors.push('observation '+i+':'+k);
  if(row.previousHash!==previous)errors.push('parent '+i);
  const {hash:h,...payload}=row;if(await digest(payload)!==h)errors.push('digest '+i);
  previous=h;
 }
 if(previous!==claimedHead)errors.push('chain head');
 if(summaries.length!==Math.floor(rows.length/360))errors.push('checkpoint count');
 for(let g=0;g<summaries.length;g++){
  const state=summaries[g],expected=target.summaries[g];if(!expected){errors.push('extra checkpoint '+g);continue}
  for(const k of Object.keys(expected))if(JSON.stringify(state[k])!==JSON.stringify(expected[k]))errors.push('checkpoint '+g+':'+k);
  if(state.head!==rows[(g+1)*360-1]?.hash||state.entryCount!==(g+1)*360)errors.push('checkpoint digest '+g);
  if(state.internal!==144||state.external!==216)errors.push('clock '+g);
  if(state.decision==='REJECT'&&state.carryOut.length)errors.push('failed memory escape '+g);
  if(state.permissionUsed&&(!target.summaries[g-1]?.authorizedForNext||g<=target.detectedAt))errors.push('premature authority '+g);
  if(state.postErrorGenerations.some(x=>x<=state.detectedAt))errors.push('stale calibration '+g);
 }
 return {ok:!errors.length,complete:rows.length===c.count*360,checked:rows.length,errors};
}
function scenarios(){
 const base=options();if(!valid(base))return {ok:false,error:'invalid settings'};
 const configs=[['nominal → persistent','nominal','persistent'],['pulse → nominal','pulse','nominal'],['nominal → late','nominal','late'],['accumulating → persistent','accumulating','persistent'],['no shift','nominal','nominal']];
 const tests=configs.map(([name,before,after])=>{
  const e=compute({...base,before,after}),s=e.summaries;
  return {name,detectedAt:e.detectedAt,authorized:s.filter(x=>x.authorizedForNext).length,
   safe:s.every((x,g)=>x.internal===144&&x.external===216&&(x.decision!=='REJECT'||x.carryOut.length===0)&&
     x.carryOut.length<=x.windowOut&&(!x.permissionUsed||g>0&&s[g-1].authorizedForNext)&&
     x.postErrorGenerations.every(k=>k>x.detectedAt))};
 });
 const ok=tests.every(x=>x.safe);$('v26-status').textContent=(ok?'PASS':'FAIL')+' · '+tests.map(x=>x.name+': detect '+(x.detectedAt??'none')+' / authorized '+x.authorized).join(' · ');
 return {ok,tests};
}
async function challenge(){if(!ledger.length){$('v26-status').textContent='RUN FIRST';return}
 const altered=clone(ledger);altered[Math.floor(altered.length/2)].qed=0;
 const v=await verify(altered,clone(generations),head,locked);
 $('v26-status').textContent=v.ok?'FAIL · mutation accepted':'PASS · cloned evidence mutation detected';
}
function exportJson(){const snap={schema:'PHOTON16-v26-reauthorization',model:'synthetic classical analogues',configuration:locked||options(),generations:clone(generations),ledger:clone(ledger),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(snap,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v26-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function render(){
 const c=locked||options();
 $('v26-counts').textContent=generations.length+'/'+c.count+' generations · '+ledger.length+'/'+(c.count*360)+' ticks';
 $('v26-detected').textContent=generations.find(x=>x.detectedNow)?'G'+generations.find(x=>x.detectedNow).generation:'NOT DETECTED';
 $('v26-authorized').textContent=generations.length&&generations.at(-1).authorizedForNext?'ELIGIBLE NEXT GENERATION':'WITHHELD';
 $('v26-head').textContent=head.slice(0,19)+'…';
 $('v26-ledger').textContent=generations.map(x=>'G'+x.generation+' '+x.regime+' · forecast '+(x.forecast??'—')+' / actual '+x.actualFaults+' · error '+(x.absoluteError??'—')+
  ' · '+(x.detectedNow?'SHIFT DETECTED':x.permissionUsed?'PREDICTIVE ACTION':x.authorizedForNext?'REAUTHORIZATION EARNED':'WITHHELD')+' · fresh '+x.postErrorGenerations.length+' · '+x.decision).join('\n')||'No new evidence.';
 const cv=$('v26-plot'),ctx=cv.getContext('2d'),w=cv.width,h=cv.height;ctx.fillStyle='#091523';ctx.fillRect(0,0,w,h);
 const m=32,step=(w-2*m)/c.count,y=h*.62,band=56;
 ctx.fillStyle='#dcecfb';ctx.font='13px monospace';ctx.fillText('PRE-SHIFT → DETECT → FRESH CALIBRATION → CONDITIONAL REAUTHORIZATION',20,25);
 generations.forEach((x,i)=>{
  const left=m+i*step,color=x.detectedNow?'#f06580':x.authorizedForNext?'#63ecc1':x.shiftDetected?'#f1a267':'#879cba';
  ctx.fillStyle=color;ctx.globalAlpha=.30;ctx.fillRect(left,y-band,step-5,band*2);ctx.globalAlpha=1;ctx.strokeStyle=color;ctx.strokeRect(left,y-band,step-5,band*2);
  ctx.fillStyle='#eaf4fe';ctx.fillText('G'+i,left+8,y-9);
  ctx.font='11px monospace';ctx.fillText(x.authorizedForNext?'READY':x.detectedNow?'DETECT':x.shiftDetected?'HOLD':'BASE',left+5,y+13);ctx.font='13px monospace';
 });
 ctx.fillStyle='#bdcbde';ctx.fillText('Orange = authority withheld · Green = earned for next generation · Red = detected shift',m,h-18);
}
$('v26-run').onclick=run;$('v26-tests').onclick=scenarios;$('v26-audit').onclick=async()=>{const r=await verify();$('v26-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' replayed ticks'+(r.errors.length?' · '+r.errors.slice(0,3).join(', '):'')};
$('v26-tamper').onclick=challenge;$('v26-export').onclick=exportJson;
['v26-count','v26-shift','v26-before','v26-after','v26-intent','v26-required'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){locked=null;ledger=[];generations=[];head=ZERO;render()}}));
window.PHOTON_RECOVERY26={compute,verify,scenarios,run,ledger:()=>clone(ledger),generations:()=>clone(generations)};
render();
})();