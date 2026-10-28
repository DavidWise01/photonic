/* ROOT0 GEN14 · GRAVITY VORTEX GEOMETRY
 * A bounded, shrinking Canvas2D projection from the scalar field to the
 * GEN13 reference floor. Shape is illustrative; not a GR ray tracer.
 * 10^-10 m atomic, 10^-15 m nuclear are order-of-magnitude benchmarks;
 * 10^-16 m is an exploratory subnuclear coordinate, NOT a known object radius.
 * Floor pitch comes exclusively from ROOT0_FIELD_FLOOR (1.61615e-35m).
 */
(function(g){
 "use strict";
 const PI=Math.PI,TAU=2*PI;
 const markerBands=Object.freeze([
  Object.freeze({key:"atom",name:"ATOM ~ 10⁻¹⁰ m",meters:1e-10,t:.17,hex:"#6cd9ff",provenance:"representative atomic length scale"}),
  Object.freeze({key:"nucleus",name:"NUCLEUS ~ 10⁻¹⁵ m",meters:1e-15,t:.58,hex:"#ff99bb",provenance:"representative nuclear length scale"}),
  Object.freeze({key:"subnuclear",name:"10⁻¹⁶ m ? (REFERENCE)",meters:1e-16,t:.77,hex:"#b0ffd3",provenance:"exploratory scale marker; not the known diameter of a particular particle"})
 ]);
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function radiusAt(t,mouth=160,neck=2.5,compression=1.25){
  if(![t,mouth,neck,compression].every(Number.isFinite)||mouth<=0||neck<=0||mouth<neck||compression<=0)throw new RangeError("Invalid vortex dimensions");
  const u=clamp(t,0,1);
  return neck+(mouth-neck)*Math.pow(1-u,compression);
 }
 function ringAt(t,o){
  const u=clamp(t,0,1),r=radiusAt(u,o.mouthRadius,o.neckRadius,o.compression);
  return {t:u,x:o.cx,y:o.topY+(o.floorY-o.topY)*u,rx:r,
    ry:Math.max(.75,r*(o.flatten??.24)*(1-u*.35))};
 }
 function pointOnRing(t,angle,o){const r=ringAt(t,o);return {x:r.x+Math.cos(angle)*r.rx,y:r.y+Math.sin(angle)*r.ry}}
 function validate(o){
  for(const k of ["cx","topY","floorY","mouthRadius","neckRadius","compression","ringCount","spin"]){
   if(!Number.isFinite(o[k]))throw new RangeError("Nonfinite vortex "+k);
  }
  if(o.floorY<=o.topY||o.mouthRadius<=o.neckRadius||o.ringCount<1||o.ringCount>128||o.compression<=0)throw new RangeError("Invalid vortex shape");
 }
 function draw(ctx,opts){
  const o={flatten:.24,direction:1,labels:true,halo:true,...opts};validate(o);
  const start=ringAt(0,o),end=ringAt(1,o),seg=88;
  const strokeRing=(t,hex,width,alpha,spin=0)=>{
   const ring=ringAt(t,o);ctx.beginPath();
   ctx.ellipse(ring.x,ring.y,Math.max(.25,ring.rx),Math.max(.3,ring.ry),0,0,TAU);
   ctx.strokeStyle=hex;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.stroke();ctx.globalAlpha=1;
  };
  ctx.save();
  // Translucent walls: first the back half, then carefully spaced flow curves.
  const gradient=ctx.createLinearGradient(o.cx,start.y,o.cx,end.y);
  gradient.addColorStop(0,"#54b6ff29");gradient.addColorStop(.55,"#2ebbd122");gradient.addColorStop(1,"#c3ffe32f");
  ctx.beginPath();
  for(let i=0;i<=seg;i++){const r=ringAt(i/seg,o);if(i===0)ctx.moveTo(r.x-r.rx,r.y);else ctx.lineTo(r.x-r.rx,r.y)}
  for(let i=seg;i>=0;i--){const r=ringAt(i/seg,o);ctx.lineTo(r.x+r.rx,r.y)}
  ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
  // The complete profile runs to a finite floor contact; never a physical singularity.
  for(const side of [-1,1]){
   ctx.beginPath();
   for(let i=0;i<=seg;i++){
    const t=i/seg,r=ringAt(t,o),p={x:r.x+side*r.rx,y:r.y};
    if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   ctx.strokeStyle=side<0?"#53dfffbb":"#a3e7ff9c";ctx.lineWidth=1.6;ctx.stroke();
  }
  // Meridian flow lines are individually continuous and narrow with the wall.
  for(let j=0;j<14;j++){
   let a=j*TAU/14+o.spin*.17;
   ctx.beginPath();
   for(let i=0;i<=seg;i++){
    const t=i/seg,p=pointOnRing(t,a+t*o.spin*.12*o.direction,o);
    if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   ctx.lineWidth=j%3===0?1.25:.7;
   ctx.strokeStyle=j%3===0?"#9debffe0":"#66cad878";ctx.stroke();
  }
  // Concentric rings compress towards the floor; no extra HON registers.
  for(let j=0;j<o.ringCount;j++){
   const t=(j+.48)/(o.ringCount+.05);
   strokeRing(t,j%4===0?"#e5fdff":"#63cafc",j%4===0?1.85:1.12,j%4===0?.9:.56);
  }
  // Two visible helical trajectories provide the gravity-vortex motion motif.
  for(let k=0;k<2;k++){
   ctx.beginPath();
   for(let i=0;i<=420;i++){
    const t=i/420,a=o.spin*o.direction+k*PI+TAU*(5.5*t+1.2*t*t)*o.direction;
    const p=pointOnRing(t,a,o);
    if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   ctx.shadowColor=k===0?"#4fe2ff":"#ce93ff";ctx.shadowBlur=10;
   ctx.strokeStyle=k===0?"#80f2ffc8":"#af9cfbb4";ctx.lineWidth=k===0?2.4:1.3;ctx.stroke();ctx.shadowBlur=0;
  }
  // The three scale markers are intentionally diagram positions, NOT
  // a log-true vertical metric; their physical-length order is retained.
  if(o.labels){
   for(const m of markerBands){
    const r=ringAt(m.t,o);
    strokeRing(m.t,m.hex,2.3,.96);
    ctx.beginPath();ctx.moveTo(r.x+r.rx+2,r.y);ctx.lineTo(r.x+r.rx+19,r.y);
    ctx.strokeStyle=m.hex;ctx.lineWidth=1;ctx.stroke();
    ctx.textAlign="left";ctx.font="bold 11px ui-monospace,monospace";
    ctx.fillStyle=m.hex;
    ctx.fillText(m.name,r.x+r.rx+23,r.y+4);
   }
  }
  // The floor is already rendered by the calling page. The sink itself
  // sits at its projected D=0 foot and is visually separated from the origin.
  ctx.beginPath();ctx.ellipse(end.x,end.y,Math.max(6,o.neckRadius*4.3),4,0,0,TAU);
  ctx.strokeStyle="#8ce3ffd0";ctx.lineWidth=2;ctx.shadowColor="#53b9ff";
  ctx.shadowBlur=16;ctx.stroke();ctx.shadowBlur=0;
  const sink=ctx.createRadialGradient(end.x,end.y,0,end.x,end.y,13);
  sink.addColorStop(0,"#00040b");sink.addColorStop(.33,"#031121");sink.addColorStop(.57,"#5fc7ffb0");sink.addColorStop(1,"#7de6ff00");
  ctx.beginPath();ctx.arc(end.x,end.y,13,0,TAU);ctx.fillStyle=sink;ctx.fill();
  ctx.beginPath();ctx.arc(end.x,end.y,3,0,TAU);ctx.fillStyle="#02050b";ctx.fill();
  ctx.strokeStyle="#d2fcff";ctx.lineWidth=1.1;ctx.stroke();
  ctx.restore();
  return {mouthRadius:start.rx,neckRadius:end.rx,topY:o.topY,floorY:o.floorY,
    ringCount:o.ringCount,markerBands,monotonic:true,sink:{x:end.x,y:end.y},
    floorPitchMeters:g.ROOT0_FIELD_FLOOR?.geometry.oneTilePitchMeters??null};
 }
 const defaults=Object.freeze({compression:1.4,ringCount:23,flatten:.24,direction:1});
 if(!(radiusAt(.0,100,2,1.4)>radiusAt(.5,100,2,1.4)&&radiusAt(.5,100,2,1.4)>radiusAt(1,100,2,1.4))||
   markerBands.length!==3||!(markerBands[0].meters>markerBands[1].meters&&markerBands[1].meters>markerBands[2].meters))
   throw Error("GEN14 vortex radius/scale invariant failed");
 g.ROOT0_GRAVITY_VORTEX=Object.freeze({defaults,markerBands,radiusAt,ringAt,pointOnRing,validate,draw});
})(typeof window!=="undefined"?window:this);
