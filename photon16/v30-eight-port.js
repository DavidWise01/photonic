/* PHOTON-16 v0.30: reverse-QD eight-port logical convergence.
 * 2^3 is a software addressing space. "Photon is reverse QD" is a
 * user-defined topology metaphor, not a physical quantum-dot claim.
 * A scalar point alone is lossy. A reversible point is a handle to
 * an append-only manifest plus XOR parity (one erased byte recoverable).
 */
(()=>{'use strict';
const $=id=>document.getElementById(id),TOPOLOGY='[96/24/12/4] / 3 / 3 / 1 / 1 > 2^3 > 1 > .';
const P=8,mask=255,clone=x=>JSON.parse(JSON.stringify(x));
const names=['000','001','010','011','100','101','110','111'];
const coords=id=>({x:(id>>2)&1,y:(id>>1)&1,z:id&1});
function encode(data){
 if(!Array.isArray(data)||data.length!==P||data.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('eight byte-valued ports required');
 const lanes=data.map((value,id)=>({id,xyz:names[id],value,position:coords(id)}));
 const parity=data.reduce((acc,v)=>acc^v,0);
 // The 1 > . point is an index/commitment, not data compression by magic.
 // Full reversibility requires retaining a distinct lane manifest.
 const checksum=data.reduce((acc,v,i)=>(acc+(i+1)*v)>>>0,0);
 return {topology:TOPOLOGY,lanes,parity,checksum,point:{kind:'manifest-index',value:checksum}};
}
function recover(packet,missing=null){
 if(!packet||!Array.isArray(packet.lanes)||packet.lanes.length!==8)throw Error('invalid manifest');
 if(missing!==null&&(!Number.isInteger(missing)||missing<0||missing>=8))throw Error('invalid erasure location');
 const lanes=packet.lanes.map((lane,i)=>{
  if(lane.id!==i||lane.xyz!==names[i])throw Error('identity/order mismatch');
  return lane.value;
 });
 if(missing!==null){
  if(lanes[missing]!==null)throw Error('requested erasure is not present');
  if(lanes.filter(x=>x===null).length!==1)throw Error('XOR parity handles exactly one erasure');
  lanes[missing]=lanes.reduce((a,v)=>a^(v===null?0:v),packet.parity);
 }
 if(lanes.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('unrecovered port');
 const rebuilt=encode(lanes);
 if(rebuilt.parity!==packet.parity||rebuilt.checksum!==packet.checksum)throw Error('manifest integrity check failed');
 return {lanes:rebuilt.lanes,values:lanes,restored:missing!==null,point:rebuilt.point};
}
function erase(packet,id){
 const p=clone(packet);p.lanes[id].value=null;return p;
}
function tests(){
 const base=[12,24,36,48,60,72,84,96],packet=encode(base),checks=[];
 checks.push({name:'8 unique xyz addresses',pass:new Set(packet.lanes.map(x=>x.xyz)).size===8});
 checks.push({name:'8/8 reversible with manifest',pass:JSON.stringify(recover(packet).values)===JSON.stringify(base)});
 checks.push({name:'8/8 single-port erased recovery',pass:Array.from({length:8},(_,i)=>JSON.stringify(recover(erase(packet,i),i).values)===JSON.stringify(base)).every(Boolean)});
 let refused=false;try{const p=erase(erase(packet,2),5);recover(p,2)}catch(e){refused=true}
 checks.push({name:'two erased ports correctly rejected',pass:refused});
 let corruptRefused=false;try{const p=clone(packet);p.lanes[3].value=91;recover(p)}catch(e){corruptRefused=true}
 checks.push({name:'corrupt intact port rejected by checksum',pass:corruptRefused});
 checks.push({name:'point-only intentionally not reversible',pass:packet.point.value!==undefined&&packet.point.lanes===undefined});
 checks.push({name:'preserve original 96/24/12/4 and 3/3/1/1 chain',pass:packet.topology===TOPOLOGY});
 return {ok:checks.every(x=>x.pass),checks};
}
const $port=id=>$('v30-port-'+id);
function read(){return Array.from({length:P},(_,i)=>Number($port(i).value))}
function snapshot(){
 const packet=encode(read()),missing=Number($('v30-erasure').value);
 const broken=missing<0?packet:erase(packet,missing);
 let recovered,error=null;
 try{recovered=recover(broken,missing<0?null:missing)}catch(e){error=e.message}
 return {packet,broken,missing, recovered,error};
}
function show(){
 let snap;try{snap=snapshot()}catch(e){$('v30-status').textContent='INVALID PORT · '+e.message;return}
 const {packet,missing,recovered,error}=snap;
 $('v30-checksum').textContent=String(packet.checksum);
 $('v30-parity').textContent=packet.parity.toString(16).padStart(2,'0').toUpperCase();
 $('v30-outcome').textContent=recovered?'8/8 VERIFIED': 'RECOVERY FAILED';
 $('v30-ledger').textContent=packet.lanes.map(x=>'Port '+x.xyz+' = '+String(x.value).padStart(3,' ') + (x.id===missing?'  [ERASED → '+(recovered?recovered.values[x.id]:'UNRECOVERED')+']':'')).join('\n')+
 '\n1 > . = point '+packet.point.value+' + preserved manifest + parity '+packet.parity;
 $('v30-status').textContent=error?'FAIL · '+error:'PASS · point indexed, manifest intact, '+(missing<0?'all eight ports present':'port '+names[missing]+' recovered from XOR parity');
 draw(snap);
}
function draw(snap){
 const c=$('v30-canvas'),ctx=c.getContext('2d'),w=c.width,h=c.height;
 ctx.fillStyle='#071522';ctx.fillRect(0,0,w,h);
 const {packet,missing,recovered}=snap;
 const xx=i=>130+(i%4)*125,yy=i=>76+Math.floor(i/4)*130;
 ctx.font='15px monospace';ctx.fillStyle='#d9eeff';ctx.fillText('2³ EIGHT PORTS   →   1 INDEX   →   . POINT',22,25);
 packet.lanes.forEach((p,i)=>{
  const x=xx(i),y=yy(i),failed=i===missing;
  ctx.strokeStyle=failed?'#ff8a7a':'#5ee7cf';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+22,y);ctx.lineTo(735,143);ctx.stroke();
  ctx.fillStyle=failed?'#ff8a7a':'#70dbc3';ctx.beginPath();ctx.arc(x,y,25,0,2*Math.PI);ctx.fill();
  ctx.fillStyle='#071522';ctx.font='15px monospace';ctx.textAlign='center';ctx.fillText(p.xyz,x,y+5);
  ctx.fillStyle='#e6f4ff';ctx.font='12px monospace';ctx.fillText(failed?'ERASED':String(p.value),x,y+46);
 });
 ctx.fillStyle='#b28bff';ctx.beginPath();ctx.arc(735,143,33,0,2*Math.PI);ctx.fill();
 ctx.fillStyle='#071522';ctx.font='22px monospace';ctx.fillText('1',735,151);
 ctx.strokeStyle='#ffa765';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(768,143);ctx.lineTo(968,143);ctx.stroke();
 ctx.fillStyle='#ffad62';ctx.beginPath();ctx.arc(980,143,8,0,2*Math.PI);ctx.fill();
 ctx.fillStyle='#e2efff';ctx.font='15px monospace';ctx.fillText('.',980,173);
 ctx.font='12px monospace';ctx.textAlign='left';ctx.fillText('Manifest retained: identity + values; XOR parity recovers ONE erased byte',35,h-25);
 ctx.fillStyle=recovered?'#60e9b7':'#ff7a8c';ctx.fillText(recovered?'RECOVERABLE':'UNRECOVERABLE',825,50);
}
for(let i=0;i<P;i++){$port(i).addEventListener('input',show)}
$('v30-erasure').onchange=show;
$('v30-test').onclick=()=>{const r=tests();$('v30-test-status').textContent=(r.ok?'PASS':'FAIL')+' · '+r.checks.filter(x=>x.pass).length+'/'+r.checks.length+' tests · '+r.checks.map(x=>(x.pass?'✓':'✗')+' '+x.name).join(' | ')};
$('v30-export').onclick=()=>{
 const snap=snapshot(),payload={schema:'PHOTON16-v30-reverse-qd-eight-ports',model:'symbolic software-only',...snap,tests:tests()};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='photon16-v30-eight-port.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.PHOTON_EIGHT30={encode,erase,recover,tests,coords,topology:TOPOLOGY};
show();
})();