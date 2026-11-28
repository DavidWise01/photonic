'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
(async()=>{const e=(await WebAssembly.instantiate(fs.readFileSync(process.argv[3]),{})).instance.exports;assert.equal(e.photon_rg_abi(),1);
const cases=[];for(let seed=0;seed<256;seed++){let a=[[0,2],[1,0],[0,2],[1,0],[0,2],[1,0],[0,0],[1,0],[2,8],[6,seed%3],[4,seed%3],[4,(seed+1)%3],[1,0],[3,seed%3],[4,seed%3],[4,seed%3],[2,7]];let x=seed+1;for(let j=0;j<128;j++){x=(Math.imul(x,1664525)+1013904223)>>>0;a.push([x%8,(x>>>8)%40]);}cases.push(a);}
cases.push(Array.from({length:4098},()=>[7,0]));
const input=cases.map(a=>a.map(x=>x.join(':')).join(' ')).join('\n')+'\n';
const native=spawnSync(process.argv[2],[],{input,encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(native.status,0,native.stderr);const lines=native.stdout.trimEnd().split('\n');assert.equal(lines.length,cases.length);let checks=0;
for(let i=0;i<cases.length;i++){e.photon_rg_reset();const rows=cases[i].map(([op,arg])=>{const status=e.photon_rg_step(op,arg),m=Array.from({length:10},(_,k)=>e.photon_rg_metric(k));assert.equal(m[8],1);assert.equal(m[4],m[5]+m[0]);assert.equal(m[6],m[7]+m[1]);assert.ok(m[1]<=m[2]&&m[2]<=17408&&m[0]<=3&&m[3]<=32);checks++;return [status,...m].join(',');});assert.equal(rows.join(';'),lines[i],'case '+i);if(i===256){assert.equal(e.photon_rg_metric(9),4096);assert.equal(e.photon_rg_step(0,0),3);}}
console.log(JSON.stringify({cases:cases.length,checks,scope:'native/WASM logical parity; simulated observer only',authority:'HOLD'}));})().catch(e=>{console.error(e);process.exitCode=1});
