
var chemAngle=60,chemSelected=1;
function sendChem(){if(window.parent!==window){try{window.parent.postMessage({kind:"root0-chem-color",rgb:$("apply").checked?chemRGB(chemAngle).map(x=>x/255):null},"*")}catch(_){}}}
function setAngle(a,send=true){chemAngle=CLAMP(Math.round(a),0,360);$("ang").value=chemAngle;
 var sec=chemSector(chemAngle),rgb=chemRGB(chemAngle);
 $("angleVal").textContent=chemAngle+"°";$("sector").textContent=sec.name;$("casimir").textContent=sec.k;$("swatch").style.background=toCSS(rgb);
 ["H","O","N"].forEach(k=>$("s"+k).setAttribute("aria-pressed",String(sec.key===k)));
 paintGradient();if(send)sendChem()}
function paintGradient(){let can=$("gradient"),ctx=can.getContext("2d");
 let im=ctx.createImageData(can.width,can.height);
 for(let x=0;x<can.width;x++){let rgb=chemRGB(x*360/(can.width-1));for(let y=0;y<can.height;y++){let i=(y*can.width+x)*4;im.data[i]=rgb[0];im.data[i+1]=rgb[1];im.data[i+2]=rgb[2];im.data[i+3]=255}}
 ctx.putImageData(im,0,0);let px=chemAngle/360*can.width;
 ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,can.height);ctx.stroke()}
$("ang").addEventListener("input",()=>setAngle(+$("ang").value));
$("gradient").addEventListener("click",e=>{let r=e.currentTarget.getBoundingClientRect();setAngle((e.clientX-r.left)/r.width*360)});
[["H",60],["O",180],["N",300]].forEach(([k,a])=>$("s"+k).addEventListener("click",()=>{setAngle(a);selectElement(k==="H"?1:k==="O"?8:7)}));
$("apply").addEventListener("change",sendChem);
function selectElement(z){chemSelected=z;let [p,g]=groupPos(z),a=elemAngle(z);
 $("elementBadge").textContent=z+" · "+CHEM_SYMBOLS[z-1];$("elementName").textContent=CHEM_NAMES[z-1];$("elementInfo").textContent="Z "+z+" · period "+(p>7?p-2:p)+" · "+(p>7?"f-block":"group "+g);
 $("elementCoordinate").textContent="Registry θ "+a+"°";document.querySelectorAll(".el").forEach(b=>b.classList.toggle("active",+b.dataset.z===z));setAngle(a)}
