/* ROOT0 GEN13 · one reference floor tile at user-specified length
 * 1 × 1.61615 × 10^-35 meters. This is a scale annotation/model pitch,
 * not a measured lattice or a physical minimal cutoff.
 * CODATA 2022 recommended Planck length: 1.616255(18) × 10^-35 m.
 * Source: https://physics.nist.gov/cuu/pdf/all.pdf
 */
(function(g) {
 "use strict";
 const unitMeters=1.61615e-35;
 const codata2022Meters=1.616255e-35;
 const allowedGridSizes=Object.freeze([1,13,27]);
 const geometry=Object.freeze({schema:"root0-gen13-floor-v1",
  userExpression:"1 × 1.61615 × 10^-35 m",
  oneTilePitchMeters:unitMeters,authorValueMeters:unitMeters,
  codata2022PlanckLengthMeters:codata2022Meters,
  floorUnits:"reference tile; not physical quantum-lattice cell",
  modelOrigin:Object.freeze({x:0,y:0,z:0}),gridSizeDefault:13
 });
 function isAllowed(size){return allowedGridSizes.includes(size)}
 function span(size){if(!isAllowed(size))throw RangeError("Floor grid size must be 1, 13 or 27");
  return size*unitMeters}
 function tile(x,z){if(!Number.isInteger(x)||!Number.isInteger(z))throw TypeError("Tile indices must be integers");
  return Object.freeze({x,z,xMeters:x*unitMeters,zMeters:z*unitMeters})}
 function project(x,z,centerX,centerY,unitPx){
  for(const n of [x,z,centerX,centerY,unitPx])if(!Number.isFinite(n))throw RangeError("Floor projector requires finite coordinates");
  if(unitPx<=0)throw RangeError("Floor projector pixel pitch must be positive");
  return {x:centerX+(x-z)*unitPx*.68,y:centerY+(x+z)*unitPx*.245}
 }
 function projectedGrid(size,cx,cy,pitchPx){
  if(!isAllowed(size))throw RangeError("Grid size not supported");
  const half=size/2,lines=[];
  for(let i=0;i<=size;i++){
   const v=i-half;
   lines.push([project(v,-half,cx,cy,pitchPx),project(v,half,cx,cy,pitchPx)]);
   lines.push([project(-half,v,cx,cy,pitchPx),project(half,v,cx,cy,pitchPx)]);
  }
  return lines;
 }
 function ratioToCODATA(){return unitMeters/codata2022Meters}
 if(geometry.oneTilePitchMeters!==1.61615e-35||
  span(13)!==13*unitMeters||Math.abs(ratioToCODATA()-1)>0.001||
  projectedGrid(13,0,0,10).length!==28||
  project(0,0,12,9,3).x!==12)throw Error("GEN13 floor invariant failed");
 g.ROOT0_FIELD_FLOOR=Object.freeze({geometry,allowedGridSizes,isAllowed,span,tile,project,projectedGrid,ratioToCODATA});
})(typeof window!=="undefined"?window:this);
