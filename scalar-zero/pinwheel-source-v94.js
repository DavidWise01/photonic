/* Derived adapter — original OASIS/N184 HON v9.4, read-only source preserved:
 * https://github.com/DavidWise01/oasis/blob/main/n184/elemental-hon-color-operants-v94/hon_core.mjs
 * HSV rounding follows generational-color-lattice-v91/color_core.mjs.
 * Chemical hues and five operants are symbolic display transformations, not physical forces. */
(function(g){
 "use strict";
 const roots=Object.freeze([
  Object.freeze({symbol:"H",name:"Hydrogen",atomicNumber:1,start:1,end:122,hueMin:0,hueMax:30}),
  Object.freeze({symbol:"O",name:"Oxygen",atomicNumber:8,start:123,end:244,hueMin:120,hueMax:180}),
  Object.freeze({symbol:"N",name:"Nitrogen",atomicNumber:7,start:245,end:366,hueMin:240,hueMax:290})
 ]);
 const tiers=Object.freeze({W:1/3,M:2/3,S:1});
 const operants=Object.freeze(["gravity","expansion","compression","containment","explosion"]);
 function hsvRGB(hue,saturation=1,value=1){
  if(![hue,saturation,value].every(Number.isFinite)||saturation<0||saturation>1||value<0||value>1)throw new RangeError("Invalid HSV");
  const h=((hue%360)+360)%360,chroma=value*saturation,x=chroma*(1-Math.abs((h/60)%2-1)),m=value-chroma;
  let channels;
  if(h<60)channels=[chroma,x,0];else if(h<120)channels=[x,chroma,0];
  else if(h<180)channels=[0,chroma,x];else if(h<240)channels=[0,x,chroma];
  else if(h<300)channels=[x,0,chroma];else channels=[chroma,0,x];
  return channels.map(v=>Math.round(255*(v+m)));
 }
 function hex(rgb){return "#"+rgb.map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase()}
 function rootAt(address){
  if(!Number.isInteger(address)||address<1||address>366)throw new RangeError("Address must be 1..366");
  return roots[Math.floor((address-1)/122)];
 }
 function colorAt(address,strength="S",operators=[]){
  const root=rootAt(address),amplitude=tiers[strength];if(amplitude===undefined)throw new RangeError("Strength W/M/S");
  if(!Array.isArray(operators)||operators.length>5||operators.some(v=>!operants.includes(v)))throw new RangeError("Five defined operators maximum");
  const localIndex=address-root.start;
  let hue=root.hueMin+localIndex*(root.hueMax-root.hueMin)/121,saturation=1,value=amplitude;
  const rawHue=hue;
  for(const op of operators){
   if(op==="gravity")hue=root.hueMin+(hue-root.hueMin)*0.5;
   if(op==="expansion")hue=root.hueMin+(hue-root.hueMin)*1.25;
   if(op==="compression")saturation*=.5;
   if(op==="containment"){hue=Math.max(root.hueMin,Math.min(root.hueMax,hue));saturation=Math.min(saturation,.8)}
   if(op==="explosion"){hue+=45;saturation=1;value=Math.min(1,value+.2)}
  }
  hue=((hue%360)+360)%360;
  const rgb=hsvRGB(hue,saturation,value);
  return{address,rootSymbol:root.symbol,rootName:root.name,atomicNumber:root.atomicNumber,
   localIndex,localAddress:localIndex+1,hue,rawHue,saturation,value,rgb,hex:hex(rgb),
   strength,operators:operators.slice(),lid:address===366,rootStart:root.start,rootEnd:root.end,
   source:"oasis/n184/elemental-hon-color-operants/v94"};
 }
 const api=Object.freeze({capacity:366,roots,tiers,operants,hsvRGB,colorAt,rootAt});
 if(api.roots.reduce((a,r)=>a+r.end-r.start+1,0)!==366||api.colorAt(366).lid!==true||
    api.colorAt(1).hex!=="#FF0000"||api.colorAt(123).hex!=="#00FF00"||api.colorAt(245).hex!=="#0000FF")
  throw new Error("OASIS v9.4 source mapping mismatch");
 g.ROOT0_PINWHEEL_366=api;
})(typeof window!=="undefined"?window:this);
