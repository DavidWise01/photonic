/* ROOT0 GEN10: 732 independently addressable signed vectors pinned to scalar D=0.
 * Source palette remains the read-only OASIS HON v9.4 366 address adapter.
 * Real arithmetic is bounded; ±∞ is a symbolic state, not an infinite canvas coordinate.
 */
(function(global){
 "use strict";
 const ADDRESSES=366,COUNT=732,MAX_EXP=36;
 function assertIndex(id){if(!Number.isInteger(id)||id<0||id>=COUNT)throw new RangeError("Vector index 0..731")}
 function decode(id){assertIndex(id);return Object.freeze({
   id,address:Math.floor(id/2)+1,phase:id%2?"plus":"minus",polarity:id%2?"+":"−",
   sign:id%2?1:-1,angleDegrees:id*360/COUNT,pair:id^1
 });}
 function encode(address,polarity){if(!Number.isInteger(address)||address<1||address>ADDRESSES)throw new RangeError("Address 1..366");
   if(!["−","+","minus","plus",-1,1].includes(polarity))throw new RangeError("Use −/+ phase");
   return (address-1)*2+((polarity==="+"||polarity==="plus"||polarity===1)?1:0)}
 function defaults(){return{pinned:false,sign:1,exponent:0,infinite:false}}
 function normalize(input){
  const v=input&&typeof input==="object"?input:{},d=defaults();
  if(typeof v.pinned==="boolean")d.pinned=v.pinned;
  if(v.sign===1||v.sign===-1)d.sign=v.sign;
  if(typeof v.exponent==="number"&&Number.isFinite(v.exponent))d.exponent=Math.min(MAX_EXP,Math.max(0,Math.round(v.exponent*4)/4));
  if(typeof v.infinite==="boolean")d.infinite=v.infinite;
  return d;
 }
 function magnitude(v){v=normalize(v);if(v.infinite)return null;return Math.pow(10,v.exponent)-1}
 function descriptor(v){
  v=normalize(v);
  if(!v.pinned)return "FREE / UNPINNED";
  if(v.infinite)return v.sign<0?"−∞ (symbolic)":"+∞ (symbolic)";
  if(v.exponent===0)return "0 / PINNED TO D";
  return (v.sign<0?"−":"+")+"(10^"+v.exponent.toFixed(2)+" − 1) / MODEL UNITS";
 }
 function fraction(v){v=normalize(v);return v.infinite?1:Math.max(0,Math.min(1,v.exponent/MAX_EXP))}
 function tip(id,values,origin={x:0,y:0},radius=1,flatten=1,rotationRadians=0){
  const m=decode(id),v=normalize(values),a=m.angleDegrees*Math.PI/180+rotationRadians+(v.sign<0?Math.PI:0);
  const fractionScale=fraction(v);let r=radius*fractionScale;
  return{x:origin.x+Math.cos(a)*r,y:origin.y+Math.sin(a)*r*flatten,distanceRatio:fractionScale,
    direction:a,pinned:v.pinned,infinite:v.infinite,rawValue:magnitude(v)};
 }
 function model(){
  return Array.from({length:COUNT},(_,id)=>({...decode(id),value:defaults()}));
 }
 if(model().length!==732||decode(0).address!==1||decode(1).address!==1||
    decode(730).address!==366||decode(731).address!==366||
    encode(366,"+")!==731||encode(1,"−")!==0||
    !model().every(x=>encode(x.address,x.polarity)===x.id))
  throw new Error("ROOT0 732-vector address invariant failed");
 global.ROOT0_VECTOR_732=Object.freeze({count:COUNT,addresses:ADDRESSES,maxExponent:MAX_EXP,
  decode,encode,normalize,defaults,descriptor,magnitude,fraction,tip,model});
})(typeof window!=="undefined"?window:this);
