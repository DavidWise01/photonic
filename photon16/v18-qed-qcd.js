/* PHOTON-16 v0.18 — QED/QCD-inspired toy arbitration, not quantum field theory.
 * Separate decision workflow: does not rewrite v0.17, optical propagation, or user intent.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),PH=window.PHOTON_TIME16.phases,N=window.PHOTON_NIBBLE15;
const clone=x=>JSON.parse(JSON.stringify(x)),zero='0'.repeat(64);
const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(v=>v.toString(16).padStart(2,'0')).join('');
let evidence=[],head=zero,busy=false,config=null;
function readConfig(){return {intent:$('v18-intent').value,domain:Number($('v18-domain').value),phase:Number($('v18-phase').value),r:Number($('v18-r').value),g:Number($('v18-g').value),b:Number($('v18-b').value)}}
function physics(c){
 // QED-inspired interference visibility: two normalized unit-amplitude field contributions.
 const phaseRadians=c.phase*Math.PI/180,coherence=(1+Math.cos(phaseRadians))/2;
 // QCD-inspired color-neutrality residual (equal-channel balancing), NOT SU(3) dynamics.
 const mean=(c.r+c.g+c.b)/3;
 const residual=Math.sqrt(((c.r-mean)**2+(c.g-mean)**2+(c.b-mean)**2)/3)/255;
 const colorNeutral=1-Math.min(1,residual);
 return {qed:{coherence:Number(coherence.toFixed(9)),threshold:0.75,passes:coherence>=0.75},qcd:{neutrality:Number(colorNeutral.toFixed(9)),threshold:0.90,passes:colorNeutral>=0.90},method:'classical interference plus RGB channel balance; no QED/QCD field equations'};
}
function expectedRecord(i,c){
 const p=PH[i],z=physics(c),addr=Array.from({length:4},(_,j)=>c.domain*16+p.nibble*4+j);
 const basics={index:i,role:p.role,side:p.side,vm:p.vm,nibble:p.nibble,tickStart:p.start,tickEnd:p.endExclusive-1,addresses:addr,intent:c.intent,domain:c.domain,signals:clone(c),observation:null,decision:null};
 if(i===0)return {...basics,observation:{type:'intent',value:c.intent}};
 if(i===1)return {...basics,observation:{type:'qed_signal',coherence:z.qed.coherence,passes:z.qed.passes}};
 if(i===2)return {...basics,observation:{type:'user_checkpoint',value:c.intent,after:'Factory A'}};
 if(i===3)return {...basics,observation:{type:'qcd_color',neutrality:z.qcd.neutrality,passes:z.qcd.passes}};
 if(i===4)return {...basics,observation:{type:'user_checkpoint',value:c.intent,after:'Factory B'}};
 const complete=Number.isFinite(z.qed.coherence)&&Number.isFinite(z.qcd.neutrality);
 return {...basics,observation:{type:'factory_c_assessment',qed:z.qed,qcd:z.qcd},decision:complete&&z.qed.passes&&z.qcd.passes?'approve':'reject'};
}
async function append(){if(busy||evidence.length>=6)return;busy=true;try{
 if(!config)config=readConfig();const row={...expectedRecord(evidence.length,config),previousHash:head};
 const digest=await hash(row);evidence.push({...row,hash:digest});head=digest;show();
 }catch(e){$('v18-status').textContent='ERROR · '+e.message}finally{busy=false}}
function reset(){if(busy)return;evidence=[];head=zero;config=null;for(const id of ['v18-intent','v18-domain','v18-phase','v18-r','v18-g','v18-b'])$(id).disabled=false;show()}
async function verify(rows=clone(evidence),claimedHead=head,c=config||readConfig()){
 const errors=[];let prev=zero;
 if(PH.length!==6||PH.reduce((s,p)=>s+(p.side==='internal'?p.length:0),0)!==144||PH.reduce((s,p)=>s+(p.side==='external'?p.length:0),0)!==216)errors.push('temporal split');
 if(rows.length>6)errors.push('too many stages');
 for(let i=0;i<rows.length;i++){
  const r=rows[i],expected=expectedRecord(i,c);
  for(const k of Object.keys(expected))if(JSON.stringify(r[k])!==JSON.stringify(expected[k]))errors.push('payload '+i+':'+k);
  if(r.previousHash!==prev)errors.push('parent '+i);
  const {hash:d,...payload}=r;if(await hash(payload)!==d)errors.push('digest '+i);
  for(const a of expected.addresses){const p=N.decode(a);if(p.vm!==expected.vm||p.nibble!==expected.nibble)errors.push('ownership '+i)}
  prev=d;
 }
 if(prev!==claimedHead)errors.push('head mismatch');
 return {ok:errors.length===0,complete:rows.length===6,turns:rows.length,errors,head:prev,physics:physics(c),result:rows.length===6?rows[5].decision:null};
}
function show(){
 const c=config||readConfig(),p=physics(c),n=evidence.length;
 $('v18-qed').textContent=(100*p.qed.coherence).toFixed(1)+'%';
 $('v18-qcd').textContent=(100*p.qcd.neutrality).toFixed(1)+'%';
 $('v18-stage').textContent=n+'/6';
 $('v18-result').textContent=n===6?(evidence[5].decision.toUpperCase()+' · Factory C'):'PENDING';
 $('v18-next').textContent=n===5?'CAST FACTORY C VOTE':n===6?'CYCLE SEALED':'RECORD '+PH[n].role;
 $('v18-next').disabled=n===6;
 $('v18-chain').textContent=head.slice(0,20)+'…';
 $('v18-log').textContent=evidence.map(r=>'T'+r.tickStart+'–'+r.tickEnd+' · '+r.role+' · '+r.observation.type+(r.decision?' · VOTE '+r.decision.toUpperCase():'')+' · '+r.hash.slice(0,12)+'…').join('\n')||'Ready to record User A intent';
 $('v18-status').textContent=n===6?'FINAL DECISION RECORDED · verify SHA-256 chain':'DECISION IN PROGRESS · no automatic vote';
 ['v18-intent','v18-domain','v18-phase','v18-r','v18-g','v18-b'].forEach(id=>$(id).disabled=n>0);
 draw(c);
}
function draw(c){
 const canvas=$('v18-canvas'),ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);ctx.fillStyle='#081321';ctx.fillRect(0,0,W,H);
 const mid=W/2,cy=H/2+4;ctx.lineWidth=2;for(let i=0;i<3;i++){const color=['#ff835b','#6be3ae','#81a6ff'][i];ctx.strokeStyle=color;ctx.beginPath();for(let x=0;x<W;x+=4){const a=x/W*Math.PI*6,phase=c.phase*Math.PI/180,amp=[c.r,c.g,c.b][i]/255;const y=cy+(i-1)*29+Math.sin(a+phase*i)*25*amp;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
 ctx.fillStyle='#d9ecfb';ctx.font='13px monospace';ctx.fillText('QED analogy: interference visibility · QCD analogy: R/G/B neutrality',16,23);
}
async function challenge(){if(!evidence.length){$('v18-status').textContent='RECORD A STAGE BEFORE CHALLENGE';return}const copyRows=clone(evidence);copyRows[0].intent=copyRows[0].intent==='approve'?'reject':'approve';const result=await verify(copyRows,head,config);$('v18-status').textContent=result.ok?'FAIL · altered record accepted':'PASS · altered record rejected: '+result.errors.slice(0,2).join(', ')}
async function scenarios(){
 const configs=[
  {intent:'approve',domain:0,phase:0,r:128,g:128,b:128,expected:'approve'},
  {intent:'approve',domain:0,phase:180,r:128,g:128,b:128,expected:'reject'},
  {intent:'approve',domain:0,phase:0,r:255,g:0,b:0,expected:'reject'},
  {intent:'reject',domain:0,phase:0,r:128,g:128,b:128,expected:'approve'}
 ];let outcomes=configs.map(c=>({expected:c.expected,actual:expectedRecord(5,c).decision}));
 const bad=outcomes.filter(x=>x.expected!==x.actual);
 $('v18-status').textContent=(bad.length?'FAIL':'PASS')+' · 4 deterministic cases · '+outcomes.map((x,i)=>['balanced','phase fault','color fault','user/factory disagreement'][i]+':'+x.actual).join(' · ');
 return {ok:!bad.length,outcomes};
}
function exportLedger(){
 const snap={schema:'PHOTON16-v18-qed-qcd-toy',model:'classical physics-inspired simulation',configuration:config||readConfig(),phases:clone(PH),records:clone(evidence),head};
 const url=URL.createObjectURL(new Blob([JSON.stringify(snap,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='photon16-v18-qed-qcd-decision.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('v18-next').onclick=append;$('v18-reset').onclick=reset;
$('v18-verify').onclick=async()=>{try{const r=await verify();$('v18-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.turns+'/6 chain'+(r.complete?' · COMPLETE':' · PARTIAL')+(r.errors.length?' · '+r.errors.slice(0,3).join(', '):'')}catch(e){$('v18-status').textContent='ERROR · '+e.message}};
$('v18-challenge').onclick=challenge;$('v18-scenarios').onclick=scenarios;$('v18-export').onclick=exportLedger;
['v18-intent','v18-domain','v18-phase','v18-r','v18-g','v18-b'].forEach(id=>$(id).addEventListener('input',show));
for(let d=0;d<96;d++){const o=document.createElement('option');o.value=d;o.textContent='Domain '+d;$('v18-domain').appendChild(o)}
window.PHOTON_QFT18={physics,expectedRecord,verify,scenarios,ledger:()=>clone(evidence),append,reset};
show();
})();