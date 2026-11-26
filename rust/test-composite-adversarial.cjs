'use strict';
const assert=require('node:assert/strict');
const {fixture}=require('./test-composite-qualification.cjs');
const {qualify}=require('./qualification-gate.cjs');
const cases=[
 ['legacy protocol',f=>{f.bundle.protocol='PHOTON16:qualification:v2'},'PROTOCOL_DOWNGRADE_OR_UNKNOWN'],
 ['missing external policy',f=>{delete f.external.protocol},'MISSING_EXTERNAL_POLICY'],
 ['missing comparison',f=>{delete f.bundle.comparison},'INCOMPLETE_EXTERNAL_COMPARISON'],
 ['stale challenge',f=>{f.external.challenge='f'.repeat(64)},'QUALIFICATION_REJECTED'],
 ['invalid comparison challenge',f=>{f.external.comparisonChallenge='f'.repeat(64)},'CHECKPOINT_COMPARISON_REJECTED'],
 ['checkpoint signature substitution',f=>{f.bundle.receipt.signature='invalid'},'QUALIFICATION_REJECTED'],
 ['shared producer ancestry',f=>{f.external.producerControlRoots.push('witness0')},'CUSTODY_REJECTED'],
 ['duplicate custody observation',f=>{f.bundle.observations[1]=f.bundle.observations[0]},'CUSTODY_REJECTED'],
 ['auditor signature substitution',f=>{f.bundle.observations[0].signature='invalid'},'CUSTODY_REJECTED'],
 ['modified binary',f=>{f.bundle.files['photon16.wasm'][0]=1},'QUALIFICATION_REJECTED'],
 ['foreign manifest anchor',f=>{f.external.expected.manifestSha256='f'.repeat(64)},'QUALIFICATION_REJECTED'],
 ['missing artifact',f=>{delete f.bundle.files.SOURCE_INDEX},'QUALIFICATION_REJECTED'],
 ['missing seal',f=>{f.bundle.seals.pop()},'REPRODUCTION_REJECTED'],
 ['modified barrier',f=>{f.bundle.barrier.digest='f'.repeat(64)},'REPRODUCTION_REJECTED'],
 ['substituted report',f=>{f.bundle.reports[0].returns=2879},'REPRODUCTION_REJECTED'],
 ['modified opening',f=>{f.bundle.reveals[0].salt='f'.repeat(64)},'REPRODUCTION_REJECTED'],
 ['foreign reference',f=>{f.external.reference.wasmSha256='f'.repeat(64)},'REPRODUCTION_REJECTED']
];
function run(f){const x=qualify(f.bundle,f.external);assert.equal(x.releaseAuthority,'HOLD');return x;}
assert.equal(run(fixture()).status,'COMPOSED_EVIDENCE_MATCH');
for(const [name,mutate,reason] of cases){const f=fixture();mutate(f);const x=run(f);assert.equal(x.status,'HOLD',name);assert.equal(x.reason,reason,name);console.log('REJECTED '+name);}
assert.equal(run(fixture()).status,'COMPOSED_EVIDENCE_MATCH');
console.log('SYNTHETIC ONLY: 17 cross-module rejection scenarios and two clean controls; no operational authority.');
