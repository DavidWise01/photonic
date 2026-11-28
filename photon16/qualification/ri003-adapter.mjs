// Isolated qualification adapter. Never calls simulated stop observation. .dlw
export class IdentityAdapter {
 constructor(e){if(e.photon_rg_abi()!==1||typeof e.photon_rg_identity!=='function')throw Error('ABI unavailable');this.e=e;this.bindings=new Map();this.seen=new Set();}
 identity(slot){return Array.from({length:4},(_,i)=>this.e.photon_rg_identity(slot,i)>>>0);}
 bind(slot,worker){if(!Number.isInteger(slot)||slot<0||slot>2||!worker||this.bindings.has(slot)||[...this.bindings.values()].some(b=>b.worker===worker))throw Error('invalid binding');const key=this.identity(slot);if(key[0]===4294967295||key[1]!==slot||key[3]!==0||this.seen.has(key[0]))throw Error('invalid identity');this.seen.add(key[0]);this.bindings.set(slot,{worker,key,accepted:false});return [...key];}
 observe(slot,worker,data){const b=this.bindings.get(slot);if(!b||b.worker!==worker||b.accepted||!Array.isArray(data?.key)||data.key.length!==4||!b.key.every((v,i)=>v===data.key[i])||!b.key.every((v,i)=>v===this.identity(slot)[i]))return false;b.accepted=true;return true;}
 unbind(slot,worker){const b=this.bindings.get(slot);if(!b||b.worker!==worker)return false;this.bindings.delete(slot);return true;}
}
