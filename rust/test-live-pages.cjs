'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const live=require('./verify-live-pages.cjs'),gate=require('./qualification-gate.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceCommit='a'.repeat(40);
function fixture(){
 const files=Object.fromEntries(live.names.map(n=>[n,Buffer.from('synthetic '+n)]));
 files['photon16.wasm']=Buffer.from('0061736d01000000','hex');
 const wasmSha256=hash(files['photon16.wasm']);
 files.SOURCE_COMMIT=Buffer.from(sourceCommit+'\n');
 files.REPRODUCTION=Buffer.from('build-a '+wasmSha256+'\nbuild-b '+wasmSha256+'\n');
 files.QUALIFICATION=Buffer.from('native-tests=PASS\nwasm-verifier=PASS\nsame-runner-reproduction=PASS\nbrowser-acceptance=PASS\n');
 files['BROWSER_ACCEPTANCE.json']=Buffer.from(JSON.stringify({sourceCommit,wasmSha256,servedHashes:[wasmSha256,wasmSha256,wasmSha256],errors:[],failed:[]}));
 const reseal=()=>{files.RELEASE_SHA256SUMS=Buffer.from(live.names.map(n=>hash(files[n])+'  '+n).join('\n')+'\n');return {sourceCommit,wasmSha256,manifestSha256:hash(files.RELEASE_SHA256SUMS)};};
 return {files,expected:reseal(),reseal};
}
const f=fixture();assert.equal(live.verify(f.files,f.expected).status,'ARTIFACT_IDENTITY_MATCH');assert.equal(live.verify(f.files,f.expected).releaseAuthority,'HOLD');
const cases=[
 ['modified binary',x=>{x.files['photon16.wasm'][0]=1;}],
 ['modified screenshot',x=>{x.files['browser-rust.png']=Buffer.from('changed');}],
 ['missing artifact',x=>{delete x.files.SOURCE_INDEX;}],
 ['modified manifest',x=>{x.files.RELEASE_SHA256SUMS=Buffer.from('changed');}],
 ['self-issued manifest',x=>{x.files.NODE_VERSION=Buffer.from('new');x.reseal();}],
 ['wrong external source',x=>{x.expected.sourceCommit='b'.repeat(40);}],
 ['wrong external binary',x=>{x.expected.wasmSha256='b'.repeat(64);}],
 ['duplicate manifest entry',x=>{const l=x.files.RELEASE_SHA256SUMS.toString().trim().split('\n');l[1]=l[0];x.files.RELEASE_SHA256SUMS=Buffer.from(l.join('\n')+'\n');x.expected.manifestSha256=hash(x.files.RELEASE_SHA256SUMS);}],
 ['stale source under resealed manifest',x=>{x.files.SOURCE_COMMIT=Buffer.from('b'.repeat(40));x.expected=x.reseal();}],
 ['browser error under resealed manifest',x=>{const e=JSON.parse(x.files['BROWSER_ACCEPTANCE.json']);e.errors=['synthetic error'];x.files['BROWSER_ACCEPTANCE.json']=Buffer.from(JSON.stringify(e));x.expected=x.reseal();}],
 ['qualification downgrade',x=>{x.files.QUALIFICATION=Buffer.from('native-tests=PASS\n');x.expected=x.reseal();}],
 ['reproduction mismatch',x=>{x.files.REPRODUCTION=Buffer.from('build-a '+x.expected.wasmSha256+'\nbuild-b '+'c'.repeat(64));x.expected=x.reseal();}]
];
for(const [name,mutate] of cases){const x=fixture();mutate(x);assert.throws(()=>live.verify(x.files,x.expected),undefined,name);}
for(const protocol of [undefined,'PHOTON16:qualification:v1','PHOTON16:qualification:v2','PHOTON16:qualification:v4']){const r=gate.qualify({protocol},{protocol:gate.PROTOCOL});assert.equal(r.reason,'PROTOCOL_DOWNGRADE_OR_UNKNOWN');assert.equal(r.releaseAuthority,'HOLD');}
assert.equal(gate.qualify({protocol:gate.PROTOCOL},{}).reason,'MISSING_EXTERNAL_POLICY');
assert.equal(gate.qualify({protocol:gate.PROTOCOL},{protocol:gate.PROTOCOL}).reason,'INCOMPLETE_EXTERNAL_COMPARISON');
console.log('SYNTHETIC ONLY: one artifact identity control, 12 tampering cases, six protocol rejection cases. Composite positive path not exercised.');
