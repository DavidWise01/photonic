const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const crypto=require('node:crypto');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(process.argv[2]||'site');
 const sourceCommit=fs.readFileSync(path.join(root,'photon16/wasm/SOURCE_COMMIT'),'utf8').trim();
 const wasmSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'photon16/wasm/photon16.wasm'))).digest('hex');
 assert.match(sourceCommit,/^[0-9a-f]{40}$/);assert.equal(sourceCommit,process.env.GITHUB_SHA);
 assert.equal(wasmSha256,fs.readFileSync(path.join(root,'photon16/wasm/SHA256SUMS'),'utf8').trim().split(/\s+/)[0]);
 const server=http.createServer((req,res)=>{
  const name=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!name.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  let file=name;
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   const type={'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.css':'text/css','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[],failed=[],servedHashes=[];
  // Observe each panel's actual response, not an assumed cache hit count.
  const wasmResponses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().includes('/photon16/')&&r.status()>=400)failed.push(r.url()+' '+r.status());});
  const url='http://127.0.0.1:'+server.address().port+'/photon16/';
  page.on('response',r=>{if(r.url()===url+'wasm/photon16.wasm'){servedHashes.push(r.body().then(b=>crypto.createHash('sha256').update(b).digest('hex')));wasmResponses.push(r.status());}});
  await page.goto(url,{waitUntil:'load'});
  const main=page.locator('section').filter({has:page.getByRole('heading',{name:/RUST WASM/})});
  assert.equal(await main.count(),1);
  await main.getByRole('button',{name:'Execute Rust',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#rust83status')?.textContent.startsWith('Rust WASM executed'),{},{timeout:120000});
  const native=JSON.parse(await main.locator('pre').textContent());
  assert.equal(native.source,'Rust WASM');assert.equal(native.generation,7);assert.equal(native.codons,552960);assert.equal(native.sealedCodons,552960);assert.equal(native.stages,4423680);assert.equal(native.updates,161280);assert.equal(native.storage.conservation,true);assert.equal(native.storage.returns,2880);
  const resource=page.locator('section').filter({has:page.getByRole('heading',{name:/Native resource policy laboratory/})});
  assert.equal(await resource.count(),1);
  await resource.getByRole('button',{name:'Evaluate native policies'}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('section')].some(s=>s.querySelector('h2')?.textContent.includes('Native resource policy laboratory')&&s.querySelector('pre')?.textContent.includes('"candidates"')),{},{timeout:120000});
  const trials=JSON.parse(await resource.locator('pre').textContent());assert.equal(trials.source,'Rust WASM');assert.equal(trials.candidates.length,4);assert.deepEqual(trials.candidates.map(x=>x.budget).sort((a,b)=>a-b),[0,448,1536,1984]);assert.ok(trials.candidates.some(x=>JSON.stringify(x)===JSON.stringify(trials.winner)));assert.ok(trials.candidates.every(x=>x.digest===trials.winner.digest&&x.cost>=trials.winner.cost));
  const online=page.locator('section').filter({has:page.getByRole('heading',{name:/Causal online resource adaptation/})});
  assert.equal(await online.count(),1);
  await online.getByRole('button',{name:'Execute causal Rust'}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('section')].some(s=>s.querySelector('h2')?.textContent.includes('Causal online resource adaptation')&&s.querySelector('pre')?.textContent.includes('"trace"')),{},{timeout:120000});
  const trace=JSON.parse(await online.locator('pre').textContent());assert.equal(trace.source,'Rust WASM');assert.equal(trace.trace.length,96);assert.deepEqual(trace.final,trace.trace[95]);assert.equal(trace.trace[0].budget,1536);assert.ok(trace.trace.every((x,i)=>x.t===i&&[0,448,1536,1984].includes(x.budget)&&Number.isFinite(x.idle)&&x.idle>=0&&x.idle<=x.budget&&Number.isFinite(x.cost)&&Number.isInteger(x.allocations)&&x.allocations>=0&&(!i||(x.cost>=trace.trace[i-1].cost&&x.allocations>=trace.trace[i-1].allocations))));
  const served=await Promise.all(servedHashes);assert.ok(served.length>=3);assert.ok(wasmResponses.every(x=>x===200));assert.ok(served.every(h=>h===wasmSha256));
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  await main.scrollIntoViewIfNeeded();await main.screenshot({path:'verified/browser-rust.png'});
  fs.writeFileSync('verified/BROWSER_ACCEPTANCE.json',JSON.stringify({sourceCommit,wasmSha256,servedHashes:served,wasmResponses,browser:browser.version(),native,trials,online:trace,errors,failed},null,2));
  console.log('Chromium native kernel, resource policies and causal trace PASS');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
