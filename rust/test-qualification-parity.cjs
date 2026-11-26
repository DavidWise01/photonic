'use strict';
const assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
function model(sequence){
 let cursor=0,state='A0',terminal=false;
 const trace=[state];
 for(const [stage,o] of sequence){
  let event='OK';
  if(terminal)event='TERMINAL';
  else if(stage!==cursor){event='REJECT';state='H:ORDER';terminal=true;}
  else if(o!==0){event='REJECT';state='H:'+(o===1?'R':'M')+stage;terminal=true;}
  else{cursor++;state=cursor===6?'MATCH':'A'+cursor;terminal=cursor===6;}
  trace.push(event+':'+state);
 }
 return trace.join(',')+'|HOLD';
}
const prefix=n=>Array.from({length:n},(_,i)=>[i,0]);
const cases=[[]];
for(let n=0;n<=6;n++){
 cases.push(prefix(n));
 for(let stage=0;stage<6;stage++)for(let o=0;o<3;o++){
  cases.push([...prefix(n),[stage,o],[0,0],[5,2]]);
 }
}
const input=cases.map(s=>s.map(x=>x.join(':')).join(' ')).join('\n')+'\n';
const result=spawnSync(process.argv[2]||'rust/target/debug/qualification_parity',[],{input,encoding:'utf8',maxBuffer:8*1024*1024});
if(result.error)throw result.error;
assert.equal(result.status,0,result.stderr);
const actual=result.stdout.trimEnd().split(/\r?\n/);
assert.equal(actual.length,cases.length);
for(let i=0;i<cases.length;i++)assert.equal(actual[i],model(cases[i]),'case '+i+' '+JSON.stringify(cases[i]));
console.log(JSON.stringify({cases:cases.length,status:'DECISION_PARITY',releaseAuthority:'HOLD',scope:'declared observations only'}));
