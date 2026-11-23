/* PHOTON-16 v0.20 — cross-generation, deterministic toy signal stability.
 * 360 ticks/gen, 144 internal + 216 external. Not physical QED/QCD.
 * New append-only ledger; earlier lab states remain untouched.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),TIME=window.PHOTON_TIME16,HEX='0'.repeat(64),T=360,N=3;
const modes={
 stable:()=>[],
 accumulating:g=>[{tick:285,phase:1.35+.5*g,color:.85+.35*g}],
 terminal:g=>g===1?[{tick:351,phase:2.7,color:2.3}]:[{tick:80,phase:.8,color:.4}],
 recovery:g=>[{tick:70,phase:1.8,color:1.5},{tick:190,phase:.8,color:.6}]
};
const clean=x=>JSON.parse(JSON.stringify(x)),sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(a=>a.toString(16).padStart(2,'0')).join('');
const pass=(phase,color)=>((1+Math.cos(phase))/2>=.75)&&(Math.max(0,1-Math.abs(color)*.22)>=.90);
const round=x=>Number(x.toFixed(10));
let ledger=[],head=HEX,generations=[],busy=false,mode='stable',intent='approve';
function step(g,t,state,modeName){
 const shocks=modes[modeName](g);
 let phase=state.phase*Math.exp(-t/35)+Math.sin(t*.051+g*.1)*.06;
 let color=state.color*Math.exp(-t/40)+Math.cos(t*.043+g*.1)*.025;
 for(const s of shocks)if(t>=s.tick){const dt=t-s.tick;phase+=s.phase*Math.exp(-dt/16);color+=s.color*Math.exp(-dt/18)}
 const q=round((1+Math.cos(phase))/2),c=round(Math.max(0,1-Math.abs(color)*.22));
 const p=TIME.at(t);
 return {generation:g,tick:t,globalTick:g*T+t,role:p.role,side:p.side,vm:p.vm,nibble:p.nibble,
 phase:round(phase),color:round(color),qed:q,qcd:c,passed:q>=.75&&c>=.9,
 injected:shocks.some(s=>s.tick===t)};
}
function compute(g,carry,modeName){
 const rows=Array.from({length:T},(_,t)=>step(g,t,carry,modeName));
 const tail=rows.slice(-5),valid=tail.every(r=>r.passed);
 const last=rows[359];
 const terminal={phase:last.phase,color:last.color},next=valid?terminal:{phase:0,color:0};
 const count=rows.reduce((o,r)=>{o[r.side]++;return o},{internal:0,external:0});
 const outcome={generation:g,internal:count.internal,external:count.external,valid,decision:valid?'APPROVE':'REJECT',
 carryIn:clean(carry),observedTerminal:terminal,carryOut:next,carryPolicy:valid?'validated_transfer':'anchor_reset',
 failures:rows.filter(x=>!x.passed).length,finalWindow:tail.map(x=>x.passed)};
 return {rows,outcome};
}
async function run(){
 if(busy)return;busy=true;$('v20-run').disabled=true;
 try{
  mode=$('v20-mode').value;intent=$('v20-intent').value;ledger=[];generations=[];head=HEX;
  let carry={phase:0,color:0};
  for(let g=0;g<N;g++){
   const c=compute(g,carry,mode);
   for(const r of c.rows){const payload={...r,intent,previousHash:head};const digest=await sha(payload);ledger.push({...payload,hash:digest});head=digest}
   const generationRecord={...c.outcome,intent,head,entries:ledger.length};
   generations.push(generationRecord);carry=clean(c.outcome.carryOut);display();
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  const v=await verify();$('v20-status').textContent=(v.ok?'PASS':'FAIL')+' · '+v.checked+'/1080 chained observations · '+v.errors.slice(0,3).join(', ');
 }catch(e){$('v20-status').textContent='ERROR · '+e.message}finally{busy=false;$('v20-run').disabled=false}
}
async function verify(rows=clean(ledger),reported=clean(generations),claimedHead=head,selected=mode,originalIntent=intent){
 const errors=[];let prev=HEX,carry={phase:0,color:0};
 if(rows.length>N*T)errors.push('length beyond cap');
 for(let i=0;i<rows.length;i++){
  const r=rows[i],g=Math.floor(i/T),t=i%T,expected=step(g,t,reported[g]?.carryIn||carry,selected);
  for(const key of Object.keys(expected))if(r[key]!==expected[key])errors.push('field '+i+':'+key);
  if(r.intent!==originalIntent)errors.push('intent drift '+i);
  if(r.previousHash!==prev)errors.push('parent '+i);
  const {hash,...data}=r;if(await sha(data)!==hash)errors.push('digest '+i);
  prev=hash;
 }
 if(prev!==claimedHead)errors.push('head');
 for(let g=0;g<reported.length;g++){
  const predicted=compute(g,carry,selected).outcome;
  const record=reported[g];
  for(const key of Object.keys(predicted))if(JSON.stringify(record[key])!==JSON.stringify(predicted[key]))errors.push('generation '+g+':'+key);
  if(record.intent!==originalIntent)errors.push('generation intent '+g);
  if(record.entries!==(g+1)*T||record.head!==rows[(g+1)*T-1]?.hash)errors.push('checkpoint '+g);
  carry=predicted.carryOut;
 }
 if(rows.length===1080&&reported.length!==3)errors.push('generation count');
 return {ok:errors.length===0,checked:rows.length,generations:reported.length,errors};
}
function display(){
 $('v20-entries').textContent=ledger.length+'/1080';
 $('v20-gens').textContent=generations.length+'/3';
 $('v20-head').textContent=head.slice(0,18)+'…';
 $('v20-finals').textContent=generations.length?generations.map(g=>'G'+g.generation+' '+g.decision+(g.valid?' / carry':' / reset')).join(' → '):'No generations executed';
 $('v20-ledger').textContent=generations.length?generations.map(g=>'G'+g.generation+' · '+g.internal+'/144 internal · '+g.external+'/216 external · '+g.failures+' failing ticks · '+g.carryPolicy+' · '+g.head.slice(0,15)+'…').join('\n'):'Ready for three 360-tick generations';
 draw();
}
function draw(){
 const c=$('v20-chart'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#071421';ctx.fillRect(0,0,w,h);
 const left=42,right=w-15,top=30,bottom=h-36,xx=i=>left+i/1079*(right-left),yy=v=>bottom-v*(bottom-top);
 for(const [value,col] of [[.75,'#35735d'],[.9,'#665d9c']]){ctx.strokeStyle=col;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(left,yy(value));ctx.lineTo(right,yy(value));ctx.stroke();ctx.setLineDash([])}
 for(let g=1;g<3;g++){const x=xx(g*360);ctx.strokeStyle='#ff9957';ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke()}
 for(const [key,col] of [['qed','#62ebc6'],['qcd','#b0a0ff']]){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ledger.forEach((r,i)=>{let x=xx(i),y=yy(r[key]);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
 ctx.font='13px monospace';ctx.fillStyle='#e4eefa';ctx.fillText('G0 / 360',left+10,18);ctx.fillText('G1 / 360',xx(390),18);ctx.fillText('G2 / 360',xx(750),18);
 ctx.fillText('QED coherence / QCD RGB analogy',left,bottom+22);
}
function dryRun(){
 const names=['stable','accumulating','terminal','recovery'];
 const outcomes=names.map(name=>{let carry={phase:0,color:0},result=[];for(let g=0;g<N;g++){const x=compute(g,carry,name).outcome;result.push(x);carry=x.carryOut}return {mode:name,decisions:result.map(x=>x.decision),carry:result.map(x=>x.carryPolicy),splits:result.every(x=>x.internal===144&&x.external===216)}});
 const terminal=outcomes.find(x=>x.mode==='terminal');
 const ok=outcomes.every(x=>x.splits)&&outcomes.find(x=>x.mode==='stable').decisions.every(x=>x==='APPROVE')&&terminal.decisions[1]==='REJECT'&&terminal.carry[1]==='anchor_reset';
 $('v20-status').textContent=(ok?'PASS':'FAIL')+' · '+outcomes.map(x=>x.mode+':'+x.decisions.join('/')).join(' · ');
 return {ok,outcomes};
}
async function challenge(){if(!ledger.length){$('v20-status').textContent='RUN FIRST';return}const rows=clean(ledger);rows[Math.floor(rows.length/2)].qcd=.02;const checked=await verify(rows,clean(generations),head,mode,intent);$('v20-status').textContent=checked.ok?'FAIL · clone mutation accepted':'PASS · clone mutation detected: '+checked.errors.slice(0,2).join(', ')}
function exportData(){const payload={schema:'PHOTON16-v20-generational',model:'classical signal analogy',intent,mode,head,generations:clean(generations),ledger:clean(ledger)};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v20-generational.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('v20-run').onclick=run;$('v20-test').onclick=dryRun;$('v20-verify').onclick=async()=>{const r=await verify();$('v20-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' observations'+(r.errors.length?' · '+r.errors.slice(0,3).join(', '):'')};$('v20-tamper').onclick=challenge;$('v20-export').onclick=exportData;
window.PHOTON_GENERATIONS20={compute,step,verify,dryRun,ledger:()=>clean(ledger),summary:()=>clean(generations),run};
display();
})();