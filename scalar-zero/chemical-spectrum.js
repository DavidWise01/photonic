const C_SI=299792458,H_SI=6.62607015e-34,E_SI=1.602176634e-19;
const BAND_PRESET={ir:-5,vis:Math.log10(550e-9),xr:-10,ga:-12};
function spectrumBand(lambda){
 if(lambda>=1e-3)return"Microwave";
 if(lambda>=7e-7)return"Infrared";
 if(lambda>=4e-7)return"Visible";
 if(lambda>=1e-8)return"Ultraviolet";
 if(lambda>=1e-11)return"X-ray";
 return"Gamma (approx.)"}
function wavelengthUnit(m){
 if(m>=1e-3)return(m*1e3).toPrecision(4)+" mm";
 if(m>=1e-6)return(m*1e6).toPrecision(4)+" µm";
 if(m>=1e-9)return(m*1e9).toPrecision(4)+" nm";
 return(m*1e12).toPrecision(4)+" pm"}
function refreshSpectrum(){
 const e=+$("exp").value,lambda=Math.pow(10,e),freq=C_SI/lambda,energyEV=H_SI*freq/E_SI,band=spectrumBand(lambda);
 $("expval").textContent=e.toFixed(2);$("lambda").textContent=wavelengthUnit(lambda);
 $("frequency").textContent=sci(freq,4)+" Hz";
 $("energy").textContent=energyEV>=1e6?(energyEV/1e6).toPrecision(4)+" MeV":energyEV>=1e3?(energyEV/1e3).toPrecision(4)+" keV":energyEV.toPrecision(4)+" eV";
 $("category").textContent=band;$("band").textContent=band+" · "+sci(lambda,3)+" m";
 for(let [k,b] of [["ir","Infrared"],["vis","Visible"],["xr","X-ray"],["ga","Gamma (approx.)"]])$(k).setAttribute("aria-pressed",String(band===b));
}
$("exp").addEventListener("input",refreshSpectrum);
document.querySelectorAll("[data-band]").forEach(b=>b.addEventListener("click",()=>{
 $("exp").value=BAND_PRESET[b.dataset.band];refreshSpectrum()}));
refreshSpectrum();selectElement(1);
function notifyHeight(){if(parent!==window)parent.postMessage({kind:"root0-chem-height",height:document.documentElement.scrollHeight},"*")}
if(typeof ResizeObserver==="function")new ResizeObserver(notifyHeight).observe(document.body);
window.addEventListener("resize",notifyHeight);notifyHeight();
