/* PHOTON-16 v0.21 · bounded generational memory + causal recovery timing
   Deterministic classical analogues, NOT QED/QCD quantum field calculations.
   Append-only browser evidence, independent replay; no modification to prior versions. */
(()=>{'use strict';
const $=id=>document.getElementById(id), CLOCK=window.PHOTON_TIME16;
const SEED='0'.repeat(64),T=360,LIMIT=12,clone=x=>JSON.parse(JSON.stringify(x)),round=x=>Number(x.toFixed(9));
const modes={
 nominal:g=>[],
 pulse:g=>[{tick:55,phase:1.8,color:1.4},{tick:190,phase:1.4,color:1.0}],
 accumulating:g=>[{tick:100,phase:1.5+g*.12,color:1.0+g*.09},{tick:245,phase:1.3+g*.12,color:.8+g*.09}],
 late:g=>g%3===1?[{tick:350,phase:2.8,color:2.7}]:[{tick:60,phase:1.1,color:.8}],
 persistent:g=>[{tick:347,phase:2.8,color:2.5}]
};
const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data))))).map(x=>x.toString(16).padStart(2,'0')).join('');
const vector=items=>items.length?{phase:round(items.reduce((a,x)=>a+x.phase,0)/items.length),color:round(items.reduce((a,x)=>a+x.color,0)/items.length)}:{phase:0,color:0};
let rows=[],generations=[],head=SEED,locked=null,busy=false;
function config(){return {count:Number($('v21-count').value),window:Number($('v21-window').value),mode:$('v21-mode').value,intent:$('v21-intent').value}}
function valid(c){return Number.isInteger(c.count)&&c.count>=1&&c.count<=LIMIT&&Number.isInteger(c.window)&&c.window>=1&&c.window<=8&&Object.hasOwn(modes,c.mode)&&['approve','reject'].includes(c.intent)}
function observe(g,t,carry,c){
 let p=carry.phase*Math.exp(-t/35)+Math.sin(.051*t+.1*g)*.06;
 let color=carry.color*Math.exp(-t/40)+Math.cos(.043*t+.1*g)*.025;
 const shocks=modes[c.mode](g);
 for(const s of shocks)if(t>=s.tick){const age=t-s.tick;p+=s.phase*Math.exp(-age/16);color+=s.color*Math.exp(-age/18)}
 const qed=round((1+Math.cos(p))/2),qcd=round(Math.max(0,1-Math.abs(color)*.22)),part=CLOCK.at(t);
 return {generation:g,tick:t,globalTick:g*T+t,intent:c.intent,role:part.role,side:part.side,vm:part.vm,nibble:part.nibble,qed,qcd,passed:qed>=.75&&qcd>=.9,
 phase:round(p),color:round(color),injected:shocks.some(s=>s.tick===t)};
}
function recovery(observations,eventTick){
 // Recovery is the earliest completion of FIVE consecutive passing measurements
 // starting no earlier than the event, rather than merely the first good sample.
 for(let end=eventTick+4;end<T;end++)if(observations.slice(end-4,end+1).every(x=>x.passed))return {eventTick,recoveredAt:end,latency:end-eventTick};
 return {eventTick,recoveredAt:null,latency:null};
}
function simulate(g,memory,c){
 const carry=vector(memory);
 const observations=Array.from({length:T},(_,t)=>observe(g,t,carry,c));
 const accepted=observations.slice(-5).every(x=>x.passed);
 const terminal={phase:observations[359].phase,color:observations[359].color};
 const next=accepted?[...memory,terminal].slice(-c.window):[];
 const events=modes[c.mode](g).map(e=>recovery(observations,e.tick));
 return {observations,summary:{generation:g,intent:c.intent,decision:accepted?'APPROVE':'REJECT',carryIn:carry,
 memoryBefore:clone(memory),memoryAfter:clone(next),carryPolicy:accepted?'validated_window':'anchor_reset',
 terminal,internal:observations.filter(x=>x.side==='internal').length,external:observations.filter(x=>x.side==='external').length,
 faults:observations.filter(x=>!x.passed).length,recoveries:events,
 unrecovered:events.filter(x=>x.latency===null).length}};
}
async function run(){
 if(busy)return;const c=config();if(!valid(c)){$('v21-status').textContent='INVALID CONFIGURATION';return}
 busy=true;locked=clone(c);$('v21-run').disabled=true;rows=[];generations=[];head=SEED;display();
 try{
  let memory=[];
  for(let g=0;g<c.count;g++){
   const simulation=simulate(g,memory,c);
   for(const observation of simulation.observations){const payload={...observation,previousHash:head};const digest=await hash(payload);rows.push({...payload,hash:digest});head=digest}
   const entry={...simulation.summary,head,recordCount:rows.length};
   generations.push(entry);memory=clone(entry.memoryAfter);display();
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  const report=await verify();$('v21-status').textContent=(report.ok?'PASS':'FAIL')+' · '+report.checked+' chained ticks · '+report.errors.slice(0,2).join(', ');
 }catch(e){$('v21-status').textContent='ERROR · '+e.message}finally{busy=false;$('v21-run').disabled=false}
}
async function verify(source=clone(rows),checkpoints=clone(generations),claimedHead=head,c=locked){
 const errors=[];if(!c||!valid(c))return {ok:false,errors:['missing configuration'],checked:0};
 if(source.length>c.count*T||checkpoints.length>c.count)errors.push('range');
 let prev=SEED,memory=[];
 for(let g=0;g<checkpoints.length;g++){
  const expected=simulate(g,memory,c),record=checkpoints[g];
  for(const key of Object.keys(expected.summary))if(JSON.stringify(record[key])!==JSON.stringify(expected.summary[key]))errors.push('summary '+g+':'+key);
  if(record.recordCount!==(g+1)*T||record.head!==source[(g+1)*T-1]?.hash)errors.push('checkpoint '+g);
  if(expected.summary.internal!==144||expected.summary.external!==216)errors.push('2/5:3/5 '+g);
  memory=clone(expected.summary.memoryAfter);
 }
 memory=[];
 for(let i=0;i<source.length;i++){
  const g=Math.floor(i/T),t=i%T;
  if(t===0){const computed=simulate(g,memory,c);memory=computed.summary.memoryAfter}
  // Independent carry must be computed from previous generations, never from evidence fields.
  let prior=[];for(let k=0;k<g;k++)prior=simulate(k,prior,c).summary.memoryAfter;
  const expected=observe(g,t,vector(prior),c),record=source[i];
  for(const key of Object.keys(expected))if(record[key]!==expected[key])errors.push('observation '+i+':'+key);
  if(record.previousHash!==prev)errors.push('parent '+i);
  const {hash:digest,...payload}=record;if(await hash(payload)!==digest)errors.push('hash '+i);
  prev=digest;
 }
 if(prev!==claimedHead)errors.push('head mismatch');
 if(source.length===c.count*T&&checkpoints.length!==c.count)errors.push('missing generation checkpoints');
 return {ok:errors.length===0,complete:source.length===c.count*T,checked:source.length,generations:checkpoints.length,errors};
}
function dryRuns(){
 const c=config();if(!valid(c))return {ok:false,errors:['invalid config']};
 const scenarios=Object.keys(modes).map(mode=>{
  let memory=[],out=[];
  for(let g=0;g<c.count;g++){const s=simulate(g,memory,{...c,mode});out.push(s.summary);memory=s.summary.memoryAfter}
  return {mode,decisions:out.map(x=>x.decision),resetCount:out.filter(x=>x.carryPolicy==='anchor_reset').length,unrecovered:out.reduce((n,x)=>n+x.unrecovered,0),
    validClock:out.every(x=>x.internal===144&&x.external===216),bounded:out.every(x=>x.memoryAfter.length<=c.window),cleanReset:out.every(x=>x.decision!=='REJECT'||x.memoryAfter.length===0)};
 });
 const ok=scenarios.every(x=>x.validClock&&x.bounded&&x.cleanReset)&&scenarios.find(x=>x.mode==='nominal').resetCount===0;
 $('v21-status').textContent=(ok?'PASS':'FAIL')+' · '+scenarios.map(x=>x.mode+':'+x.decisions.join('/')).join(' · ');
 return {ok,scenarios};
}
function draw(){
 const c=$('v21-chart'),ctx=c.getContext('2d'),w=c.width,h=c.height;
 ctx.fillStyle='#081421';ctx.fillRect(0,0,w,h);
 if(!rows.length)return;
 let left=45,right=w-17,top=22,bottom=h-32;
 const x=i=>left+i/Math.max(1,rows.length-1)*(right-left),y=v=>bottom-v*(bottom-top);
 for(let g=1;g<generations.length;g++){ctx.strokeStyle='#ff9957';ctx.beginPath();ctx.moveTo(x(g*T));ctx.lineTo(x(g*T),bottom);ctx.stroke()}
 for(const [k,col] of [['qed','#61efc9'],['qcd','#a8a0ff']]){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();rows.forEach((r,i)=>{i?ctx.lineTo(x(i),y(r[k])):ctx.moveTo(x(i),y(r[k]))});ctx.stroke()}
 ctx.fillStyle='#c8e7fc';ctx.font='12px monospace';ctx.fillText('QED visibility (green) · QCD analogy (purple) · generations: '+generations.length,left,15);
}
function display(){
 const c=locked||config(),faults=generations.reduce((a,x)=>a+x.faults,0);
 $('v21-gens').textContent=generations.length+'/'+c.count;
 $('v21-ticks').textContent=rows.length+'/'+(c.count*T);
 $('v21-faults').textContent=String(faults);
 $('v21-resets').textContent=String(generations.filter(x=>x.carryPolicy==='anchor_reset').length);
 $('v21-head').textContent=head.slice(0,18)+'…';
 $('v21-entries').textContent=generations.map(g=>'G'+g.generation+' '+g.decision+' · faults '+g.faults+' · '+g.carryPolicy+
 ' · memory '+g.memoryAfter.length+'/'+c.window+' · latency '+g.recoveries.map(r=>r.latency===null?'unrecovered':r.latency+'t').join(',')).join('\n')||'Ready for bounded generational simulation';
 draw();
}
async function challenge(){
 if(!rows.length){$('v21-status').textContent='RUN BEFORE CHALLENGE';return}
 const fake=clone(rows);fake[Math.floor(fake.length/2)].qed=.00001;
 const report=await verify(fake,clone(generations),head,locked);
 $('v21-status').textContent=report.ok?'FAIL · mutation passed':'PASS · copied evidence mutation detected: '+report.errors.slice(0,2).join(', ');
}
function exportLedger(){
 const payload={schema:'PHOTON16-v21-bounded-generations',simulation:true,config:locked||config(),generations:clone(generations),ledger:clone(rows),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v21-bounded-generations.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('v21-run').onclick=run;$('v21-test').onclick=dryRuns;$('v21-audit').onclick=async()=>{const report=await verify();$('v21-status').textContent=(report.ok?'PASS':'FAIL')+' · '+report.checked+' verified rows'+(report.errors.length?' · '+report.errors.slice(0,2).join(', '):'')};$('v21-tamper').onclick=challenge;$('v21-export').onclick=exportLedger;
['v21-count','v21-window','v21-mode','v21-intent'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){rows=[];generations=[];head=SEED;locked=null;display()}}));
window.PHOTON_MEMORY21={observe,simulate,recovery,verify,dryRuns,run,summary:()=>clone(generations),ledger:()=>clone(rows)};
display();
})();