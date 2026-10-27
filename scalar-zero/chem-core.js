"use strict";
const $=id=>document.getElementById(id);
const CLAMP=(n,a,b)=>Math.min(b,Math.max(a,n));
function chemSector(a){return a<=120?{key:"H",name:"HYDROGEN · RED",k:"+1k",i:0}:a<=240?{key:"O",name:"OXYGEN · GREEN",k:"0k",i:1}:{key:"N",name:"NITROGEN · BLUE",k:"−1k",i:2}}
function chemRGB(a){a=CLAMP(a,0,360);let sec=chemSector(a),t=sec.i===0?a/120:sec.i===1?(a-121)/119:(a-241)/119;
 const stops=[[[112,24,50],[232,65,52],[142,30,42]],[[22,87,52],[49,219,119],[15,101,89]],[[24,46,109],[80,122,244],[47,53,145]]][sec.i];
 const left=t<=.5?stops[0]:stops[1],right=t<=.5?stops[1]:stops[2],u=(t%0.5)*2;
 return left.map((v,i)=>Math.round(v+(right[i]-v)*u))}
function toCSS(rgb){return "rgb("+rgb.join(",")+")"}
function groupPos(z){if(z===1)return[1,1];if(z===2)return[1,18];
 if(z<=4)return[2,z-2];if(z<=10)return[2,z+8];
 if(z<=12)return[3,z-10];if(z<=18)return[3,z];
 if(z<=36)return[4,z-18];if(z<=54)return[5,z-36];
 if(z<=56)return[6,z-54];if(z<=71)return[8,z-53];
 if(z<=86)return[6,z-68];if(z<=88)return[7,z-86];
 if(z<=103)return[9,z-85];return[7,z-100]}
function elemAngle(z){if(z===1)return 60;if(z===8)return 180;if(z===7)return 300;return Math.round((z-1)*360/117)}
function sci(v,d=3){return v.toExponential(d).replace("e+"," ×10^").replace("e-"," ×10^-")}
if(CHEM_SYMBOLS.length!==118||CHEM_NAMES.length!==118||CHEM_SYMBOLS[117]!=="Og"||CHEM_NAMES[117]!=="Oganesson")throw Error("Element registry corrupted");
