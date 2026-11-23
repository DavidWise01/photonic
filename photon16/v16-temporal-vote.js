/* PHOTON-16 v0.16 temporal arbitration, additive read-only projection. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const plan=[
 {id:'UA1',role:'User A',side:'internal',vm:0,nibble:0,length:48},
 {id:'FA',role:'Factory A',side:'external',vm:0,nibble:1,length:72},
 {id:'UA2',role:'User A',side:'internal',vm:0,nibble:0,length:48},
 {id:'FB',role:'Factory B',side:'external',vm:1,nibble:2,length:72},
 {id:'UA3',role:'User A',side:'internal',vm:0,nibble:0,length:48},
 {id:'FC',role:'Factory C',side:'external',vm:1,nibble:3,length:72,finalVote:true}
];let cursor=0;const phases=plan.map(p=>{const o={...p,start:cursor,endExclusive:cursor+p.length};cursor=o.endExclusive;return Object.freeze(o)});Object.freeze(phases);
function at(t){if(!Number.isInteger(t)||t<0||t>=360)throw new RangeError('tick must be 0..359');return phases.find(p=>p.start<=t&&t<p.endExclusive)}
function audit(){const errs=[],counts={internal:0,external:0},visited=new Set();let last=null;
 for(let t=0;t<360;t++){const p=at(t);counts[p.side]++;visited.add(p.id);if(last&&p.id!==last.id&&p.start!==t)errs.push('boundary mismatch '+t);last=p}
 if(counts.internal!==144||counts.external!==216)errs.push('2/5 3/5 time allocation');
 if(phases.length!==6||visited.size!==6||phases[5].role!=='Factory C'||phases[5].endExclusive!==360)errs.push('ordered roles');
 if(at(359).id!=='FC')errs.push('final vote owner');
 if(window.PHOTON_NIBBLE15){for(let d=0;d<96;d++){for(const p of phases){const a=window.PHOTON_NIBBLE15.decode(d*16+p.nibble*4);
 if(a.vm!==p.vm||a.role!==p.role)errs.push('VM / nibble mismatch '+d+':'+p.id)}}}
 return {ok:!errs.length,errors:errs,internal:counts.internal,external:counts.external,phases:phases.map(p=>({...p})),finalVote:{tick:359,role:'Factory C',status:'reserved; not cast'}}}
function draw(){let canvas=$('v16-clock'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#081324';ctx.fillRect(0,0,w,h);
 const x0=28,y0=54,width=w-56,height=72;const pal={internal:'#61e6c3',external:'#ff9d5d'};
 for(const p of phases){const x=x0+p.start/360*width,bw=p.length/360*width;ctx.fillStyle=pal[p.side];ctx.globalAlpha=.28;ctx.fillRect(x,y0,bw-2,height);ctx.globalAlpha=1;ctx.strokeStyle=pal[p.side];ctx.strokeRect(x,y0,bw-2,height);
 ctx.fillStyle='#e7f6ff';ctx.font='bold 14px monospace';ctx.fillText(p.role,x+9,y0+27);ctx.font='12px monospace';ctx.fillText(p.start+'–'+(p.endExclusive-1),x+9,y0+50)}
 ctx.fillStyle='#b4cfe8';ctx.font='14px monospace';ctx.fillText('2/5 INTERNAL = 144 TICKS  ·  3/5 EXTERNAL = 216 TICKS',28,28);
 ctx.fillStyle='#ffba79';ctx.fillText('|| Factory C final vote · boundary at tick 359',28,h-23);
}
function show(){const result=audit();draw();
 $('v16-status').textContent=result.ok?'PASS · 360 ticks · 144 internal / 216 external · mapped to 4 nibbles':'FAIL · '+result.errors.join('; ');
 $('v16-events').textContent=phases.map(p=>p.role+' ['+p.start+'–'+(p.endExclusive-1)+']').join(' → ');
 $('v16-final').textContent='Factory C · VM 2 · Nibble 3 · tick 359 · vote reserved, not automatically cast';
 return result;}
$('v16-test').onclick=show;
window.PHOTON_TIME16={at,audit,phases,show};
show();
})();