
function renderTable(){
 let root=$("ptable");root.textContent="";
 for(let [row,text] of [[6,"57–71"],[7,"89–103"]]){let d=document.createElement("div");d.className="gap";d.style.gridRow=row;d.textContent=text;root.appendChild(d)}
 for(let z=1;z<=118;z++){
  let [row,col]=groupPos(z),a=elemAngle(z);let b=document.createElement("button");
  b.type="button";b.className="el";b.dataset.z=z;b.style.gridRow=row;b.style.gridColumn=col;
  b.style.background=toCSS(chemRGB(a));b.setAttribute("aria-label",CHEM_NAMES[z-1]+", atomic number "+z);
  b.title=z+" "+CHEM_NAMES[z-1];let n=document.createElement("small");n.textContent=z;
  let s=document.createElement("span");s.textContent=CHEM_SYMBOLS[z-1];
  b.append(n,s);b.addEventListener("click",()=>selectElement(z));root.appendChild(b)}
}
$("search").addEventListener("input",()=>{let q=$("search").value.trim().toLowerCase();
 document.querySelectorAll(".el").forEach(b=>{let z=+b.dataset.z,show=!q||(""+z)===q||CHEM_SYMBOLS[z-1].toLowerCase().includes(q)||CHEM_NAMES[z-1].toLowerCase().includes(q);
 b.classList.toggle("dim",!show)})});
renderTable();
