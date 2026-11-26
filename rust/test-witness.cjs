const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {assess,payload,domains}=require('./witness-authority.cjs');
const candidate={sourceCommit:'a'.repeat(40),wasmSha256:'b'.repeat(64),manifestSha256:'c'.repeat(64),status:'STAGED_BUNDLE_PASS'};
const pairs=Array.from({length:3},()=>crypto.generateKeyPairSync('ed25519'));
const registry=pairs.map((p,i)=>({id:'synthetic-'+i,ancestry:'synthetic-root-'+i,publicKey:p.publicKey.export({type:'spki',format:'pem'})}));
const records=registry.map((e,i)=>{const r={...candidate,witnessId:e.id,ancestry:e.ancestry,observation:'REPRODUCED_AND_EXECUTED'};r.signature=crypto.sign(null,payload(r),pairs[i].privateKey).toString('base64');return r;});
const check=(r,reg=registry,roots=['repository-ci'])=>assess(candidate,r,reg,roots);
const good=check(records);assert.equal(good.status,'SIGNATURES_VALID');assert.equal(good.releaseAuthority,'HOLD');assert.equal(good.independentWitness,'UNVERIFIED');
const cases=[
 ['unregistered',records,[],[]],
 ['producer ancestry',records,registry,[registry[0].ancestry]],
 ['duplicate record',[records[0],records[0],records[2]]],
 ['insufficient roots',records.slice(0,2)],
 ['different source',[{...records[0],sourceCommit:'d'.repeat(40)},...records.slice(1)]],
 ['different binary',[{...records[0],wasmSha256:'d'.repeat(64)},...records.slice(1)]],
 ['different manifest',[{...records[0],manifestSha256:'d'.repeat(64)},...records.slice(1)]],
 ['different observation',[{...records[0],observation:'DECLARED_PASS'},...records.slice(1)]],
 ['invalid signature',[{...records[0],signature:Buffer.alloc(64).toString('base64')},...records.slice(1)]],
 ['unknown identity',[{...records[0],witnessId:'self-issued'},...records.slice(1)]]
];
for(const [name,r,reg,roots] of cases){assert.equal(check(r,reg,roots).status,'HOLD',name);console.log('REJECTED '+name);}
const duplicateRegistry=registry.map((e,i)=>i===1?{...e,publicKey:registry[0].publicKey}:e);
const duplicateKey={...records[1]};duplicateKey.signature=crypto.sign(null,payload(duplicateKey),pairs[0].privateKey).toString('base64');
assert.equal(check([records[0],duplicateKey,records[2]],duplicateRegistry).reason,'DUPLICATE_KEY');
const duplicateRootRegistry=registry.map((e,i)=>i===1?{...e,ancestry:registry[0].ancestry}:e);
const duplicateRoot={...records[1],ancestry:registry[0].ancestry};duplicateRoot.signature=crypto.sign(null,payload(duplicateRoot),pairs[1].privateKey).toString('base64');
assert.equal(check([records[0],duplicateRoot,records[2]],duplicateRootRegistry).reason,'DUPLICATE_ANCESTRY');
assert.equal(domains(candidate).releaseAuthority,'HOLD');assert.equal(domains(candidate).externalWitness.reason,'NO_EXTERNAL_TRUST_ROOTS');
console.log('SYNTHETIC ONLY: 12 witness rejection scenarios; valid signatures do not grant authority.');
