// Isolated echo worker; no computation or termination authority. .dlw
self.onmessage=({data})=>{if(data?.kind==='echo'&&Array.isArray(data.key))self.postMessage({key:data.key});};
