/* PHOTON-16 v0.25 · observed regime shift & authority revocation.
 * Deterministic classical analogues; no physical QED/QCD simulation.
 * Causality: shift outcome is measured AFTER forecast; authority revocation
 * takes effect on the NEXT generation. Immutable SHA-256 observation chain. */
(()=>{'use strict';
const $=id=>document.getElementById(id),S=window.PHOTON_MEMORY21,ZERO='0'.repeat(64);
const copy=x=>JSON.parse(JSON.stringify(x)),modes=['nominal','pulse','accumulating','late','persistent'];
const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data))))).map(x=>x.toString(16).padStart(2,'0')).join('');
let observations=[],generations=[],head=ZERO,locked=null,busy=false;
function config(){return {count:+$('v25-count').value,shiftAt:+$('v25-shift').value,from:$('v25-before').value,to:$('v25-after').value,cal:+$('v25-cal').value,intent:$('v25-intent').value}}
function valid(c){return Number.isInteger(c.count)&&c.count>=4&&c.count<=12&&Number.isInteger(c.shiftAt)&&c.shiftAt>=1&&c.shiftAt<c.count&&modes.includes(c.from)&&modes.includes(c.to)&&Number.isInteger(c.cal)&&c.cal>=2&&c.cal<=5&&['approve','reject'].includes(c.intent)}
function quantile(values,p=.9){const sorted=values.slice().sort((a,b)=>a-b);return sorted[Math.max(0,Math.min(sorted.length-1,Math.ceil((sorted.length+1)*p)-1))]}
function forecast(history){if(!history.length)return null;if(history.length===1)return history[0].faults;const a=history.at(-2).faults,b=history.at(-1).faults;return Math.max(0,Math.round(b+(b-a)))}
function evaluate(c){
 let memory=[],window=1,history=[],errors=[],misses=[],revokedUntil=-1;
 const rows=[],checkpoints=[];
 for(let g=0;g<c.count;g++){
  const prior=history.slice(),priorErrors=errors.slice();
  const predicted=forecast(prior);
  const calibrated=predicted!==null&&priorErrors.length>=c.cal;
  const radius=calibrated?quantile(priorErrors.slice(-c.cal)) : null;
  const interval=calibrated?{lower:Math.max(0,predicted-radius),upper:predicted+radius,radius}:null;
  const revoked=g<=revokedUntil;
  const allowed=calibrated&&!revoked&&interval.lower>=20;
  const applied=allowed?Math.max(1,window-1):window;
  const incoming=memory.slice(-applied),mode=g<c.shiftAt?c.from:c.to;
  const run=S.simulate(g,incoming,{count:c.count,window:applied,mode,intent:c.intent});
  const result=run.summary,actual=result.faults;
  const contained=interval?actual>=interval.lower&&actual<=interval.upper:null;
  // If a calibrated interval misses, revoke predictive authority for the
  // NEXT TWO generations. No retrospective edits to this generation.
  if(contained===false){misses.push(g);revokedUntil=Math.max(revokedUntil,g+2)}
  const error=predicted===null?null:Math.abs(predicted-actual);
  if(error!==null)errors.push(error);
  history.push({generation:g,faults:actual});
  const nextWindow=result.decision==='REJECT'?1:actual<=2?Math.min(4,applied+1):actual>=20?Math.max(1,applied-1):applied;
  const outgoing=result.decision==='REJECT'?[]:[...incoming,result.terminal].slice(-nextWindow);
  const summary={generation:g,regime:mode,transition:g===c.shiftAt,forecast:predicted,interval,
   calibrationCount:priorErrors.length,revokedAtStart:revoked,permission:allowed,
   actualFaults:actual,contained,error,revokedUntilAfter:revokedUntil,
   windowBefore:window,windowApplied:applied,windowAfter:nextWindow,
   decision:result.decision,carryIn:copy(incoming),carryOut:copy(outgoing),
   internal:result.internal,external:result.external,intent:c.intent};
  rows.push(...run.observations);checkpoints.push(summary);
  memory=outgoing;window=nextWindow;
 }
 return {rows,checkpoints};
}
async function run(){
 if(busy)return;const c=config();if(!valid(c)){$('v25-status').textContent='INVALID SETTINGS';return}
 locked=copy(c);observations=[];generations=[];head=ZERO;busy=true;$('v25-run').disabled=true;
 try{
  const expected=evaluate(c);
  for(let g=0;g<c.count;g++){
   for(let t=0;t<360;t++){
    const data={...expected.rows[g*360+t],previousHash:head};
    const digest=await hash(data);observations.push({...data,hash:digest});head=digest;
   }
   generations.push({...expected.checkpoints[g],head,entryCount:observations.length});
   render();await new Promise(r=>setTimeout(r,0));
  }
  const checked=await verify();$('v25-status').textContent=(checked.ok?'PASS':'FAIL')+' · '+checked.checked+' chained ticks'+(checked.errors.length?' · '+checked.errors.slice(0,2).join(', '):'');
 }catch(e){$('v25-status').textContent='ERROR · '+e.message}finally{busy=false;$('v25-run').disabled=false}
}
async function verify(rows=copy(observations),states=copy(generations),claimedHead=head,c=locked){
 if(!c||!valid(c))return {ok:false,checked:0,errors:['no valid locked run']};
 const expected=evaluate(c),errors=[];let prev=ZERO;
 if(rows.length>c.count*360)errors.push('too many observations');
 for(let i=0;i<rows.length;i++){
  const row=rows[i],target=expected.rows[i];if(!target){errors.push('unexpected row '+i);break}
  for(const k of Object.keys(target))if(row[k]!==target[k])errors.push('observation '+i+':'+k);
  if(row.previousHash!==prev)errors.push('parent '+i);
  const {hash:d,...data}=row;if(await hash(data)!==d)errors.push('digest '+i);
  prev=d;
 }
 if(prev!==claimedHead)errors.push('chain head');
 if(states.length!==Math.floor(rows.length/360))errors.push('checkpoint count');
 for(let g=0;g<states.length;g++){
  const state=states[g],target=expected.checkpoints[g];if(!target){errors.push('extra checkpoint '+g);continue}
  for(const k of Object.keys(target))if(JSON.stringify(state[k])!==JSON.stringify(target[k]))errors.push('checkpoint '+g+':'+k);
  if(state.entryCount!==(g+1)*360||state.head!==rows[(g+1)*360-1]?.hash)errors.push('checkpoint hash '+g);
  if(state.internal!==144||state.external!==216)errors.push('clock split '+g);
  if(state.decision==='REJECT'&&state.carryOut.length)errors.push('failed-state leak '+g);
  if(state.carryOut.length>state.windowAfter)errors.push('window overflow '+g);
  if(state.permission&&(!state.interval||state.interval.lower<20||state.revokedAtStart))errors.push('unauthorized prediction '+g);
  // Only completed history may be used for the forecast or calibration.
  if(state.calibrationCount>g-1)errors.push('future calibration '+g);
 }
 return {ok:!errors.length,complete:rows.length===c.count*360,checked:rows.length,errors};
}
function scenarios(){
 const c=config();if(!valid(c)){$('v25-status').textContent='INVALID SETTINGS';return {ok:false}}
 const cases=[
  {name:'nominal → late',from:'nominal',to:'late'},
  {name:'nominal → persistent',from:'nominal',to:'persistent'},
  {name:'pulse → nominal',from:'pulse',to:'nominal'},
  {name:'accumulating → persistent',from:'accumulating',to:'persistent'},
  {name:'no change',from:'nominal',to:'nominal'}
 ].map(x=>{
  const s=evaluate({...c,from:x.from,to:x.to}).checkpoints;
  const safe=s.every((p,i)=>p.internal===144&&p.external===216&&
    (p.decision!=='REJECT'||p.carryOut.length===0)&&
    (!p.permission||(p.interval&&p.interval.lower>=20&&!p.revokedAtStart))&&
    (i===0||s[i-1].revokedUntilAfter<i||p.revokedAtStart));
  return {name:x.name,safe,misses:s.filter(x=>x.contained===false).length,rejections:s.filter(x=>x.decision==='REJECT').length,authorizations:s.filter(x=>x.permission).length};
 });
 const ok=cases.every(x=>x.safe);
 $('v25-status').textContent=(ok?'PASS':'FAIL')+' · '+cases.map(x=>x.name+' / misses '+x.misses+' / votes rejected '+x.rejections).join(' · ');
 return {ok,cases};
}
async function tamper(){if(!observations.length){$('v25-status').textContent='RUN BEFORE CHALLENGE';return}
 const altered=copy(observations);altered[Math.floor(altered.length/2)].qcd=0;
 const r=await verify(altered,copy(generations),head,locked);
 $('v25-status').textContent=r.ok?'FAIL · altered copy accepted':'PASS · copied evidence mutation detected';
}
function exportLedger(){
 const data={schema:'PHOTON16-v25-shift-audit',simulation:true,warning:'Empirical coverage, not guaranteed shift detection',config:locked||config(),generations:copy(generations),observations:copy(observations),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v25-shift.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function render(){
 const c=locked||config(),calibrated=generations.filter(x=>x.contained!==null),covered=calibrated.filter(x=>x.contained);
 $('v25-progress').textContent=generations.length+'/'+c.count+' generations · '+observations.length+'/'+c.count*360+' observations';
 $('v25-coverage').textContent=calibrated.length?covered.length+'/'+calibrated.length:'NOT CALIBRATED';
 $('v25-misses').textContent=String(calibrated.length-covered.length);
 $('v25-revoked').textContent=String(generations.filter(x=>x.revokedAtStart).length);
 $('v25-head').textContent=head.slice(0,19)+'…';
 $('v25-log').textContent=generations.map(x=>'G'+x.generation+' '+x.regime+' · forecast '+(x.forecast??'—')+' / actual '+x.actualFaults+' · '+(x.contained===null?'uncalibrated':x.contained?'covered':'MISSED')+' · '+(x.revokedAtStart?'REVOKED':x.permission?'AUTHORIZED':'HOLD')+' · '+x.decision).join('\n')||'No shift experiment executed.';
 const cv=$('v25-chart'),ctx=cv.getContext('2d'),w=cv.width,h=cv.height;
 ctx.fillStyle='#081522';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#d9eeff';ctx.font='13px monospace';ctx.fillText('REGIME SHIFT · OBSERVED FAULTS / INTERVAL MISSES',20,22);
 const max=Math.max(25,...generations.map(x=>Math.max(x.actualFaults,x.interval?.upper||0))),step=(w-50)/Math.max(c.count,1),baseline=h-30,scale=(h-65)/max;
 ctx.strokeStyle='#ffb35d';const shiftX=25+c.shiftAt*step;ctx.beginPath();ctx.moveTo(shiftX,30);ctx.lineTo(shiftX,baseline);ctx.stroke();
 generations.forEach((x,i)=>{
  const px=25+(i+.5)*step;
  if(x.interval){ctx.strokeStyle='#9886ed';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px,baseline-x.interval.lower*scale);ctx.lineTo(px,baseline-x.interval.upper*scale);ctx.stroke()}
  ctx.fillStyle=x.contained===false?'#ff6a78':'#61eaca';ctx.beginPath();ctx.arc(px,baseline-x.actualFaults*scale,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cbdff3';ctx.fillText('G'+i,px-9,h-10);
 });
}
$('v25-run').onclick=run;$('v25-tests').onclick=scenarios;
$('v25-verify').onclick=async()=>{const r=await verify();$('v25-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' rows'+(r.errors.length?' · '+r.errors.slice(0,2).join(', '):'')};
$('v25-tamper').onclick=tamper;$('v25-export').onclick=exportLedger;
['v25-count','v25-shift','v25-before','v25-after','v25-cal','v25-intent'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){locked=null;observations=[];generations=[];head=ZERO;render()}}));
window.PHOTON_SHIFT25={evaluate,verify,scenarios,run,ledger:()=>copy(observations),checkpoints:()=>copy(generations)};
render();
})();