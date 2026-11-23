/* PHOTON-16 v0.32 — temporal 8×10 perception lattice.
   360 logical ticks, 144 User A and 216 Factory A/B/C ticks.
   Model-only HSL visualization; not quantum-dot hardware or human color calibration.
   The convergence point is a reference to retained per-port manifests. */
(()=>{'use strict';
const $=id=>document.getElementById(id),P=window.PHOTON_PERCEPT31,E=window.PHOTON_EIGHT30;
const CANON='[96/24/12/4] / 3 / 3 / 1 / 1 > 2^3 > 1 > .';
const phases=[
 {start:0,end:48,role:'User A',side:'internal'},
 {start:48,end:120,role:'Factory A',side:'external'},
 {start:120,end:168,role:'User A',side:'internal'},
 {start:168,end:240,role:'Factory B',side:'external'},
 {start:240,end:288,role:'User A',side:'internal'},
 {start:288,end:360,role:'Factory C',side:'external'}
];
const clone=x=>JSON.parse(JSON.stringify(x)),hex=buf=>Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('');
const sha=async data=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data))));
const ZERO='0'.repeat(64);
let tick=0,play=false,handle=null,frames=[],head=ZERO,buildBusy=false;
const delay=()=>new Promise(resolve=>setTimeout(resolve,0));
function phaseOf(t){return phases.find(p=>t>=p.start&&t<p.end)}
function snapshot(t){
 if(!Number.isInteger(t)||t<0||t>=360)throw Error('tick out of range');
 const portSteps=Array.from({length:8},(_,port)=>(Math.floor(t/36)+port)%10);
 const embedded=P.encode(portSteps);
 return {tick:t,phase:phaseOf(t).role,side:phaseOf(t).side,
  steps:portSteps,point:embedded.checksum,parity:embedded.parity,
  manifest:embedded.manifest.map(s=>({address:s.address,port:s.port,step:s.step,family:s.family,
   hue:s.hue,tone:s.tone,temperature:s.temperature,shade:s.shade,shadow:s.shadow,
   perception:s.perception,hsl:s.hsl}))};
}
function construct(){return Array.from({length:360},(_,i)=>snapshot(i))}
function invariantTests(){
 const seq=construct(),checks=[];
 const add=(name,pass)=>checks.push({name,pass:!!pass});
 add('360 distinct time addresses',seq.length===360&&new Set(seq.map(s=>s.tick)).size===360);
 add('all 8 ports uniquely identified at every tick',seq.every(s=>s.manifest.length===8&&new Set(s.manifest.map(p=>p.address)).size===8));
 add('every port visits 10 states 36 ticks each',Array.from({length:8},(_,p)=>Array.from({length:10},(_,n)=>seq.filter(s=>s.steps[p]===n).length===36).every(Boolean)).every(Boolean));
 add('80 distinct port+percept combinations',new Set(seq.flatMap(s=>s.manifest.map(p=>p.address+':'+p.step))).size===80);
 add('144 internal / 216 external ticks',seq.filter(s=>s.side==='internal').length===144&&seq.filter(s=>s.side==='external').length===216);
 add('6 stage boundaries and Factory C final phase',phases.length===6&&seq[359].phase==='Factory C'&&phases.reduce((n,p)=>n+(p.end-p.start),0)===360);
 add('all manifest points decode reversibly',seq.every(s=>{const e=P.encode(s.steps);return JSON.stringify(P.decode(e).steps)===JSON.stringify(s.steps)&&e.checksum===s.point&&e.parity===s.parity}));
 add('point alone does not disclose 8 port values',!('steps' in E.encode(seq[0].steps).point));
 add('no state address mutated across neighboring ticks',seq.every(s=>s.manifest.every((p,i)=>p.address===i.toString(2).padStart(3,'0'))));
 add('canonical reverse-QD chain retained',P.topology===CANON);
 return {ok:checks.every(x=>x.pass),passed:checks.filter(x=>x.pass).length,checks};
}
function draw(t){
 tick=t;$('v32-scrub').value=String(t);
 const s=snapshot(t),ctx=$('v32-canvas').getContext('2d'),cv=$('v32-canvas'),w=cv.width,h=cv.height;
 ctx.fillStyle='#081521';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#e0efff';ctx.font='15px monospace';ctx.fillText('8 PORTS × 10 PERCEPT STATES × 360 TICKS',22,27);
 ctx.font='12px monospace';ctx.fillText(s.phase.toUpperCase()+' · '+s.side.toUpperCase()+' · TICK '+t,22,49);
 // 8 rows, ten percept cells per row with highlighted active state.
 const ox=170,oy=70,cw=92,ch=24;
 for(let p=0;p<8;p++){
  ctx.font='12px monospace';ctx.fillStyle='#e4f2ff';ctx.fillText(s.manifest[p].address+' '+s.manifest[p].family,14,oy+p*ch+17);
  for(let n=0;n<10;n++){
   const st=P.state(p,n),x=ox+cw*n,y=oy+ch*p;
   ctx.fillStyle=st.css;ctx.fillRect(x,y,cw-5,ch-2);
   if(n===s.steps[p]){ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.strokeRect(x+1,y+1,cw-7,ch-4)}
   ctx.fillStyle=st.hsl[2]>50?'#06202a':'#ffffff';ctx.font='11px monospace';ctx.fillText(String(n),x+7,y+16);
  }
 }
 ctx.fillStyle='#ad92ff';ctx.beginPath();ctx.arc(615,330,30,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#081521';ctx.font='17px monospace';ctx.fillText('1',610,336);
 ctx.strokeStyle='#ffa96a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(646,330);ctx.lineTo(890,330);ctx.stroke();
 ctx.fillStyle='#ffa96a';ctx.beginPath();ctx.arc(903,330,7,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#dbeafb';ctx.font='12px monospace';ctx.fillText('Manifest checksum '+s.point+'  |  XOR parity '+s.parity+'  |  8 original port identities retained',20,391);
 // Clock strip shows 2/5 internal vs 3/5 external as six contiguous phases.
 const sy=427,sw=(w-42)/360;
 for(const p of phases){ctx.fillStyle=p.side==='internal'?'#57dfca':'#df945f';ctx.fillRect(20+p.start*sw,sy,(p.end-p.start)*sw-2,19)}
 ctx.fillStyle='#f2f6fc';ctx.fillRect(20+t*sw-1,sy-7,3,32);
 ctx.fillStyle='#ceddec';ctx.font='11px monospace';ctx.fillText('USER A (144 ticks) / FACTORIES A, B, C (216 ticks) — 6-stage diodic clock',20,470);
 $('v32-tick').textContent=t+' / 359';
 $('v32-phase').textContent=s.phase;
 $('v32-point').textContent=String(s.point);
 $('v32-head').textContent=head.slice(0,18)+'…';
 $('v32-states').textContent=s.manifest.map(p=>p.address+':'+p.step).join(' | ');
}
function step(){if(tick>=359){pause();return}draw(tick+1)}
function pause(){play=false;if(handle!==null)clearInterval(handle);handle=null;$('v32-play').textContent='PLAY'}
function start(){if(play){pause();return}if(tick>=359)draw(0);play=true;$('v32-play').textContent='PAUSE';handle=setInterval(step,Math.max(25,Number($('v32-speed').value)))}
function reset(){pause();draw(0)}
async function build(){
 if(buildBusy)return;buildBusy=true;$('v32-build').disabled=true;$('v32-status').textContent='HASHING 360 TICKS…';
 frames=[];head=ZERO;
 try{
  const seq=construct();
  for(let i=0;i<seq.length;i++){
   const payload={...seq[i],previousHash:head},digest=await sha(payload);
   frames.push({...payload,hash:digest});head=digest;
   if(i%36===35){$('v32-status').textContent='HASHED '+(i+1)+'/360 TICKS';await delay()}
  }
  const result=await verify();
  $('v32-status').textContent=(result.ok?'PASS':'FAIL')+' · '+result.checked+'/360 chained ticks'+(result.errors.length?' · '+result.errors.slice(0,2).join(', '):'');
  draw(tick);
 }catch(e){$('v32-status').textContent='ERROR · '+e.message}finally{buildBusy=false;$('v32-build').disabled=false}
}
async function verify(candidate=clone(frames),claimedHead=head){
 const expected=construct(),errors=[];let parent=ZERO;
 if(candidate.length!==360)errors.push('missing or extra observations');
 for(let i=0;i<candidate.length;i++){
  const row=candidate[i],target=expected[i];if(!target){errors.push('unexpected tick '+i);break}
  for(const k of Object.keys(target))if(JSON.stringify(row[k])!==JSON.stringify(target[k]))errors.push('observation mismatch '+i+':'+k);
  if(row.previousHash!==parent)errors.push('parent mismatch '+i);
  const {hash:h,...payload}=row;if(await sha(payload)!==h)errors.push('digest mismatch '+i);
  parent=h;
 }
 if(parent!==claimedHead)errors.push('chain head mismatch');
 return {ok:errors.length===0,checked:candidate.length,errors};
}
function tests(){const r=invariantTests();$('v32-tests-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.passed+'/'+r.checks.length+' invariants · '+r.checks.map(x=>(x.pass?'✓':'✗')+' '+x.name).join(' | ');return r}
async function tamper(){if(frames.length!==360){$('v32-status').textContent='BUILD LEDGER FIRST';return}
 const altered=clone(frames);altered[180].manifest[3].step=(altered[180].manifest[3].step+1)%10;
 const r=await verify(altered,head);$('v32-status').textContent=r.ok?'FAIL · tampered state accepted':'PASS · altered percept state detected';
}
function exportData(){
 const data={schema:'PHOTON16-v32-temporal-perception',topology:CANON,classicalDisplayModel:true,clock:phases,
   records:clone(frames),head,tests:invariantTests()};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download='photon16-v32-temporal-perception.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('v32-play').onclick=start;$('v32-reset').onclick=reset;$('v32-step').onclick=()=>{pause();step()};
$('v32-scrub').oninput=v=>{pause();draw(Number(v.target.value))};
$('v32-speed').onchange=()=>{if(play){pause();start()}};
$('v32-tests').onclick=tests;$('v32-build').onclick=build;
$('v32-verify').onclick=async()=>{const r=await verify();$('v32-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checked+' records'+(r.errors.length?' · '+r.errors.slice(0,2).join(', '):'')};
$('v32-tamper').onclick=tamper;$('v32-export').onclick=exportData;
window.PHOTON_TIME32={phases,snapshot,construct,invariantTests,verify,build,frames:()=>clone(frames)};
draw(0);
})();