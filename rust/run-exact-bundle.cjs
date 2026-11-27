'use strict';
// EA-002D portable source reconstruction; executes only explicitly pinned source.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const input=process.argv[2];assert.ok(input,'usage: node run-exact-bundle.cjs bundle.json');
const bundle=JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(bundle.schema,'photon16-exact-source-bundle-v1');
assert.equal(bundle.baselineCommit,'289ef17c32d43db9005a55db443cd6da7fcb5e52');
const expected={
'custody-registry':'65aca58c7a6079e485c98b78aaefb36c65915f70',
'custodian-transition':'0515d6521955d0fd0c787898ae13782e45482d7b',
'registry-fork':'042fed613e5662d334547a8ae8f5bbfa77827d82',
'temporal-witness':'f43aaafb137729488d72bc722322e5b476c34fd1',
'checkpoint-freshness':'9f21de24c2ef52aebaf9535d9f0eb66961c7ee16',
'independent-custody':'dd7dec427f4328cb716d49e0e280cb0b3269f376',
'blind-witness':'953838ff03d95052ec86641cd16362b70781516f',
'external-reproduction':'646b84fe1553de07f03ab7b0aed11ae282089696',
'verify-live-pages':'6b781e0a139c906aa9486f7444b610b28eec5157',
'qualification-gate':'ec9bdeb5eaa5c0151d811ca5491f7c28f4b82785',
'test-composite-qualification':'b70382e133b1a17744ccce0b08643136860a6af1',
'test-composite-adversarial':'e180aa1eb8fdef777de2e51a2bb57d437d2fb7d5'};
const allowed=new Map(Object.entries(expected).map(([n,h])=>['rust/'+n+'.cjs',h]));
assert.equal(bundle.files.length,allowed.size);
const seen=new Set(),verified=[];
for(const f of bundle.files){
 assert.ok(allowed.has(f.path)&&!seen.has(f.path),'unexpected or duplicate path');
 assert.equal(f.blob,allowed.get(f.path));assert.equal(typeof f.content,'string');
 const b=Buffer.from(f.content,'utf8');
 const git=crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
 assert.equal(git,f.blob,'Git blob mismatch: '+f.path);seen.add(f.path);
 verified.push({path:f.path,gitBlob:git,sha256:crypto.createHash('sha256').update(b).digest('hex')});
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'photon-exact-'));
const results=[];
try{
 for(const f of bundle.files)fs.writeFileSync(path.join(dir,path.basename(f.path)),f.content,{flag:'wx'});
 for(const suite of ['test-composite-qualification.cjs','test-composite-adversarial.cjs']){
  const r=spawnSync(process.execPath,[path.join(dir,suite)],{cwd:dir,encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
  results.push({suite,exitCode:r.status,signal:r.signal,error:r.error?.message||null,stdout:r.stdout,stderr:r.stderr});
 }
}finally{fs.rmSync(dir,{recursive:true,force:true});}
const pass=results.length===2&&results.every(r=>r.exitCode===0&&!r.error);
console.log(JSON.stringify({baselineCommit:bundle.baselineCommit,runtime:process.version,verified,results,status:pass?'LOCAL_SYNTHETIC_PASS':'LOCAL_EXECUTION_FAILED',releaseAuthority:'HOLD'},null,2));
process.exitCode=pass?0:1;
