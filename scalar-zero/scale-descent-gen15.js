/* ROOT0 GEN15 — logarithmic generations from atom-scale 10^-10 m down
 * to the exact author-defined GEN13 floor of 1.61615e-35 m.
 * Distinguishes physical structure sizes, photon wavelengths, Compton lengths,
 * and experimental probe bounds; none is treated as another's radius.
 *
 * References:
 * NASA X-ray / gamma wavelength ranges:
 * https://heasarc.gsfc.nasa.gov/docs/heasarc/headates/spectrum.html
 * Helium-4 alpha rms charge radius 1.67824(83) fm:
 * https://www.nature.com/articles/s41586-021-03183-1
 * CERN 2026 quark no substructure to 10^-20 m:
 * https://home.cern/cms-looks-deep-inside-quarks/
 * CERN 125 GeV Higgs mass benchmark:
 * https://cmsexperiment.web.cern.ch/physics/higgs-boson/observation-new-particle-mass-125-gev
 * NIST/CODATA 2022 Planck length 1.616255e-35 m:
 * https://physics.nist.gov/cuu/pdf/all.pdf
 */
(function(g){
 "use strict";
 const floor=1.61615e-35,mouth=1e-10,logFloor=Math.log10(floor),logTop=-10;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const markers=Object.freeze([
 {key:"atom",label:"ATOM / atomic diameter",meters:1e-10,kind:"size",color:"#8ceafa",
   detail:"Representative atom-scale length, not a universal diameter.",source:"https://cds.cern.ch/record/2204859/files/CERN%20Higgs%20Panel.pdf"},
 {key:"xray",label:"X-RAY / example wavelength",meters:1e-11,kind:"wavelength",color:"#7ac6ff",
   detail:"Illustrative X-ray photon wavelength of 0.01 nm. A wavelength is not a photon diameter; X-ray ranges vary by convention.",source:"https://heasarc.gsfc.nasa.gov/docs/heasarc/headates/spectrum.html"},
 {key:"gamma",label:"GAMMA / example wavelength",meters:1e-13,kind:"wavelength",color:"#afadff",
   detail:"Illustrative 0.1 pm gamma-ray wavelength, not gamma-photon size. X-ray/gamma energy bands can overlap; origins and conventions differ.",source:"https://heasarc.gsfc.nasa.gov/docs/heasarc/headates/spectrum.html"},
 {key:"nucleus",label:"NUCLEUS / representative radius scale",meters:1e-15,kind:"size",color:"#ffb1be",
   detail:"Representative nuclear size order of magnitude; different nuclei have different radii.",source:"https://cds.cern.ch/record/2204859/files/CERN%20Higgs%20Panel.pdf"},
 {key:"alpha",label:"ALPHA DECAY / emitted ⁴He nucleus radius",meters:1.67824e-15,kind:"size",color:"#ff9e9b",
   detail:"Measured helium-4 alpha particle RMS charge radius, 1.67824(83) fm. Alpha decay is a process; this is the size of its emitted nucleus.",source:"https://www.nature.com/articles/s41586-021-03183-1"},
 {key:"proton",label:"PROTON / charge radius ~0.84 fm",meters:.84075e-15,kind:"size",color:"#fac08f",
   detail:"Approximately 0.84 fm proton RMS charge radius (CODATA 2022), not a universal hadron size.",source:"https://physics.nist.gov/cuu/pdf/all.pdf"},
 {key:"higgs",label:"HIGGS / reduced Compton length",meters:1.57861584e-18,kind:"compton",color:"#ffe39a",
   detail:"Calculated ħ/(mc) from a roughly 125 GeV Higgs mass. NOT its measured spatial radius or Higgs-field extent.",source:"https://cmsexperiment.web.cern.ch/physics/higgs-boson/observation-new-particle-mass-125-gev"},
 {key:"beta",label:"BETA DECAY / electron, unresolved size",meters:1e-18,kind:"limit",color:"#b2d0ff",
   detail:"Beta decay emits an electron or positron (and neutrino). No finite electron radius is known; this 10^-18 m level marks illustrative pointlike-resolution context, NOT a beta-particle diameter.",source:"https://www.energy.gov/science/doe-explainsbeta-decay"},
 {key:"elementary",label:"ELEMENTARY / quark probe to ~10⁻²⁰ m",meters:1e-20,kind:"limit",color:"#92ffcf",
   detail:"CERN CMS 2026 reports no quark substructure in a benchmark composite-quark search down to ~10^-20 m. This is a probe/constraint, not a detected quark radius.",source:"https://home.cern/cms-looks-deep-inside-quarks/"},
 {key:"floor",label:"FLOOR / author-specified reference tile",meters:floor,kind:"floor",color:"#c7ffeb",
   detail:"The author's one-tile reference pitch is 1.61615×10^-35 m. It differs from CODATA 2022 Planck length 1.616255×10^-35 m; not an observed fundamental floor.",source:"https://physics.nist.gov/cuu/pdf/all.pdf"}
 ].map(x=>Object.freeze(x)));
 const categoryOrder=Object.freeze(["size","wavelength","compton","limit","floor"]);
 function t(meters){if(!Number.isFinite(meters)||meters<=0)throw RangeError("Positive finite length required");return clamp((logTop-Math.log10(meters))/(logTop-logFloor),0,1)}
 function metersAt(tValue){const u=clamp(tValue,0,1);return Math.pow(10,logTop+(logFloor-logTop)*u)}
 function generations(){let list=[];for(let e=-10;e>=-34;e--)list.push(Object.freeze({
  generation:-10-e,exponent:e,meters:10**e,t:t(10**e),
  label:"GEN "+String(-10-e).padStart(2,"0")+" · 10^"+e+" m"}));
  list.push(Object.freeze({generation:25,exponent:logFloor,meters:floor,t:1,label:"FLOOR · 1.61615×10^-35 m"}));
  return Object.freeze(list)
 }
 const gens=generations();
 function filtered(kind="all"){if(kind!=="all"&&!categoryOrder.includes(kind))throw RangeError("Unknown marker kind");return markers.filter(x=>kind==="all"||x.kind===kind)}
 function near(tValue,kind="all"){const list=filtered(kind);return list.reduce((best,m)=>!best||Math.abs(t(m.meters)-tValue)<Math.abs(t(best.meters)-tValue)?m:best,null)}
 function markerInfo(key){return markers.find(x=>x.key===key)||null}
 function setupMarkers(){
  return markers.map(x=>({...x,t:t(x.meters),log10:Math.log10(x.meters)}))
 }
 if(gens.length!==26||gens[0].exponent!==-10||gens[24].exponent!==-34||gens[25].meters!==floor
  ||Math.abs(t(1e-10))>1e-12||t(floor)!==1
  ||gens.some((x,i)=>i>0&&!(x.t>gens[i-1].t))||
  !markers.every(x=>x.meters>=floor&&x.meters<=mouth)||
  markers.length!==10||Math.abs(Math.log10(metersAt(t(1e-20)))-(-20))>1e-10)
  throw Error("GEN15 log scale invariant failed");
 g.ROOT0_SCALE_DESCENT=Object.freeze({schema:"root0-gen15-log-descent-v1",mouthMeters:mouth,floorMeters:floor,
  logTop,logFloor,markers,categoryOrder,generations:gens,t,metersAt,filtered,near,markerInfo,setupMarkers});
})(typeof window!=="undefined"?window:this);
