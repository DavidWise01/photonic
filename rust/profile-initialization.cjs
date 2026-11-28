'use strict';
// OR001 observation only: static startup inventory, no module execution.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||'photon16'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const rows=[];let i=0;
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const src=m[1].match(/(?:^|\s)(?:data-)?src\s*=\s*["']([^"']+)["']/i)?.[1];
 const file=src?path.resolve(root,src):null;
 if(file&&!file.startsWith(root+path.sep))throw Error('nonlocal script '+src);
 const code=src?fs.readFileSync(file,'utf8'):m[2];
 rows.push({order:++i,reserved:/application\/photon-history/.test(m[1]),source:src||'inline-'+i,bytes:Buffer.byteLength(code),sha256:crypto.createHash('sha256').update(code).digest('hex'),intervalSites:(code.match(/\bsetInterval\s*\(/g)||[]).length,animationSites:(code.match(/\brequestAnimationFrame\s*\(/g)||[]).length,selftestSites:(code.match(/\bselftest\s*\(/gi)||[]).length,loopSites:(code.match(/\b(?:for|while)\s*\(/g)||[]).length});
}
const report={schema:'photon16-static-initialization-inventory-v1',sourceCommit:process.env.GITHUB_SHA||null,modules:rows.length,external:rows.filter(r=>!r.source.startsWith('inline-')).length,inline:rows.filter(r=>r.source.startsWith('inline-')).length,bytes:rows.reduce((n,r)=>n+r.bytes,0),rows,scope:'lexical sites only; not runtime invocation counts or timing',releaseAuthority:'HOLD'};
console.log(JSON.stringify(report,null,2));
