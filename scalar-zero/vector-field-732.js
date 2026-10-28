"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const M=window.ROOT0_VECTOR_732,C=window.ROOT0_PINWHEEL_366,F=window.ROOT0_FIELD_FLOOR,G=window.ROOT0_GRAVITY_VORTEX,S=window.ROOT0_SCALE_DESCENT,TAU=Math.PI*2;
 if(!M||!C||!F||!G||!S||M.count!==732||C.capacity!==366||F.geometry.oneTilePitchMeters!==1.61615e-35||S.floorMeters!==F.geometry.oneTilePitchMeters)throw Error("GEN13 field floor / vector / OASIS source missing");
 const STORE="root0.gen11.vector-field.metric.v2",LEGACY_STORE="root0.gen10.vector-field.v1";
 const defaults=()=>Array.from({length:732},()=>M.defaults());
 let vectors=defaults(),audit=[],selected=0,tilt=65,seq=0,last=0;
 let rollStep=0,rollElapsed=0,rollPlaying=true,vortexSpin=0;
 const canvas=$("vectors"),ctx=canvas.getContext("2d");
 const colors=Array.from({length:732},(_,i)=>C.colorAt(M.decode(i).address,"S").hex);
 if(!Array.isArray(M.rollBeats)||M.rollBeats.length!==6||M.rollBeats.map(b=>b.code).join("/")!=="−36/0/+36/0/1/1")throw Error("GEN12 roll mapping not available");
 function refreshFloor(){
   const grid=+($("floorGrid").value);
   if(!F.isAllowed(grid))return;
   $("floorPitch").textContent="1.61615 × 10⁻³⁵ m";
   $("floorSpan").textContent=F.span(grid).toExponential(6).replace("e-"," × 10^-")+" m";
 }
 $("floorGrid").addEventListener("change",refreshFloor);
 $("showFloor").addEventListener("change",refreshFloor);
 refreshFloor();
 function refreshVortex(){
   $("vortexCompressionOut").textContent=(+$("vortexCompression").value).toFixed(2);
   $("vortexRingsOut").textContent=$("vortexRings").value;
 }
 for(const id of ["vortexCompression","vortexRings"])$(id).addEventListener("input",refreshVortex);
 for(const id of ["vortexVisible","vortexMarkers"])$(id).addEventListener("change",refreshVortex);
 refreshVortex();
 function updateScaleInfo(){
   const m=S.markerInfo($("gen15Select").value)||S.markers[0];
   $("gen15Detail").textContent=m.label+" · "+m.meters.toExponential(4)+" m · "+m.kind.toUpperCase()+". "+m.detail;
 }
 for(const m of S.markers){
   const option=document.createElement("option");option.value=m.key;option.textContent=m.label;
   $("gen15Select").appendChild(option);
 }
 $("gen15Select").value="atom";
 $("gen15Select").addEventListener("change",updateScaleInfo);
 $("gen15Visible").addEventListener("change",updateScaleInfo);
 updateScaleInfo();
 const regions=Array.from({length:130},(_,i)=>({
    x:((i*73.743)%987)/987,y:((i*241.173)%991)/991,r:.25+(i%4)*.21
 }));
 let dims={w:0,h:0,dpr:1},hit={cx:0,cy:0,inner:0,outer:0,tiltY:1,offset:-Math.PI/2};
 function validRecord(x){return x&&typeof x==="object"&&Number.isInteger(x.id)&&x.id>=0&&x.id<732}
 // Never overwrite GEN10 v1 storage. New v2 saves under a distinct key.
 // If v2 does not exist, migrate legacy 10^e−1 magnitudes into the new
 // signed 10^e metric, rounding to the nearest 0.25 exponent.
 let migrated=false;
 try{
   const newer=JSON.parse(localStorage.getItem(STORE)||"null");
   if(newer&&newer.schema==="root0-vector732-metric-v2"&&Array.isArray(newer.states)&&newer.states.length===732){
     vectors=newer.states.map(M.normalize);
     if(Array.isArray(newer.events))audit=newer.events.filter(validRecord);
     if(Number.isInteger(newer.selected)&&newer.selected>=0&&newer.selected<732)selected=newer.selected;
   }else{
     const old=JSON.parse(localStorage.getItem(LEGACY_STORE)||"null");
     if(old&&old.schema==="root0-vector732-v1"&&Array.isArray(old.states)&&old.states.length===732){
       vectors=old.states.map(M.migrateV1);
       if(Array.isArray(old.events))audit=old.events.filter(validRecord);
       if(Number.isInteger(old.selected)&&old.selected>=0&&old.selected<732)selected=old.selected;
       migrated=true;
     }
   }
 }catch(_){}
 seq=audit.reduce((max,e)=>Math.max(max,Number.isInteger(e.seq)?e.seq:0),0);
 if(migrated){
   audit.push({seq:++seq,id:selected,address:M.decode(selected).address,
     polarity:M.decode(selected).polarity,kind:"MIGRATION_V1_TO_METRIC_V2",scope:"all_732",
     time:new Date().toISOString(),state:{...vectors[selected]},
     note:"Legacy 10^e−1 converted to exact zero or nearest quarter-exponent 10^e; v1 localStorage retained unchanged."});
   save();
 }
 function save(){
  try{localStorage.setItem(STORE,JSON.stringify({schema:"root0-vector732-metric-v2",metric:M.metric,states:vectors,
    selected,events:audit}));return true}
  catch(e){$("audit").textContent="Browser storage unavailable; export JSON to retain these changes. "+String(e);return false}
 }
 function logChange(kind,ids,note){
   const list=Array.isArray(ids)?ids:[ids],time=new Date().toISOString();
   for(const id of list){
     if(!Number.isInteger(id)||id<0||id>=732)continue;
     audit.push({seq:++seq,id,address:M.decode(id).address,polarity:M.decode(id).polarity,kind,
       state:{...vectors[id]},time,note:note||null});
   }
   save();drawAudit();
 }
 function drawAudit(){
   const root=$("audit");root.replaceChildren();
   if(!audit.length){root.textContent="No pin or scale changes yet.";return}
   for(const entry of audit.slice(-7).reverse()){
    const line=document.createElement("div");line.className="event";
    line.textContent="#"+entry.seq+" · V"+String(entry.id).padStart(3,"0")+" · "+entry.kind+" · "+M.descriptor(entry.state)+" · "+entry.time;
    root.appendChild(line);
   }
 }
 function stats(){
   $("pinnedTotal").textContent=vectors.reduce((n,v)=>n+(v.pinned?1:0),0);
   $("infiniteTotal").textContent=vectors.reduce((n,v)=>n+(v.pinned&&v.infinite?1:0),0);
 }
 function refresh(){
   const d=M.decode(selected),v=vectors[selected],color=C.colorAt(d.address,"S");
   $("vector").value=selected;$("vectorOut").textContent=String(selected).padStart(3,"0")+" / 731";
   $("identity").textContent="V"+String(selected).padStart(3,"0")+" · "+String(d.address).padStart(3,"0")+" "+d.polarity;
   $("label").textContent="OASIS "+color.rootSymbol+" · "+color.hex+" · "+(d.bit?"◉ TOROID":"□ BOX")+" · HON "+color.localAddress+"/122";
   $("swatch").style.background=color.hex;
   $("pinState").textContent=v.pinned?"PINNED TO D":"FREE";
   $("signState").textContent=v.sign===1?"+":"−";
   $("magnitude").textContent=M.descriptor(v);
   $("zeroState").textContent=v.zero?"EXACT 0":v.infinite?"SYMBOLIC ∞":"FINITE 10^e";
   $("pair").textContent="V"+String(d.pair).padStart(3,"0");
   $("exponent").value=v.exponent;$("expOut").textContent=v.exponent.toFixed(2);
   $("tilt").value=tilt;$("tiltOut").textContent=tilt+"°";
   $("pin").textContent=v.pinned?"UNPIN FROM D":"PIN → D = 0";
   $("pin").setAttribute("aria-pressed",String(v.pinned));
   $("negative").setAttribute("aria-pressed",String(v.sign===-1));
   $("positive").setAttribute("aria-pressed",String(v.sign===1));
   $("infinity").setAttribute("aria-pressed",String(v.infinite));
   $("infinity").textContent=v.infinite?"SIGNED ∞ SET":"SET SIGNED ∞";
   $("zeroSelected").setAttribute("aria-pressed",String(v.zero));
   $("finite").setAttribute("aria-pressed",String(!v.zero&&!v.infinite));
   stats();
 }
 /* GEN12: The roll is a read-only, frame-local overlay.
  * Saved states are never changed by an animation frame.
  * All six stages use canonical GEN11 exact zero/10^exponent states. */
 function previewState(id){
   const base=vectors[id],scope=$("rollScope").value;
   if(scope==="saved"||(scope==="selected"&&id!==selected)||
     (scope==="pinned"&&!base.pinned))return base;
   return {...M.rollState(rollStep,base),pinned:true};
 }
 function refreshRoll(){
   const beat=M.rollBeat(rollStep);
   $("rollIndex").textContent=(rollStep+1)+" / 6";
   $("rollValue").textContent=beat.label;
   $("rollMetric").textContent=beat.code==="0"?"EXACT SCALAR ZERO":beat.code==="1"?"10⁰ = 1 · UNIT BEAT":"10^"+beat.exponent+" · FINITE MAGNITUDE";
   $("rollPlay").textContent=rollPlaying?"Ⅱ PAUSE ROLL":"▶ RESUME ROLL";
   $("rollPlay").setAttribute("aria-pressed",String(rollPlaying));
   for(const b of $("rollBeats").children){
     b.classList.toggle("active",Number(b.dataset.step)===rollStep);
     b.setAttribute("aria-pressed",String(Number(b.dataset.step)===rollStep));
   }
 }
 function gotoRoll(n,pause=true){
   rollStep=M.rollIndex(n);rollElapsed=0;
   if(pause)rollPlaying=false;
   refreshRoll();
 }
 function initRoll(){
   M.rollBeats.forEach((beat,i)=>{
     const b=document.createElement("button");
     b.type="button";b.className=beat.zero?"zero":"";
     b.dataset.step=String(i);b.textContent=beat.code;
     b.title="Beat "+(i+1)+": "+beat.label;
     b.addEventListener("click",()=>gotoRoll(i,true));
     $("rollBeats").appendChild(b);
   });
   $("rollPlay").addEventListener("click",()=>{rollPlaying=!rollPlaying;refreshRoll()});
   $("rollNext").addEventListener("click",()=>gotoRoll(rollStep+1,true));
   $("rollReset").addEventListener("click",()=>gotoRoll(0,true));
   $("rollSpeed").addEventListener("input",()=>{
     $("rollSpeedOut").textContent=(+$("rollSpeed").value).toFixed(2);
   });
   $("rollScope").addEventListener("change",refreshRoll);
   $("rollCommit").addEventListener("click",()=>{
     const value=M.rollState(rollStep,vectors[selected]);
     vectors[selected]={...value,pinned:true};
     refresh();
     logChange("COMMIT_GEN12_ROLL_BEAT",selected,
       "Beat "+(rollStep+1)+"/6: "+M.rollBeat(rollStep).code+"; deliberate saved-state mutation");
   });
   refreshRoll();
 }
 function emitSelection(){
  if(window.parent!==window){
   const d=M.decode(selected);
   window.parent.postMessage({kind:"root0-vector-selected",index:selected,address:d.address,polarity:d.polarity},"*");
  }
 }
 function pick(id,emit=true){
   try{M.decode(id)}catch(_){return}
   selected=id;refresh();
   if(emit)emitSelection();
 }
 function updateSelected(change,kind,commit=true){
   vectors[selected]=M.normalize({...vectors[selected],...change});
   refresh();
   if(commit)logChange(kind,selected);
 }
 $("vector").addEventListener("input",()=>pick(+$("vector").value));
 $("tilt").addEventListener("input",()=>{tilt=+$("tilt").value;refresh()});
 $("exponent").addEventListener("input",()=>{
   vectors[selected]=M.normalize({...vectors[selected],exponent:+$("exponent").value,zero:false,infinite:false});
   refresh();
 });
 $("exponent").addEventListener("change",()=>logChange("SCALE_EXPONENT",selected));
 $("pin").addEventListener("click",()=>updateSelected({pinned:!vectors[selected].pinned},"PIN_TOGGLE"));
 $("negative").addEventListener("click",()=>updateSelected({sign:-1},"SIGN_MINUS"));
 $("positive").addEventListener("click",()=>updateSelected({sign:1},"SIGN_PLUS"));
 $("infinity").addEventListener("click",()=>updateSelected({zero:false,infinite:!vectors[selected].infinite},"SYMBOLIC_INFINITY_TOGGLE"));
 $("finite").addEventListener("click",()=>updateSelected({zero:false,infinite:false},"RETURN_TO_FINITE"));
 $("zeroSelected").addEventListener("click",()=>updateSelected({zero:true,infinite:false},"EXACT_SCALAR_ZERO"));
 $("otherPhase").addEventListener("click",()=>pick(M.decode(selected).pair));
 // Each pin/unpin is a separately addressable vector; bulk commands log a compact
 // batch entry rather than falsely claiming 732 independent witnessed events.
 function bulkPin(value){
   vectors=vectors.map(v=>M.normalize({...v,pinned:value}));
   refresh();
   audit.push({seq:++seq,id:selected,address:M.decode(selected).address,polarity:M.decode(selected).polarity,
    kind:value?"BULK_PIN_732":"BULK_UNPIN_732",scope:"all_732",time:new Date().toISOString(),state:{...vectors[selected]}});
   save();drawAudit();
 }
 $("pinAll").addEventListener("click",()=>bulkPin(true));
 $("unpinAll").addEventListener("click",()=>bulkPin(false));
 for(const b of document.querySelectorAll("[data-jump]")){
   b.addEventListener("click",()=>pick(+b.dataset.jump));
 }
 $("export").addEventListener("click",()=>{
  const out={schema:"root0-vector732-metric-v2",metric:M.metric,exponentRange:[M.minExponent,M.maxExponent],zeroMode:"independent exact zero",
   name:"ROOT0 GEN11 signed power-of-ten metric for 732 independent vectors",
   coordinateSystem:"scalar D=(0,0): 0 exact OR sign*10^e with e∈[-36,36] OR symbolic sign*∞",
   phaseCount:732,colorAddresses:366,source:"DavidWise01/oasis N184 HON v9.4",
   floor:{...F.geometry,enabled:$("showFloor").checked,gridSize:+$("floorGrid").value,
      gridSpanMeters:F.span(+$("floorGrid").value),tetherFromD:true,
      vortex:{schema:"root0-gen14-vortex-v1",enabled:$("vortexVisible").checked,
       compression:+$("vortexCompression").value,rings:+$("vortexRings").value,
       markersVisible:$("vortexMarkers").checked,scaleBands:G.markerBands,visualOnly:true,
       logarithmicDescent:{schema:S.schema,enabled:$("gen15Visible").checked,
        selectedMarker:$("gen15Select").value,topMeters:S.mouthMeters,floorMeters:S.floorMeters,
        generations:S.generations,scienceMarkers:S.setupMarkers(),interpretation:"logarithmic height, schematic funnel width"}},
      calibration:"user value, not CODATA 2022 exactly; not a physical spatial quantum"},
   roll:{schema:"root0-gen12-six-beat-v1",sequence:M.rollBeats.map(x=>({...x})),beat:rollStep+1,
    speedBeatsPerSecond:+$("rollSpeed").value,playing:rollPlaying,scope:$("rollScope").value,
    previewOnly:true,manualCommitOnly:true},
   states:vectors.map((v,i)=>({vector:M.decode(i),...v,
    descriptor:M.descriptor(v),sourceHex:colors[i]})),events:audit.slice(),selected,generated:new Date().toISOString(),
   boundary:"No physical infinities, observed cosmic vector fields or quantum gravity claims"};
  const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="ROOT0_GEN11_732_SIGNED_POWER10_METRIC.json";
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 function resize(){
  const b=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
  if(dims.w!==b.width||dims.h!==b.height||dims.dpr!==dpr){
   dims={w:b.width,h:b.height,dpr};canvas.width=Math.max(1,Math.round(b.width*dpr));
   canvas.height=Math.max(1,Math.round(b.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
  }
 }
 function drawFloor(cx,cy,outer){
   if(!$("showFloor").checked)return;
   const count=+$("floorGrid").value;
   if(!F.isAllowed(count))return;
   const floorY=cy+outer*.73;
   const pitch=outer/(Math.max(count,5)*.84);
   const half=count/2;
   const polygon=[
     F.project(-half,-half,cx,floorY,pitch),
     F.project(half,-half,cx,floorY,pitch),
     F.project(half,half,cx,floorY,pitch),
     F.project(-half,half,cx,floorY,pitch)
   ];
   ctx.beginPath();
   polygon.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});
   ctx.closePath();
   ctx.fillStyle="#184d5b29";ctx.fill();
   ctx.strokeStyle="#78d5c777";ctx.lineWidth=1.2;ctx.stroke();
   const grid=F.projectedGrid(count,cx,floorY,pitch);
   ctx.strokeStyle="#83d4d44d";ctx.lineWidth=count>13?.48:.75;
   ctx.beginPath();
   for(const [a,b] of grid){ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}
   ctx.stroke();
   // Scalar D=0 belongs to the vector origin; its ground-floor projection is
   // an annotated tether, not a claim of gravitational acceleration.
   if(!$("vortexVisible").checked){
   ctx.save();
   ctx.setLineDash([4,5]);
   ctx.strokeStyle="#defceb8f";ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,floorY);ctx.stroke();
   ctx.restore();
   }
   ctx.fillStyle="#c8ffe4";ctx.beginPath();ctx.arc(cx,floorY,3.8,0,TAU);ctx.fill();
   ctx.textAlign="center";ctx.font="10px ui-monospace,monospace";
   ctx.fillStyle="#b5ffe9";
   ctx.fillText("1 TILE = 1.61615×10⁻³⁵ m",cx,Math.min(dims.h-11,floorY+pitch*(count*.245)+18));
   ctx.fillText("D=0 FLOOR PROJECTION",cx,floorY-10);
   ctx.textAlign="left";
 }
 function draw(){
  resize();const w=dims.w,h=dims.h;
  if(w<=0||h<=0)return;
  ctx.clearRect(0,0,w,h);
  const cx=w*.5,cy=h*.51,outer=Math.min(w*.445,h*.445),inner=outer*.235;
  const tiltY=Math.max(.15,Math.cos(tilt*Math.PI/180)),offset=-Math.PI/2;
  hit={cx,cy,inner,outer,tiltY,offset};
  const polar=(r,a)=>({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*tiltY});
  for(const s of regions){ctx.fillStyle="#a0c8da55";ctx.fillRect(s.x*w,s.y*h,s.r,s.r)}
  drawFloor(cx,cy,outer);
  if($("showFloor").checked&&$("vortexVisible").checked){
    G.draw(ctx,{cx,topY:cy+outer*.08,floorY:cy+outer*.73,
      mouthRadius:outer*.54,neckRadius:2.3,
      compression:+$("vortexCompression").value,ringCount:+$("vortexRings").value,
      flatten:Math.max(.16,tiltY*.65),spin:vortexSpin,direction:1,
      labels:false});
    if($("gen15Visible").checked){
      const topY=cy+outer*.08,floorY=cy+outer*.73;
      const cfg={cx,topY,floorY,mouthRadius:outer*.54,neckRadius:2.3,
        compression:+$("vortexCompression").value,ringCount:+$("vortexRings").value,
        spin:vortexSpin,flatten:Math.max(.16,tiltY*.65)};
      for(const gen of S.generations){
        const r=G.ringAt(gen.t,cfg);
        ctx.beginPath();ctx.ellipse(r.x,r.y,r.rx,r.ry,0,0,TAU);
        ctx.strokeStyle=gen.generation%5===0?"#d3faefc6":"#74bff16b";
        ctx.lineWidth=gen.generation%5===0?1.7:.8;ctx.stroke();
      }
      const m=S.markerInfo($("gen15Select").value)||S.markers[0];
      const mr=G.ringAt(S.t(m.meters),cfg);
      ctx.beginPath();ctx.ellipse(mr.x,mr.y,mr.rx,mr.ry,0,0,TAU);
      ctx.strokeStyle=m.color;ctx.lineWidth=3;ctx.stroke();
    }
  }
  // Gray geometric field: neither a gravitational lens solution nor physical space.
  for(let ring=1;ring<=4;ring++){
    let r=inner+(outer-inner)*ring/4;ctx.beginPath();
    for(let n=0;n<=144;n++){
      const p=polar(r,n*TAU/144);if(n===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}
    ctx.strokeStyle="#50718c4b";ctx.lineWidth=1;ctx.stroke();
  }
  // 732 precise vector addresses at circumference. Both polarity samples retain
  // the color of their parent HON address; no extra chemical colors are generated.
  for(let id=0;id<732;id++){
    const d=M.decode(id),angle=offset+id*TAU/732;
    const p0=polar(outer*.965,angle),p1=polar(outer+4,angle);
    ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);
    ctx.strokeStyle=colors[id];ctx.lineWidth=1.2;ctx.globalAlpha=.83;ctx.stroke();ctx.globalAlpha=1;
  }
  for(let i=0;i<28;i++){
    const a=offset+i*TAU/28,p0=polar(inner,a),p1=polar(outer,a);
    ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);
    ctx.strokeStyle="#bbe5f22b";ctx.lineWidth=.6;ctx.stroke();
  }
  // Pinned samples extend from D toward ± the logarithmically compressed tip.
  // Both axes point away from zero; negative values reverse the arrow orientation.
  for(let id=0;id<732;id++){
    const v=previewState(id);if(!v.pinned||id===selected)continue;
    const d=M.decode(id),frac=M.fraction(v),a=offset+d.angleDegrees*Math.PI/180+(v.sign<0?Math.PI:0),point=polar(frac*outer,a);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(point.x,point.y);
    ctx.strokeStyle=colors[id];ctx.globalAlpha=v.infinite?.64:.28;ctx.lineWidth=v.infinite?1.5:.8;ctx.stroke();ctx.globalAlpha=1;
    if(frac>0){ctx.fillStyle=colors[id];ctx.fillRect(point.x-1.5,point.y-1.5,3,3)}
  }
  // Scalar zero always stays visible above all pinned vectors.
  const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,inner*.9);
  grad.addColorStop(0,"#040a11");grad.addColorStop(.68,"#071725");grad.addColorStop(1,"#173b4955");
  ctx.beginPath();ctx.arc(cx,cy,inner*.57,0,TAU);
  ctx.fillStyle=grad;ctx.shadowBlur=18;ctx.shadowColor="#9ec9e643";ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle="#cbfff3";ctx.lineWidth=1.4;ctx.stroke();
  ctx.textAlign="center";ctx.fillStyle="#f3fffd";ctx.font="bold "+Math.max(11,inner*.23)+"px ui-monospace,monospace";
  ctx.fillText("D = 0",cx,cy+4);
  // Selected vector always visible, even when currently unpinned (dashed preview).
  const d=M.decode(selected),v=previewState(selected),a=offset+d.angleDegrees*Math.PI/180+(v.sign<0?Math.PI:0);
  const frac=M.fraction(v),r=frac*outer,to=polar(v.pinned?r:outer,a);
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(to.x,to.y);
  ctx.strokeStyle=v.pinned?"#fff9cf":"#b7ccde";ctx.lineWidth=v.pinned?3:1.8;
  ctx.setLineDash(v.pinned?[]:[7,6]);ctx.shadowColor=colors[selected];ctx.shadowBlur=v.pinned?13:0;ctx.stroke();
  ctx.setLineDash([]);ctx.shadowBlur=0;
  ctx.beginPath();const nodeRadius=v.infinite?7:5;
  if(d.bit)ctx.arc(to.x,to.y,nodeRadius,0,TAU);
  else ctx.rect(to.x-nodeRadius,to.y-nodeRadius,nodeRadius*2,nodeRadius*2);
  ctx.strokeStyle="#ffdfac";ctx.lineWidth=2;ctx.fillStyle=v.pinned?colors[selected]:"#182c40";ctx.fill();ctx.stroke();
  if(v.infinite){
    ctx.fillStyle="#ffdda8";ctx.font="bold 13px ui-monospace,monospace";
    ctx.fillText(v.sign<0?"−∞":"+∞",to.x,to.y-12);
  }
  ctx.textAlign="left";ctx.fillStyle="#a0c4d2";ctx.font="10px ui-monospace,monospace";
  ctx.fillText("V"+String(selected).padStart(3,"0")+" / "+d.polarity+" · HON "+d.address+" · "+v.sign+" · "+($("rollScope").value==="saved"?"SAVED":"ROLL "+(rollStep+1)+"/6"),13,h-15);
 }
 canvas.addEventListener("click",e=>{
  const rect=canvas.getBoundingClientRect(),dx=e.clientX-rect.left-hit.cx,dy=(e.clientY-rect.top-hit.cy)/(hit.tiltY||1);
  const r=Math.hypot(dx,dy);
  if(r<hit.inner*.66||r>hit.outer+15)return;
  const a=(Math.atan2(dy,dx)-hit.offset+TAU*4)%TAU;
  pick(Math.floor(a/TAU*732)%732);
 });
 window.addEventListener("message",event=>{
  if(event.source!==window.parent||!event.data)return;
  const msg=event.data;
  if(msg.kind==="root0-vector-set-tick"&&Number.isInteger(msg.tick)&&msg.tick>=0&&msg.tick<732)pick(msg.tick,false);
  if(msg.kind==="root0-vector-set-address"&&Number.isInteger(msg.address)&&msg.address>=1&&msg.address<=366){
   const phase=M.decode(selected).polarity;pick(M.encode(msg.address,phase),false);
  }
 });
 // Animation is for viewport drawing only: no background mutation of user pins.
 function loop(time){
   const dt=last?Math.max(0,Math.min(.1,(time-last)/1000)):0;last=time;
   if(rollPlaying){
     vortexSpin+=dt*.55;
     rollElapsed+=dt*(+$("rollSpeed").value);
     if(rollElapsed>=1){
       const steps=Math.floor(rollElapsed);rollElapsed-=steps;
       rollStep=M.rollIndex(rollStep+steps);refreshRoll();
     }
   }
   draw();requestAnimationFrame(loop);
 }
 const updateHeight=()=>{if(window.parent!==window)window.parent.postMessage({kind:"root0-vector-height",height:document.documentElement.scrollHeight},"*")};
 if(typeof ResizeObserver==="function")new ResizeObserver(updateHeight).observe(document.body);
 window.addEventListener("resize",updateHeight);
 initRoll();drawAudit();refresh();updateHeight();requestAnimationFrame(loop);
})();
