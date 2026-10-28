"use strict";
(function(){
 const $=id=>document.getElementById(id),TAU=Math.PI*2;
 const core=window.ROOT0_PINWHEEL_366;
 if(!core||core.capacity!==366)throw Error("OASIS HON v9.4 pinwheel source adapter missing");
 const canvas=$("wheel"),ctx=canvas.getContext("2d");
 let diskRotation=0,drag=null,skipClick=false;
 let address=366,phase=0,strength="S",operators=[],running=true,last=0,opsUI=[],dpr=1,w=0,h=0,hit={cx:0,cy:0,inner:0,outer:0,angle:0};
 const sourceColors=Array.from({length:366},(_,i)=>core.colorAt(i+1,"S"));
 const starPositions=Array.from({length:145},(_,i)=>({x:((i*73.271)%977)/977,y:((i*231.119)%991)/991,r:.3+(i%4)*.2}));
 function state(){return core.colorAt(address,strength,operators)}
 function currentTick(){return(Math.floor(phase)%732+732)%732}
 function scanState(){const t=currentTick();return{tick:t,address:Math.floor(t/2)+1,polarity:t%2===0?"−":"+",angle:t/732*360}}
 function updateReads(){
  const base=core.colorAt(address,"S"),current=state(),scan=scanState();
  $("addrOut").textContent=String(address).padStart(3,"0");
  $("address").value=address;
  $("selectedName").textContent=String(address).padStart(3,"0")+" · "+current.rootSymbol;
  $("description").textContent=current.rootName+" · local "+current.localAddress+"/122"+(current.lid?" · N LID / STITCH":"");
  $("swatch").style.background=current.hex;
  $("hex").textContent=current.hex+(operators.length?" (transformed)":"");
  $("hue").textContent=current.hue.toFixed(3)+"°"+(operators.length?" · root "+base.hue.toFixed(3)+"°":"");
  $("local").textContent=current.rootSymbol+" / "+String(current.localAddress).padStart(3,"0");
  $("polarity").textContent=scan.polarity+" · "+(scan.tick+1)+"/732";
  $("tickOut").textContent=scan.tick+" / 731";
  $("tick").value=scan.tick;
  $("mode").textContent=running?"LIVE":"PAUSED";
  for(const b of document.querySelectorAll("[data-strength]"))b.setAttribute("aria-pressed",String(b.dataset.strength===strength));
  for(const b of opsUI)b.setAttribute("aria-pressed",String(operators.includes(b.dataset.operant)));
  $("opChain").textContent=operators.length?operators.map((v,i)=>(i+1)+" "+v).join(" → "):"Original source colors · no operants";
 }
 function sendAddress(){
  if(window.parent!==window)window.parent.postMessage({kind:"root0-pinwheel-select",address:address},"*");
 }
 function sendTick(){
  if(window.parent!==window)window.parent.postMessage({kind:"root0-pinwheel-tick",tick:currentTick()},"*");
 }
 function pickAddress(n,notify=true){const a=Math.round(+n);if(!Number.isInteger(a)||a<1||a>366)return;
  address=a;updateReads();if(notify)sendAddress()}
 function seekTick(n,notify=true){const t=Math.round(+n);if(!Number.isInteger(t)||t<0||t>=732)return;
  phase=t;running=false;$("pause").textContent="▶ RESUME";updateReads();if(notify)sendTick()}
 $("address").addEventListener("input",()=>pickAddress($("address").value));
 $("tick").addEventListener("input",()=>seekTick($("tick").value));
 $("speed").addEventListener("input",()=>$("speedOut").textContent=$("speed").value);
 $("tilt").addEventListener("input",()=>$("tiltOut").textContent=$("tilt").value+"°");
 $("viewMode").addEventListener("change",()=>{canvas.style.touchAction=$("viewMode").value==="disk"?"none":"pan-y"});
 canvas.style.touchAction="none";
 $("pause").addEventListener("click",()=>{running=!running;$("pause").textContent=running?"Ⅱ PAUSE":"▶ RESUME";updateReads()});
 $("step").addEventListener("click",()=>seekTick((currentTick()+1)%732));
 $("reset").addEventListener("click",()=>{running=false;phase=0;operators=[];strength="S";diskRotation=0;pickAddress(1);$("pause").textContent="▶ RESUME";updateReads();sendTick()});
 for(const b of document.querySelectorAll("[data-strength]"))b.addEventListener("click",()=>{
  strength=b.dataset.strength;updateReads()});
 core.operants.forEach(op=>{
  const b=document.createElement("button");b.type="button";b.dataset.operant=op;b.textContent=op[0].toUpperCase()+op.slice(1);
  b.title="Append "+op+" as display-only operant (maximum five)";
  b.addEventListener("click",()=>{if(operators.length>=5)return;operators.push(op);updateReads()});
  $("ops").appendChild(b);opsUI.push(b)});
 $("clearOps").addEventListener("click",()=>{operators=[];updateReads()});
 for(const b of document.querySelectorAll("[data-root]"))b.addEventListener("click",()=>{
  const root=core.roots.find(x=>x.symbol===b.dataset.root);if(root)pickAddress(root.start)});
 $("export").addEventListener("click",()=>{
  const payload={title:"ROOT0 GEN9 · OASIS v9.4 366-color pinwheel",schema:"root0-gen9-hon366",
   source:{repo:"DavidWise01/oasis",path:"n184/elemental-hon-color-operants-v94/hon_core.mjs",
    legacy:"apps/i-color-370/index.html",preservesFourExtraColors:true},
   capacity:366,roots:core.roots,sourceStrengths:core.tiers,
   sourceColors:sourceColors.map(c=>({address:c.address,hex:c.hex,hue:c.hue,root:c.rootSymbol,local:c.localAddress,lid:c.lid})),
   selected:address,strength,appliedOperants:operators.slice(),selectedTransformed:state(),
   displayGeometry:{mode:$("viewMode").value,tiltDegrees:+$("tilt").value,halo:$("halo").checked,schematic:true},
   gen8:{registers:366,phases:732,sourceVsAxialTerminalMeaningKeptDistinct:true},
   exportedAt:new Date().toISOString(),boundary:"symbolic carrier hues, not atomic emission data"};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ROOT0_OASIS_HON_366_PINWHEEL_GEN9.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 function resize(){const box=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);
  if(w!==box.width||h!==box.height||dpr!==d){w=box.width;h=box.height;dpr=d;canvas.width=Math.max(1,Math.round(w*d));canvas.height=Math.max(1,Math.round(h*d));ctx.setTransform(d,0,0,d,0,0)}}
 function segment(a,b,cx,cy,inner,outer,color,alpha=1){
  ctx.beginPath();ctx.arc(cx,cy,outer,a,b);ctx.arc(cx,cy,inner,b,a,true);ctx.closePath();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fill();ctx.globalAlpha=1;
 }

 function renderAccretion(){
  resize();if(w<1||h<1)return;
  const cx=w*.50,cy=h*.515,outer=Math.min(w*.426,h*.685),inner=outer*.34;
  const tilt=+$("tilt").value,flatten=Math.max(.07,Math.cos(tilt*Math.PI/180));
  const offset=currentTick()/732*TAU-Math.PI/2+diskRotation;
  const polar=(radius,angle)=>({x:cx+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius*flatten});
  const drawArc=(radius,from,to,color,width,opacity)=>{
    ctx.beginPath();
    for(let k=0;k<=88;k++){const angle=from+(to-from)*k/88,p=polar(radius,angle);if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=opacity;ctx.stroke();ctx.globalAlpha=1;
  };
  hit={cx,cy,inner,outer,angle:offset,tiltY:flatten};
  ctx.clearRect(0,0,w,h);
  for(let i=0;i<starPositions.length;i++){
   const p=starPositions[i];ctx.fillStyle=i%7===0?"#b9d7e364":"#80a6c02e";ctx.fillRect(p.x*w,p.y*h,p.r,p.r);
  }
  // Soft extended accretion glow; the ring colors themselves remain the precise
  // OASIS v9.4 366-address HSV values, with only separate lighting overlays.
  if($("halo").checked){
    ctx.save();ctx.translate(cx,cy);ctx.scale(1,flatten);
    let glow=ctx.createRadialGradient(0,0,inner*.69,0,0,outer*1.17);
    glow.addColorStop(0,"#07121e00");glow.addColorStop(.42,"#266c8050");
    glow.addColorStop(.74,"#72b0c932");glow.addColorStop(1,"#0b253000");
    ctx.beginPath();ctx.arc(0,0,outer*1.19,0,TAU);ctx.fillStyle=glow;ctx.fill();ctx.restore();
    // Lensing-style arch is artistic, not a Schwarzschild null-geodesic solution.
    const haloH=Math.max(16,inner*flatten*1.65);
    ctx.beginPath();ctx.ellipse(cx,cy-4,inner*1.11,haloH,0,Math.PI*1.09,Math.PI*1.93);
    ctx.strokeStyle="#b6eaff6f";ctx.lineWidth=3.2;ctx.shadowBlur=17;ctx.shadowColor="#8cc6ff";ctx.stroke();ctx.shadowBlur=0;
    ctx.beginPath();ctx.ellipse(cx,cy-4,inner*1.045,haloH*.85,0,Math.PI*1.08,Math.PI*1.91);
    ctx.strokeStyle="#ffffff5b";ctx.lineWidth=1;ctx.stroke();
  }
  // Each address owns one independently rendered angular segment of the ring.
  for(let i=0;i<366;i++){
    const start=offset+TAU*i/366,end=offset+TAU*(i+1)/366+.00013;
    const p1=polar(inner,start),p2=polar(outer,start),p3=polar(outer,end),p4=polar(inner,end);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.lineTo(p3.x,p3.y);ctx.lineTo(p4.x,p4.y);ctx.closePath();
    ctx.fillStyle=strength==="S"?sourceColors[i].hex:core.colorAt(i+1,strength).hex;
    ctx.fill();
  }
  // Fixed-position radial filaments provide visible orbit flow without
  // reassigning address hues or inventing atomic spectral lines.
  for(let n=0;n<105;n++){
    const i=(n*47)%366,radial=.36+((n*37)%101)/101*.59,r=inner+(outer-inner)*radial;
    const a=offset+TAU*(i+.5)/366,p=polar(r,a),q=polar(r,a+(.03+.016*(n%4)));
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
    ctx.strokeStyle="#ffffff";ctx.globalAlpha=n%5===0?.54:.20;ctx.lineWidth=n%7===0?1.7:.7;ctx.stroke();ctx.globalAlpha=1;
  }
  // Straight GEN8 arm guides overlay but never replace the source color sites.
  for(let k=0;k<28;k++){
    const a=offset+k/28*TAU,p1=polar(inner,a),p2=polar(outer,a);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);
    ctx.strokeStyle="#e3f9f538";ctx.lineWidth=.65;ctx.stroke();
  }
  // HON sector boundaries at 122, 244 and 366, with no extra slots.
  for(let i=0;i<3;i++){
    const a=offset+i*TAU/3,p1=polar(inner-4,a),p2=polar(outer+5,a);
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);
    ctx.strokeStyle="#ecffffbb";ctx.lineWidth=1.8;ctx.stroke();
  }
  // Torus inner rim, with glow strongest on the forward-facing half.
  drawArc(inner,0,TAU,"#bcfaff",2.7,.58);
  drawArc(inner,0,Math.PI,"#ffe3b1",3.5,.82);
  drawArc(outer,0,TAU,"#c5e9ff",1.5,.46);
  // Dark silhouette in the empty annulus center. No physical event horizon scale.
  const coreX=inner*.88,coreY=Math.max(4,inner*flatten*.90);
  ctx.save();ctx.translate(cx,cy);ctx.scale(1,Math.max(.16,flatten));
  const shadow=ctx.createRadialGradient(0,0,inner*.03,0,0,inner*.89);
  shadow.addColorStop(0,"#000006");shadow.addColorStop(.72,"#020914");shadow.addColorStop(1,"#081321");
  ctx.beginPath();ctx.arc(0,0,inner*.90,0,TAU);ctx.fillStyle=shadow;ctx.shadowColor="#0a101c";ctx.shadowBlur=10;ctx.fill();
  ctx.shadowBlur=0;ctx.strokeStyle="#b5d9f554";ctx.lineWidth=1.4;ctx.stroke();ctx.restore();
  // The apparent back/upper halo is deliberately schematic.
  if($("halo").checked){
    const haloH=Math.max(16,inner*flatten*1.65);
    ctx.beginPath();ctx.ellipse(cx,cy-4,inner*1.11,haloH,0,.10*Math.PI,.89*Math.PI);
    ctx.strokeStyle="#f6bca85a";ctx.lineWidth=1.3;ctx.stroke();
  }
  const selectedA=offset+(address-.5)/366*TAU;
  const pInner=polar(inner-5,selectedA),pOuter=polar(outer+9,selectedA);
  ctx.beginPath();ctx.moveTo(pInner.x,pInner.y);ctx.lineTo(pOuter.x,pOuter.y);ctx.strokeStyle="#f7fff6";ctx.lineWidth=2;ctx.shadowColor="#ffffff";ctx.shadowBlur=12;ctx.stroke();ctx.shadowBlur=0;
  ctx.beginPath();ctx.arc(pOuter.x,pOuter.y,5.6,0,TAU);ctx.fillStyle="#fff4bc";ctx.fill();
  ctx.fillStyle="#d5f7ee";ctx.textAlign="center";ctx.font="bold 12px ui-monospace,monospace";ctx.fillText("D = 0",cx,cy+3);
  ctx.fillStyle="#a4cbd0";ctx.font="10px ui-monospace,monospace";ctx.fillText("366 / HON",cx,cy+19);
  ctx.textAlign="left";ctx.fillStyle="#9ec8d3";ctx.font="10px ui-monospace,monospace";
  ctx.fillText("ACCRETION PROJECTION · "+tilt+"° · SOURCE "+strength,14,h-15);
 }

 function render(){
  if($("viewMode").value==="disk"){renderAccretion();return;}
  resize();if(w<1||h<1)return;ctx.clearRect(0,0,w,h);
  const cx=w*.5,cy=h*.50,outer=Math.min(w*.44,h*.47),inner=outer*.29,offset=currentTick()/732*TAU-Math.PI/2;
  hit={cx,cy,inner,outer,angle:offset,tiltY:1};
  // Exact 366 source swatches at selected W/M/S brightness; each of 3 equal 122-sector parts.
  for(let i=0;i<366;i++){
    const a=offset+TAU*i/366,b=offset+TAU*(i+1)/366+.0004;
    const col=strength==="S"?sourceColors[i].hex:core.colorAt(i+1,strength).hex;
    segment(a,b,cx,cy,inner,outer,col);
  }
  for(let i=0;i<3;i++){
   let a=offset+i*122/366*TAU;
   ctx.strokeStyle="#e0efffd9";ctx.lineWidth=2;ctx.beginPath();
   ctx.moveTo(cx+Math.cos(a)*(inner-5),cy+Math.sin(a)*(inner-5));
   ctx.lineTo(cx+Math.cos(a)*(outer+8),cy+Math.sin(a)*(outer+8));ctx.stroke();
  }
  // Each radial band contains a 28×13 address mapping only in GEN8. Draw spoke guides but do not
  // identify 366 color bins with 364 arm/cell sites; +/− are independently annotated.
  for(let k=0;k<28;k++){const a=offset+k/28*TAU;
   ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);
   ctx.lineTo(cx+Math.cos(a)*outer,cy+Math.sin(a)*outer);ctx.lineWidth=.6;ctx.strokeStyle="#d8f8f455";ctx.stroke()}
  const chosenA=offset+(address-.5)/366*TAU,pRad=outer*.98,px=cx+Math.cos(chosenA)*pRad,py=cy+Math.sin(chosenA)*pRad;
  ctx.beginPath();ctx.arc(px,py,Math.max(5,outer*.027),0,TAU);ctx.fillStyle="#fff7d1";ctx.shadowColor="#fff";ctx.shadowBlur=21;ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.beginPath();
  ctx.moveTo(cx+Math.cos(chosenA)*(inner-2),cy+Math.sin(chosenA)*(inner-2));
  ctx.lineTo(cx+Math.cos(chosenA)*(outer+10),cy+Math.sin(chosenA)*(outer+10));ctx.stroke();
  const grad=ctx.createRadialGradient(cx,cy,3,cx,cy,inner);
  grad.addColorStop(0,"#153f53");grad.addColorStop(.87,"#0b2232");grad.addColorStop(1,"#020a17");
  ctx.beginPath();ctx.arc(cx,cy,inner,0,TAU);ctx.fillStyle=grad;ctx.fill();
  ctx.strokeStyle="#bffff0";ctx.lineWidth=1.2;ctx.stroke();
  ctx.textAlign="center";ctx.fillStyle="#b9efe1";ctx.font="bold "+Math.max(12,inner*.2)+"px ui-monospace,monospace";ctx.fillText("D = 0",cx,cy+3);
  ctx.fillStyle="#8ab6bf";ctx.font="10px ui-monospace,monospace";ctx.fillText("366 / HON",cx,cy+18);
  ctx.textAlign="left";ctx.font="10px ui-monospace,monospace";ctx.fillStyle="#9dbfc8";ctx.fillText("SOURCE COLORS · GEN9 · "+strength,13,h-14);
 }
 canvas.addEventListener("pointerdown",e=>{
  if($("viewMode").value!=="disk")return;
  drag={x:e.clientX,y:e.clientY,rotate:diskRotation,tilt:+$("tilt").value,moved:false};
  if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener("pointermove",e=>{
  if(!drag)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(dx,dy)>5)drag.moved=true;
  if(!drag.moved)return;
  diskRotation=drag.rotate+dx*.009;
  const t=Math.max(0,Math.min(86,Math.round(drag.tilt+dy*.16)));
  $("tilt").value=t;$("tiltOut").textContent=t+"°";
 });
 canvas.addEventListener("pointerup",()=>{if(drag?.moved)skipClick=true;drag=null});
 canvas.addEventListener("pointercancel",()=>{drag=null});
 canvas.addEventListener("click",e=>{
  if(skipClick){skipClick=false;return;}
  const box=canvas.getBoundingClientRect(),mx=e.clientX-box.left,my=e.clientY-box.top;
  const dx=mx-hit.cx,dy=(my-hit.cy)/(hit.tiltY||1),r=Math.hypot(dx,dy);
  if(r<hit.inner||r>hit.outer+15)return;
  const a=(Math.atan2(dy,dx)-hit.angle+TAU*5)%TAU;
  pickAddress(Math.min(366,Math.floor(a/TAU*366)+1));
 });
 window.addEventListener("message",event=>{
  if(event.source!==window.parent||!event.data)return;
  if(event.data.kind==="root0-pinwheel-set-address")pickAddress(event.data.address,false);
  if(event.data.kind==="root0-pinwheel-set-tick")seekTick(event.data.tick,false);
  if(event.data.kind==="root0-pinwheel-request")sendAddress();
 });
 let frames=0;
 function loop(now){const dt=last?Math.min(.075,(now-last)/1000):0;last=now;
  if(running)phase=(phase+dt*(+$("speed").value))%732;
  if(++frames%5===0)updateReads();render();requestAnimationFrame(loop)}
 function updateHeight(){if(window.parent!==window)window.parent.postMessage({kind:"root0-pinwheel-height",height:document.documentElement.scrollHeight},"*")}
 if(typeof ResizeObserver==="function")new ResizeObserver(updateHeight).observe(document.body);
 window.addEventListener("resize",updateHeight);
 updateReads();updateHeight();requestAnimationFrame(loop);
})();
