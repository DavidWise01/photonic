/* PHOTON-16 v0.27 · repeated regime shift, causal reauthorization
 * Classical QED/QCD-inspired software signals; not quantum field theory.
 * Independent append-only evidence; old modules are unmodified. */
(()=>{'use strict';
const $=id=>document.getElementById(id),CORE=window.PHOTON_MEMORY21,ZERO='0'.repeat(64);
const dup=x=>JSON.parse(JSON.stringify(x)),sha=async obj=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(obj))))).map(x=>x.toString(16).padStart(2,'0')).join('');
const programs={
  aba:['nominal','persistent','nominal'],
  bab:['persistent','nominal','persistent'],
  pulse:['pulse','persistent','pulse'],
  stable:['nominal','nominal','nominal'],
  mild:['nominal','pulse','nominal']
};
let records=[],snapshots=[],head=ZERO,locked=null,busy=false;
function settings(){return {count:+$('v27-count').value,first:+$('v27-first').value,second:+$('v27-second').value,program:$('v27-program').value,required:+$('v27-required').value,intent:$('v27-intent').value}}
function valid(c){return c&&[10,11,12].includes(c.count)&&Number.isInteger(c.first)&&Number.isInteger(c.second)&&c.first>=1&&c.second>=c.first+3&&c.second<c.count&&Object.hasOwn(programs,c.program)&&[2,3].includes(c.required)&&['approve','reject'].includes(c.intent)}
function prediction(hist){if(!hist.length)return null;if(hist.length===1)return hist[0];return Math.max(0,2*hist.at(-1)-hist.at(-2))}
function calculate(c){
 if(!valid(c))throw Error('invalid configuration');
 const regimes=programs[c.program],history=[],previousErrors=[],samples=[],summaries=[],observations=[];
 let window=1,memory=[],detectedGeneration=null,epoch=0,fresh=[],streak=0,authorized=false;
 const shifts=[c.first,c.second],detected=[],grants=[],exposure=[];
 for(let g=0;g<c.count;g++){
  const index=g<c.first?0:g<c.second?1:2,regime=regimes[index],truthTransition=(g===c.first||g===c.second)&&regimes[index]!==regimes[index-1];
  const predicted=prediction(history),errorThreshold=Math.max(2,...previousErrors.slice(-3));
  const usedAuthority=authorized&&fresh.length>=c.required;
  const applied=usedAuthority&&predicted!==null&&predicted>=20?Math.max(1,window-1):window;
  const carryIn=memory.slice(-applied),run=CORE.simulate(g,carryIn,{count:c.count,window:applied,mode:regime,intent:c.intent}),observed=run.summary.faults;
  const error=predicted===null?null:Math.abs(observed-predicted);
  // Detect only AFTER observing generation g; a changed regime name
  // is retained for evaluation but is NOT used as a detector input.
  const surprise=error!==null&&error>errorThreshold;
  // Following a detected event, permit another detection on later
  // surprising observations. Suppress no event on elapsed-time grounds.
  const detectedNow=g>=c.first&&surprise&&
    (detectedGeneration===null||g>detectedGeneration+1);
  if(detectedNow){
    epoch++;detectedGeneration=g;fresh=[];streak=0;authorized=false;
    detected.push(g);
  }else if(detectedGeneration!==null&&g>detectedGeneration){
    const good=error!==null&&error<=4;
    fresh.push({generation:g,error,good,epoch});
    streak=good?streak+1:0;
    if(!good)authorized=false;
    if(fresh.length>=c.required&&streak>=c.required&&!authorized){authorized=true;grants.push(g)}
  }
  // Outcome from this generation is never allowed to change
  // the permission already used to start it.
  if(truthTransition&&usedAuthority)exposure.push(g);
  if(error!==null)previousErrors.push(error);
  history.push(observed);
  const decision=run.summary.decision;
  const nextWindow=decision==='REJECT'?1:observed<=2?Math.min(4,applied+1):observed>=20?Math.max(1,applied-1):applied;
  const carryOut=decision==='REJECT'?[]:[...carryIn,run.summary.terminal].slice(-nextWindow);
  observations.push(...run.observations);
  summaries.push({generation:g,regime,truthTransition,forecast:predicted,observedFaults:observed,error,threshold:errorThreshold,
    detectedNow,epoch,detectedGeneration,postDetectionGenerations:fresh.map(x=>x.generation),successStreak:streak,
    authorizedForNext:authorized,permissionUsed:usedAuthority,windowIn:window,windowApplied:applied,windowOut:nextWindow,
    intent:c.intent,decision,carryIn:dup(carryIn),carryOut:dup(carryOut),internal:run.summary.internal,external:run.summary.external});
  window=nextWindow;memory=carryOut;
 }
 const detectionDelays=shifts.map((boundary,i)=>{
  if(regimes[i]===regimes[i+1])return {boundary,changed:false,detectedAt:null,delay:null};
  const end=i===0?shifts[1]:c.count;
  const found=detected.find(g=>g>=boundary&&g<end);
  return {boundary,changed:true,detectedAt:found??null,delay:found===undefined?null:found-boundary};
 });
 return {observations,summaries,metrics:{shifts:detectionDelays,detections:detected,grants,exposure,staleGrants:summaries.filter(x=>x.authorizedForNext&&x.detectedGeneration!==null&&x.postDetectionGenerations.length<c.required).length}};
}
async function run(){
 if(busy)return;const c=settings();if(!valid(c)){$('v27-status').textContent='INVALID SETTINGS · second shift must be at least 3 generations after first';return}
 busy=true;locked=dup(c);records=[];snapshots=[];head=ZERO;$('v27-run').disabled=true;
 try{
  const model=calculate(c);
  for(let g=0;g<c.count;g++){
   for(let t=0;t<360;t++){
    const datum={...model.observations[g*360+t],previousHash:head},h=await sha(datum);records.push({...datum,hash:h});head=h;
   }
   snapshots.push({...model.summaries[g],entryCount:records.length,head});draw();
   await new Promise(r=>setTimeout(r,0));
  }
  const verification=await verify();
  $('v27-status').textContent=(verification.ok?'PASS':'FAIL')+' · '+verification.checked+' chained ticks · '+(verification.errors.slice(0,2).join(', ')||'all checkpoints match');
 }catch(e){$('v27-status').textContent='ERROR · '+e.message}finally{busy=false;$('v27-run').disabled=false}
}
async function verify(rows=dup(records),states=dup(snapshots),claimedHead=head,c=locked){
 if(!valid(c))return {ok:false,checked:0,errors:['missing valid locked settings']};
 const target=calculate(c),errors=[];let parent=ZERO;
 if(rows.length>360*c.count)errors.push('excess evidence');
 for(let i=0;i<rows.length;i++){
  const row=rows[i],expected=target.observations[i];if(!expected){errors.push('extra observation '+i);break}
  for(const k of Object.keys(expected))if(row[k]!==expected[k])errors.push('observation mismatch '+i+':'+k);
  if(row.previousHash!==parent)errors.push('parent '+i);
  const {hash:h,...data}=row;if(await sha(data)!==h)errors.push('digest '+i);
  parent=h;
 }
 if(parent!==claimedHead)errors.push('head mismatch');
 if(states.length!==Math.floor(rows.length/360))errors.push('checkpoint count');
 for(let g=0;g<states.length;g++){
  const s=states[g],expected=target.summaries[g];if(!expected){errors.push('unexpected checkpoint '+g);continue}
  for(const k of Object.keys(expected))if(JSON.stringify(s[k])!==JSON.stringify(expected[k]))errors.push('checkpoint '+g+':'+k);
  if(s.entryCount!==(g+1)*360||s.head!==rows[(g+1)*360-1]?.hash)errors.push('checkpoint head '+g);
  if(s.internal!==144||s.external!==216)errors.push('time allocation '+g);
  if(s.decision==='REJECT'&&s.carryOut.length)errors.push('failed-state leak '+g);
  if(s.carryOut.length>s.windowOut)errors.push('window overflow '+g);
  if(s.postDetectionGenerations.some(index=>index<=s.detectedGeneration))errors.push('stale evidence '+g);
  if(s.permissionUsed&&g>0&&!target.summaries[g-1].authorizedForNext)errors.push('premature permission '+g);
 }
 return {ok:errors.length===0,complete:rows.length===360*c.count,checked:rows.length,errors,metrics:target.metrics};
}
function test(){
 const c=settings();if(!valid(c)){$('v27-status').textContent='INVALID CONFIG';return}
 const cases=Object.keys(programs).map(program=>{
  const result=calculate({...c,program});
  const safe=result.summaries.every((s,g)=>s.internal===144&&s.external===216&&s.carryOut.length<=s.windowOut&&
    (s.decision!=='REJECT'||s.carryOut.length===0)&&s.postDetectionGenerations.every(x=>x>s.detectedGeneration)&&
    (!s.permissionUsed||g>0&&result.summaries[g-1].authorizedForNext));
  return {program,safe,shifts:result.metrics.shifts,grants:result.metrics.grants,exposure:result.metrics.exposure,staleGrants:result.metrics.staleGrants};
 });
 const ok=cases.every(x=>x.safe&&x.staleGrants===0);
 $('v27-status').textContent=(ok?'PASS':'FAIL')+' · '+cases.map(x=>x.program+': delays '+x.shifts.map(y=>y.delay??'—').join('/')+' / grants '+x.grants.join(',')).join(' · ');
 return {ok,cases};
}
async function tamper(){if(!records.length){$('v27-status').textContent='RUN BEFORE TAMPER TEST';return}
 const changed=dup(records);changed[Math.floor(changed.length/2)].qed=0;
 const r=await verify(changed,dup(snapshots),head,locked);
 $('v27-status').textContent=r.ok?'FAIL · altered observation accepted':'PASS · altered observation detected';
}
function exportData(){const data={schema:'PHOTON16-v27-repeated-shifts',simulation:true,settings:locked||settings(),checkpoints:dup(snapshots),observations:dup(records),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v27-repeated-shifts.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function draw(){
 const c=locked||settings(),n=snapshots.length,chart=$('v27-canvas'),ctx=chart.getContext('2d'),w=chart.width,h=chart.height;
 ctx.fillStyle='#081421';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#ddeaf9';ctx.font='14px monospace';ctx.fillText('REPEATED SHIFT: OBSERVE → DETECT → REVOKE → FRESH REAUTHORIZATION',18,22);
 const step=(w-52)/c.count,y=95;
 for(let i=0;i<c.count;i++){
  const x=25+i*step,s=snapshots[i],color=!s?'#283d52':s.detectedNow?'#f47b89':s.authorizedForNext?'#5de8bf':s.detectedGeneration!==null?'#f2a565':'#6596be';
  ctx.fillStyle=color;ctx.globalAlpha=.25;ctx.fillRect(x,y-32,step-5,85);ctx.globalAlpha=1;
  ctx.strokeStyle=color;ctx.strokeRect(x,y-32,step-5,85);
  ctx.font='12px monospace';ctx.fillStyle='#e2f0fc';ctx.fillText('G'+i,x+6,y-10);
  if(s){ctx.font='10px monospace';ctx.fillText(s.detectedNow?'DETECT':s.authorizedForNext?'READY':s.detectedGeneration!==null?'HOLD':'BASE',x+4,y+9);
   ctx.fillText(s.regime.slice(0,4).toUpperCase(),x+4,y+28)}
 }
 for(const g of [c.first,c.second]){let x=25+g*step-2;ctx.strokeStyle='#f5d47d';ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(x,36);ctx.lineTo(x,h-25);ctx.stroke();ctx.setLineDash([])}
 ctx.fillStyle='#c9d8e8';ctx.font='12px monospace';ctx.fillText('Yellow dashed = ground-truth shift (scoring only) · Red = observed detection · Green = authority earned',18,h-12);
 const metrics=n&&valid(c)?calculate(c).metrics:null;
 $('v27-progress').textContent=n+'/'+c.count+' generations · '+records.length+'/'+(c.count*360)+' ticks';
 $('v27-detections').textContent=metrics?metrics.detections.join(', ')||'None':'—';
 $('v27-delays').textContent=metrics?metrics.shifts.filter(x=>x.changed).map(x=>x.delay===null?'missed':x.delay+' gen').join(' / ')||'No actual shift':'—';
 $('v27-exposure').textContent=metrics?String(metrics.exposure.length):'0';
 $('v27-head').textContent=head.slice(0,19)+'…';
 $('v27-log').textContent=snapshots.map(s=>'G'+s.generation+' '+s.regime+' · forecast '+(s.forecast??'—')+' actual '+s.observedFaults+' · '+(s.detectedNow?'DETECTED':s.authorizedForNext?'READY':s.permissionUsed?'USED AUTHORITY':'WITHHELD')+' · '+s.decision).join('\n')||'No observations yet';
}
$('v27-run').onclick=run;$('v27-test').onclick=test;$('v27-audit').onclick=async()=>{const r=await verify();$('v27-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' records'+(r.errors.length?' · '+r.errors.slice(0,3).join(', '):'')};
$('v27-tamper').onclick=tamper;$('v27-export').onclick=exportData;
['v27-count','v27-first','v27-second','v27-program','v27-required','v27-intent'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){locked=null;records=[];snapshots=[];head=ZERO;draw()}}));
window.PHOTON_REPEAT27={calculate,verify,test,run,ledger:()=>dup(records),generations:()=>dup(snapshots)};
draw();
})();