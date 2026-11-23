/* PHOTON-16 v0.28: causal intra-generation exposure containment.
   Classical QED/QCD-inspired analogues, not quantum field equations.
   Two consecutive observed bad ticks trigger a sticky quarantine.
   No future observations, hidden shift schedule, or Factory C override. */
(()=>{'use strict';
const $=id=>document.getElementById(id),SIM=window.PHOTON_MEMORY21,Z='0'.repeat(64),copy=x=>JSON.parse(JSON.stringify(x));
const sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(n=>n.toString(16).padStart(2,'0')).join('');
const programs={aba:['nominal','persistent','nominal'],bab:['persistent','nominal','persistent'],pulse:['pulse','persistent','pulse'],stable:['nominal','nominal','nominal'],mild:['nominal','pulse','nominal']};
let ledger=[],summaries=[],head=Z,locked=null,busy=false;
function config(){return {program:$('v28-program').value,first:+$('v28-first').value,second:+$('v28-second').value,count:+$('v28-count').value,streak:+$('v28-streak').value,intent:$('v28-intent').value}}
function valid(c){return c&&Object.hasOwn(programs,c.program)&&[10,11,12].includes(c.count)&&Number.isInteger(c.first)&&Number.isInteger(c.second)&&c.first>=1&&c.second>=c.first+3&&c.second<c.count&&[2,3].includes(c.streak)&&['approve','reject'].includes(c.intent)}
function predict(hist){if(!hist.length)return null;return hist.length===1?hist[0]:Math.max(0,2*hist.at(-1)-hist.at(-2))}
function compute(c){
 if(!valid(c))throw Error('invalid settings');
 let memory=[],window=1,history=[],priorErrors=[],lastDetected=null,fresh=0,good=0,authorized=false;
 const rows=[],stages=[];
 for(let g=0;g<c.count;g++){
  const regime=programs[c.program][g<c.first?0:g<c.second?1:2],forecast=predict(history);
  const startingAuthority=authorized&&fresh>=2;
  const applied=startingAuthority&&forecast!==null&&forecast>=20?Math.max(1,window-1):window;
  const incoming=memory.slice(-applied);
  const simulation=SIM.simulate(g,incoming,{count:c.count,window:applied,mode:regime,intent:c.intent});
  let streak=0,trigger=null,firstFailure=null,baselineExposure=0,guardExposure=0;
  const ticks=simulation.observations.map(ob=>{
   if(!ob.passed){streak++;if(firstFailure===null)firstFailure=ob.tick}else streak=0;
   // Trigger is applied as soon as the second/third observed failure arrives.
   if(trigger===null&&streak>=c.streak)trigger=ob.tick;
   const authorityActive=startingAuthority&&trigger===null;
   if(startingAuthority&&!ob.passed)baselineExposure++;
   if(authorityActive&&!ob.passed)guardExposure++;
   return {...ob,authorityBefore:startingAuthority,authorityActive,quarantined:trigger!==null,quarantineTriggered:trigger===ob.tick,consecutiveFailures:streak};
  });
  const failures=simulation.summary.faults,error=forecast===null?null:Math.abs(forecast-failures);
  const threshold=Math.max(2,...priorErrors.slice(-2));
  const detectedNow=g>=c.first&&error!==null&&error>threshold&&(lastDetected===null||g>lastDetected+1);
  if(detectedNow){lastDetected=g;fresh=0;good=0;authorized=false}
  else if(lastDetected!==null&&g>lastDetected){
   fresh++;good=error!==null&&error<=4?good+1:0;
   if(good===0)authorized=false;
   if(fresh>=2&&good>=2)authorized=true;
  }
  if(trigger!==null){authorized=false;fresh=0;good=0;lastDetected=g}
  if(error!==null)priorErrors.push(error);
  history.push(failures);
  const decision=simulation.summary.decision;
  const nextWindow=decision==='REJECT'||trigger!==null?1:failures<=2?Math.min(4,applied+1):failures>=20?Math.max(1,applied-1):applied;
  const outgoing=decision==='REJECT'||trigger!==null?[]:[...incoming,simulation.summary.terminal].slice(-nextWindow);
  stages.push({generation:g,regime,forecast,error,failures,decision,startingAuthority,
   firstFailure,quarantineTick:trigger,baselineExposure,guardExposure,avoidedExposure:baselineExposure-guardExposure,
   detectorDelay:trigger===null||firstFailure===null?null:trigger-firstFailure,
   quarantined:trigger!==null,detectedNow,authorizedForNext:authorized,
   windowBefore:window,windowAfter:nextWindow,carryIn:copy(incoming),carryOut:copy(outgoing),
   internal:simulation.summary.internal,external:simulation.summary.external,intent:c.intent});
  rows.push(...ticks);window=nextWindow;memory=outgoing;
 }
 return {rows,stages,summary:{potentialExposure:stages.reduce((a,x)=>a+x.baselineExposure,0),
  actualExposure:stages.reduce((a,x)=>a+x.guardExposure,0),
  prevented:stages.reduce((a,x)=>a+x.avoidedExposure,0),
  quarantined:stages.filter(x=>x.quarantined).length,
  detected:stages.filter(x=>x.detectedNow).map(x=>x.generation)}};
}
async function run(){
 if(busy)return;const c=config();if(!valid(c)){$('v28-status').textContent='INVALID SETTINGS';return}
 busy=true;locked=copy(c);ledger=[];summaries=[];head=Z;$('v28-run').disabled=true;
 try{
  const expected=compute(c);
  for(let g=0;g<c.count;g++){
   for(let t=0;t<360;t++){
    const data={...expected.rows[g*360+t],previousHash:head},h=await sha(data);
    ledger.push({...data,hash:h});head=h;
   }
   summaries.push({...expected.stages[g],head,count:ledger.length});draw();
   await new Promise(r=>setTimeout(r,0));
  }
  const report=await verify();$('v28-status').textContent=(report.ok?'PASS':'FAIL')+' · '+report.checked+' chained ticks'+(report.errors.length?' · '+report.errors.slice(0,2).join(', '):'');
 }catch(e){$('v28-status').textContent='ERROR '+e.message}finally{busy=false;$('v28-run').disabled=false}
}
async function verify(rows=copy(ledger),states=copy(summaries),claimedHead=head,c=locked){
 if(!valid(c))return {ok:false,errors:['invalid or absent configuration'],checked:0};
 const reference=compute(c),errors=[];let parent=Z;
 if(rows.length>c.count*360)errors.push('excess observations');
 for(let i=0;i<rows.length;i++){
  const actual=rows[i],expected=reference.rows[i];if(!expected){errors.push('unexpected '+i);break}
  for(const k of Object.keys(expected))if(actual[k]!==expected[k])errors.push('tick '+i+':'+k);
  if(actual.previousHash!==parent)errors.push('parent '+i);
  const {hash:h,...datum}=actual;if(await sha(datum)!==h)errors.push('digest '+i);
  parent=h;
 }
 if(parent!==claimedHead)errors.push('chain head');
 if(states.length!==Math.floor(rows.length/360))errors.push('checkpoint count');
 for(let g=0;g<states.length;g++){
  const actual=states[g],expected=reference.stages[g];if(!expected){errors.push('excess checkpoint');break}
  for(const k of Object.keys(expected))if(JSON.stringify(actual[k])!==JSON.stringify(expected[k]))errors.push('checkpoint '+g+':'+k);
  if(actual.head!==rows[(g+1)*360-1]?.hash||actual.count!==(g+1)*360)errors.push('checkpoint hash '+g);
  if(actual.internal!==144||actual.external!==216)errors.push('clock '+g);
  if(actual.quarantined&&actual.carryOut.length)errors.push('quarantine carry leak '+g);
  if(actual.decision==='REJECT'&&actual.carryOut.length)errors.push('rejected carry leak '+g);
  if(actual.guardExposure>actual.baselineExposure)errors.push('exposure regression '+g);
 }
 return {ok:!errors.length,complete:rows.length===c.count*360,checked:rows.length,errors,summary:reference.summary};
}
function tests(){
 const c=config();if(!valid(c))return {ok:false};
 const cases=Object.keys(programs).map(program=>{
  const v=compute({...c,program});
  const safe=v.stages.every(s=>s.internal===144&&s.external===216&&(s.decision!=='REJECT'||s.carryOut.length===0)&&
   (!s.quarantined||s.carryOut.length===0)&&s.guardExposure<=s.baselineExposure);
  return {program,quarantines:v.summary.quarantined,prevented:v.summary.prevented,baseline:v.summary.potentialExposure,safe};
 });
 const ok=cases.every(x=>x.safe);$('v28-status').textContent=(ok?'PASS':'FAIL')+' · '+cases.map(x=>x.program+': prevented '+x.prevented+'/'+x.baseline).join(' · ');return {ok,cases};
}
async function tamper(){if(!ledger.length){$('v28-status').textContent='RUN FIRST';return}const bad=copy(ledger);bad[Math.floor(bad.length/2)].quarantined=!bad[Math.floor(bad.length/2)].quarantined;const r=await verify(bad,copy(summaries),head,locked);$('v28-status').textContent=r.ok?'FAIL · mutation accepted':'PASS · cloned mutation rejected'}
function exportJson(){const data={schema:'PHOTON16-v28-containment',simulation:true,caution:'Exposure counts only failing ticks with predictive control active; not physical hazard or actual execution',config:locked||config(),summaries:copy(summaries),records:copy(ledger),head};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v28-containment.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function draw(){
 const c=locked||config(),cv=$('v28-plot'),ctx=cv.getContext('2d'),w=cv.width,h=cv.height,step=(w-55)/c.count;
 ctx.fillStyle='#071422';ctx.fillRect(0,0,w,h);
 ctx.font='13px monospace';ctx.fillStyle='#e2effc';ctx.fillText('360-TICK REACTIVE GUARD · BLUE normal · RED quarantine · GREEN authority',16,22);
 summaries.forEach((s,i)=>{
  const x=28+i*step,y=60,bw=step-5,bh=96;
  ctx.fillStyle=s.quarantined?'#e77a83':s.startingAuthority?'#67e3b6':'#668cb3';ctx.globalAlpha=.24;ctx.fillRect(x,y,bw,bh);ctx.globalAlpha=1;ctx.strokeStyle=s.quarantined?'#f08192':'#88a9c9';ctx.strokeRect(x,y,bw,bh);
  if(s.quarantineTick!==null){const xx=x+s.quarantineTick/360*bw;ctx.fillStyle='#f08192';ctx.fillRect(xx,y,bw-(xx-x),bh)}
  ctx.fillStyle='#e5edf9';ctx.font='11px monospace';ctx.fillText('G'+i,x+4,y+16);ctx.fillText(s.quarantineTick===null?'CLEAR':'Q@'+s.quarantineTick,x+4,y+37);
  ctx.fillText('SAVE '+s.avoidedExposure,x+4,y+58);
 });
 for(const i of [c.first,c.second]){const x=28+i*step;ctx.strokeStyle='#f5c26e';ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(x,34);ctx.lineTo(x,h-26);ctx.stroke();ctx.setLineDash([])}
 ctx.fillStyle='#bdd2e6';ctx.font='12px monospace';ctx.fillText('Yellow boundaries = programmed regime changes (scoring only). Quarantine is driven by observed ticks.',16,h-12);
 const base=summaries.reduce((a,x)=>a+x.baselineExposure,0),actual=summaries.reduce((a,x)=>a+x.guardExposure,0);
 $('v28-progress').textContent=summaries.length+'/'+c.count+' · '+ledger.length+'/'+(c.count*360)+' ticks';
 $('v28-exposure').textContent=actual+' / '+base;
 $('v28-avoided').textContent=String(base-actual);
 $('v28-quarantine').textContent=String(summaries.filter(x=>x.quarantined).length);
 $('v28-head').textContent=head.slice(0,20)+'…';
 $('v28-log').textContent=summaries.map(s=>'G'+s.generation+' '+s.regime+' · '+(s.quarantined?'QUARANTINE T'+s.quarantineTick:'clear')+' · authority '+s.startingAuthority+' · avoided '+s.avoidedExposure+' · factory vote '+s.decision+' · carry '+s.carryOut.length).join('\n')||'No observations yet';
}
$('v28-run').onclick=run;$('v28-tests').onclick=tests;$('v28-audit').onclick=async()=>{const r=await verify();$('v28-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' records'+(r.errors.length?' · '+r.errors.slice(0,3).join(', '):'')};$('v28-tamper').onclick=tamper;$('v28-export').onclick=exportJson;
['v28-count','v28-first','v28-second','v28-program','v28-streak','v28-intent'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){locked=null;ledger=[];summaries=[];head=Z;draw()}}));
window.PHOTON_GUARD28={compute,verify,tests,run,ledger:()=>copy(ledger),generations:()=>copy(summaries)};
draw();
})();