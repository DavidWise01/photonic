const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const source='a'.repeat(40);
const names=['photon16.wasm','SOURCE_COMMIT','SOURCE_INDEX','RUST_TOOLCHAIN','NODE_VERSION','REPRODUCTION','QUALIFICATION','BROWSER_ACCEPTANCE.json','browser-rust.png'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'photon-rc5-'));
const file=n=>path.join(root,n),put=(n,v)=>fs.writeFileSync(file(n),v),get=n=>fs.readFileSync(file(n)),hash=n=>sha(get(n));
const manifest=()=>put('RELEASE_SHA256SUMS',names.map(n=>hash(n)+'  '+n).join('\n')+'\n');
function fixture(){
 for(const n of fs.readdirSync(root))fs.rmSync(file(n),{force:true});
 for(const n of names)put(n,'SYNTHETIC TEST ONLY');
 put('photon16.wasm',Buffer.from([0,97,115,109,1,0,0,0]));
 const h=hash('photon16.wasm');put('SOURCE_COMMIT',source);put('REPRODUCTION','build-a '+h+'\nbuild-b '+h+'\n');
 put('QUALIFICATION','native-tests=PASS\nwasm-verifier=PASS\nsame-runner-reproduction=PASS\nbrowser-acceptance=PASS\n');
 const candidates=[0,448,1536,1984].map((budget,i)=>({budget,cost:i+1,digest:123}));
 put('BROWSER_ACCEPTANCE.json',JSON.stringify({sourceCommit:source,wasmSha256:h,servedHashes:[h,h,h],errors:[],failed:[],native:{codons:552960,storage:{returns:2880,conservation:true}},trials:{candidates,winner:candidates[0]},online:{trace:Array.from({length:96},(_,t)=>({t,budget:1536,idle:448,cost:t+1,allocations:1}))}}));
 manifest();
}
function edit(fn){const e=JSON.parse(get('BROWSER_ACCEPTANCE.json'));fn(e);put('BROWSER_ACCEPTANCE.json',JSON.stringify(e));manifest();}
const cases=[
 ['missing file',()=>fs.unlinkSync(file('SOURCE_INDEX'))],
 ['altered binary',()=>put('photon16.wasm','corrupt')],
 ['wrong source',()=>{put('SOURCE_COMMIT','b'.repeat(40));manifest();}],
 ['reproduction mismatch',()=>{put('REPRODUCTION','build-a '+hash('photon16.wasm')+'\nbuild-b '+'0'.repeat(64));manifest();}],
 ['forged partial PASS',()=>{put('QUALIFICATION','browser-acceptance=PASS');manifest();}],
 ['wrong browser hash',()=>edit(e=>e.servedHashes[1]='0'.repeat(64))],
 ['missing browser read',()=>edit(e=>e.servedHashes.pop())],
 ['browser error',()=>edit(e=>e.errors.push('fault'))],
 ['coverage discrepancy',()=>edit(e=>e.native.codons--)],
 ['conservation false',()=>edit(e=>e.native.storage.conservation=false)],
 ['candidate divergence',()=>edit(e=>e.trials.candidates[1].digest++)],
 ['duplicate budget',()=>edit(e=>e.trials.candidates[1].budget=0)],
 ['fabricated winner',()=>edit(e=>e.trials.winner={budget:99,cost:0,digest:123})],
 ['short trace',()=>edit(e=>e.online.trace.pop())],
 ['budget violation',()=>edit(e=>e.online.trace[8].idle=1984)],
 ['cost rollback',()=>edit(e=>e.online.trace[8].cost=0)],
 ['duplicate manifest entry',()=>fs.appendFileSync(file('RELEASE_SHA256SUMS'),hash(names[0])+'  '+names[0]+'\n')],
 ['manifest corruption',()=>fs.appendFileSync(file('RELEASE_SHA256SUMS'),'invalid\n')],
 ['unmanifested change',()=>put('NODE_VERSION','changed')]
];
function run(){return spawnSync(process.execPath,[path.join(__dirname,'adjudicate-release.cjs'),root],{env:{...process.env,GITHUB_SHA:source},encoding:'utf8'});}
try{
 fixture();const valid=run();assert.equal(valid.status,0,valid.stderr);const report=JSON.parse(get('ADJUDICATION.json'));assert.equal(report.status,'STAGED_BUNDLE_PASS');assert.equal(report.independentWitness,'UNVERIFIED');assert.equal(report.liveDeployment,'UNVERIFIED');
 for(const [name,mutate] of cases){fixture();put('ADJUDICATION.json','STALE PASS');mutate();const r=run();assert.equal(r.error,undefined,name);assert.notEqual(r.status,0,name);assert.ok(!fs.existsSync(file('ADJUDICATION.json')),name+' stale authority');console.log('REJECTED '+name);}
 console.log('SYNTHETIC ONLY: 1 consistent fixture accepted; '+cases.length+' inconsistent fixtures rejected. No real execution attested.');
}finally{fs.rmSync(root,{recursive:true,force:true});}
