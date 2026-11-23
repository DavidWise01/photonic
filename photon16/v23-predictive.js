/* PHOTON-16 v0.23 · causal prediction / adaptive memory
 * Forecasts use only closed generations, never lookahead. All QED/QCD
 * signals are classical software analogues, not quantum-field calculations. */
(()=>{'use strict';
const $=id=>document.getElementById(id),SIM=window.PHOTON_MEMORY21,ZERO='0'.repeat(64);
const copy=x=>JSON.parse(JSON.stringify(x)),hash=async obj=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(obj))))).map(n=>n.toString(16).padStart(2,'0')).join('');
let rows=[],checkpoints=[],head=ZERO,locked=null,busy=false;
function config(){return {count:+$('v23-count').value,minWindow:+$('v23-min').value,maxWindow:+$('v23-max').value,mode:$('v23-mode').value,intent:$('v23-intent').value}}
function valid(c){return Number.isInteger(c.count)&&c.count>=1&&c.count<=12&&Number.isInteger(c.minWindow)&&Number.isInteger(c.maxWindow)&&c.minWindow>=1&&c.maxWindow<=8&&c.minWindow<=c.maxWindow&&['nominal','pulse','accumulating','late','persistent'].includes(c.mode)&&['approve','reject'].includes(c.intent)}
function predict(history){
 // Causal prediction recorded BEFORE generation g is observed.
 if(!history.length)return {expectedFaults:null,risk:'UNKNOWN',basis:[]};
 const recent=history.slice(-2),faults=recent.map(x=>x.faults);
 const estimate=recent.length===1?faults[0]:Math.max(0,Math.round(faults[1]+(faults[1]-faults[0])));
 return {expectedFaults:estimate,risk:estimate>=20?'HIGH':estimate>=3?'MEDIUM':'LOW',basis:recent.map(x=>x.generation)};
}
function beforeWindow(w,forecast,c){
 return forecast.risk==='HIGH'?Math.max(c.minWindow,w-1):w;
}
function afterWindow(w,summary,c){
 if(summary.decision==='REJECT')return {window:c.minWindow,reason:'rejected_reset',memory:[]};
 const next=summary.faults<=2?Math.min(c.maxWindow,w+1):summary.faults>=20?Math.max(c.minWindow,w-1):w;
 return {window:next,reason:next>w?'stable_expand':next<w?'disturbed_contract':'hold'};
}
function simulateAll(c,predictive){
 let memory=[],window=c.minWindow,observations=[],generations=[];
 for(let g=0;g<c.count;g++){
  const forecast=predict(generations),appliedWindow=predictive?beforeWindow(window,forecast,c):window;
  // Retention narrowing applies before generation g, using only history g-1 and earlier.
  memory=memory.slice(-appliedWindow);
  const experiment=SIM.simulate(g,memory,{count:c.count,window:appliedWindow,mode:c.mode,intent:c.intent});
  const summary=experiment.summary;
  observations.push(...experiment.observations);
  const next=afterWindow(appliedWindow,summary,c);
  const newMemory=summary.decision==='REJECT'?[]:[...memory,summary.terminal].slice(-next.window);
  const discrepancy=forecast.expectedFaults===null?null:summary.faults-forecast.expectedFaults;
  generations.push({generation:g,forecast,windowIn:window,windowApplied:appliedWindow,windowOut:next.window,
   decision:summary.decision,reason:next.reason,faults:summary.faults,error:discrepancy,
   internal:summary.internal,external:summary.external,intent:c.intent,
   memoryIn:copy(memory),memoryOut:copy(newMemory),recoveries:copy(summary.recoveries)});
  memory=newMemory;window=next.window;
 }
 return {observations,generations};
}
async function run(){
 if(busy)return;const c=config();if(!valid(c)){$('v23-status').textContent='INVALID PARAMETERS';return}
 busy=true;locked=copy(c);rows=[];checkpoints=[];head=ZERO;$('v23-run').disabled=true;
 try{
 const model=simulateAll(c,true);
 for(let g=0;g<c.count;g++){
  for(const observation of model.observations.slice(g*360,(g+1)*360)){
   const payload={...observation,previousHash:head},digest=await hash(payload);rows.push({...payload,hash:digest});head=digest;
  }
  checkpoints.push({...model.generations[g],head,entryCount:rows.length});render();
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 const r=await verify();$('v23-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' rows · '+r.errors.slice(0,2).join(', ');
 }catch(e){$('v23-status').textContent='ERROR · '+e.message}finally{busy=false;$('v23-run').disabled=false}
}
async function verify(candidate=copy(rows),states=copy(checkpoints),claimedHead=head,c=locked){
 if(!c||!valid(c))return {ok:false,checked:0,errors:['run with valid settings first']};
 const errors=[],baseline=simulateAll(c,true),checkHashes=[];
 if(candidate.length>c.count*360)errors.push('excess rows');
 let prev=ZERO;
 for(let i=0;i<candidate.length;i++){
  const row=candidate[i],expect=baseline.observations[i];
  if(!expect){errors.push('extra row '+i);break}
  for(const k of Object.keys(expect))if(row[k]!==expect[k])errors.push('row mismatch '+i+':'+k);
  if(row.previousHash!==prev)errors.push('parent '+i);
  const {hash:d,...payload}=row;if(await hash(payload)!==d)errors.push('digest '+i);
  prev=d;if(i%360===359)checkHashes.push(d);
 }
 if(prev!==claimedHead)errors.push('head mismatch');
 if(states.length!==Math.floor(candidate.length/360))errors.push('checkpoint count');
 for(let g=0;g<states.length;g++){
  const state=states[g],expect=baseline.generations[g];
  if(!expect){errors.push('extra checkpoint '+g);continue}
  for(const k of Object.keys(expect))if(JSON.stringify(state[k])!==JSON.stringify(expect[k]))errors.push('checkpoint '+g+':'+k);
  if(state.head!==checkHashes[g]||state.entryCount!==(g+1)*360)errors.push('checkpoint digest '+g);
  if(state.internal!==144||state.external!==216)errors.push('time budget '+g);
  if(state.decision==='REJECT'&&state.memoryOut.length!==0)errors.push('contaminated carry '+g);
  if(state.memoryOut.length>state.windowOut)errors.push('memory capacity '+g);
  if(state.forecast.basis.some(i=>i>=g))errors.push('future leakage '+g);
 }
 return {ok:errors.length===0,complete:candidate.length===c.count*360,checked:candidate.length,errors};
}
function compare(){
 const c=config();if(!valid(c))return {ok:false,error:'invalid parameters'};
 const predicted=simulateAll(c,true),baseline=simulateAll(c,false);
 const a=predicted.generations,b=baseline.generations;
 const mean=x=>x.reduce((s,v)=>s+v,0)/Math.max(1,x.length);
 const latency=s=>s.flatMap(x=>x.recoveries.filter(r=>r.latency!==null).map(r=>r.latency));
 const out={predictive:{faults:a.reduce((s,x)=>s+x.faults,0),rejections:a.filter(x=>x.decision==='REJECT').length,meanRecovery:mean(latency(a))},
 baseline:{faults:b.reduce((s,x)=>s+x.faults,0),rejections:b.filter(x=>x.decision==='REJECT').length,meanRecovery:mean(latency(b))}};
 $('v23-status').textContent='COUNTERFACTUAL · predicted faults '+out.predictive.faults+' vs baseline '+out.baseline.faults+' · recovery '+out.predictive.meanRecovery.toFixed(1)+' vs '+out.baseline.meanRecovery.toFixed(1)+' ticks';
 return out;
}
function scenarios(){
 const c=config();if(!valid(c))return {ok:false,error:'invalid parameters'};
 const modes=['nominal','pulse','accumulating','late','persistent'];
 const tests=modes.map(mode=>{const model=simulateAll({...c,mode},true),gs=model.generations;
  return {mode,windows:gs.map(x=>x.windowApplied),rejections:gs.filter(x=>x.decision==='REJECT').length,
   safe:gs.every(x=>x.internal===144&&x.external===216&&x.memoryOut.length<=x.windowOut&&(x.decision!=='REJECT'||x.memoryOut.length===0)&&x.forecast.basis.every(b=>b<x.generation))}});
 const ok=tests.every(x=>x.safe);$('v23-status').textContent=(ok?'PASS':'FAIL')+' · '+tests.map(x=>x.mode+':'+x.windows.join('→')).join(' · ');
 return {ok,tests};
}
async function challenge(){
 if(!rows.length){$('v23-status').textContent='RUN BEFORE CHALLENGE';return}
 const altered=copy(rows);altered[Math.floor(altered.length/2)].qcd=0;
 const report=await verify(altered,copy(checkpoints),head,locked);
 $('v23-status').textContent=report.ok?'FAIL · mutation escaped':'PASS · cloned evidence alteration detected';
}
function exportLedger(){
 const data={schema:'PHOTON16-v23-predictive',classicalAnalogy:true,config:locked||config(),checkpoints:copy(checkpoints),observations:copy(rows),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v23-predictive.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function render(){
 const c=locked||config();
 $('v23-counts').textContent=checkpoints.length+'/'+c.count+' generations · '+rows.length+'/'+(c.count*360)+' observations';
 $('v23-head').textContent=head.slice(0,19)+'…';
 $('v23-last').textContent=checkpoints.length?checkpoints.at(-1).decision:'PENDING';
 $('v23-log').textContent=checkpoints.map(x=>'G'+x.generation+' · forecast '+(x.forecast.expectedFaults===null?'unknown':x.forecast.expectedFaults)+' / observed '+x.faults+' · '+x.forecast.risk+' · W'+x.windowIn+'→'+x.windowApplied+'→'+x.windowOut+' · '+x.decision).join('\n')||'No generations observed';
 const canvas=$('v23-chart'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 ctx.fillStyle='#071524';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#cbdff1';ctx.font='13px monospace';ctx.fillText('FORECAST (violet) vs OBSERVED (orange) — NO FUTURE DATA',24,24);
 if(!checkpoints.length)return;
 const max=Math.max(20,...checkpoints.map(x=>Math.max(x.faults,x.forecast.expectedFaults||0))),step=(w-80)/Math.max(1,c.count);
 checkpoints.forEach((x,i)=>{let bx=45+i*step,bh=(h-80),a=x.forecast.expectedFaults===null?0:x.forecast.expectedFaults/max*bh,b=x.faults/max*bh;
 ctx.fillStyle='#a18fff';ctx.fillRect(bx,h-34-a,Math.max(5,step*.27),a);
 ctx.fillStyle='#ff995e';ctx.fillRect(bx+step*.30,h-34-b,Math.max(5,step*.27),b);
 ctx.fillStyle='#dce9fa';ctx.fillText('G'+i,bx,h-12)});
}
$('v23-run').onclick=run;$('v23-verify').onclick=async()=>{const r=await verify();$('v23-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' rows · '+r.errors.slice(0,2).join(', ')};
$('v23-compare').onclick=compare;$('v23-scenarios').onclick=scenarios;$('v23-challenge').onclick=challenge;$('v23-export').onclick=exportLedger;
['v23-count','v23-min','v23-max','v23-mode','v23-intent'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){locked=null;rows=[];checkpoints=[];head=ZERO;render()}}));
window.PHOTON_PREDICT23={predict,simulateAll,verify,compare,scenarios,ledger:()=>copy(rows),generations:()=>copy(checkpoints)};
render();
})();