"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const SOURCE="..||..|....|||....|.", STORE="root0.gen6.cellular27.responses.v1";
 const CHOICES=["fight","flight","hide"];
 const tokens=[],cells=[],pairs=[];
 let pos=0;
 for(let i=0;i<SOURCE.length;i++){
  const symbol=SOURCE[i],weight=symbol==="."?1:2,start=pos+1,end=pos+weight;
  tokens.push({number:i+1,symbol,weight,start,end});
  for(let z=start;z<=end;z++)cells.push({
    z,element:CHEM_SYMBOLS[z-1],name:CHEM_NAMES[z-1],
    bit:z%2,geometry:z%2?"toroid":"box",weight,token:i+1,symbol,
    mirrored:28-z,offset:z-14
  });
  pos=end;
 }
 for(let k=1;k<=13;k++){
  const a=14-k,b=14+k;
  pairs.push({distance:k,left:a,right:b,sameParity:(a%2)===(b%2),
    weightDelta:cells[a-1].weight-cells[b-1].weight});
 }
 if(CHEM_SYMBOLS.length!==118||CHEM_NAMES.length!==118||
    tokens.length!==20||cells.length!==27||pos!==27||
    SOURCE.split(".").length-1!==13||SOURCE.split("|").length-1!==7||
    pairs.length!==13||pairs.some(p=>!p.sameParity||p.left+p.right!==28)||
    cells[13].element!=="Si"||cells[26].element!=="Co"||
    pairs.reduce((a,p)=>a+2,1)!==27)throw Error("GEN7 boundary violated");
 let selected=14,logs=[];
 try{
  const saved=JSON.parse(localStorage.getItem(STORE)||"[]");
  if(Array.isArray(saved))logs=saved.filter(e=>e&&Number.isInteger(e.address)&&e.address>=1&&e.address<=27&&CHOICES.includes(e.response)).slice(0,5000);
 }catch(_){}
 const latest=new Map();logs.forEach(e=>latest.set(e.address,e.response));
 let spine=new Map(),rowNodes=[];
 function make(tag,cls,text){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
 }
 function select(z){
  if(!Number.isInteger(z)||z<1||z>27)return;
  selected=z;refresh();
 }
 function paintSpine(){
  const root=$("spine");root.replaceChildren();
  for(const c of cells){
   const b=make("button","pip "+(c.bit?"odd":"even")+(c.z===14?" center":""));
   b.type="button";b.title=c.z+" "+c.name+" / "+(c.bit?"toroid":"box")+" / token "+c.token;
   b.setAttribute("aria-label","Position "+c.z+", "+c.name+", "+(c.bit?"toroid":"box"));
   const g=make("span","glyph",c.bit?"◉":"□"),n=make("small","",String(c.z).padStart(2,"0"));
   b.append(g,n);b.addEventListener("click",()=>select(c.z));root.appendChild(b);spine.set(c.z,b);
  }
 }
 function paintPairs(){
  const root=$("pairs");root.replaceChildren();
  for(const p of pairs){
   const row=make("div","pair"),tag=make("span","",String(p.distance).padStart(2,"0")+" FROM 14");
   const left=cells[p.left-1],right=cells[p.right-1],lb=make("button",left.bit?"odd":"even"),rb=make("button",right.bit?"odd":"even");
   lb.type="button";rb.type="button";lb.dataset.z=p.left;rb.dataset.z=p.right;
   for(const [button,cell] of [[lb,left],[rb,right]]){
    button.append(make("span","",(cell.bit?"◉ ":"□ ")+cell.z+" "+cell.element),
                  make("span","desc",cell.symbol+cell.weight));
    button.title=cell.name+" / token "+cell.token;
    button.addEventListener("click",()=>select(cell.z));
   }
   const compare=make("strong","", "△W "+(p.weightDelta>0?"+":"")+p.weightDelta);
   row.append(tag,lb,compare,rb);root.appendChild(row);
   rowNodes.push({p,row,lb,rb,compare});
  }
 }
 function getResponse(z){return latest.get(z)||null}
 function refresh(){
  const c=cells[selected-1],mirrored=c.mirrored,delta=Math.abs(c.offset),r=getResponse(selected);
  $("selected").textContent=String(selected).padStart(2,"0")+" · "+c.element;
  $("elemName").textContent=c.name+(selected===14?" · center pivot":" · "+(c.offset<0?"left":"right")+" arm");
  $("geom").textContent=c.bit+" · "+c.geometry.toUpperCase();
  $("operator").textContent="#"+String(c.token).padStart(2,"0")+" · "+c.symbol+" / "+c.weight;
  $("mirror").textContent=selected===14?"CENTER":selected+" ↔ "+mirrored;
  $("response").textContent=r?r.toUpperCase():"UNASSIGNED";
  for(const [z,node] of spine)node.classList.toggle("selected",z===selected);
  for(const item of rowNodes){
   const {p,row,lb,rb,compare}=item,active=selected===p.left||selected===p.right;
   const l=getResponse(p.left),r2=getResponse(p.right);
   row.classList.toggle("active",active);
   lb.classList.toggle("selected",selected===p.left);
   rb.classList.toggle("selected",selected===p.right);
   const flag=l&&r2?(l===r2?"REPORTS MATCH":"REPORTS DIFFER"):"REPORTS OPEN";
   compare.textContent="△W "+(p.weightDelta>0?"+":"")+p.weightDelta+" · "+(flag==="REPORTS MATCH"?"=":flag==="REPORTS DIFFER"?"≠":"?");
   compare.classList.toggle("diff",flag==="REPORTS DIFFER");
   compare.title=flag+"; reports are not automatically reconciled";
  }
  for(const button of document.querySelectorAll("[data-choice]"))button.setAttribute("aria-pressed",String(button.dataset.choice===r));
  $("mirrorButton").disabled=selected===14;
 }
 function assign(choice){
  if(!CHOICES.includes(choice))return;
  const c=cells[selected-1];
  const entry={seq:logs.length+1,address:c.z,response:choice,operator:c.symbol,weight:c.weight,token:c.token,
   when:new Date().toISOString(),kind:"human-chosen symbolic response",geometry:c.geometry,centeredOffset:c.offset};
  logs.push(entry);latest.set(selected,choice);
  try{localStorage.setItem(STORE,JSON.stringify(logs))}catch(_){}
  refresh();renderLog();
 }
 function renderLog(){
  const root=$("log");root.replaceChildren();
  if(!logs.length){root.textContent="No response observations in this browser.";return}
  for(const e of logs.slice(-9).reverse()){
   const div=make("div","log-entry",
    "#"+e.seq+" · Z "+String(e.address).padStart(2,"0")+" "+CHEM_SYMBOLS[e.address-1]+" · "+e.response.toUpperCase()+" · "+e.when);
   root.appendChild(div);
  }
 }
 function mirror(){select(28-selected)}
 function exportJSON(){
  const obj={
   name:"ROOT0 GEN7 — 13|1|13 Mirror",version:"1.0",source:SOURCE,
   schema:"root0-gen7-mirror-13-1-13",
   reference:{D:0,role:"external scalar-zero coordinate reference; not an element"},
   total:27,partition:{left:13,pivot:1,right:13,centerAddress:14,centerElement:"Si",
    note:"13x1x13 is a spatial partition 13+1+13=27, not arithmetic multiplication"},
   grammar:{dotWeight:1,barWeight:2,tokens:20,dots:13,bars:7},
   coordinateSystem:{left:"1..13",center:14,right:"15..27",mirror:"28-z",
    alternative:"3x3x3 27-point arrangement (different topology)"},
   mirrorPairs:pairs,cells,
   threeLabels:"fight/flight/hide are user-selected symbols, never automatic classifications",
   observations:logs.slice(),selected,created:new Date().toISOString(),
   disclaimer:"Geometric overlay, not a measured chemical or cellular mechanism; original element names from IUPAC"}
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=u;a.download="ROOT0_GEN7_13_1_13_27_BOUNDARY.json";document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
 }
 for(const b of document.querySelectorAll("[data-choice]"))b.addEventListener("click",()=>assign(b.dataset.choice));
 $("prev").addEventListener("click",()=>select(selected===1?27:selected-1));
 $("next").addEventListener("click",()=>select(selected===27?1:selected+1));
 $("mirrorButton").addEventListener("click",mirror);
 $("export").addEventListener("click",exportJSON);
 paintSpine();paintPairs();renderLog();refresh();
 if(window.parent!==window){
  const height=()=>window.parent.postMessage({kind:"root0-gen7-height",height:document.documentElement.scrollHeight},"*");
  if(typeof ResizeObserver==="function")new ResizeObserver(height).observe(document.body);
  window.addEventListener("resize",height);height();
 }
})();