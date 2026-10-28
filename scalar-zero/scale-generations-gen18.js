/* ROOT0 GEN18 — fractional log10 generations, 366 / 370 / 999 intervals.
 * GEN15's 26 whole-power / terminal floor anchors are preserved exactly.
 * Intervals are fractions of a decade; they are NOT 999 powers of ten.
 * GEN16 still has 366 original HON colors, independently mapped onto the axis.
 * GEN17 remains a hypothetical H/Og normalized shape test, not an actual
 * physical compression experiment or a Higgs compositeness calculation.
 */
(function(g){
"use strict";
const S=g.ROOT0_SCALE_DESCENT,I=g.ROOT0_SPHERICAL_INVARIANT;
if(!S||S.mouthMeters!==1e-10||S.floorMeters!==1.61615e-35)
 throw Error("GEN18 requires GEN15 logarithmic reference");
const MODES=Object.freeze([366,370,999]),DEFAULT=370,VERSION="root0-gen18-fractional-decade-v1";
const log10=Math.log10;
function mode(n){if(!MODES.includes(n))throw RangeError("GEN18 allows 366, 370, 999 intervals");return n}
function level(index,segments=DEFAULT){
 mode(segments);
 if(!Number.isInteger(index)||index<0||index>segments)throw RangeError("Level index outside 0..segments");
 const t=index/segments;
 // Use the existing normalized physical log axis, ensuring exact endpoints.
 const meters=index===0?S.mouthMeters:index===segments?S.floorMeters:S.metersAt(t);
 const exponent=log10(meters),honAddress=1+Math.min(365,Math.floor(366*t));
 return Object.freeze({index,segments,t,meters,exponent,
  fractionalDecade:true,honAddress,
  wholePowerAnchor:false,
  floor:index===segments,origin:index===0});
}
function levels(segments=DEFAULT){
 mode(segments);
 return Object.freeze(Array.from({length:segments+1},(_,i)=>level(i,segments)));
}
function metadata(segments=DEFAULT){
 mode(segments);
 return Object.freeze({schema:VERSION,intervals:segments,nodes:segments+1,
  exponentRange:[S.logTop,S.logFloor],
  exponentDelta:(S.logFloor-S.logTop)/segments,
  topMeters:S.mouthMeters,floorMeters:S.floorMeters,
  honColorAddresses:366,retainedScientificLandmarks:S.generations.length,
  endpointsInclusive:true,
  meaning:"fractional log10 scale intervals, not 366/370/999 separate elements or measured quantum steps"});
}
function closestLevel(meters,segments=DEFAULT){
 mode(segments);if(!Number.isFinite(meters)||meters<=0)throw RangeError("positive finite meters expected");
 return level(Math.min(segments,Math.max(0,Math.round(S.t(meters)*segments))),segments);
}
function compressionSweep(symbol,segments=DEFAULT){
 mode(segments);
 if(!I||!I.identity[symbol])throw Error("GEN18 H/Og compression requires GEN17");
 const base=I.model.baseReferenceMeters,floor=I.model.floorMeters;
 let lastRadius=Infinity,lastDensity=-Infinity,identities=true,monotone=true,finite=true;
 let first=null,final=null;
 for(let j=0;j<=segments;j++){
  const t=j/segments;
  const radius=j===0?base:j===segments?floor:
   Math.exp(Math.log(base)+(Math.log(floor)-Math.log(base))*t);
  const stretch=j===0?1:j===segments?0:(radius-floor)/(base-floor);
  const state=I.compress(symbol,stretch);
  if(j===0)first=state;
  if(j===segments)final=state;
  identities=identities&&state.identity.symbol===symbol&&state.identity.Z===I.identity[symbol].Z&&!state.chemicalTransmutation;
  const density=state.shape.log10RelativeInformationDensity;
  finite=finite&&state.shape.radiusMeters>0&&Number.isFinite(density);
  if(j>0)monotone=monotone&&state.shape.radiusMeters<lastRadius&&density>lastDensity;
  lastRadius=state.shape.radiusMeters;lastDensity=density;
 }
 return Object.freeze({symbol,Z:I.identity[symbol].Z,intervals:segments,nodes:segments+1,
  firstRadiusMeters:first.shape.radiusMeters,lastRadiusMeters:final.shape.radiusMeters,
  lastDensityDex:final.shape.log10RelativeInformationDensity,
  identityPreserved:identities,monotone,finite,
  pass:identities&&monotone&&finite&&final.shape.radiusMeters===floor});
}
function test(segments=DEFAULT){
 const a=levels(segments),meta=metadata(segments);
 let inc=true,hon=true;
 for(let i=1;i<a.length;i++){
  inc=inc&&a[i].t>a[i-1].t&&a[i].meters<a[i-1].meters;
  hon=hon&&a[i].honAddress>=a[i-1].honAddress;
 }
 const tests={count:a.length===segments+1,firstExact:a[0].meters===1e-10,
  floorExact:a.at(-1).meters===1.61615e-35,logMonotonic:inc,
  originalHONRange:hon&&a[0].honAddress===1&&a.at(-1).honAddress===366,
  landmark26Unchanged:S.generations.length===26,
  positiveEverywhere:a.every(x=>x.meters>0&&Number.isFinite(x.meters))};
 let H=null,Og=null;
 if(I){H=compressionSweep("H",segments);Og=compressionSweep("Og",segments);
  tests.HIdentityAndDensity=H.pass;tests.OgIdentityAndDensity=Og.pass;
  tests.identitySeparate=H.Z!==Og.Z;
 }
 return {schema:VERSION,meta,checks:tests,pass:Object.values(tests).every(Boolean),H,Og};
}
for(const n of MODES){const r=test(n);if(!r.pass)throw Error("GEN18 "+n+"-interval invariant failed")}
g.ROOT0_SCALE_GENERATIONS=Object.freeze({schema:VERSION,modes:MODES,defaultMode:DEFAULT,mode,level,levels,metadata,
 closestLevel,compressionSweep,test});
})(typeof window!=="undefined"?window:this);
