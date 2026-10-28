"use strict";
(function(){
 const $=id=>document.getElementById(id),TAU=Math.PI*2;
 const core=window.ROOT0_PINWHEEL_366;
 if(!core||core.capacity!==366)throw Error("OASIS HON v9.4 pinwheel source adapter missing");
 const canvas=$("wheel"),ctx=canvas.getContext("2d");
 let address=366,phase=0,strength="S",operators=[],running=true,last=0,opsUI=[],dpr=1,w=0,h=0,hit={cx:0,cy:0,inner:0,outer:0,angle:0};
 const sourceColors=Array.from({length:366},(_,i)=>core.colorAt(i+1,"S"));
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
 $("pause").addEventListener("click",()=>{running=!running;$("pause").textContent=running?"Ⅱ PAUSE":"▶ RESUME";updateReads()});
 $("step").addEventListener("click",()=>seekTick((currentTick()+1)%732));
 $("reset").addEventListener("click",()=>{running=false;phase=0;operators=[];strength="S";pickAddress(1);$("pause").textContent="▶ RESUME";updateReads();sendTick()});
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
   gen8:{registers:366,phases:732,sourceVsAxialTerminalMeaningKeptDistinct:true},
   exportedAt:new Date().toISOString(),boundary:"symbolic carrier hues, not atomic emission data"};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ROOT0_OASIS_HON_366_PINWHEEL_GEN9.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 function resize(){const box=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);
  if(w!==box.width||h!==box.height||dpr!==d){w=box.width;h=box.height;dpr=d;canvas.width=Math.max(1,Math.round(w*d));canvas.height=Math.max(1,Math.round(h*d));ctx.setTransform(d,0,0,d,0,0)}}
 function segment(a,b,cx,cy,inner,outer,color,alpha=1){
  ctx.beginPath();ctx.arc(cx,cy,outer,a,b);ctx.arc(cx,cy,inner,b,a,true);ctx.closePath();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fill();ctx.globalAlpha=1;
 }
 function render(){
  resize();if(w<1||h<1)return;ctx.clearRect(0,0,w,h);
  const cx=w*.5,cy=h*.50,outer=Math.min(w*.44,h*.47),inner=outer*.29,offset=currentTick()/732*TAU-Math.PI/2;
  hit={cx,cy,inner,outer,angle:offset};
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
 canvas.addEventListener("click",e=>{
  const box=canvas.getBoundingClientRect(),mx=e.clientX-box.left,my=e.clientY-box.top;
  const dx=mx-hit.cx,dy=my-hit.cy,r=Math.hypot(dx,dy);
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
