/* ROOT0 GEN17 — two-angle oscillation / spherical identity invariant
 * Hypothetical symbolic quanta model, NOT a hydrogen compression experiment,
 * elemental transmutation, a Higgs substructure derivation, or radiation model.
 * Deterministic irrational-rotation sampling deliberately covers the sphere;
 * the one-angle phase-locked control fails isotropy. Identity (H Z=1,
 * Og Z=118) remains independent of stretch and display palette.
 *
 * Physical reference categories (not conflated):
 * H Bohr radius approx 5.29177210903e-11 m (scale reference);
 * H-alpha emission wavelength ~656.3nm;
 * observed orange H flames primarily sodium impurities ~589nm;
 * Og emission / flame color unknown; short-lived synthetic element.
 */
(function(g){
"use strict";
const TAU=Math.PI*2;
const MODEL=Object.freeze({
 schema:"root0-gen17-spherical-invariant-v1",
 floorMeters:1.61615e-35,baseReferenceMeters:5.29177210903e-11,
 sampleCount:16384,threshold:0.01,entropyThresholdBits:2.95,
 mode:"two independent angular sampler channels, not particle spin quantum numbers",
 status:"computational toy model; not a test of Standard Model or Higgs composition"
});
const identity=Object.freeze({
 H:Object.freeze({symbol:"H",Z:1,name:"Hydrogen",paletteAddress:1,
    observedHAlphaNm:656.3,flameColor:"usually faint / near-invisible; orange often sodium contamination at ~589 nm",
    measuredElementalEmission:"H-alpha 656.3 nm",flameColorReliable:false}),
 Og:Object.freeze({symbol:"Og",Z:118,name:"Oganesson",paletteAddress:118,
    observedHAlphaNm:null,flameColor:"not experimentally established",
    measuredElementalEmission:"not established",flameColorReliable:false})
});
const fract=x=>x-Math.floor(x);
const check=(ok,msg)=>{if(!ok)throw Error("GEN17 invariant: "+msg)};
function geometry(stretch){
 if(!Number.isFinite(stretch)||stretch<0||stretch>1)throw RangeError("Stretch must be 0..1");
 const radiusMeters=MODEL.floorMeters+stretch*(MODEL.baseReferenceMeters-MODEL.floorMeters);
 const referenceVolume=(4/3)*Math.PI*Math.pow(radiusMeters,3);
 return Object.freeze({stretch,radiusMeters,
  hLikeGeometricExtension:stretch,
  log10ReferenceVolume:Math.log10(4*Math.PI/3)+3*Math.log10(radiusMeters),
  log10RelativeInformationDensity:3*Math.log10(MODEL.baseReferenceMeters/radiusMeters),
  floorRegularization:true,physicalDensityMeasured:false,
  volumeFinite:Number.isFinite(referenceVolume)&&referenceVolume>0});
}
function unitPoint(j,locked=false){
 if(!Number.isInteger(j)||j<0)throw RangeError("Nonnegative sample index");
 // Independent irrational rotations. Only the normalized directions are
 // generated; neither channel is assigned real W charge or physical spin.
 const u=fract((j+.5)*Math.SQRT2),v=fract((j+.5)*Math.sqrt(3));
 const z=2*u-1,phi=locked?0:TAU*v,s=Math.sqrt(Math.max(0,1-z*z));
 return [s*Math.cos(phi),s*Math.sin(phi),z];
}
function moments(count=MODEL.sampleCount,locked=false){
 if(!Number.isInteger(count)||count<100||count>100000)throw RangeError("Sample count 100..100000");
 const c=[0,0,0],m=[0,0,0],cross=[0,0,0],octants=Array(8).fill(0);
 for(let j=0;j<count;j++){
  const [x,y,z]=unitPoint(j,locked),r=[x,y,z];
  for(let k=0;k<3;k++){c[k]+=r[k];m[k]+=r[k]*r[k]}
  cross[0]+=x*y;cross[1]+=x*z;cross[2]+=y*z;
  octants[(x>=0?1:0)|(y>=0?2:0)|(z>=0?4:0)]++;
 }
 const centroid=c.map(x=>x/count),diagonal=m.map(x=>x/count),
  offDiagonal=cross.map(x=>x/count);
 const isotropyError=Math.max(...diagonal.map(x=>Math.abs(x-1/3)),...offDiagonal.map(Math.abs));
 const centroidNorm=Math.hypot(...centroid);
 const octantEntropy=octants.reduce((sum,n)=>{
  if(!n)return sum;
  const p=n/count;return sum-p*Math.log2(p);
 },0);
 return {sampleCount:count,locked,centroid,diagonal,offDiagonal,octants,
  octantEntropyBits:octantEntropy,isotropyError,centroidNorm,
  pass:isotropyError<MODEL.threshold&&centroidNorm<MODEL.threshold&&
       octantEntropy>MODEL.entropyThresholdBits};
}
function compress(symbol,stretch,paletteColorHex=null){
 const source=identity[symbol];if(!source)throw RangeError("Only H and Og controls are defined");
 const shape=geometry(stretch);
 return Object.freeze({identity:source,shape,paletteColorHex,
  displayColorIsNotPhysicalEmission:true,chemicalTransmutation:false,
  scalarZeroIsModelStretchZero:stretch===0});
}
function test(){
 const coherent=moments(),locked=moments(MODEL.sampleCount,true);
 const scales=[1,.5,.1,.01,0],states={};
 for(const symbol of ["H","Og"]){
  const values=scales.map(s=>compress(symbol,s));
  states[symbol]={
   Z:identity[symbol].Z,stretches:scales,
   dimensions:values.map(x=>x.shape.radiusMeters),
   volumesPositive:values.every(x=>x.shape.volumeFinite),
   identityPreserved:values.every(x=>x.identity.Z===identity[symbol].Z&&
     x.identity.symbol===symbol&&x.chemicalTransmutation===false),
   densityMonotonic:values.every((x,i)=>i===0||
     x.shape.log10RelativeInformationDensity>values[i-1].shape.log10RelativeInformationDensity)
  };
 }
 const checks={
  coherentSphereIsotropic:coherent.pass,
  phaseLockedControlFails:!locked.pass&&locked.isotropyError>.2,
  hydrogenIdentityPreserved:states.H.identityPreserved,
  oganessonIdentityPreserved:states.Og.identityPreserved,
  elementsRemainDistinct:identity.H.Z!==identity.Og.Z,
  noPhysicalColorsInvented:identity.Og.measuredElementalEmission==="not established"&&
    identity.H.observedHAlphaNm===656.3,
  finiteFloorAllScales:states.H.volumesPositive&&states.Og.volumesPositive,
  densityIncreasesUnderCompression:states.H.densityMonotonic&&states.Og.densityMonotonic,
  zeroStretchIsNotZeroRadius:geometry(0).radiusMeters===MODEL.floorMeters,
  noPhysicalTransmutation:true
 };
 return {schema:MODEL.schema,checks,pass:Object.values(checks).every(Boolean),
  coherent,locked,states,model:MODEL};
}
const initial=test();
check(initial.pass,"initial deterministic test failed");
g.ROOT0_SPHERICAL_INVARIANT=Object.freeze({
 model:MODEL,identity,geometry,unitPoint,moments,compress,test
});
})(typeof window!=="undefined"?window:this);
