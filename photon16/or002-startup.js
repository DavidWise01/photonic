/* OR002: ordered, explicitly activated historical lane. .dlw */
(()=>{'use strict';
const records=[];let state='reserved',activation=null;
const report=()=>({state,records:records.map(x=>({...x})),scope:'script activation wall time, includes network and scheduling',releaseAuthority:'HOLD'});
window.PHOTON_STARTUP=Object.freeze({report});
window.addEventListener('DOMContentLoaded',()=>{
 const button=document.getElementById('or002-activate'),out=document.getElementById('or002-status');
 if(!button||!out)return;
 const queue=[...document.querySelectorAll('script[type="application/photon-history"]')];
 const render=()=>out.textContent=JSON.stringify(report(),null,2);
 button.onclick=()=>{
  if(activation)return;
  button.disabled=true;state='activating';render();
  activation=(async()=>{
   for(const old of queue){
    await new Promise(r=>setTimeout(r,0));
    const start=performance.now(),script=document.createElement('script'),src=old.dataset.src;
    if(src){script.async=false;script.src=src;await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(Error('load failed '+src));old.after(script);});}
    else{script.textContent=old.textContent;old.after(script);}
    records.push({source:src||'inline',wallMs:performance.now()-start});render();
   }
   state='activated';render();
  })().catch(e=>{state='failed';records.push({error:String(e)});render();});
 };
 render();
});
})();
