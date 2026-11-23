/* PHOTON-16 v0.31 · 8 port colors × 10 perceptual states
 * An explicitly modeled display-color atlas, not a physical spectrum/QED/QCD result.
 * v0.30's manifest/parity method remains the reversible point reference.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),E=window.PHOTON_EIGHT30;
const FAMILIES=[
 {name:'RED',h:0},{name:'ORANGE',h:30},{name:'YELLOW',h:55},
 {name:'GREEN',h:130},{name:'CYAN',h:185},{name:'BLUE',h:222},
 {name:'PURPLE',h:275},{name:'MAGENTA',h:325}
];
const LEVELS=[
 {name:'Hue seed',tone:0,temperature:0,shade:0,shadow:0,perception:'identity'},
 {name:'Faint tone',tone:-.18,temperature:0,shade:0,shadow:0,perception:'threshold'},
 {name:'Light tone',tone:.17,temperature:0,shade:0,shadow:0,perception:'illumination'},
 {name:'Temperature lean',tone:0,temperature:1,shade:0,shadow:0,perception:'thermal contrast'},
 {name:'Balanced field',tone:.07,temperature:0,shade:.04,shadow:0,perception:'equilibrium'},
 {name:'Full chroma',tone:.03,temperature:0,shade:0,shadow:0,perception:'saturation'},
 {name:'Deep tone',tone:-.10,temperature:0,shade:.16,shadow:0,perception:'depth'},
 {name:'Shaded',tone:-.06,temperature:0,shade:.30,shadow:.03,perception:'attenuation'},
 {name:'Shadowed',tone:-.12,temperature:-1,shade:.32,shadow:.19,perception:'enclosure'},
 {name:'Perceptual extreme',tone:.10,temperature:1,shade:.08,shadow:.07,perception:'emergence'}
];
const topology='[96/24/12/4] / 3 / 3 / 1 / 1 > 2^3 > 1 > .';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=v=>Number(v.toFixed(3));
function state(port,step){
 if(!Number.isInteger(port)||port<0||port>=8||!Number.isInteger(step)||step<0||step>9)throw Error('invalid port/step');
 const family=FAMILIES[port],level=LEVELS[step];
 const temperature=level.temperature*(port%2===0?8:-8);
 const hue=(family.h+temperature+360)%360;
 const saturation=clamp(82-level.shade*70+(step===5?13:0),10,100);
 const lightness=clamp(53+level.tone*100-level.shade*38-level.shadow*45,6,94);
 return {address:port.toString(2).padStart(3,'0'),port,step,key:port+':'+step,
  family:family.name,kind:level.name,hue:round(hue),tone:level.tone,
  temperature:round(temperature),shade:level.shade,shadow:level.shadow,
  perception:level.perception,hsl:[round(hue),round(saturation),round(lightness)],
  css:'hsl('+round(hue)+' '+round(saturation)+'% '+round(lightness)+'%)'};
}
function atlas(){return Array.from({length:8},(_,p)=>Array.from({length:10},(_,s)=>state(p,s))).flat()}
function encode(steps){
 if(!Array.isArray(steps)||steps.length!==8||steps.some(x=>!Number.isInteger(x)||x<0||x>9))throw Error('exactly eight 0–9 percept steps required');
 const packet=E.encode(steps);return {topology,portSteps:steps.slice(),
  manifest:steps.map((step,port)=>state(port,step)),
  point:packet.point,parity:packet.parity,checksum:packet.checksum,packet};
}
function decode(snapshot,erased=null){
 if(!snapshot||!snapshot.packet)throw Error('missing manifest');
 const restored=E.recover(snapshot.packet,erased);
 const steps=restored.values;
 const baseline=encode(steps);
 if(baseline.checksum!==snapshot.checksum||baseline.parity!==snapshot.parity)throw Error('point mismatch');
 if(snapshot.portSteps.some((v,i)=>v!==steps[i]))throw Error('manifest mismatch');
 return {steps,manifest:baseline.manifest,restored:erased!==null,point:baseline.point};
}
function tests(){
 const all=atlas(),keys=new Set(all.map(s=>s.key)),steps=[0,1,2,3,4,5,6,9],packet=encode(steps);
 const checks=[
  ['80 distinct port:step addresses',all.length===80&&keys.size===80],
  ['8 fixed color-family identities',new Set(all.map(s=>s.family)).size===8&&all.every(s=>FAMILIES[s.port].name===s.family)],
  ['10 named, ordered percept conditions',LEVELS.length===10&&all.every(s=>s.kind===LEVELS[s.step].name)],
  ['6 grounded channels for each state',all.every(s=>['hue','tone','temperature','shade','shadow','perception'].every(k=>s[k]!==undefined))],
  ['80 display colors with valid HSL bounds',all.every(s=>s.hsl[0]>=0&&s.hsl[0]<360&&s.hsl[1]>=0&&s.hsl[1]<=100&&s.hsl[2]>=0&&s.hsl[2]<=100)],
  ['8-port manifest roundtrip',JSON.stringify(decode(packet).steps)===JSON.stringify(steps)],
  ['single port erasure recovered across all 8',Array.from({length:8},(_,port)=>{const erased=structuredErasure(packet,port);return JSON.stringify(decode(erased,port).steps)===JSON.stringify(steps)}).every(Boolean)],
  ['two erasures rejected',(()=>{try{const a=structuredErasure(packet,2);const b=structuredErasure(a,5);decode(b,2);return false}catch{return true}})()],
  ['point alone cannot decode states',!packet.point.manifest&&!packet.point.portSteps],
  ['canonical reverse-QD geometry preserved',topology===E.topology]
 ];
 return {ok:checks.every(x=>x[1]),passed:checks.filter(x=>x[1]).length,total:checks.length,checks};
}
function structuredErasure(snapshot,port){
 const result=JSON.parse(JSON.stringify(snapshot));result.packet.lanes[port].value=null;return result;
}
function selection(){return Array.from({length:8},(_,i)=>Number($('v31-select-'+i).value))}
function draw(){
 const selected=selection(),states=atlas(),packet=encode(selected);
 const c=$('v31-canvas'),ctx=c.getContext('2d'),W=c.width,H=c.height;
 ctx.fillStyle='#081522';ctx.fillRect(0,0,W,H);
 const x0=165,y0=38,dx=96,dy=26;
 ctx.font='13px monospace';ctx.textAlign='left';ctx.fillStyle='#deefff';ctx.fillText('PERCEPT ATLAS  ·  8 FIXED PORT IDENTITIES × 10 HUE/TONE/TEMP/SHADE/SHADOW/PERCEPTION STATES',15,19);
 for(let p=0;p<8;p++){
  ctx.fillStyle='#d7edfc';ctx.font='12px monospace';ctx.fillText(p.toString(2).padStart(3,'0')+' '+FAMILIES[p].name,8,y0+p*dy+17);
  for(let s=0;s<10;s++){
   const st=states[p*10+s],x=x0+s*dx,y=y0+p*dy;
   ctx.fillStyle=st.css;ctx.fillRect(x,y,dx-5,dy-3);
   if(selected[p]===s){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,dx-7,dy-5)}
   ctx.font='11px monospace';ctx.fillStyle=st.hsl[2]>50?'#071522':'#ffffff';ctx.fillText(String(s),x+5,y+17);
  }
 }
 const by=286;ctx.fillStyle='#d6e6fa';ctx.font='13px monospace';ctx.fillText('2³ ports → 1 manifest index → .  |  manifest preserved outside the point',14,by);
 ctx.fillText('Current point checksum: '+packet.checksum+'   XOR parity: '+packet.parity+'   8/8 port identities retained',14,by+23);
 $('v31-selected').textContent=selected.map((s,i)=>i.toString(2).padStart(3,'0')+':'+s).join(' | ');
 $('v31-point').textContent=String(packet.checksum);
 $('v31-parity').textContent=packet.parity.toString(16).padStart(2,'0').toUpperCase();
 $('v31-description').textContent=LEVELS.map((x,i)=>i+' '+x.name).join('  ·  ');
 $('v31-status').textContent='READY · 80 unique semantic addresses · all 8 port steps stored in a reversible manifest';
}
function exportJson(){
 const obj={schema:'PHOTON16-v31-color-percept-atlas',topology,model:'classical display HSL analogy',atlas:atlas(),selected:encode(selection()),tests:tests()};
 const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download='photon16-v31-percept-atlas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
for(let i=0;i<8;i++){const s=$('v31-select-'+i);for(let step=0;step<10;step++){const o=document.createElement('option');o.value=step;o.textContent=step+' '+LEVELS[step].name;s.appendChild(o)}s.value=String(i%10);s.onchange=draw}
$('v31-tests').onclick=()=>{const r=tests();$('v31-test-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.passed+'/'+r.total+' tests · '+r.checks.map(([n,p])=>(p?'✓ ':'✗ ')+n).join(' | ')};
$('v31-export').onclick=exportJson;
window.PHOTON_PERCEPT31={topology,FAMILIES,LEVELS,state,atlas,encode,decode,tests};
draw();
})();