/* PHOTON-16 v0.22 — adaptive cross-generation retention.
   Uses the frozen v0.21 deterministic signal model without modifying it.
   QED/QCD terms remain classical signal analogies; not quantum field calculations. */
(()=>{'use strict';
const $=id=>document.getElementById(id),SIM=window.PHOTON_MEMORY21,CLK=window.PHOTON_TIME16;
const ZERO='0'.repeat(64),copy=x=>JSON.parse(JSON.stringify(x));
const digest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(n=>n.toString(16).padStart(2,'0')).join('');
let ledger=[],checkpoints=[],head=ZERO,params=null,busy=false;
function settings(){return {count:+$('v22-count').value,minWindow:+$('v22-min').value,maxWindow:+$('v22-max').value,mode:$('v22-mode').value,intent:$('v22-intent').value}}
function valid(c){return Number.isInteger(c.count)&&c.count>=1&&c.count<=12&&c.minWindow>=1&&c.maxWindow<=8&&c.minWindow<=c.maxWindow&&['nominal','pulse','accumulating','late','persistent'].includes(c.mode)&&['approve','reject'].includes(c.intent)}
function transition(window,memory,summary,c){
 // Only completed observed generations may change the next window.
 // Thresholds are deliberately fixed and displayed, not learned from hidden state.
 if(summary.decision==='REJECT')return {window:c.minWindow,memory:[],reason:'rejection_reset'};
 const nextWindow=summary.faults<=2?Math.min(c.maxWindow,window+1):summary.faults>=20?Math.max(c.minWindow,window-1):window;
 const carried=[...memory,summary.terminal].slice(-nextWindow);
 return {window:nextWindow,memory:carried,reason:summary.faults<=2?'stable_expand':summary.faults>=20?'disturbed_contract':'hold'};
}
function expected(c){
 let window=c.minWindow,memory=[],rows=[],summaries=[];
 for(let g=0;g<c.count;g++){
  const s=SIM.simulate(g,memory,{count:c.count,window,mode:c.mode,intent:c.intent});
  const next=transition(window,memory,s.summary,c);
  rows.push(...s.observations);
  summaries.push({generation:g,windowIn:window,windowOut:next.window,reason:next.reason,
   memoryIn:copy(memory),memoryOut:copy(next.memory),
   decision:s.summary.decision,faults:s.summary.faults,recoveries:copy(s.summary.recoveries),
   internal:s.summary.internal,external:s.summary.external,intent:c.intent});
  window=next.window;memory=next.memory;
 }
 return {rows,summaries};
}
async function run(){
 if(busy)return;const c=settings();if(!valid(c)){$('v22-status').textContent='INVALID WINDOW RANGE';return}
 busy=true;params=copy(c);ledger=[];checkpoints=[];head=ZERO;$('v22-run').disabled=true;
 try{
  const computed=expected(c);
  for(let g=0;g<c.count;g++){
   for(let t=0;t<360;t++){
    const data={...computed.rows[g*360+t],previousHash:head};
    const hash=await digest(data);ledger.push({...data,hash});head=hash;
   }
   checkpoints.push({...computed.summaries[g],head,entryCount:ledger.length});
   show();await new Promise(resolve=>setTimeout(resolve,0));
  }
  const report=await verify();$('v22-status').textContent=(report.ok?'PASS':'FAIL')+' · '+report.checked+' chained observations'+(report.errors.length?' · '+report.errors.slice(0,2).join(', '):'');
 }catch(e){$('v22-status').textContent='ERROR · '+e.message}finally{busy=false;$('v22-run').disabled=false}
}
async function verify(rows=copy(ledger),states=copy(checkpoints),claimedHead=head,c=params){
 if(!c||!valid(c))return {ok:false,checked:0,errors:['missing configuration']};
 const errors=[],reference=expected(c),end=Math.min(rows.length,c.count*360),checkpointHashes=[];
 if(rows.length>c.count*360)errors.push('excess rows');
 let previous=ZERO;
 for(let i=0;i<rows.length;i++){
  const r=rows[i],baseline=reference.rows[i];
  if(!baseline){errors.push('unexpected '+i);break}
  for(const k of Object.keys(baseline))if(r[k]!==baseline[k])errors.push('value '+i+':'+k);
  if(r.previousHash!==previous)errors.push('parent '+i);
  const {hash,...payload}=r;if(await digest(payload)!==hash)errors.push('digest '+i);
  previous=hash;
  if(i%360===359)checkpointHashes.push(hash);
 }
 if(previous!==claimedHead)errors.push('head mismatch');
 if(states.length!==Math.floor(rows.length/360))errors.push('checkpoint count');
 for(let g=0;g<states.length;g++){
  const state=states[g],baseline=reference.summaries[g];
  if(!baseline){errors.push('unexpected checkpoint '+g);continue}
  for(const k of Object.keys(baseline))if(JSON.stringify(state[k])!==JSON.stringify(baseline[k]))errors.push('checkpoint '+g+':'+k);
  if(state.head!==checkpointHashes[g]||state.entryCount!==(g+1)*360)errors.push('checkpoint hash '+g);
  if(state.internal!==144||state.external!==216)errors.push('time split '+g);
  if(state.decision==='REJECT'&&state.memoryOut.length)errors.push('failed state escaped '+g);
  if(state.memoryOut.length>state.windowOut)errors.push('memory overflow '+g);
 }
 return {ok:errors.length===0,complete:rows.length===c.count*360,checked:end,errors};
}
function dryRun(){
 const c=settings();if(!valid(c)){$('v22-status').textContent='INVALID WINDOW RANGE';return}
 const tests=['nominal','pulse','accumulating','late','persistent'].map(mode=>{
  const data=expected({...c,mode});
  return {mode,windows:data.summaries.map(x=>x.windowOut),decisions:data.summaries.map(x=>x.decision),
   safe:data.summaries.every(x=>x.memoryOut.length<=x.windowOut&&(x.decision!=='REJECT'||x.memoryOut.length===0)&&x.internal===144&&x.external===216)}
 });
 const ok=tests.every(x=>x.safe)&&tests.find(x=>x.mode==='nominal').windows.at(-1)>=c.minWindow;
 $('v22-status').textContent=(ok?'PASS':'FAIL')+' · '+tests.map(x=>x.mode+':'+x.windows.join('→')).join(' · ');
 return {ok,tests};
}
async function challenge(){
 if(!ledger.length){$('v22-status').textContent='RUN BEFORE MUTATION TEST';return}
 const altered=copy(ledger);altered[Math.floor(altered.length/2)].qed=0;
 const report=await verify(altered,copy(checkpoints),head,params);
 $('v22-status').textContent=report.ok?'FAIL · tampered copy accepted':'PASS · altered copy detected: '+report.errors.slice(0,2).join(', ');
}
function exportData(){
 const p={schema:'PHOTON16-v22-adaptive',simulation:true,config:params||settings(),checkpoints:copy(checkpoints),observations:copy(ledger),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v22-adaptive.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function show(){
 const c=params||settings();
 $('v22-generations').textContent=checkpoints.length+'/'+c.count;
 $('v22-observations').textContent=ledger.length+'/'+c.count*360;
 $('v22-window').textContent=checkpoints.length?String(checkpoints.at(-1).windowOut):String(c.minWindow);
 $('v22-resets').textContent=String(checkpoints.filter(x=>x.reason==='rejection_reset').length);
 $('v22-head').textContent=head.slice(0,20)+'…';
 $('v22-ledger').textContent=checkpoints.map(x=>'G'+x.generation+' · '+x.decision+' · '+x.reason+' · W'+x.windowIn+'→W'+x.windowOut+' · faults '+x.faults+' · latencies '+x.recoveries.map(r=>r.latency===null?'unrecovered':r.latency+'t').join(',')).join('\n')||'No generations recorded';
 const canvas=$('v22-chart'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.fillStyle='#091421';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#d9eeff';ctx.font='13px monospace';ctx.fillText('ADAPTIVE WINDOW · OBSERVED GENERATION BOUNDARIES',25,25);
 checkpoints.forEach((x,i)=>{const bw=Math.max(12,(w-70)/Math.max(1,c.count)-8),bx=32+i*(w-70)/c.count,by=h-35,bar=x.windowOut/c.maxWindow*(h-90);
 ctx.fillStyle=x.decision==='REJECT'?'#f17e82':x.reason==='stable_expand'?'#58e8c4':'#9a91ec';ctx.fillRect(bx,by-bar,bw,bar);
 ctx.fillStyle='#cddfed';ctx.fillText('G'+i,bx,by+16)});
}
$('v22-run').onclick=run;$('v22-test').onclick=dryRun;$('v22-verify').onclick=async()=>{const r=await verify();$('v22-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' rows '+r.errors.slice(0,2).join(', ')};
$('v22-challenge').onclick=challenge;$('v22-export').onclick=exportData;
['v22-count','v22-min','v22-max','v22-mode','v22-intent'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){params=null;ledger=[];checkpoints=[];head=ZERO;show()}}));
window.PHOTON_ADAPT22={expected,transition,verify,dryRun,run,ledger:()=>copy(ledger),checkpoints:()=>copy(checkpoints)};
show();
})();