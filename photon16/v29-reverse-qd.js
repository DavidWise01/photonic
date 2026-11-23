/* PHOTON-16 v0.29: reverse-QD routing + post-quarantine recovery.
 * Reverse-QD is a USER DEFINED software geometry, not a claim that a
 * photon is physically a quantum dot. Existing optical/VM clocks unchanged. */
(()=>{'use strict';
const $=id=>document.getElementById(id),BASE=window.PHOTON_MEMORY21,SEED='0'.repeat(64);
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(v=>v.toString(16).padStart(2,'0')).join('');
// The bracket is a hierarchy [96/24/12/4], NOT sequential division.
// 96 domains, 24 per sector? Actual project: 96 domains, 12 per group of 8,
// 4 quads per sector, 3 sectors. We preserve the user's expression literally
// and use all stages as named logical coordinates, not hardware channels.
const canonical='[96/24/12/4] / 3 / 3 / 1 / 1 > 2^3 > 1 > .';
const geometry=[
 {label:'96',role:'domain registry',count:96},
 {label:'24',role:'routing bundle',count:24},
 {label:'12',role:'subbundle',count:12},
 {label:'4',role:'nibble cluster',count:4},
 {label:'3',role:'ternary axis A',count:3},
 {label:'3',role:'ternary axis B',count:3},
 {label:'1',role:'first singular gate',count:1},
 {label:'1',role:'second singular gate',count:1},
 {label:'2³',role:'eight-port spatial cell',count:8},
 {label:'1',role:'emergent output',count:1},
 {label:'.',role:'point origin',count:1}
];
const modes=['nominal','pulse','accumulating','late','persistent'];
let ledger=[],stages=[],head=SEED,locked=null,busy=false;
function config(){return {count:+$('v29-generations').value,mode:$('v29-mode').value,threshold:+$('v29-trip').value,recover:+$('v29-recover').value,intent:$('v29-intent').value}}
function valid(c){return c&&Number.isInteger(c.count)&&c.count>=1&&c.count<=8&&modes.includes(c.mode)&&[2,3].includes(c.threshold)&&[3,5,8].includes(c.recover)&&['approve','reject'].includes(c.intent)}
function model(c){
 if(!valid(c))throw Error('invalid settings');
 let memory=[],rows=[],summaries=[];
 for(let g=0;g<c.count;g++){
  // v0.21 supplies 360 observations, the 144/216 time split, and the
  // QED/QCD-inspired classical field measurements.
  const run=BASE.simulate(g,memory,{count:c.count,window:3,mode:c.mode,intent:c.intent});
  let bad=0,good=0,trip=null,recovered=null,quarantined=false;
  const observations=run.observations.map(ob=>{
   if(ob.passed){bad=0;if(quarantined&&recovered===null)good++}else{bad++;good=0}
   const tripNow=!quarantined&&bad>=c.threshold;
   if(tripNow){trip=ob.tick;quarantined=true;good=0}
   const recoverNow=quarantined&&recovered===null&&good>=c.recover;
   if(recoverNow)recovered=ob.tick;
   const state=!quarantined?'OBSERVE':recovered===null?'QUARANTINE':'RECOVERED_OBSERVATION_ONLY';
   return {...ob,reverseQD:'[96/24/12/4]/3/3/1/1>2^3>1>.',state,tripNow,recoverNow,
    quarantined:quarantined,recovered:recovered!==null,
    // A generation which was quarantined NEVER regains write authority
    // or terminal state transfer in the same generation.
    writeAuthority:!quarantined};
  });
  const voted=run.summary.decision; // Factory C remains authoritative
  const transferable=!quarantined&&voted==='APPROVE';
  const nextMemory=transferable?[...memory,run.summary.terminal].slice(-3):[];
  const summary={generation:g,mode:c.mode,intent:c.intent,tripTick:trip,recoveryTick:recovered,
   latency:trip===null||recovered===null?null:recovered-trip,
   quarantined,observationRecovered:recovered!==null,
   writeAuthorityAtEnd:!quarantined,transferable,carryIn:clone(memory),carryOut:clone(nextMemory),
   finalVote:voted,passedTicks:observations.filter(x=>x.passed).length,
   internal:run.summary.internal,external:run.summary.external};
  rows.push(...observations);summaries.push(summary);memory=nextMemory;
 }
 return {rows,summaries};
}
async function run(){
 if(busy)return;const c=config();if(!valid(c)){$('v29-status').textContent='INVALID SETTINGS';return}
 locked=clone(c);ledger=[];stages=[];head=SEED;busy=true;$('v29-run').disabled=true;
 try{
  const expected=model(c);
  for(let g=0;g<c.count;g++){
   for(let t=0;t<360;t++){
    const data={...expected.rows[g*360+t],parent:head},h=await hash(data);
    ledger.push({...data,hash:h});head=h;
   }
   stages.push({...expected.summaries[g],head,entries:ledger.length});
   render();await new Promise(r=>setTimeout(r,0));
  }
  const check=await verify();$('v29-status').textContent=(check.ok?'PASS':'FAIL')+' · '+check.checked+' ticks · '+(check.errors.slice(0,3).join(', ')||'all invariants confirmed');
 }catch(e){$('v29-status').textContent='ERROR · '+e.message}finally{busy=false;$('v29-run').disabled=false}
}
async function verify(rows=clone(ledger),summaries=clone(stages),claimedHead=head,c=locked){
 if(!valid(c))return {ok:false,checked:0,errors:['no valid run']};
 let parent=SEED;const expected=model(c),errors=[];
 if(rows.length>c.count*360)errors.push('excess records');
 for(let i=0;i<rows.length;i++){
  const row=rows[i],x=expected.rows[i];if(!x){errors.push('unexpected tick '+i);break}
  for(const key of Object.keys(x))if(row[key]!==x[key])errors.push('observation '+i+':'+key);
  if(row.parent!==parent)errors.push('parent '+i);
  const {hash:h,...payload}=row;if(await hash(payload)!==h)errors.push('hash '+i);
  parent=h;
 }
 if(parent!==claimedHead)errors.push('head mismatch');
 if(summaries.length!==Math.floor(rows.length/360))errors.push('checkpoint count');
 for(let g=0;g<summaries.length;g++){
  const row=summaries[g],x=expected.summaries[g];if(!x){errors.push('extra checkpoint '+g);break}
  for(const key of Object.keys(x))if(JSON.stringify(row[key])!==JSON.stringify(x[key]))errors.push('checkpoint '+g+':'+key);
  if(row.head!==rows[(g+1)*360-1]?.hash||row.entries!==(g+1)*360)errors.push('checkpoint hash '+g);
  if(row.internal!==144||row.external!==216)errors.push('time split '+g);
  if(row.quarantined&&(row.writeAuthorityAtEnd||row.transferable||row.carryOut.length))errors.push('quarantine leak '+g);
  if(row.finalVote==='REJECT'&&row.carryOut.length)errors.push('factory rejection leak '+g);
 }
 return {ok:!errors.length,complete:rows.length===c.count*360,checked:rows.length,errors};
}
function tests(){
 const c=config();if(!valid(c))return {ok:false};
 const cases=modes.map(mode=>{
  const result=model({...c,mode}),ss=result.summaries;
  const safe=ss.every(s=>s.internal===144&&s.external===216&&
   (!s.quarantined||!s.writeAuthorityAtEnd&&!s.transferable&&!s.carryOut.length)&&
   (s.finalVote!=='REJECT'||!s.carryOut.length)&&
   (s.recoveryTick===null||s.tripTick!==null&&s.recoveryTick>=s.tripTick+c.recover));
  return {mode,safe,quarantined:ss.filter(x=>x.quarantined).length,recovered:ss.filter(x=>x.observationRecovered).length,
   latencies:ss.map(x=>x.latency).filter(x=>x!==null)};
 });
 const ok=cases.every(x=>x.safe)&&geometry[0].count===96&&geometry[8].count===8;
 $('v29-status').textContent=(ok?'PASS':'FAIL')+' · '+cases.map(x=>x.mode+': Q'+x.quarantined+'/R'+x.recovered).join(' · ');
 return {ok,cases};
}
async function tamper(){if(!ledger.length){$('v29-status').textContent='RUN FIRST';return}
 const rows=clone(ledger);rows[Math.floor(rows.length/2)].writeAuthority=!rows[Math.floor(rows.length/2)].writeAuthority;
 const r=await verify(rows,clone(stages),head,locked);$('v29-status').textContent=r.ok?'FAIL · altered ledger accepted':'PASS · modified evidence rejected';
}
function exportData(){const data={schema:'PHOTON16-v29-reverse-qd-recovery',topology:canonical,geometry,model:'symbolic reverse-QD / classical light gate analogy',configuration:locked||config(),generations:clone(stages),records:clone(ledger),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v29-reverse-qd.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function draw(){
 const canvas=$('v29-plot'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 ctx.fillStyle='#071421';ctx.fillRect(0,0,w,h);ctx.font='13px monospace';ctx.fillStyle='#d9f5ff';
 ctx.fillText('REVERSE-QD · [96/24/12/4] / 3 / 3 / 1 / 1 > 2³ > 1 > .',18,22);
 const origin=30,step=(w-60)/(geometry.length-1),cy=85;
 geometry.forEach((n,i)=>{
  const x=origin+i*step,r=Math.max(5,14-i*.6);
  if(i){ctx.strokeStyle=i>=8?'#f9a866':'#55d8c7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(origin+(i-1)*step+11,cy);ctx.lineTo(x-11,cy);ctx.stroke()}
  ctx.fillStyle=i>=8?'#ff9e55':i%2?'#9e91ed':'#63e7ca';ctx.beginPath();ctx.arc(x,cy,r,0,2*Math.PI);ctx.fill();
  ctx.fillStyle='#edf8fc';ctx.textAlign='center';ctx.fillText(n.label,x,cy+35);
 });ctx.textAlign='left';
 ctx.font='12px monospace';ctx.fillStyle='#b6cbdf';ctx.fillText('Software hierarchy, not physical QD conversion  |  qubit-style 2³ is an eight-address cell',18,143);
 const gen=stages.length?stages.at(-1):null;
 if(gen){
  const x=t=>30+t/359*(w-60),left=168,right=207;
  ctx.fillStyle='#86bfe9';ctx.fillText('LAST GENERATION · TICK-CAUSAL RECOVERY',18,left-3);
  ctx.fillStyle='#235b73';ctx.fillRect(30,left,w-60,28);
  if(gen.tripTick!==null){ctx.fillStyle='#ef7b88';ctx.fillRect(x(gen.tripTick),left,w-30-x(gen.tripTick),28)}
  if(gen.recoveryTick!==null){ctx.fillStyle='#5bccac';ctx.fillRect(x(gen.recoveryTick),left,w-30-x(gen.recoveryTick),28)}
  ctx.fillStyle='#dceefa';ctx.fillText('Trip '+(gen.tripTick??'none')+'  /  Recovery '+(gen.recoveryTick??'none')+'  /  Terminal memory '+(gen.transferable?'TRANSFER':'BLOCK'),30,right+22);
 }
}
function render(){
 const c=locked||config();$('v29-progress').textContent=stages.length+'/'+c.count+' · '+ledger.length+'/'+(c.count*360)+' ticks';
 $('v29-quarantines').textContent=String(stages.filter(s=>s.quarantined).length);
 $('v29-recoveries').textContent=String(stages.filter(s=>s.observationRecovered).length);
 $('v29-isolated').textContent=String(stages.filter(s=>s.quarantined&&!s.transferable).length);
 $('v29-head').textContent=head.slice(0,20)+'…';
 $('v29-log').textContent=stages.map(s=>'G'+s.generation+' · trip '+(s.tripTick??'none')+' · recovery '+(s.recoveryTick??'none')+' · '+(s.observationRecovered?'OBSERVING AGAIN':'no recovery')+' · Factory C '+s.finalVote+' · '+(s.transferable?'memory transferred':'memory isolated')).join('\n')||'No evidence yet';
 draw();
}
$('v29-run').onclick=run;$('v29-tests').onclick=tests;$('v29-audit').onclick=async()=>{const r=await verify();$('v29-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' chained records · '+r.errors.slice(0,2).join(', ')};
$('v29-tamper').onclick=tamper;$('v29-export').onclick=exportData;
['v29-generations','v29-mode','v29-trip','v29-recover','v29-intent'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy){locked=null;ledger=[];stages=[];head=SEED;render()}}));
window.PHOTON_REVERSE_QD29={canonical,geometry,model,verify,tests,run,ledger:()=>clone(ledger),generations:()=>clone(stages)};
render();
})();