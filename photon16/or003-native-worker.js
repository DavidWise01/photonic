'use strict';
// Dedicated compute lane; no synthetic fallback. .dlw
self.onmessage=async({data})=>{
 try{
  const {mode,pattern,weight}=data;
  const response=await fetch(new URL('wasm/photon16.wasm',self.location.href));
  if(!response.ok)throw Error('HTTP '+response.status);
  const e=(await WebAssembly.instantiate(await response.arrayBuffer(),{})).instance.exports;
  if(e.photon_abi()!==83)throw Error('ABI mismatch');
  let result;
  if(mode==='kernel'){
   if(e.photon_run()!==552960)throw Error('coverage mismatch');
   result=Array.from({length:8},(_,g)=>Array.from({length:26},(_,k)=>Array.from({length:8},(_,c)=>e.photon_metric(g,k,c))));
  }else{
   if(!Number.isInteger(pattern)||pattern<0||pattern>3||!Number.isInteger(weight)||weight<0||weight>65536)throw Error('invalid policy input');
   if(mode==='policy')result=Array.from({length:4},(_,i)=>Array.from({length:8},(_,k)=>e.photon_resource(pattern,weight,i,k)));
   else if(mode==='online'){
    if(e.photon_online_run(pattern,weight)!==96)throw Error('Incomplete trace');
    result=Array.from({length:96},(_,t)=>Array.from({length:5},(_,k)=>e.photon_online_metric(t,k)));
   }else throw Error('invalid mode');
  }
  self.postMessage({ok:true,mode,result});
 }catch(e){self.postMessage({ok:false,error:String(e.message||e)});}
};
