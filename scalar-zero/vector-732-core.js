/* ROOT0 GEN11 METRIC v2: every scalar-zero vector has independent exact-zero,
 * signed finite 10^e with -36 <= e <= +36, and symbolic ±infinity states.
 * OASIS HON v9.4 color addresses and all 732 vector identities are preserved.
 * Model coordinates are dimensionless; no Planck-scale measurement is asserted.
 */
(function(global){
 "use strict";
 const ADDRESSES=366,COUNT=732,MIN_EXP=-36,MAX_EXP=36,STEP=.25;
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
 function assertIndex(id){if(!Number.isInteger(id)||id<0||id>=COUNT)throw new RangeError("Vector index 0..731")}
 function decode(id){assertIndex(id);const address=Math.floor(id/2)+1;return Object.freeze({
   id,address,bit:address%2,shape:address%2?"toroid":"box",phase:id%2?"plus":"minus",polarity:id%2?"+":"−",
   sign:id%2?1:-1,angleDegrees:id*360/COUNT,pair:id^1
 });}
 function encode(address,polarity){
  if(!Number.isInteger(address)||address<1||address>ADDRESSES)throw new RangeError("Address 1..366");
  if(!["−","+","minus","plus",-1,1].includes(polarity))throw new RangeError("Use −/+ phase");
  return (address-1)*2+((polarity==="+"||polarity==="plus"||polarity===1)?1:0);
 }
 function defaults(){return{pinned:false,sign:1,zero:true,exponent:0,infinite:false}}
 function normalize(input){
  const v=input&&typeof input==="object"?input:{},d=defaults();
  if(typeof v.pinned==="boolean")d.pinned=v.pinned;
  if(v.sign===1||v.sign===-1)d.sign=v.sign;
  if(typeof v.exponent==="number"&&Number.isFinite(v.exponent))
   d.exponent=clamp(Math.round(v.exponent/STEP)*STEP,MIN_EXP,MAX_EXP);
  if(typeof v.zero==="boolean")d.zero=v.zero;
  if(typeof v.infinite==="boolean")d.infinite=v.infinite;
  // Infinity and exact zero are disjoint. Infinity wins on malformed payloads.
  if(d.infinite)d.zero=false;
  return d;
 }
 function migrateV1(input){
  const v=input&&typeof input==="object"?input:{},oldExp=Number.isFinite(v.exponent)?clamp(v.exponent,0,36):0;
  // Legacy magnitude = 10^e - 1. V2 has exact zero or 10^e.
  // This mapping is nearest quarter exponent, with the raw v1 state kept intact
  // in the separate legacy localStorage key (non-destructive migration).
  if(v.infinite)return normalize({pinned:v.pinned,sign:v.sign,zero:false,exponent:oldExp,infinite:true});
  if(oldExp===0)return normalize({pinned:v.pinned,sign:v.sign,zero:true,exponent:0,infinite:false});
  return normalize({pinned:v.pinned,sign:v.sign,zero:false,
   exponent:Math.log10(Math.pow(10,oldExp)-1),infinite:false});
 }
 function magnitude(v){v=normalize(v);return v.infinite?null:v.zero?0:Math.pow(10,v.exponent)}
 function signedValue(v){v=normalize(v);const absolute=magnitude(v);return absolute===null?null:v.sign*absolute}
 function descriptor(v){
  v=normalize(v);
  if(!v.pinned)return "FREE / UNPINNED";
  if(v.infinite)return v.sign<0?"−∞ (symbolic)":"+∞ (symbolic)";
  if(v.zero)return "0 / EXACT SCALAR ZERO D";
  return (v.sign<0?"−":"+")+"10^"+v.exponent.toFixed(2)+" / MODEL UNITS";
 }
 // Compressed visual LOD; reserve a visible nonzero radius for 10^-36
 // and a distinct outer limit for symbolic infinity.
 function fraction(v){
  v=normalize(v);
  if(v.infinite)return 1;
  if(v.zero)return 0;
  return .08+.86*((v.exponent-MIN_EXP)/(MAX_EXP-MIN_EXP));
 }
 function tip(id,values,origin={x:0,y:0},radius=1,flatten=1,rotationRadians=0){
  const m=decode(id),v=normalize(values),a=m.angleDegrees*Math.PI/180+rotationRadians+(v.sign<0?Math.PI:0);
  const f=fraction(v),r=radius*f;
  return{x:origin.x+Math.cos(a)*r,y:origin.y+Math.sin(a)*r*flatten,distanceRatio:f,
    direction:a,pinned:v.pinned,zero:v.zero,infinite:v.infinite,rawValue:signedValue(v)};
 }
 /* Six discrete metric beats, in the exact authored order.
  * The trailing 1/1 is a deliberate two-beat unit-scale dwell.
  * Sign and HON phase address remain independent of the exponent sequence. */
 const ROLL_BEATS=Object.freeze([
  Object.freeze({code:"−36",label:"10⁻³⁶",zero:false,exponent:-36,infinite:false}),
  Object.freeze({code:"0",label:"EXACT 0",zero:true,exponent:0,infinite:false}),
  Object.freeze({code:"+36",label:"10³⁶",zero:false,exponent:36,infinite:false}),
  Object.freeze({code:"0",label:"EXACT 0",zero:true,exponent:0,infinite:false}),
  Object.freeze({code:"1",label:"1 · FIRST",zero:false,exponent:0,infinite:false}),
  Object.freeze({code:"1",label:"1 · SECOND",zero:false,exponent:0,infinite:false})
 ]);
 function rollIndex(index){
  if(!Number.isFinite(index))throw new RangeError("Roll index must be finite");
  return ((Math.floor(index)%ROLL_BEATS.length)+ROLL_BEATS.length)%ROLL_BEATS.length;
 }
 function rollBeat(index){return ROLL_BEATS[rollIndex(index)]}
 function rollState(index,base){
  const beat=rollBeat(index);
  return normalize({...normalize(base),zero:beat.zero,exponent:beat.exponent,infinite:beat.infinite});
 }
 function model(){return Array.from({length:COUNT},(_,id)=>({...decode(id),value:defaults()}))}
 if(model().length!==732||encode(366,"+")!==731||encode(1,"−")!==0||
   !model().every(x=>encode(x.address,x.polarity)===x.id)||
   magnitude({zero:true,exponent:0})!==0||
   magnitude({zero:false,exponent:-36})!==1e-36||
   magnitude({zero:false,exponent:0})!==1||
   magnitude({zero:false,exponent:36})!==1e36||
   fraction({zero:true})!==0||
   !(fraction({zero:false,exponent:-36})>0&&fraction({infinite:true})===1)||
   ROLL_BEATS.length!==6||
   ROLL_BEATS.map(b=>b.code).join("/")!=="−36/0/+36/0/1/1"||
   rollState(1).zero!==true||rollState(3).zero!==true||
   rollState(4).zero!==false||magnitude(rollState(4))!==1||
   magnitude(rollState(0))!==1e-36||magnitude(rollState(2))!==1e36||
   magnitude(rollState(5))!==1||rollIndex(-1)!==5)
  throw new Error("ROOT0 GEN11 metric boundary failed");
 global.ROOT0_VECTOR_732=Object.freeze({metric:"root0-gen11-signed-power10-v2",count:COUNT,addresses:ADDRESSES,
  minExponent:MIN_EXP,maxExponent:MAX_EXP,maxExponentV1:36,step:STEP,
  decode,encode,normalize,migrateV1,defaults,descriptor,magnitude,signedValue,fraction,tip,model,
  rollBeats:ROLL_BEATS,rollIndex,rollBeat,rollState});
})(typeof window!=="undefined"?window:this);
