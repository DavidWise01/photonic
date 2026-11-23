/* PHOTON-16 v0.15 · domain nibble/VM overlay — additive; 16 agents remain 16. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const roles=['User A','Factory A','Factory B','Factory C'];
const names=['VM 1','VM 2'];
const C=window.PHOTON_CLOCK13;
function decode(address){
 if(!Number.isInteger(address)||address<0||address>=1536)throw new RangeError('agent address must be 0..1535');
 const domainGlobal=Math.floor(address/16),localAgent=address%16;
 const nibble=Math.floor(localAgent/4),bitInNibble=localAgent%4,vm=Math.floor(nibble/2);
 return {address,sector:Math.floor(domainGlobal/32),quad:Math.floor((domainGlobal%32)/8),domain:domainGlobal%8,domainGlobal,
 localAgent,nibble,bitInNibble,vm,vmName:names[vm],role:roles[nibble]};
}
function audit(){
 const errors=[],seen=new Set(),nibbles=Array(384).fill(0),vms=Array(192).fill(0);
 for(let a=0;a<1536;a++){
  let p=decode(a),base=((p.sector*4+p.quad)*8+p.domain)*16;
  if(base+p.localAgent!==a)errors.push('address inverse '+a);
  if(p.vm!==Math.floor(p.nibble/2)||p.role!==roles[p.nibble])errors.push('role mapping '+a);
  if(seen.has(a))errors.push('duplicate '+a);seen.add(a);
  nibbles[p.domainGlobal*4+p.nibble]++;
  vms[p.domainGlobal*2+p.vm]++;
 }
 nibbles.forEach((n,i)=>{if(n!==4)errors.push('nibble capacity '+i)});
 vms.forEach((n,i)=>{if(n!==8)errors.push('vm capacity '+i)});
 for(let t=0;t<360;t++){
  let b=C.schedule(t),start=(b.sector*4+b.quad)*128+Math.floor((t%30)*128/30),end=(b.sector*4+b.quad)*128+Math.floor(((t%30)+1)*128/30);
  if(b.start!==start||b.end!==end||b.agents.length!==end-start)errors.push('clock partition '+t);
  b.agents.forEach(x=>{let p=decode(x.address);if(p.sector!==x.sector||p.quad!==x.quad||p.domain!==x.domain||p.localAgent!==x.agent)errors.push('clock agent '+t)});
 }
 return {ok:errors.length===0,errors,agents:seen.size,nibbles:nibbles.length,vms:vms.length,domains:96,ticks:360};
}
function render(){
 const result=audit();
 $('v15-status').textContent=result.ok?'PASS · 1536 agents / 384 nibbles / 192 VMs':'FAIL · '+result.errors.slice(0,3).join('; ');
 $('v15-counts').textContent=result.agents+' agents · '+result.nibbles+' nibbles · '+result.vms+' logical VMs · '+result.ticks+' clock partitions';
 const select=Number($('v15-domain').value)||0,base=select*16,agents=Array.from({length:16},(_,i)=>decode(base+i));
 $('v15-map').innerHTML='';
 for(let vm=0;vm<2;vm++){
  let container=document.createElement('div');container.className='vm15';container.style.cssText='border:1px solid '+(vm?'#6489da':'#d48b5a')+';border-radius:13px;padding:12px;flex:1;min-width:240px;background:#0b1929';
  let h=document.createElement('h3');h.style.cssText='font:700 14px ui-monospace,monospace;margin:0 0 10px;color:#e9f3ff';h.textContent=names[vm]+' · 8 AGENTS';container.appendChild(h);
  for(let n=vm*2;n<vm*2+2;n++){
   const tile=document.createElement('div');tile.style.cssText='border:1px solid #35506b;border-radius:8px;padding:10px;margin:7px 0;background:#10243b';
   const label=document.createElement('div');label.style.cssText='font:12px ui-monospace,monospace;color:#c8e5f1;margin-bottom:7px';label.textContent='N'+n+' · '+roles[n]+' · 4 agents';tile.appendChild(label);
   const cells=document.createElement('div');cells.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px';
   for(const p of agents.filter(p=>p.nibble===n)){const b=document.createElement('div');b.style.cssText='border:1px solid #54708b;border-radius:5px;padding:8px 2px;text-align:center;background:'+(vm?'#1b274a':'#3a281c')+';color:#f3faff;font:12px ui-monospace,monospace';b.textContent=String(p.address);b.title='S'+p.sector+' Q'+p.quad+' D'+p.domain+' / '+names[vm]+' / '+roles[n]+' / agent '+p.localAgent;cells.appendChild(b)}
   tile.appendChild(cells);container.appendChild(tile);
  }
  $('v15-map').appendChild(container);
 }
 const first=decode(base);$('v15-description').textContent='Domain '+select+' · Sector '+first.sector+' · Quad '+first.quad+' · Domain '+first.domain+' · Addresses '+base+'–'+(base+15);
 return result;
}
$('v15-domain').addEventListener('change',render);
$('v15-test').addEventListener('click',render);
window.PHOTON_NIBBLE15={decode,audit,roles:roles.slice(),vms:names.slice(),render};
render();
})();