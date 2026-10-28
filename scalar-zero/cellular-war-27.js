"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const SOURCE="..||..|....|||....|.",STORAGE="root0.gen6.cellular27.responses.v1";
 const ENDS=[2,10,18,36,54,86,118],STARTS=[1,3,11,19,37,55,87];
 if(CHEM_SYMBOLS.length!==118||CHEM_NAMES.length!==118||CHEM_SYMBOLS[117]!=="Og"||CHEM_NAMES[117]!=="Oganesson")throw Error("Missing element registry");
 if(!/^[.|]+$/.test(SOURCE))throw Error("Unknown source token");
 const tokens=[];const cells=[];let offset=0;
 Array.from(SOURCE).forEach((symbol,i)=>{
   let weight=symbol==="."?1:2,first=offset+1,last=offset+weight;
   tokens.push({index:i+1,symbol,weight,first,last});
   for(let j=first;j<=last;j++)cells.push({address:j,token:i+1,symbol,weight,bit:j%2,shape:j%2?"toroid":"box",symbolElement:CHEM_SYMBOLS[j-1],element:CHEM_NAMES[j-1]});
   offset=last;
 });
 if(tokens.length!==20||SOURCE.split(".").length-1!==13||SOURCE.split("|").length-1!==7||offset!==27||cells.length!==27)throw Error("27-cell weighted invariant");
 const all=Array.from({length:118},(_,i)=>({z:i+1,symbol:CHEM_SYMBOLS[i],name:CHEM_NAMES[i],bit:(i+1)%2,shape:(i+1)%2?"toroid":"box",
  period:ENDS.findIndex(end=>i+1<=end)+1,noble:ENDS.includes(i+1)}));
 if(all.filter(x=>x.bit===0).length!==59||all.filter(x=>x.bit===1).length!==59||ENDS.some(z=>all[z-1].bit!==0))throw Error("periodic parity invariant");
 let selectedZ=1,selectedPeriod=0,selectedToken=1,logs=[];
 const valid=["fight","flight","hide"];
 try{let raw=JSON.parse(localStorage.getItem(STORAGE)||"[]");if(Array.isArray(raw))logs=raw.filter(e=>e&&Number.isInteger(e.address)&&e.address>=1&&e.address<=27&&valid.includes(e.response)).slice(0,5000)}catch(_){}
 const latest=new Map();logs.forEach(e=>latest.set(e.address,e.response));
 const elCells=new Map(),elTokens=new Map(),elElements=new Map();
 function mkEl(tag,className){let e=document.createElement(tag);if(className)e.className=className;return e}
 function select(z){selectedZ=z;
  if(z>=1&&z<=27)selectedToken=cells[z-1].token;
  if(z>=1){let period=all[z-1].period-1;if(selectedPeriod!==period){selectedPeriod=period;renderElements()} }
  updateView()}
 function drawTokens(){let root=$("tokens");root.replaceChildren();
  tokens.forEach(tok=>{let b=mkEl("button","token "+(tok.symbol==="."?"dot":"bar"));b.type="button";b.textContent=tok.symbol;b.title="Token "+tok.index+": "+tok.symbol+" = "+tok.weight+" cell"+(tok.weight===2?"s":"")+", positions "+tok.first+"–"+tok.last;b.setAttribute("aria-label",b.title);
    b.addEventListener("click",()=>select(tok.first));root.appendChild(b);elTokens.set(tok.index,b)})}
 function drawCells(){let root=$("layers");root.replaceChildren();
  for(let layer=0;layer<3;layer++){let wrap=mkEl("div","layer"),h=mkEl("h3");h.textContent="LAYER "+(layer+1)+" · Z "+(layer*9+1)+"–"+(layer*9+9);
    wrap.appendChild(h);let grid=mkEl("div","cells");
    for(let j=0;j<9;j++){let z=layer*9+j+1,cell=cells[z-1],b=mkEl("button","cell");
     b.type="button";b.dataset.weight=cell.weight;b.dataset.response="";b.title=cell.element+" | Z "+z+" | "+cell.symbol+" = "+cell.weight;
     let geom=mkEl("strong"),txt=mkEl("small"),tag=mkEl("span","response");geom.textContent=cell.bit?"◉":"□";txt.textContent=z+" · "+cell.symbolElement;tag.textContent="—";
     b.append(geom,txt,tag);b.addEventListener("click",()=>select(z));grid.appendChild(b);elCells.set(z,b)}
    wrap.appendChild(grid);root.appendChild(wrap)}}
 function renderPeriods(){const root=$("periods");root.replaceChildren();let d=mkEl("button");d.type="button";d.innerHTML="<b>□ D=0</b><small>GROUND / BOX</small>";d.addEventListener("click",()=>select(0));root.appendChild(d);
  ENDS.forEach((end,i)=>{let b=mkEl("button");b.type="button";b.dataset.period=i;
   let title=mkEl("b"),sub=mkEl("small");title.textContent="□ "+CHEM_SYMBOLS[end-1];sub.textContent=STARTS[i]+"–"+end;b.append(title,sub);b.addEventListener("click",()=>{selectedPeriod=i;selectedZ=STARTS[i];renderElements();updateView()});root.appendChild(b)})}
 function renderElements(){let root=$("elements");root.replaceChildren();
  for(let z=STARTS[selectedPeriod];z<=ENDS[selectedPeriod];z++){let n=all[z-1],b=mkEl("button","el "+(n.bit?"odd":"even")+(n.noble?" noble":"")+(z<=27?" pilot":""));
   b.type="button";b.dataset.z=z;b.title=n.name+" · Z "+z;
   let s=mkEl("span","shape"),num=mkEl("small");s.textContent=n.bit?"◉":"□";num.textContent=n.symbol;b.append(s,num);
   b.addEventListener("click",()=>select(z));root.appendChild(b);elElements.set(z,b)}
  let end=ENDS[selectedPeriod];$("periodTitle").textContent="RING "+(selectedPeriod+1)+" · "+CHEM_SYMBOLS[STARTS[selectedPeriod]-1]+" → "+CHEM_SYMBOLS[end-1]+" · "+(end-STARTS[selectedPeriod]+1)+" ELEMENTS";}
 function inspectLog(){let root=$("ledger");root.replaceChildren();
  if(!logs.length){root.textContent="No behavioral observations recorded.";return}
  for(let e of logs.slice(-8).reverse()){let line=mkEl("div","record");line.textContent="#"+e.seq+"  "+e.address+" / "+CHEM_SYMBOLS[e.address-1]+"  "+e.response.toUpperCase()+"  · "+e.when;root.appendChild(line)}}
 function updateView(){
  const seed=selectedZ>=1&&selectedZ<=27,ref=selectedZ===0;
  const n=ref?null:all[selectedZ-1],cell=seed?cells[selectedZ-1]:null,t=cell?tokens[cell.token-1]:null;
  $("sel").textContent=ref?"D = 0 · □":String(selectedZ).padStart(2,"0")+" · "+n.symbol;
  $("selName").textContent=ref?"Scalar-zero ground reference, not an element":n.name+(seed?" · 27-cell overlay":" · full 118-element register");
  $("bit").textContent=ref?"0 · BOX":n.bit+" · "+n.shape.toUpperCase();
  $("weight").textContent=seed?cell.weight+" · "+cell.symbol:"NO SEED";
  $("tokenNo").textContent=seed?cell.token+" / 20":"—";
  $("response").textContent=seed?(latest.get(selectedZ)||"UNASSIGNED").toUpperCase():"NOT ASSIGNED";
  for(let b of document.querySelectorAll("[data-response]"))if(b.tagName==="BUTTON")b.setAttribute("aria-pressed",String(seed&&latest.get(selectedZ)===b.dataset.response));
  for(let b of document.querySelectorAll("[data-response]"))if(b.tagName==="BUTTON")b.disabled=!seed;
  for(let [z,b] of elCells){let x=latest.get(z)||"",tag=b.querySelector(".response");b.dataset.response=x;tag.textContent=x?x.toUpperCase():"—";b.classList.toggle("selected",z===selectedZ);}
  for(let [i,b] of elTokens)b.classList.toggle("selected",!!t&&i===t.index);
  for(let [z,b] of elElements)b.classList.toggle("selected",z===selectedZ);
  for(let b of $("periods").children)b.classList.toggle("active",selectedZ===0?!b.dataset.period:Number(b.dataset.period)===selectedPeriod);
  if(t)$("operatorDetail").textContent="TOKEN "+t.index+"/20 · '"+t.symbol+"' · ADVANCE "+t.weight+" · POSITIONS "+t.first+"–"+t.last+" · CUMULATIVE "+t.last+"/27";
  else $("operatorDetail").textContent="No weighted seed operator for this selected coordinate.";
  $("elementNote").textContent=ref?"D=0 is the reference box and is not atomic number zero.":n.noble?"Noble-gas box lid: "+n.symbol+" (Z "+n.z+").":seed?"First 27 known elements indexed by the 27 weighted source positions.":"Known chemistry identity; parity is model geometry only.";
 }
 function assign(response){if(selectedZ<1||selectedZ>27||!valid.includes(response))return;
  const entry={seq:logs.length+1,address:selectedZ,response,operator:cells[selectedZ-1].symbol,weight:cells[selectedZ-1].weight,
   token:cells[selectedZ-1].token,when:new Date().toISOString(),kind:"human-chosen symbolic response"};
  logs.push(entry);latest.set(selectedZ,response);
  try{localStorage.setItem(STORAGE,JSON.stringify(logs))}catch(_){}
  inspectLog();updateView()}
 document.querySelectorAll("button[data-response]").forEach(b=>b.addEventListener("click",()=>assign(b.dataset.response)));
 $("prev").addEventListener("click",()=>select(selectedZ<=1?27:selectedZ-1));
 $("next").addEventListener("click",()=>select(selectedZ>=27?1:selectedZ+1));
 $("export").addEventListener("click",()=>{
  const payload={title:"ROOT0 GEN6 · 0 BOX / 1 TOROID",source:SOURCE,symbols:20,dots:13,bars:7,weightedCells:27,
   ratio:"one vertical bar contributes two logical positions; dot contributes one",
   mapping:"state bit = Z mod 2, 0 BOX, 1 TOROID; D=0 scalar reference",
   labels:"fight/flight/hide: manual, symbolic, not biology diagnosis",
   tokens:tokens,cells:cells,closures:ENDS.map((z,i)=>({range:[STARTS[i],z],noble:CHEM_SYMBOLS[z-1]})),
   elementCount:all.length,elements:all,observations:logs.slice(),exportedAt:new Date().toISOString()};
  const b=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(b),a=document.createElement("a");
  a.href=url;a.download="ROOT0_GEN6_27_CELLULAR_118_ELEMENTS.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 function notifyHeight(){if(window.parent!==window)window.parent.postMessage({kind:"root0-gen6-height",height:document.documentElement.scrollHeight},"*")}
 drawTokens();drawCells();renderPeriods();renderElements();inspectLog();updateView();
 if(typeof ResizeObserver==="function")new ResizeObserver(notifyHeight).observe(document.body);
 window.addEventListener("resize",notifyHeight);notifyHeight();
})();
