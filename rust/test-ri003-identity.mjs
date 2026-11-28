import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IdentityAdapter} from '../photon16/qualification/ri003-adapter.mjs';
const e=(await WebAssembly.instantiate(fs.readFileSync(process.argv[2]),{})).instance.exports;
let checks=0;
for(let seed=0;seed<256;seed++){
 e.photon_rg_reset();const a=new IdentityAdapter(e),w=[{},{},{}],keys=[];
 for(let i=0;i<3;i++){assert.equal(e.photon_rg_step(0,1),1);assert.equal(e.photon_rg_step(1,0),1);keys.push(a.bind(i,w[i]));}
 const i=seed%3,k=keys[i],other=(i+1)%3;
 for(const [sender,key] of [[w[other],k],[w[i],keys[other]],[w[i],[k[0],k[1],k[2]-1,k[3]]],[w[i],[k[0],k[1],k[2],99]],[w[i],[]]]){assert.equal(a.observe(i,sender,{key}),false);checks++;}
 assert.equal(a.observe(i,w[i],{key:k}),true);assert.equal(a.observe(i,w[i],{key:k}),false);checks+=2;
 assert.equal(a.unbind(i,w[other]),false);assert.equal(a.unbind(i,w[i]),true);checks+=2;
 assert.throws(()=>a.bind(i,{}));checks++;
 // Test-only simulated return; adapter never performs it.
 assert.equal(e.photon_rg_step(3,i),1);assert.equal(e.photon_rg_step(4,i),1);
 assert.equal(e.photon_rg_step(0,1),1);assert.equal(e.photon_rg_step(1,0),1);
 const nw={},nk=a.bind(i,nw);assert.ok(nk[2]>k[2]);
 assert.equal(a.observe(i,w[i],{key:nk}),false);assert.equal(a.observe(i,nw,{key:k}),false);assert.equal(a.observe(i,nw,{key:nk}),true);checks+=3;
 assert.equal(e.photon_rg_metric(8),1);assert.equal(e.photon_rg_metric(0),3);checks+=2;
}
console.log(JSON.stringify({schedules:256,checks,scope:'WASM identities and mock worker objects',authority:'HOLD'}));
