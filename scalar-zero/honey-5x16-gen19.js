/* ROOT0 · GEN19 · HONEY five-operator / 16-operant shared plane
 * Primary notation: 1×4×1×4×1×4×1×4×1 = five operator nodes,
 * with four four-lane interconnects. This is TOPOLOGY, not arithmetic
 * multiplication. Shared operants: 4×4=16, five independent operator
 * control banks each address those same 16: 5×16=80 control addresses.
 *
 * Routes: 4^4=256 distinct four-hop lane choices. The five routed
 * transfer cells for [a,b,c,d] are (0,a),(a,b),(b,c),(c,d),(d,0).
 * Boundary lane 0 is symbolic scalar reference {{i}}, not a particle.
 * Endpoint pinning limits H/Y routed reachability to 4 of 16 cells each
 * unless an additional external connection or loopback is specified.
 * Pure abstract routing model; does not assert a fifth force, a physical
 * origin of elements, or chemical bond energies.
 */
(function(g){
"use strict";
const OPERATORS=Object.freeze(["H","O","N","E","Y"]);
const MEANINGS=Object.freeze({
 H:"Hydrogen basis", O:"Oxygen basis", N:"Nitrogen basis",
 E:"Energy control", Y:"Yellow-light / optical output"
});
const WIDTH=4,OPERANT_COUNT=16,LINKS=4,ROUTES=256,SCHEMA="root0-gen19-honey-5x16-v1";
const assert=(v,s)=>{if(!v)throw Error("GEN19 invariant: "+s)};
function cell(row,col){
 if(!Number.isInteger(row)||row<0||row>=WIDTH||!Number.isInteger(col)||col<0||col>=WIDTH)
  throw RangeError("4×4 cell address must be a pair in 0..3");
 return row*WIDTH+col;
}
function decode(route){
 if(!Number.isInteger(route)||route<0||route>=ROUTES)throw RangeError("route must be 0..255");
 let n=route;const a=Array(LINKS).fill(0);
 for(let j=LINKS-1;j>=0;j--){a[j]=n%WIDTH;n=Math.floor(n/WIDTH)}
 return a;
}
function encode(lanes){
 if(!Array.isArray(lanes)||lanes.length!==LINKS||lanes.some(x=>!Number.isInteger(x)||x<0||x>=WIDTH))
  throw RangeError("four lane selections must each be 0..3");
 return lanes.reduce((n,x)=>n*WIDTH+x,0);
}
function trace(lanesOrRoute){
 const lanes=Array.isArray(lanesOrRoute)?decode(encode(lanesOrRoute)):decode(lanesOrRoute);
 const inOut=[
  [0,lanes[0]],[lanes[0],lanes[1]],[lanes[1],lanes[2]],
  [lanes[2],lanes[3]],[lanes[3],0]
 ];
 return Object.freeze(inOut.map(([incoming,outgoing],operatorIndex)=>
  Object.freeze({operator:OPERATORS[operatorIndex],operatorIndex,
   incoming,outgoing,operant:cell(incoming,outgoing)})));
}
function initialState(){
 return Object.freeze(OPERATORS.map(op=>Object.freeze(Array(OPERANT_COUNT).fill(true))));
}
function setGate(state,operator,operant,enabled){
 const i=OPERATORS.indexOf(operator);
 if(i<0)throw RangeError("unknown operator");
 if(!Number.isInteger(operant)||operant<0||operant>=OPERANT_COUNT)throw RangeError("operant 0..15");
 if(typeof enabled!=="boolean")throw TypeError("gate state must be boolean");
 if(state.length!==OPERATORS.length||state.some(row=>row.length!==OPERANT_COUNT))throw RangeError("5×16 state expected");
 return Object.freeze(state.map((row,j)=>Object.freeze(j===i?row.map((bit,k)=>k===operant?enabled:bit):[...row])));
}
function walk(state,route){
 const path=trace(route);
 const stages=path.map(stage=>Object.freeze({...stage,enabled:state[stage.operatorIndex][stage.operant]}));
 return Object.freeze({route:encode(decode(route)),lanes:decode(route),stages,
  passed:stages.every(x=>x.enabled),blockedBy:stages.filter(x=>!x.enabled).map(x=>x.operator)});
}
function census(){
 const visited=OPERATORS.map(()=>new Set()),usage=OPERATORS.map(()=>Array(OPERANT_COUNT).fill(0));
 for(let id=0;id<ROUTES;id++)
  for(const t of trace(id)){visited[t.operatorIndex].add(t.operant);usage[t.operatorIndex][t.operant]++}
 return Object.freeze({uniqueRoutedCellsByOperator:Object.freeze(visited.map(v=>v.size)),
  reachableTotal:visited.reduce((n,s)=>n+s.size,0),
  addressCapacity:OPERATORS.length*OPERANT_COUNT,
  endpointRestricted:true,
  useCountByOperator:usage});
}
function test(){
 const initial=initialState(),seen=new Set();
 let everyLength=true,everyAddressValid=true,everyRoutePasses=true;
 for(let id=0;id<ROUTES;id++){
  const lanes=decode(id),steps=trace(id),result=walk(initial,id);
  seen.add(lanes.join(","));
  everyLength=everyLength&&steps.length===OPERATORS.length;
  everyAddressValid=everyAddressValid&&steps.every((s,j)=>s.operator===OPERATORS[j]&&s.operant>=0&&s.operant<OPERANT_COUNT);
  everyRoutePasses=everyRoutePasses&&result.passed;
 }
 const toggled=setGate(initial,"N",cell(0,0),false);
 const blocked=walk(toggled,0),unblocked=walk(toggled,encode([1,2,3,0]));
 const c=census(),tests={
  fiveOperatorNodes:OPERATORS.length===5,
  fourFourLaneLinks:LINKS===4&&WIDTH===4,
  sixteenSharedOperants:OPERANT_COUNT===16,
  eightyIndependentControlAddresses:initial.length===5&&initial.every(r=>r.length===16),
  twoHundredFiftySixUniqueLaneRoutes:seen.size===256&&encode(decode(255))===255,
  allFiveStagesPerRoute:everyLength,
  everyOperantAddressValid:everyAddressValid,
  initialFullGatingPassesEveryRoute:everyRoutePasses,
  gatingBlocksOnlySelectedPath:!blocked.passed&&blocked.blockedBy.join(",")==="N"&&unblocked.passed,
  immutablePerOperatorGate:initial[2][0]===true&&toggled[2][0]===false&&
   OPERATORS.every((op,j)=>j===2||initial[j].every((v,i)=>toggled[j][i]===v)),
  endpointPinningReported:c.uniqueRoutedCellsByOperator.join(",")==="4,16,16,16,4"&&c.reachableTotal===56
 };
 return Object.freeze({schema:SCHEMA,checks:Object.freeze(tests),passed:Object.values(tests).every(Boolean),
  topology:Object.freeze({operators:5,links:4,lanesPerLink:4,operantsPerOperator:16,
   sharedOperants:16,controlAddresses:80,routeChoices:256,
   distinctRoutedOperatorOperants:c.reachableTotal}),
  census:c,negativeControl:Object.freeze({blocked,unblocked})});
}
const initialTest=test();assert(initialTest.passed,"GEN19 self-test failed");
g.ROOT0_HONEY_5x16=Object.freeze({schema:SCHEMA,operators:OPERATORS,meanings:MEANINGS,
 width:WIDTH,operants:OPERANT_COUNT,linkCount:LINKS,routes:ROUTES,
 cell,decode,encode,trace,initialState,setGate,walk,census,test});
})(typeof window!=="undefined"?window:this);
