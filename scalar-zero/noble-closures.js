"use strict";
(function(){
 const $=id=>document.getElementById(id),TAU=2*Math.PI,RAD=Math.PI/180;
 const closures=[2,10,18,36,54,86,118],starts=[1,3,11,19,37,55,87];
 const authored=[
  String.raw`{{ ([h]he)((li[be]\(b[c]))((n[o]f)){neon} }}`,
  String.raw`{{(na),[mg],(al)[si])){{(p)[s]}}(cl) argon }}`
 ];
 if(CHEM_SYMBOLS.length!==118||CHEM_NAMES.length!==118||CHEM_SYMBOLS[117]!=="Og")throw Error("IUPAC 118 registry missing");
 const rings=closures.map((end,p)=>Array.from({length:end-starts[p]+1},(_,i)=>{
  const z=starts[p]+i,coord=elemAngle(z),sector=chemSector(coord);
  return{z:z,name:CHEM_NAMES[z-1],symbol:CHEM_SYMBOLS[z-1],period:p+1,index:i,length:end-starts[p]+1,
    parity:z%2?"odd":"even",shape:z%2?"toroid":"box",isNoble:z===end,coordinate:coord,sector:sector};
 }));
 if(rings.reduce((a,r)=>a+r.length,0)!==118||rings.map(r=>r.length).join(",")!=="2,8,8,18,18,32,32"||
   rings.every(r=>r[r.length-1].z%2===0)===false||rings.every(r=>r.every(n=>n.parity===(n.z%2?"odd":"even")))===false)throw Error("closure/parity invariant");
 let activePeriod=2,selected=11,spinning=true,time=0,last=0,yaw=.26,frame=0,screen=[];
 const canvas=$("world"),ctx=canvas.getContext("2d");let wd=0,ht=0,dpr=1;
 const stars=Array.from({length:210},(_,i)=>{let q=((i*131.329)%211)/211;return{x:((i*67.77)%997)/997,y:((i*217.13)%919)/919,r:.3+(i%4)*.23,phase:q*TAU}});
 function rgba(rgb,a){return "rgba("+rgb.join(",")+","+a+")"}
 function rgb(n){return chemRGB(n.coordinate).map(v=>Math.max(0,Math.min(255,Math.round(v*.89+31))))}
 function config(){return{all:$("view").value==="all",speed:+$("rotate").value,
  tube:+$("tube").value,phase:+$("phase").value*RAD,mesh:$("mesh").checked,edges:$("edges").checked,
  astral:$("stars").checked,globules:$("globules").checked}}
 function updateControls(){for(let [id,out,suffix,prec] of [["rotate","rotateValue","×",2],["phase","phaseValue","°",0],["tube","tubeValue","",2]])$(out).textContent=(+$(id).value).toFixed(prec)+suffix}
 for(const id of ["rotate","phase","tube"])$(id).addEventListener("input",updateControls);updateControls();
 function resize(){let box=canvas.getBoundingClientRect(),scale=Math.min(2,window.devicePixelRatio||1);
 if(box.width!==wd||box.height!==ht||scale!==dpr){wd=box.width;ht=box.height;dpr=scale;canvas.width=Math.max(1,Math.round(wd*scale));canvas.height=Math.max(1,Math.round(ht*scale));ctx.setTransform(scale,0,0,scale,0,0)}}
 window.addEventListener("resize",resize);resize();
 function torusPoint(a,b,R,r){return{x:(R+r*Math.cos(b))*Math.cos(a),y:(R+r*Math.cos(b))*Math.sin(a),z:r*Math.sin(b)}}
 function project(p){let a=yaw,b=-.64,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
 let x=p.x*ca+p.z*sa,z=-p.x*sa+p.z*ca;
 let y=p.y*cb-z*sb,depth=p.y*sb+z*cb;
 let scale=Math.min(wd*.45,ht*.33),factor=3.6/(3.6-depth*.16);
 return{x:wd/2+x*scale*factor,y:ht*.51+y*scale*factor,z:depth}}
 function coords(n,c){let ring=n.period-1,major=c.all?.36+ring*.202:1.15;
  let minor=c.tube*(c.all?.52:.96);
  let a=-Math.PI/2+TAU*n.index/n.length+c.phase;
  let b=(n.index*1.618+n.period*.37)%TAU;
  return project(torusPoint(a,b,major,minor))}
 function line(a,b,color,width=1,opacity=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=opacity;ctx.stroke();ctx.globalAlpha=1}
 function backdrop(c){if(!c.astral)return;for(let p of stars){let op=.35+.38*Math.sin(time*.4+p.phase);ctx.globalAlpha=op;ctx.fillStyle="#a6dbe8";ctx.fillRect(p.x*wd,p.y*ht,p.r,p.r)}ctx.globalAlpha=1}
 function meshRing(period,c){
 let major=c.all?.36+period*.202:1.15,minor=c.tube*(c.all?.52:.96);
 let wire=period===activePeriod?"#6fc6c7":"#4c7fa0",alpha=period===activePeriod?.24:.09;
 for(let i=0;i<11;i++){
  let b=TAU*i/11,last=null;
  for(let j=0;j<=72;j++){let q=project(torusPoint(TAU*j/72,b,major,minor));if(last)line(last,q,wire,.76,alpha);last=q}
 }
 for(let i=0;i<28;i++){
  let a=TAU*i/28,last=null;
  for(let j=0;j<=18;j++){let q=project(torusPoint(a,TAU*j/18,major,minor));if(last)line(last,q,wire,.65,alpha*.8);last=q}
 }
 }
 function symbolNode(n,p,c){
  const selectedNode=n.z===selected,col=rgb(n),noble=n.isNoble,focus=n.period-1===activePeriod;
  let base=noble?10:selectedNode?9:focus?6:4.2;
  let r=base*(c.all?.9:1.18);
  if(c.globules&&(noble||selectedNode)){
   let glow=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,r*3.3);
   glow.addColorStop(0,rgba(col,.55));glow.addColorStop(1,rgba(col,0));
   ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,r*3.3,0,TAU);ctx.fill()}
  ctx.shadowColor=rgba(col,.9);ctx.shadowBlur=noble?19:selectedNode?20:6;
  ctx.fillStyle=rgba(col,1);ctx.strokeStyle=selectedNode?"#ffffff":noble?"#ffe3ac":"#b9d3da";
  ctx.lineWidth=noble?2.2:selectedNode?2.6:1;
  if(n.parity==="odd"){
   ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
   ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1.9,r*.40),0,TAU);ctx.fillStyle="#081a28";ctx.fill();ctx.strokeStyle=rgba(col,.85);ctx.lineWidth=.65;ctx.stroke();
  }else{
   ctx.beginPath();ctx.rect(p.x-r,p.y-r,r*2,r*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
   if(noble){ctx.strokeStyle="#ffe0a9";ctx.lineWidth=1;ctx.strokeRect(p.x-r*.55,p.y-r*.55,r*1.1,r*1.1)}}
  if(selectedNode||noble||(!c.all&&focus)){
   ctx.font=selectedNode?"bold 13px ui-monospace,monospace":"11px ui-monospace,monospace";
   ctx.fillStyle=selectedNode?"#ffffff":"#c2e0eb";
   ctx.fillText(n.symbol,p.x+r+4,p.y-r-4)}
 }
 function render(){
  resize();if(wd<1||ht<1)return;let c=config();ctx.clearRect(0,0,wd,ht);backdrop(c);
  if(c.mesh)for(let i=0;i<7;i++)if(c.all||i===activePeriod)meshRing(i,c);
  let zero=project({x:0,y:0,z:0});
  ctx.beginPath();ctx.arc(zero.x,zero.y,6,0,TAU);ctx.fillStyle="#ebfffe";ctx.shadowColor="#fff";ctx.shadowBlur=16;ctx.fill();ctx.shadowBlur=0;
  ctx.font="11px ui-monospace,monospace";ctx.fillStyle="#cbf9e7";ctx.fillText("D : 0",zero.x+11,zero.y-10);
  let visible=rings.filter((r,i)=>c.all||i===activePeriod),nodelist=[];
  for(let ring of visible){
   let positions=ring.map(n=>({n,p:coords(n,c)}));
   if(c.edges){
    for(let i=0;i<positions.length-1;i++){
     const n=positions[i].n,op=ring[0].period-1===activePeriod?.88:.32;
     line(positions[i].p,positions[i+1].p,rgba(rgb(n),1),1.55,op)}
    let noble=positions[positions.length-1];line(noble.p,zero,"#ffcb7d",1.25,ring[0].period-1===activePeriod?.44:.16);
   }
   nodelist.push(...positions);
  }
  screen=nodelist;
  nodelist.sort((a,b)=>a.p.z-b.p.z).forEach(({n,p})=>symbolNode(n,p,c));
  ctx.font="11px ui-monospace,monospace";ctx.fillStyle="#8cabb9";
  ctx.fillText(c.all?"SEVEN RINGS · 118 GLYPHS":"RING "+(activePeriod+1)+" · "+rings[activePeriod].length+" GLYPHS",16,ht-17);
 }
 function grammar(r){return "{{ "+r.map(n=>n.parity==="odd"?"("+n.symbol+")":"["+n.symbol+"]").join(" ")+" }}"}
 function updateInspector(){
  let n=rings.flat().find(a=>a.z===selected),end=rings[activePeriod].at(-1);
  if(!n)return;
  $("element").textContent=n.z+" · "+n.symbol;$("elementName").textContent=n.name;
  $("shape").textContent=n.parity.toUpperCase()+" · "+n.shape.toUpperCase();
  $("closure").textContent=n.period+" / "+rings[n.period-1].at(-1).symbol;
  $("electrons").textContent=n.z;
  $("sector").textContent=n.sector.key+" · "+n.sector.k;
  $("elementNote").textContent=n.isNoble?"Group-18 terminal / model box lid; "+(n.z===118?"Og properties not fully measured.":"period closure."):"Atomic-number parity determines the glyph; element chemistry does not imply a literal torus or box.";
  $("ringLabel").textContent=starts[activePeriod]+"–"+closures[activePeriod]+" → "+end.symbol;
  $("ringCount").textContent=rings[activePeriod].length.toString();
  $("ringEdges").textContent=(rings[activePeriod].length-1)+" straight edges";
  $("canonical").textContent=grammar(rings[activePeriod]);
  $("authored").textContent=activePeriod<2?authored[activePeriod]:"— Not provided. Generated parity grammar is above.";
  for(let button of document.querySelectorAll("#ringButtons button"))button.classList.toggle("active",+button.dataset.period===activePeriod);
  for(let button of document.querySelectorAll("#sequence button"))button.classList.toggle("selected",+button.dataset.z===selected);
  $("state").textContent=(spinning?"LIVE":"PAUSED")+" / "+($("view").value==="all"?"ALL PERIODS":"SINGLE RING");
 }
 function setPeriod(p){
  activePeriod=(p+7)%7;
  selected=rings[activePeriod][0].z;
  renderSequence();updateInspector();
 }
 function setElement(z){let found=rings.findIndex(r=>r.some(n=>n.z===z));if(found<0)return;
  if(activePeriod!==found){activePeriod=found;renderSequence()}
  selected=z;updateInspector()}
 function renderSequence(){
  let el=$("sequence");el.textContent="";
  for(let n of rings[activePeriod]){
   let b=document.createElement("button");b.type="button";b.dataset.z=n.z;
   b.className=(n.parity==="odd"?"odd":"even")+(n.isNoble?" noble":"");
   b.title=n.name+" · Z "+n.z;
   b.textContent=n.parity==="odd"?"("+n.symbol+")":"["+n.symbol+"]";
   b.style.borderColor=rgba(rgb(n),.8);
   b.addEventListener("click",()=>setElement(n.z));el.appendChild(b)
  }}
 function renderTabs(){
  let el=$("ringButtons");el.textContent="";
  for(let p=0;p<7;p++){
   let b=document.createElement("button");b.type="button";b.dataset.period=p;
   let n=rings[p].at(-1);
   let top=document.createElement("b"),below=document.createElement("small");
   top.textContent="□ "+n.symbol;below.textContent="Z "+n.z+" · "+rings[p].length+" cells";
   b.append(top,below);b.addEventListener("click",()=>setPeriod(p));el.appendChild(b)
  }}
 canvas.addEventListener("click",ev=>{
  let r=canvas.getBoundingClientRect(),mx=ev.clientX-r.left,my=ev.clientY-r.top;
  let best=null,d=21*21;
  for(let x of screen){let q=(mx-x.p.x)**2+(my-x.p.y)**2;if(q<d){d=q;best=x.n}}
  if(best)setElement(best.z)});
 let drag=null;
 canvas.addEventListener("pointerdown",e=>{drag={start:e.clientX,angle:yaw};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener("pointermove",e=>{if(drag)yaw=drag.angle+(e.clientX-drag.start)*.007});
 canvas.addEventListener("pointerup",()=>drag=null);canvas.addEventListener("pointercancel",()=>drag=null);
 $("view").addEventListener("change",updateInspector);
 $("pause").addEventListener("click",()=>{spinning=!spinning;$("pause").textContent=spinning?"Ⅱ PAUSE":"▶ RESUME";updateInspector()});
 $("next").addEventListener("click",()=>setPeriod(activePeriod+1));
 $("reset").addEventListener("click",()=>{yaw=.26;time=0;spinning=true;$("pause").textContent="Ⅱ PAUSE";$("view").value="all";setPeriod(0)});
 $("copy").addEventListener("click",async()=>{const content=$("canonical").textContent;
  try{await navigator.clipboard.writeText(content);$("copy").textContent="COPIED"}catch(_){$("copy").textContent="SELECT TEXT"}
 });
 $("export").addEventListener("click",()=>{
  const obj={title:"ROOT0 · GEN5 Noble-Gas Closures",schema:"root0-noble-closures-v1",source:"IUPAC elements 1–118",
   rule:"odd Z -> toroid; even Z -> box; each noble gas closes the period",ground:"D = scalar-zero coordinate reference",
   color:"ROOT0 symbolic H/O/N sectors, not element emission spectrum",
   sourceGrammar:{period2_H_Ne:authored[0],period3_Na_Ar:authored[1]},
   rings:rings.map((r,i)=>({period:i+1,range:[starts[i],closures[i]],closure:r.at(-1).symbol,ascii:grammar(r),elements:r})),
   selectedElement:selected,exportedAt:new Date().toISOString(),physicsBoundary:"geometric visualization, not atom structure or string-theory evidence"};
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  let u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="ROOT0_GEN5_7_NOBLE_CLOSURES.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)});
 function loop(now){
  if(last&&spinning){let dt=Math.min(.05,(now-last)/1000);time+=dt;yaw+=dt*config().speed*.18}
  last=now;render();requestAnimationFrame(loop)}
 function tellParent(){if(window.parent!==window){
  window.parent.postMessage({kind:"root0-noble-height",height:document.body.scrollHeight},"*")}}
 if(typeof ResizeObserver==="function")new ResizeObserver(tellParent).observe(document.body);
 window.addEventListener("resize",tellParent);
 renderTabs();setPeriod(2);tellParent();requestAnimationFrame(loop);
})();
