'use strict';
// RG-004: exercise actual browser admission and native-job prefix in a VM. .dlw
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../photon16/v83-rust-wasm.js'),'utf8').split('(()=>{"use strict";const panel=')[0];
async function run(){
 let workers=[],timers=new Map(),seq=0,fail=false,checks=0;
 class Worker {constructor(){if(fail)throw Error('constructor');workers.push(this);}postMessage(){}terminate(){this.dead=true;}}
 const c=vm.createContext({window:{},Worker,URL,document:{baseURI:'https://example.invalid/'},setTimeout:f=>{timers.set(++seq,f);return seq},clearTimeout:i=>timers.delete(i)});
 vm.runInContext(source,c);const job=mode=>vm.runInContext('photonNativeJob('+JSON.stringify(mode)+')',c).then(()=>true,()=>false);
 const s=()=>c.window.PHOTON_RESOURCE.snapshot();
 function check(a,b){const x=s();assert.equal(x.active,a);assert.equal(x.reservedBytes,b);assert.equal(x.admitted,x.returned+a);assert.equal(x.allocatedBytes,x.returnedBytes+b);assert.ok(x.conservation&&a<=3&&b<=17408);checks++;}
 for(let i=0;i<128;i++){
  const k=job('kernel'),o=job('online'),p=job('policy');check(3,17408);
  for(let j=0;j<8;j++){assert.equal(await job('policy'),false);check(3,17408);}
  const [kw,ow,pw]=workers.slice(-3);
  const actions=[()=>kw.onmessage({data:{ok:true,mode:'kernel',result:[]}}),()=>ow.onerror({message:'abnormal'}),()=>pw.onmessageerror()];
  const weights=[13312,3840,256];let remaining=17408;
  for(let j=0;j<3;j++){let n=(i+j)%3;actions[n]();remaining-=weights[n];check(2-j,remaining);actions[n]();check(2-j,remaining);}
  assert.deepEqual(await Promise.all([k,o,p]),[true,false,false]);
  const t=job('online');check(1,3840);[...timers.values()][0]();assert.equal(await t,false);check(0,0);
  fail=true;assert.equal(await job('kernel'),false);fail=false;check(0,0);
  const k2=job('kernel'),k3=job('kernel');assert.equal(await k3,false);check(1,13312);workers.at(-1).onerror({});assert.equal(await k2,false);check(0,0);
 }
 console.log(JSON.stringify({scope:'mock worker lifecycle; actual admission source',checks,...s()}));
}
run().catch(e=>{console.error(e);process.exitCode=1;});
