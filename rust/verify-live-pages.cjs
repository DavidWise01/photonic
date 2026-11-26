'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const names=['photon16.wasm','SOURCE_COMMIT','SOURCE_INDEX','RUST_TOOLCHAIN','NODE_VERSION','REPRODUCTION','QUALIFICATION','BROWSER_ACCEPTANCE.json','browser-rust.png'];
function verify(files,expected){
 assert.match(expected.sourceCommit,/^[a-f0-9]{40}$/);
 assert.match(expected.manifestSha256,/^[a-f0-9]{64}$/);
 assert.match(expected.wasmSha256,/^[a-f0-9]{64}$/);
 assert.equal(hash(files.RELEASE_SHA256SUMS),expected.manifestSha256,'manifest anchor mismatch');
 const lines=files.RELEASE_SHA256SUMS.toString('utf8').trim().split(/\r?\n/);
 assert.equal(lines.length,names.length);
 const entries=new Map();
 for(const line of lines){const m=line.match(/^([0-9a-f]{64})  ([A-Za-z0-9_.-]+)$/);assert.ok(m,'invalid manifest entry');assert.ok(names.includes(m[2])&&!entries.has(m[2]),'unexpected or duplicate entry');entries.set(m[2],m[1]);}
 for(const n of names){assert.ok(Buffer.isBuffer(files[n]),'missing '+n);assert.equal(hash(files[n]),entries.get(n),'digest mismatch: '+n);}
 assert.equal(files.SOURCE_COMMIT.toString().trim(),expected.sourceCommit,'stale source');
 assert.equal(hash(files['photon16.wasm']),expected.wasmSha256,'binary anchor mismatch');
 assert.ok(WebAssembly.validate(files['photon16.wasm']),'invalid WASM');
 const e=JSON.parse(files['BROWSER_ACCEPTANCE.json']);
 assert.equal(e.sourceCommit,expected.sourceCommit);assert.equal(e.wasmSha256,expected.wasmSha256);
 assert.ok(Array.isArray(e.servedHashes)&&e.servedHashes.length>=3&&e.servedHashes.every(h=>h===expected.wasmSha256));
 assert.deepEqual(e.errors,[]);assert.deepEqual(e.failed,[]);
 assert.deepEqual(files.QUALIFICATION.toString().trim().split(/\r?\n/),['native-tests=PASS','wasm-verifier=PASS','same-runner-reproduction=PASS','browser-acceptance=PASS']);
 assert.deepEqual(files.REPRODUCTION.toString().trim().split(/\r?\n/),['build-a '+expected.wasmSha256,'build-b '+expected.wasmSha256]);
 return {status:'ARTIFACT_IDENTITY_MATCH',sourceCommit:expected.sourceCommit,manifestSha256:expected.manifestSha256,wasmSha256:expected.wasmSha256,filesVerified:names.length,liveExecution:'UNVERIFIED',independence:'UNVERIFIED',releaseAuthority:'HOLD'};
}
async function observe(expected,fetcher=fetch){
 const base='https://davidwise01.github.io/photonic/photon16/wasm/';
 const files={};
 for(const n of ['RELEASE_SHA256SUMS',...names]){
  const u=new URL(n,base);u.searchParams.set('source',expected.sourceCommit);
  const r=await fetcher(u,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});
  assert.equal(r.status,200,'HTTP '+n);files[n]=Buffer.from(await r.arrayBuffer());
 }
 return verify(files,expected);
}
if(require.main===module)(async()=>{try{const expected=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(await observe(expected),null,2));}catch(e){console.error(JSON.stringify({status:'HOLD',reason:e.message,releaseAuthority:'HOLD'}));process.exitCode=1;}})();
module.exports={verify,observe,names};
