//! PHOTON-16 v0.99 — native dimensional kernel. .dlw
const RATES: [f64;4] = [0.0625,0.125,0.25,0.5];
const WIDTHS: [u8;4] = [8,16,32,64];
#[derive(Clone)]
enum Buffer { I8(Box<[i8;16]>), I16(Box<[i16;16]>), F32(Box<[f32;16]>), F64(Box<[f64;16]>) }
impl Buffer {
    fn new(b:u8)->Self { match b {8=>Self::I8(Box::new([0;16])),16=>Self::I16(Box::new([0;16])),32=>Self::F32(Box::new([0.;16])),64=>Self::F64(Box::new([0.;16])),_=>panic!("width")} }
    fn width(&self)->u8 {match self {Self::I8(_)=>8,Self::I16(_)=>16,Self::F32(_)=>32,Self::F64(_)=>64}}
    fn bytes(&self)->usize {match self {Self::I8(a)=>std::mem::size_of_val(&**a),Self::I16(a)=>std::mem::size_of_val(&**a),Self::F32(a)=>std::mem::size_of_val(&**a),Self::F64(a)=>std::mem::size_of_val(&**a)}}
    fn get(&self,j:usize)->f64 {let r=if j<8 {1.}else{2.}; match self {Self::I8(a)=>a[j] as f64*r/127.,Self::I16(a)=>a[j] as f64*r/32767.,Self::F32(a)=>a[j] as f64,Self::F64(a)=>a[j]}}
    fn set(&mut self,j:usize,x:f64){let r=if j<8{1.}else{2.};assert!(x.is_finite()&&x.abs()<=r+1e-12);match self {Self::I8(a)=>a[j]=((x.clamp(-r,r)*127./r)+0.5).floor() as i8,Self::I16(a)=>a[j]=((x.clamp(-r,r)*32767./r)+0.5).floor() as i16,Self::F32(a)=>a[j]=x as f32,Self::F64(a)=>a[j]=x}}
    fn convert(&self,b:u8)->Self{let mut out=Self::new(b);for j in 0..16{out.set(j,self.get(j));}out}
}
fn quant(x:f64,r:f64,b:u8)->f64{match b {64=>x,32=>(x as f32) as f64,_=>{let m=((1u32<<(b-1))-1) as f64; (x.clamp(-r,r)*m/r+0.5).floor()*r/m}}}
fn elements(k:u32)->Vec<Vec<usize>>{let mut out=vec![];for mask in 0usize..16{if mask.count_ones()!=k{continue}for fixed in 0..16{if fixed&mask!=0{continue}out.push((0..16).filter(|v|v&!mask==fixed).collect());}}out}
fn paths()->Vec<(usize,usize,usize,usize,usize)>{let cells=elements(3);let faces=elements(2);let edges=elements(1);let mut out=vec![];for(c,cv)in cells.iter().enumerate(){for(f,fv)in faces.iter().enumerate(){if !fv.iter().all(|v|cv.contains(v)){continue}for(e,ev)in edges.iter().enumerate(){if ev.iter().all(|v|fv.contains(v)){out.push((c,f,e,cv.iter().position(|v|*v==ev[0]).unwrap(),cv.iter().position(|v|*v==ev[1]).unwrap()));}}}}out}
fn signal(c:usize,l:usize,t:usize,g:usize)->f64{let p=t as f64*std::f64::consts::PI/180.+g as f64*0.03;let r=(c+if g>=4{2}else{0})%8;(0.8+0.02*l as f64)*match r{0=>0.4,1=>p.sin(),2=>(p*4.).sin(),3=>(p*12.).sin(),4=>if t<180{-0.5}else{0.5},5=>p.sin()*0.5+0.2*(p*9.).sin(),6=>p.sin()*0.3+0.35*(t as f64*2.31).sin(),_=>0.6*(p*2.).sin()+0.15*(t as f64*1.7).cos()}}
#[derive(Debug)]
struct Epoch{widths:[u8;8],rates:[usize;8],bytes:usize,mae:f64,seal:Seal,storage:StorageStats}
impl PartialEq for Epoch{fn eq(&self,o:&Self)->bool{self.widths==o.widths&&self.rates==o.rates&&self.bytes==o.bytes&&self.mae==o.mae&&self.seal==o.seal}}
#[derive(Debug,PartialEq)]
struct Run{epochs:Vec<Epoch>,count:usize,updates:usize,traffic:usize,stages:usize,lineage:u32}
fn run()->Run{run_order(0)}
fn run_order(order:usize)->Run{run_storage_mode::<56,true>(order)}
#[cfg(test)] fn run_storage<const N:usize>(order:usize)->Run{run_storage_mode::<N,false>(order)}
fn run_storage_mode<const N:usize,const ADAPT:bool>(order:usize)->Run{
 let paths=paths();let mut mem:[Buffer;8]=std::array::from_fn(|_|Buffer::new(64));let mut applied:[[Option<usize>;8];8]=[[None;8];8];let mut rates=[1usize;8];let mut out=Run{epochs:vec![],count:0,updates:0,traffic:0,stages:0,lineage:2166136261};
 let mut capacity=CapacityPolicy::default();let mut pool=StoragePool::<N>::default();
 for g in 0..8{
 let widths=std::array::from_fn(|c|mem[c].width());let mut loss=[[0.;4];8];let mut probe=[[0.;4];8];let mut samples=[0usize;8];let mut errors=[0.;8];let mut counts=[0usize;8];
 for t in 0..360{
 let mut pending=PendingTick::<N,ADAPT>::recycled(g,t,&mem,&mut pool,N==56&&ADAPT&&capacity.expanded);
 // Read phase: no writes to predictor storage until every path has observed this tick.
 for i in 0..192{let slot=match order{1=>191-i,2=>(i*37+g+t)%192,_=>i};let(c,f,e,l0,l1)=paths[slot];let l=if t%2==0{l0}else{l1};let x=signal(c,l,t,g);let m=mem[c].get(l);let obs=Observation{id:CodonId{g,t,c,f,e,l},value:x,prior:m};pending.observe_recycled(slot,&obs,&paths,&mut pool);}
 if N==56&&ADAPT{let diverse=pending.diverse(&paths);capacity.finish(diverse);}
 let mut records=pending.finish(&paths);let mut sum=[[0.;8];8];let mut n=[[0usize;8];8];
 for obs in records.by_ref() {let c=obs.id.c;let l=obs.id.l;let x=obs.value;let m=obs.prior;let stages=reciprocal(&obs);for stage in &stages{assert_eq!(stage.parent,obs.id);out.lineage=(out.lineage ^ stage.code()).wrapping_mul(16777619);out.stages+=1;}errors[c]+=(x-m).abs();counts[c]+=1;out.count+=1;sum[c][l]+=x;n[c][l]+=1;
 if let Some(a)=applied[c][l]{for k in 0..4{loss[c][k]+=(x-(m+(RATES[k]-RATES[a])*mem[c].get(8+l))).abs();}}}
 // Consume the observation accumulator before acquiring mutable predictor access.
 // Canonical records have been fully consumed.
 records.recycle(&mut pool);
 pool.trim(IDLE_POOL_BUDGET,N==56&&ADAPT&&capacity.expanded);pool.checkpoint();
 // Write phase: each address updated once, after observation completes.
 for c in 0..8{for l in 0..8{if n[c][l]==0{continue}let m=mem[c].get(l);let d=sum[c][l]/n[c][l] as f64-m;let ideal=m+RATES[rates[c]]*d;samples[c]+=1;for(k,&b)in WIDTHS.iter().enumerate(){probe[c][k]+=(quant(ideal,1.,b)-ideal).abs()+0.5*(quant(d,2.,b)-d).abs();}mem[c].set(l,ideal);mem[c].set(8+l,d);applied[c][l]=Some(rates[c]);out.updates+=1;}}
 }
 let parent=out.epochs.last().map_or(0,|e|e.seal.chain);let seal=Seal::new(g,parent,out.lineage,out.count,out.stages,out.updates,&mem,&applied,&rates);out.epochs.push(Epoch{widths,rates,bytes:mem.iter().map(Buffer::bytes).sum(),mae:errors.iter().sum::<f64>()/(360.*192.),seal,storage:pool.snapshot()});
 for c in 0..8{let budget=(0.015*errors[c]/counts[c] as f64).max(0.00001);let w=widths[c];let mut best=64;let mut score=f64::INFINITY;for(k,&b)in WIDTHS.iter().enumerate(){let p=probe[c][k]/samples[c] as f64;if p>budget{continue}let cost=2.*b as f64+if b==w{0.}else{0.25*2.*(w as f64+b as f64)}+16.*p/budget;if cost<score{score=cost;best=b;}}if g<7&&best!=w{let next=mem[c].convert(best);out.traffic+=mem[c].bytes()+next.bytes();mem[c]=next;}let mut k=rates[c];for j in 0..4{if loss[c][j]<loss[c][k]{k=j;}}rates[c]=k;}
 }
 out
}
pub fn cli(){let start=std::time::Instant::now();let r=run();for(g,e)in r.epochs.iter().enumerate(){println!("G{g}: {e:?}");}println!("codons={} updates={} payload_conversion_bytes={} elapsed={:?} .dlw",r.count,r.updates,r.traffic,start.elapsed());}
#[cfg(test)]
mod tests{use super::*;
 #[test]fn js_v80_parity(){let r=run();let bytes=[1024,224,240,240,256,256,288,288];let mae=[0.17240491799537244,0.09489707707406808,0.09397961280869428,0.09392524160032228,0.10640566052495075,0.09366220891944949,0.0936690702473279,0.09365943733222841];let widths=[[64,64,64,64,64,64,64,64],[16,16,8,8,16,16,16,16],[16,16,16,8,16,16,16,16],[16,16,16,8,16,16,16,16],[16,16,16,16,16,16,16,16],[16,16,16,16,16,16,16,16],[16,16,16,16,16,16,32,16],[16,16,16,16,16,16,32,16]];let rates=[[1,1,1,1,1,1,1,1],[3,3,3,3,3,3,0,3],[3,3,3,3,3,3,0,2],[3,3,3,3,3,3,0,2],[3,3,3,3,3,3,0,2],[3,3,3,3,0,2,3,3],[3,3,3,3,0,2,3,3],[3,3,3,3,0,2,3,3]];for(g,e)in r.epochs.iter().enumerate(){assert_eq!(e.bytes,bytes[g]);assert_eq!(e.widths,widths[g]);assert_eq!(e.rates,rates[g]);assert!((e.mae-mae[g]).abs()<1e-7,"epoch {g}: {}",e.mae);}assert_eq!(r.traffic,1440);}
 #[test]fn topology(){assert_eq!((0..=4).map(|k|elements(k).len()).collect::<Vec<_>>(),vec![16,32,24,8,1]);assert_eq!(paths().len(),192);}
 #[test]fn buffers(){for b in WIDTHS{let mut a=Buffer::new(b);a.set(0,0.4);a.set(8,-1.2);assert!((a.get(0)-0.4).abs()<0.005);assert!((a.get(8)+1.2).abs()<0.009);assert_eq!(a.bytes(),2*b as usize);}}
 #[test]fn replay_and_coverage(){let a=run();assert_eq!(a,run());assert_eq!(a.count,552960);assert_eq!(a.updates,161280);assert_eq!(a.epochs[0].bytes,1024);assert!(a.epochs.iter().all(|e|e.mae.is_finite()));}
}

thread_local! { static RESULT: std::cell::RefCell<Option<Run>> = const { std::cell::RefCell::new(None) }; }
#[no_mangle] pub extern "C" fn photon_run()->u32 { let r=run(); let count=r.count as u32; RESULT.with(|s| *s.borrow_mut()=Some(r)); count }
#[no_mangle] pub extern "C" fn photon_abi()->u32 { 83 }
#[no_mangle] pub extern "C" fn photon_metric(g:u32,kind:u32,c:u32)->f64 { RESULT.with(|s| { let s=s.borrow(); let Some(r)=s.as_ref() else{return f64::NAN}; if kind==4{return r.count as f64} if kind==5{return r.updates as f64} if kind==6{return r.traffic as f64} if kind==7{return r.stages as f64} if kind==8{return r.lineage as f64} let Some(e)=r.epochs.get(g as usize) else{return f64::NAN}; match kind {9=>e.seal.chain as f64,10=>e.seal.state as f64,11=>e.seal.parent as f64,12=>e.seal.codons as f64,13=>e.seal.stages as f64,14=>e.seal.updates as f64,15=>e.seal.lineage as f64,16..=25=>e.storage.metric(kind),0=>e.mae,1=>e.bytes as f64,2=>e.widths.get(c as usize).map_or(f64::NAN,|v|*v as f64),3=>e.rates.get(c as usize).map_or(f64::NAN,|v|*v as f64),_=>f64::NAN} }) }
#[cfg(test)] mod bridge_tests {use super::*; #[test] fn bridge(){assert_eq!(photon_abi(),83);assert!(photon_metric(0,0,0).is_nan());assert_eq!(photon_run(),552960);assert_eq!(photon_metric(7,5,0),161280.);assert!(photon_metric(99,0,0).is_nan());assert!(photon_metric(0,2,99).is_nan());}}

#[derive(Clone,Copy,Debug,PartialEq,Eq)]
struct CodonId{g:usize,t:usize,c:usize,f:usize,e:usize,l:usize}
#[derive(Clone,Copy)]
struct Observation{id:CodonId,value:f64,prior:f64}
#[derive(Clone,Copy)]
struct Stage{parent:CodonId,dimension:u8,inward:bool,scope:usize,guidance:f64}
impl Stage{fn code(&self)->u32{let p=self.parent;let mut h=0u32;for v in [p.g,p.t,p.c,p.f,p.e,p.l,self.dimension as usize,self.inward as usize,self.scope]{h=h.wrapping_mul(31).wrapping_add(v as u32);}h}}
fn reciprocal(obs:&Observation)->[Stage;8]{let d=(obs.value-obs.prior).clamp(-1.,1.);std::array::from_fn(|i|{let inward=i>=4;let dimension=if inward{8-i}else{i+1} as u8;let scope=match dimension{1=>obs.id.e,2=>obs.id.f,3=>obs.id.c,_=>0};Stage{parent:obs.id,dimension,inward,scope,guidance:if inward{d}else{obs.value}}})}
#[cfg(test)]mod lineage_tests{use super::*;#[test]fn lineage(){let obs=Observation{id:CodonId{g:0,t:0,c:0,f:0,e:0,l:0},value:0.5,prior:0.25};let s=reciprocal(&obs);assert_eq!(s.map(|x|x.dimension),[1,2,3,4,4,3,2,1]);assert!(s[..4].iter().all(|x|!x.inward&&x.guidance==0.5));assert!(s[4..].iter().all(|x|x.inward&&x.guidance==0.25));assert!(s.iter().all(|x|x.parent==obs.id));let r=run();assert_eq!(r.stages,4423680);assert_eq!(r.lineage,run().lineage);}}

struct PendingTick<'a,const N:usize=192,const ADAPT:bool=false>{g:usize,t:usize,records:Option<Box<[f64;N]>>,promoted:Option<Box<[f64;192]>>,seen:u64,memory:&'a [Buffer;8],count:usize,coverage:[u64;3],topology:Option<&'a [(usize,usize,usize,usize,usize)]>}
impl<'a,const N:usize,const ADAPT:bool> PendingTick<'a,N,ADAPT>{
 fn new(g:usize,t:usize,memory:&'a [Buffer;8])->Self{assert!(N==56||N==192);Self{g,t,records:Some(Box::new([0.;N])),promoted:None,seen:0,memory,count:0,coverage:[0;3],topology:None}}
 fn start_expanded(&mut self){assert_eq!(self.count,0);assert_eq!(N,56);self.records=None;self.promoted=Some(Box::new([0.;192]));}
 fn diverse(&self,paths:&[(usize,usize,usize,usize,usize)])->bool{assert_eq!(self.coverage,[u64::MAX;3]);let Some(full)=self.promoted.as_ref() else{return false};let mut first=[0u64;56];let mut seen=0u64;for(slot,&(c,_,_,lo,hi))in paths.iter().enumerate(){let a=compact_address(c,if self.t%2==0{lo}else{hi},self.t);let bit=1u64<<a;let v=full[slot].to_bits();if seen&bit!=0{if first[a]!=v{return true;}}else{first[a]=v;seen|=bit;}}assert_eq!(seen,(1u64<<56)-1);false}
 fn observe(&mut self,slot:usize,o:&Observation,paths:&'a [(usize,usize,usize,usize,usize)]){let mut pool=StoragePool::<N>::default();pool.active=if self.promoted.is_some(){1536}else{N*8};self.observe_recycled(slot,o,paths,&mut pool);}
 fn observe_recycled(&mut self,slot:usize,o:&Observation,paths:&'a [(usize,usize,usize,usize,usize)],pool:&mut StoragePool<N>){assert_eq!((o.id.g,o.id.t),(self.g,self.t));assert!(slot<192 && paths.len()==192);let(c,f,e,l0,l1)=paths[slot];let l=if self.t%2==0{l0}else{l1};assert_eq!((o.id.c,o.id.f,o.id.e,o.id.l),(c,f,e,l));assert!(o.value.is_finite()&&o.prior.is_finite());let mask=1u64<<(slot%64);assert_eq!(self.coverage[slot/64]&mask,0,"duplicate codon");if let Some(bound)=self.topology{assert!(std::ptr::eq(bound,paths),"topology changed");}else{self.topology=Some(paths);}assert_eq!(self.memory[c].get(l).to_bits(),o.prior.to_bits(),"conflicting contextual prior");if let Some(full)=self.promoted.as_mut(){full[slot]=o.value;}else if N==56{let a=compact_address(c,l,self.t);let bit=1u64<<a;if self.seen&bit!=0{let mismatch=self.records.as_ref().unwrap()[a].to_bits()!=o.value.to_bits();if mismatch{assert!(ADAPT,"distinct measurement in compact mode");let mut full=pool.take_full();let old=self.records.take().unwrap();for j in 0..192{if self.coverage[j/64]&(1u64<<(j%64))!=0{let(cc,_,_,lo,hi)=paths[j];let ll=if self.t%2==0{lo}else{hi};full[j]=old[compact_address(cc,ll,self.t)];}}full[slot]=o.value;pool.return_base(old);self.promoted=Some(full);}}else{self.records.as_mut().unwrap()[a]=o.value;self.seen|=bit;}}else{self.records.as_mut().unwrap()[slot]=o.value;}self.coverage[slot/64]|=mask;self.count+=1;}
 fn recycled(g:usize,t:usize,memory:&'a [Buffer;8],pool:&mut StoragePool<N>,expanded:bool)->Self{assert!(N==56||N==192);let(records,promoted)=if expanded{assert_eq!(N,56);(None,Some(pool.take_full()))}else{(Some(pool.take_base()),None)};Self{g,t,records,promoted,seen:0,memory,count:0,coverage:[0;3],topology:None}}
 fn finish(self,paths:&'a [(usize,usize,usize,usize,usize)])->SealedTick<'a,N>{assert_eq!(self.count,192);assert_eq!(self.coverage,[u64::MAX;3]);assert!(std::ptr::eq(self.topology.expect("missing topology"),paths));if N==56&&self.promoted.is_none(){assert_eq!(self.seen,(1u64<<56)-1);}SealedTick{g:self.g,t:self.t,memory:self.memory,paths,records:self.records,promoted:self.promoted,next:0}}
 #[cfg(test)] fn seal(self,paths:&'a [(usize,usize,usize,usize,usize)])->SealedTick<'a,N>{self.finish(paths)}
 #[cfg(test)] fn close(self)->([[f64;8];8],[[usize;8];8]){let mut sum=[[0.;8];8];let mut n=[[0;8];8];let paths=self.topology.expect("missing topology");for o in self.seal(paths){sum[o.id.c][o.id.l]+=o.value;n[o.id.c][o.id.l]+=1;}(sum,n)}
}
fn fold(h:u32,v:u32)->u32{(h^v).wrapping_mul(16777619)}
#[derive(Debug,PartialEq,Eq)]
struct Seal{parent:u32,chain:u32,state:u32,lineage:u32,codons:usize,stages:usize,updates:usize}
impl Seal{
 fn new(g:usize,parent:u32,lineage:u32,codons:usize,stages:usize,updates:usize,mem:&[Buffer;8],applied:&[[Option<usize>;8];8],rates:&[usize;8])->Self{
 let mut state=2166136261;for(c,b)in mem.iter().enumerate(){state=fold(state,b.width() as u32);state=fold(state,rates[c] as u32);for j in 0..16{let bits=b.get(j).to_bits();state=fold(fold(state,bits as u32),(bits>>32)as u32);}for a in applied[c]{state=fold(state,a.map_or(255,|x|x as u32));}}
 let chain=[g as u32,parent,lineage,state,codons as u32,stages as u32,updates as u32].into_iter().fold(2166136261,fold);
 Self{parent,chain,state,lineage,codons,stages,updates}
 }
}
#[cfg(test)]mod temporal_tests{use super::*;#[test]fn seals(){let r=run();let mut parent=0;for(g,e)in r.epochs.iter().enumerate(){let s=&e.seal;assert_eq!(s.parent,parent);assert_eq!(s.codons,(g+1)*69120);assert_eq!(s.stages,s.codons*8);assert_eq!(s.updates,(g+1)*20160);assert_eq!(s.chain,[g as u32,parent,s.lineage,s.state,s.codons as u32,s.stages as u32,s.updates as u32].into_iter().fold(2166136261,fold));parent=s.chain;}assert_eq!(r,run());}
#[test]#[should_panic]fn incomplete_tick(){PendingTick::<192>::new(0,0,&fixture(0.)).close();}
#[test]#[should_panic]fn foreign_tick(){let mem=fixture(0.);let mut p=PendingTick::<192>::new(0,0,&mem);let topology=paths();p.observe(0,&Observation{id:CodonId{g:0,t:1,c:0,f:0,e:0,l:0},value:0.,prior:0.},&topology);}}

#[cfg(test)]mod coverage_tests{use super::*;
fn obs(p:&[(usize,usize,usize,usize,usize)],slot:usize,t:usize)->Observation{let(c,f,e,l0,l1)=p[slot];Observation{id:CodonId{g:0,t,c,f,e,l:if t%2==0{l0}else{l1}},value:0.5,prior:0.25}}
#[test]fn complete_reverse_order(){let p=paths();for t in [0,1]{let mem=fixture(0.25);let mut a=PendingTick::<192>::new(0,t,&mem);for i in (0..192).rev(){a.observe(i,&obs(&p,i,t),&p);}assert_eq!(std::mem::size_of_val(&a.coverage),24);let(_,n)=a.close();assert_eq!(n.iter().flatten().sum::<usize>(),192);}}
#[test]#[should_panic(expected="duplicate codon")]fn duplicate(){let p=paths();let mem=fixture(0.25);let mut a=PendingTick::<192>::new(0,0,&mem);a.observe(0,&obs(&p,0,0),&p);a.observe(0,&obs(&p,0,0),&p);}
#[test]#[should_panic]fn false_slot(){let p=paths();PendingTick::<192>::new(0,0,&fixture(0.25)).observe(1,&obs(&p,0,0),&p);}
#[test]#[should_panic]fn wrong_endpoint(){let p=paths();let mut o=obs(&p,0,0);o.id.l=(o.id.l+1)%8;PendingTick::<192>::new(0,0,&fixture(0.25)).observe(0,&o,&p);}
#[test]#[should_panic]fn missing_last(){let p=paths();let mem=fixture(0.25);let mut a=PendingTick::<192>::new(0,0,&mem);for i in 0..191{a.observe(i,&obs(&p,i,0),&p);}a.close();}
#[test]#[should_panic]fn out_of_range(){let p=paths();PendingTick::<192>::new(0,0,&fixture(0.25)).observe(192,&obs(&p,0,0),&p);}
}

#[cfg(test)]mod ordering_tests{use super::*;#[test]fn full_run_order_invariance(){let a=run_order(0);assert_eq!(a,run_order(1));assert_eq!(a,run_order(2));}}

#[cfg(test)]mod compact_tests{use super::*;#[test]fn payload_size(){assert_eq!(std::mem::size_of::<[f64;192]>(),1536);assert_eq!(std::mem::size_of::<[u64;3]>(),24);assert!(std::mem::size_of::<f64>()<std::mem::size_of::<Option<Observation>>());}#[test]fn reconstruct(){let p=paths();for t in [0,1]{let mem=fixture(-0.25);let mut a=PendingTick::<192>::new(0,t,&mem);for slot in (0..192).rev(){let(c,f,e,l0,l1)=p[slot];let o=Observation{id:CodonId{g:0,t,c,f,e,l:if t==0{l0}else{l1}},value:slot as f64/192.,prior:-0.25};a.observe(slot,&o,&p);}for(slot,o)in a.seal(&p).enumerate(){let(c,f,e,l0,l1)=p[slot];assert_eq!(o.id,CodonId{g:0,t,c,f,e,l:if t==0{l0}else{l1}});assert_eq!(o.value,slot as f64/192.);assert_eq!(o.prior,-0.25);}}}#[test]#[should_panic(expected="topology changed")]fn foreign_topology(){let p=paths();let q=p.clone();let mem=fixture(0.);let mut a=PendingTick::<192>::new(0,0,&mem);for (slot,top) in [(0,&p),(1,&q)]{let(c,f,e,l,_)=top[slot];a.observe(slot,&Observation{id:CodonId{g:0,t:0,c,f,e,l},value:0.,prior:0.},top);}}}

#[cfg(test)]mod prior_tests{use super::*;
#[test]fn contextual_prior_reconstruction(){let p=paths();for t in [0,1]{let mut mem=fixture(0.);for c in 0..8{for l in 0..8{mem[c].set(l,(c*8+l) as f64/64.);}}let mut a=PendingTick::<192>::new(0,t,&mem);for slot in (0..192).rev(){let(c,f,e,l0,l1)=p[slot];let l=if t==0{l0}else{l1};a.observe(slot,&Observation{id:CodonId{g:0,t,c,f,e,l},value:slot as f64/192.,prior:(c*8+l) as f64/64.},&p);}for o in a.seal(&p){assert_eq!(o.prior,(o.id.c*8+o.id.l) as f64/64.);}}}
#[test]#[should_panic(expected="conflicting contextual prior")]fn conflicting_prior(){let p=paths();let(c,_,_,l,_)=p[0];let j=(1..192).find(|&i|p[i].0==c&&p[i].3==l).unwrap();let mem=fixture(0.25);let mut a=PendingTick::<192>::new(0,0,&mem);for(slot,prior)in [(0,0.25),(j,0.5)]{let(c,f,e,l,_)=p[slot];a.observe(slot,&Observation{id:CodonId{g:0,t:0,c,f,e,l},value:0.,prior},&p);}}
}

#[cfg(test)]fn fixture(value:f64)->[Buffer;8]{std::array::from_fn(|_|{let mut b=Buffer::new(64);for l in 0..8{b.set(l,value);}b})}

fn compact_address(c:usize,l:usize,t:usize)->usize{assert!(c<8);let local=if t%2==0{assert!(l<7);l}else{assert!((1..8).contains(&l));l-1};c*7+local}
#[cfg(test)]mod multiplicity_tests{use super::*;
#[test]fn full_and_compact_parity(){let a=run_storage::<192>(0);assert_eq!(a,run_storage::<56>(0));assert_eq!(a,run_storage::<56>(1));assert_eq!(a,run_storage::<56>(2));}
#[test]fn topology_and_payload(){let p=paths();for t in [0,1]{let mut seen=0u64;for &(c,_,_,l0,l1) in &p{seen|=1u64<<compact_address(c,if t==0{l0}else{l1},t);}assert_eq!(seen,(1u64<<56)-1);}assert_eq!(std::mem::size_of::<[f64;56]>()+std::mem::size_of::<[u64;3]>()+std::mem::size_of::<u64>(),480);}
#[test]#[should_panic(expected="distinct measurement in compact mode")]fn distinct_measurement_rejected(){let p=paths();let mem=fixture(0.);let(c,_,_,l,_)=p[0];let j=(1..192).find(|&i|p[i].0==c&&p[i].3==l).unwrap();let mut a=PendingTick::<56>::new(0,0,&mem);for(slot,value)in [(0,0.25),(j,0.5)]{let(c,f,e,l,_)=p[slot];a.observe(slot,&Observation{id:CodonId{g:0,t:0,c,f,e,l},value,prior:0.},&p);}}
}

#[cfg(test)]mod adaptive_tests{use super::*;
#[test]fn promotion_preserves_every_slot(){let p=paths();let mem=fixture(0.);for t in [0,1]{for order in 0..3{let mut adaptive=PendingTick::<56,true>::new(0,t,&mem);let mut full=PendingTick::<192>::new(0,t,&mem);for i in 0..192{let slot=match order{1=>191-i,2=>(i*37+17)%192,_=>i};let(c,f,e,l0,l1)=p[slot];let l=if t==0{l0}else{l1};let o=Observation{id:CodonId{g:0,t,c,f,e,l},value:slot as f64/192.,prior:0.};adaptive.observe(slot,&o,&p);full.observe(slot,&o,&p);}assert!(adaptive.promoted.is_some());assert!(adaptive.records.is_none());for(a,b)in adaptive.seal(&p).zip(full.seal(&p)){assert_eq!(a.id,b.id);assert_eq!(a.value.to_bits(),b.value.to_bits());assert_eq!(a.prior.to_bits(),b.prior.to_bits());}}}}
#[test]fn compact_stays_compact(){let p=paths();let mem=fixture(0.);let mut a=PendingTick::<56,true>::new(0,0,&mem);for(slot,&(c,f,e,l,_))in p.iter().enumerate(){a.observe(slot,&Observation{id:CodonId{g:0,t:0,c,f,e,l},value:l as f64/8.,prior:0.},&p);}assert!(a.promoted.is_none());assert!(a.records.is_some());assert_eq!(a.seal(&p).count(),192);}
#[test]fn adaptive_run_parity(){let a=run_storage::<192>(0);for order in 0..3{assert_eq!(a,run_storage_mode::<56,true>(order));}}
}

const RECOVERY_TICKS:u8=4;
#[derive(Default,Debug)]
struct CapacityPolicy{expanded:bool,clean:u8,promotions:usize,recoveries:usize}
impl CapacityPolicy{fn finish(&mut self,diverse:bool){if diverse{self.clean=0;if !self.expanded{self.expanded=true;self.promotions+=1;}}else if self.expanded{self.clean+=1;if self.clean>=RECOVERY_TICKS{self.expanded=false;self.clean=0;self.recoveries+=1;}}}}
#[cfg(test)]mod homeostasis_tests{use super::*;
#[test]fn sustained_diversity_and_recovery(){let mut p=CapacityPolicy::default();for _ in 0..20{p.finish(true);assert!(p.expanded);}assert_eq!(p.promotions,1);for _ in 0..3{p.finish(false);assert!(p.expanded);}p.finish(true);assert_eq!(p.clean,0);for _ in 0..4{p.finish(false);}assert!(!p.expanded);assert_eq!(p.recoveries,1);}
#[test]fn qualified_tick_sequence(){let paths=paths();let mem=fixture(0.);let mut policy=CapacityPolicy::default();let mut promotions=0;for(t,diverse)in [true,true,true,false,false,false,true,false,false,false,false,false].into_iter().enumerate(){let mut a=PendingTick::<56,true>::new(0,t,&mem);if policy.expanded{a.start_expanded();}let started=a.promoted.is_some();let mut full=PendingTick::<192>::new(0,t,&mem);for(slot,&(c,f,e,lo,hi))in paths.iter().enumerate(){let l=if t%2==0{lo}else{hi};let o=Observation{id:CodonId{g:0,t,c,f,e,l},value:if diverse{slot as f64/192.}else{l as f64/8.},prior:0.};a.observe(slot,&o,&paths);full.observe(slot,&o,&paths);}assert_eq!(a.diverse(&paths),diverse);if !started&&a.promoted.is_some(){promotions+=1;}policy.finish(a.diverse(&paths));for(x,y)in a.seal(&paths).zip(full.seal(&paths)){assert_eq!(x.id,y.id);assert_eq!(x.value.to_bits(),y.value.to_bits());}}assert_eq!(promotions,1);assert_eq!(policy.promotions,1);assert_eq!(policy.recoveries,1);assert!(!policy.expanded);}
}

struct StoragePool<const N:usize>{base:Option<Box<[f64;N]>>,full:Option<Box<[f64;192]>>,allocations:usize,evictions:usize,allocated_bytes:usize,evicted_bytes:usize,reuses:usize,returns:usize,active:usize,peak:usize}
impl<const N:usize> Default for StoragePool<N>{fn default()->Self{Self{base:None,full:None,allocations:0,evictions:0,allocated_bytes:0,evicted_bytes:0,reuses:0,returns:0,active:0,peak:0}}}
impl<const N:usize> StoragePool<N>{fn take_base(&mut self)->Box<[f64;N]>{let b=if let Some(b)=self.base.take(){self.reuses+=1;b}else{self.allocations+=1;self.allocated_bytes+=N*8;Box::new([0.;N])};self.acquire(N*8);b}fn take_full(&mut self)->Box<[f64;192]>{let b=if let Some(b)=self.full.take(){self.reuses+=1;b}else{self.allocations+=1;self.allocated_bytes+=1536;Box::new([0.;192])};self.acquire(1536);b}}
struct SealedTick<'a,const N:usize>{g:usize,t:usize,memory:&'a [Buffer;8],paths:&'a [(usize,usize,usize,usize,usize)],records:Option<Box<[f64;N]>>,promoted:Option<Box<[f64;192]>>,next:usize}
impl<'a,const N:usize> Iterator for SealedTick<'a,N>{type Item=Observation;fn next(&mut self)->Option<Observation>{if self.next==192{return None}let slot=self.next;self.next+=1;let(c,f,e,l0,l1)=self.paths[slot];let l=if self.t%2==0{l0}else{l1};let value=if let Some(full)=self.promoted.as_ref(){full[slot]}else{self.records.as_ref().unwrap()[if N==56{compact_address(c,l,self.t)}else{slot}]};Some(Observation{id:CodonId{g:self.g,t:self.t,c,f,e,l},value,prior:self.memory[c].get(l)})}}
impl<'a,const N:usize> SealedTick<'a,N>{fn recycle(self,pool:&mut StoragePool<N>){assert_eq!(self.next,192,"unconsumed sealed tick");if let Some(base)=self.records{assert!(pool.base.is_none());pool.return_base(base);}if let Some(full)=self.promoted{assert!(pool.full.is_none());pool.return_full(full);}}}
#[cfg(test)]mod recycle_tests{use super::*;
#[test]fn recycled_storage_exact_parity(){let paths=paths();let mem=fixture(0.);let mut pool=StoragePool::<56>::default();let mut policy=CapacityPolicy::default();for t in 0..24{let diverse=(3..10).contains(&t)||(17..20).contains(&t);let mut a=PendingTick::<56,true>::recycled(0,t,&mem,&mut pool,policy.expanded);let mut full=PendingTick::<192>::new(0,t,&mem);assert_eq!(a.coverage,[0;3]);assert_eq!(a.seen,0);for i in 0..192{let slot=(i*37+t)%192;let(c,f,e,lo,hi)=paths[slot];let l=if t%2==0{lo}else{hi};let o=Observation{id:CodonId{g:0,t,c,f,e,l},value:if diverse{slot as f64/192.}else{(l+t) as f64/64.},prior:0.};a.observe_recycled(slot,&o,&paths,&mut pool);full.observe(slot,&o,&paths);}policy.finish(a.diverse(&paths));let mut sealed=a.finish(&paths);for(x,y)in sealed.by_ref().zip(full.seal(&paths)){assert_eq!(x.id,y.id);assert_eq!(x.value.to_bits(),y.value.to_bits());}sealed.recycle(&mut pool);}assert_eq!(pool.allocations,2);}
#[test]#[should_panic]fn stale_values_do_not_complete_tick(){let p=paths();let mem=fixture(0.);let mut pool=StoragePool::<56>::default();pool.base=Some(Box::new([0.5;56]));let a=PendingTick::<56,true>::recycled(0,1,&mem,&mut pool,false);let _=a.finish(&p);}
#[test]#[should_panic(expected="unconsumed sealed tick")]fn partial_iterator_not_recycled(){let p=paths();let mem=fixture(0.);let mut pool=StoragePool::<56>::default();let mut a=PendingTick::<56,true>::recycled(0,0,&mem,&mut pool,false);for(slot,&(c,f,e,l,_))in p.iter().enumerate(){a.observe_recycled(slot,&Observation{id:CodonId{g:0,t:0,c,f,e,l},value:0.,prior:0.},&p,&mut pool);}a.finish(&p).recycle(&mut pool);}
}

const IDLE_POOL_BUDGET:usize=1536;
impl<const N:usize> StoragePool<N>{
 fn idle_bytes(&self)->usize{self.base.as_ref().map_or(0,|_|N*8)+self.full.as_ref().map_or(0,|_|192*8)}
 fn evict_base(&mut self){if self.base.take().is_some(){self.evictions+=1;self.evicted_bytes+=N*8;}}
 fn evict_full(&mut self){if self.full.take().is_some(){self.evictions+=1;self.evicted_bytes+=1536;}}
 // Only idle, pool-owned allocations can be dropped. Prefer the next qualified capacity.
 fn trim(&mut self,budget:usize,prefer_full:bool){
  if prefer_full{let reserve=if self.full.is_none(){192*8}else{0};if self.idle_bytes().saturating_add(reserve)>budget{self.evict_base();}if self.idle_bytes()>budget{self.evict_full();}}
  else{let reserve=if self.base.is_none(){N*8}else{0};if self.idle_bytes().saturating_add(reserve)>budget{self.evict_full();}if self.idle_bytes()>budget{self.evict_base();}}
  assert!(self.idle_bytes()<=budget);
 }
}
#[cfg(test)]mod eviction_tests{use super::*;
 #[test]fn budget_and_preference(){for budget in [0,447,448,1535,1536,1983,1984,4096]{for prefer in [false,true]{let mut p=StoragePool::<56>::default();p.base=Some(Box::new([0.;56]));p.full=Some(Box::new([0.;192]));p.trim(budget,prefer);assert!(p.idle_bytes()<=budget);if budget>=1984{assert_eq!(p.evictions,0);}else if prefer&&budget>=1536{assert!(p.full.is_some()&&p.base.is_none());}else if !prefer&&budget>=448{assert!(p.base.is_some()&&p.full.is_none());}}}}
 #[test]fn active_and_sealed_survive_zero_budget(){let paths=paths();let mem=fixture(0.);let mut pool=StoragePool::<56>::default();let mut a=PendingTick::<56,true>::recycled(0,0,&mem,&mut pool,false);for(slot,&(c,f,e,l,_))in paths.iter().enumerate(){let o=Observation{id:CodonId{g:0,t:0,c,f,e,l},value:slot as f64/192.,prior:0.};a.observe_recycled(slot,&o,&paths,&mut pool);pool.trim(0,false);}let mut sealed=a.finish(&paths);pool.trim(0,false);for(slot,o)in sealed.by_ref().enumerate(){assert_eq!(o.value.to_bits(),(slot as f64/192.).to_bits());}sealed.recycle(&mut pool);pool.trim(0,false);assert_eq!(pool.idle_bytes(),0);}
 #[test]fn budgeted_sequence_parity(){let paths=paths();let mem=fixture(0.);for budget in [0,448,1536,1984]{let mut pool=StoragePool::<56>::default();let mut policy=CapacityPolicy::default();for t in 0..24{let diverse=(3..10).contains(&t)||(17..20).contains(&t);let mut a=PendingTick::<56,true>::recycled(0,t,&mem,&mut pool,policy.expanded);let mut full=PendingTick::<192>::new(0,t,&mem);for i in 0..192{let slot=(i*37+t)%192;let(c,f,e,lo,hi)=paths[slot];let l=if t%2==0{lo}else{hi};let o=Observation{id:CodonId{g:0,t,c,f,e,l},value:if diverse{slot as f64/192.}else{(l+t) as f64/64.},prior:0.};a.observe_recycled(slot,&o,&paths,&mut pool);full.observe(slot,&o,&paths);}policy.finish(a.diverse(&paths));let mut sealed=a.finish(&paths);for(x,y)in sealed.by_ref().zip(full.seal(&paths)){assert_eq!(x.id,y.id);assert_eq!(x.value.to_bits(),y.value.to_bits());assert_eq!(x.prior.to_bits(),y.prior.to_bits());}sealed.recycle(&mut pool);pool.trim(budget,policy.expanded);assert!(pool.idle_bytes()<=budget);}}}
}

#[derive(Clone,Copy,Debug,PartialEq,Eq)]
struct StorageStats{allocations:usize,evictions:usize,allocated:usize,evicted:usize,reuses:usize,returns:usize,active:usize,idle:usize,peak:usize}
impl StorageStats{fn metric(&self,k:u32)->f64{(match k{16=>self.allocations,17=>self.evictions,18=>self.allocated,19=>self.evicted,20=>self.reuses,21=>self.returns,22=>self.active,23=>self.idle,24=>self.peak,25=>usize::from(self.allocated==self.evicted+self.active+self.idle),_=>0})as f64}}
impl<const N:usize> StoragePool<N>{
 fn acquire(&mut self,bytes:usize){self.active+=bytes;self.peak=self.peak.max(self.active+self.idle_bytes());}
 fn return_base(&mut self,b:Box<[f64;N]>){assert!(self.base.is_none());self.active-=N*8;self.returns+=1;self.base=Some(b);}
 fn return_full(&mut self,b:Box<[f64;192]>){assert!(self.full.is_none());self.active-=1536;self.returns+=1;self.full=Some(b);}
 fn snapshot(&self)->StorageStats{StorageStats{allocations:self.allocations,evictions:self.evictions,allocated:self.allocated_bytes,evicted:self.evicted_bytes,reuses:self.reuses,returns:self.returns,active:self.active,idle:self.idle_bytes(),peak:self.peak}}
 fn checkpoint(&self){let s=self.snapshot();assert_eq!(s.active,0);assert_eq!(s.allocated,s.evicted+s.idle);assert_eq!(s.allocations+s.reuses,s.returns);}
}
#[cfg(test)]mod telemetry_tests{use super::*;#[test]fn homogeneous_ledger(){let r=run();for(g,e)in r.epochs.iter().enumerate(){let s=e.storage;assert_eq!((s.allocations,s.evictions,s.allocated,s.evicted,s.active,s.idle,s.peak),(1,0,448,0,0,448,448));assert_eq!(s.returns,(g+1)*360);assert_eq!(s.reuses+1,s.returns);}}#[test]fn promotion_ledger(){let mut p=StoragePool::<56>::default();let a=p.take_base();let b=p.take_full();assert_eq!(p.snapshot().peak,1984);p.return_base(a);p.return_full(b);p.trim(1536,true);p.checkpoint();assert_eq!(p.snapshot().evicted,448);assert_eq!(p.snapshot().idle,1536);}}
}

const RESOURCE_BUDGETS:[usize;4]=[0,448,1536,1984];
#[derive(Clone,Copy,Debug,PartialEq,Eq)]
struct ResourceTrial{budget:usize,allocations:usize,evictions:usize,residency:usize,peak:usize,cost:usize,digest:u32}
fn resource_trial(pattern:usize,budget:usize,weight:usize)->ResourceTrial{
 let paths=paths();let mem:[Buffer;8]=std::array::from_fn(|_|Buffer::new(64));let mut pool=StoragePool::<56>::default();let mut policy=CapacityPolicy::default();let mut residency=0;let mut digest=2166136261;
 for t in 0..96{let diverse=match pattern{0=>false,1=>(t%32)>=4&&(t%32)<12,2=>t>=4&&t<80,_=>t%3==1};let mut a=PendingTick::<56,true>::recycled(0,t,&mem,&mut pool,policy.expanded);for i in 0..192{let slot=(i*37+t)%192;let(c,f,e,lo,hi)=paths[slot];let l=if t%2==0{lo}else{hi};let value=if diverse{slot as f64/192.}else{(l+t)as f64/128.};a.observe_recycled(slot,&Observation{id:CodonId{g:0,t,c,f,e,l},value,prior:mem[c].get(l)},&paths,&mut pool);}
 assert_eq!(a.diverse(&paths),diverse);policy.finish(diverse);let mut sealed=a.finish(&paths);for(slot,o)in sealed.by_ref().enumerate(){let expected=if diverse{slot as f64/192.}else{(o.id.l+t)as f64/128.};assert_eq!(o.value.to_bits(),expected.to_bits());let bits=o.value.to_bits();digest=fold(fold(fold(digest,slot as u32),bits as u32),(bits>>32)as u32);}sealed.recycle(&mut pool);pool.trim(budget,policy.expanded);pool.checkpoint();residency+=pool.idle_bytes();}
 let stats=pool.snapshot();ResourceTrial{budget,allocations:stats.allocations,evictions:stats.evictions,residency,peak:stats.peak,cost:residency+weight*stats.allocations,digest}
}
fn resource_trials(pattern:usize,weight:usize)->[ResourceTrial;4]{let trials=RESOURCE_BUDGETS.map(|b|resource_trial(pattern,b,weight));assert!(trials.iter().all(|r|r.digest==trials[0].digest));trials}
fn resource_winner(trials:&[ResourceTrial;4])->usize{(0..4).min_by_key(|&i|(trials[i].cost,trials[i].budget)).unwrap()}
#[no_mangle]pub extern "C" fn photon_resource(pattern:u32,weight:u32,index:u32,metric:u32)->f64{if pattern>3||weight>65536||index>3{return f64::NAN}let trials=resource_trials(pattern as usize,weight as usize);let r=trials[index as usize];match metric{0=>r.budget as f64,1=>r.allocations as f64,2=>r.evictions as f64,3=>r.residency as f64,4=>r.peak as f64,5=>r.cost as f64,6=>r.digest as f64,7=>resource_winner(&trials)as f64,_=>f64::NAN}}
#[cfg(test)]mod resource_tests{use super::*;#[test]fn all_policies_preserve_evidence(){for pattern in 0..4{let trials=resource_trials(pattern,2048);let w=resource_winner(&trials);assert!(trials.iter().all(|r|r.cost>=trials[w].cost));assert_eq!(trials,resource_trials(pattern,2048));}}#[test]fn cost_extremes(){let low=resource_trials(0,0);assert_eq!(resource_winner(&low),0);let high=resource_trials(0,65536);assert_eq!(resource_winner(&high),1);assert_eq!(high[0].allocations,96);assert_eq!(high[1].allocations,1);}}
}

#[derive(Clone,Copy,Debug,PartialEq,Eq)]
struct OnlineStep{budget:usize,cost:usize,allocations:usize,idle:usize,digest:u32}
#[derive(Default)]
struct OnlinePolicy{costs:[usize;4],completed:usize}
impl OnlinePolicy{
 fn choose(&self)->usize{if self.completed==0{return 2}(0..4).min_by_key(|&i|(self.costs[i],RESOURCE_BUDGETS[i])).unwrap()}
 fn observe(&mut self,costs:[usize;4]){for(i,c)in costs.into_iter().enumerate(){self.costs[i]+=c;}self.completed+=1;}
}
fn online_trial(environment:&[bool],weight:usize)->Vec<OnlineStep>{
 let paths=paths();let mem:[Buffer;8]=std::array::from_fn(|_|Buffer::new(64));let mut pools:[StoragePool<56>;5]=std::array::from_fn(|_|StoragePool::default());let mut capacity=CapacityPolicy::default();let mut policy=OnlinePolicy::default();let mut trace=Vec::new();let mut digest=2166136261;let mut total=0;
 for(t,&diverse)in environment.iter().enumerate(){
 let choice=policy.choose();let budget=RESOURCE_BUDGETS[choice];let mut costs=[0;4];let mut evidence=0;
 for j in 0..5{let p=&mut pools[j];let before=p.allocations;let mut a=PendingTick::<56,true>::recycled(0,t,&mem,p,capacity.expanded);
 for i in 0..192{let slot=(i*37+t)%192;let(c,f,e,lo,hi)=paths[slot];let l=if t%2==0{lo}else{hi};let value=if diverse{slot as f64/192.}else{(l+t)as f64/128.};a.observe_recycled(slot,&Observation{id:CodonId{g:0,t,c,f,e,l},value,prior:mem[c].get(l)},&paths,p);}
 assert_eq!(a.diverse(&paths),diverse);let mut sealed=a.finish(&paths);let mut h=2166136261;for(slot,o)in sealed.by_ref().enumerate(){let expected=if diverse{slot as f64/192.}else{(o.id.l+t)as f64/128.};assert_eq!(o.value.to_bits(),expected.to_bits());let bits=o.value.to_bits();h=fold(fold(fold(h,slot as u32),bits as u32),(bits>>32)as u32);}if j==0{evidence=h}else{assert_eq!(h,evidence);}sealed.recycle(p);
 let next_full=diverse||(capacity.expanded&&capacity.clean+1<RECOVERY_TICKS);p.trim(if j==4{budget}else{RESOURCE_BUDGETS[j]},next_full);p.checkpoint();let cost=p.idle_bytes()+weight*(p.allocations-before);if j<4{costs[j]=cost;}else{total+=cost;digest=fold(digest,h);trace.push(OnlineStep{budget,cost:total,allocations:p.allocations,idle:p.idle_bytes(),digest});}}
 capacity.finish(diverse);policy.observe(costs);
 }trace
}
fn online_environment(pattern:usize)->Vec<bool>{(0..96).map(|t|match pattern{0=>false,1=>t%32>=4&&t%32<12,2=>t>=4&&t<80,_=>t%3==1}).collect()}
thread_local!{static ONLINE_RESULT:std::cell::RefCell<Vec<OnlineStep>>=const{std::cell::RefCell::new(Vec::new())};}
#[no_mangle]pub extern "C" fn photon_online_run(pattern:u32,weight:u32)->u32{if pattern>3||weight>65536{return 0}let trace=online_trial(&online_environment(pattern as usize),weight as usize);let n=trace.len()as u32;ONLINE_RESULT.with(|r|*r.borrow_mut()=trace);n}
#[no_mangle]pub extern "C" fn photon_online_metric(t:u32,k:u32)->f64{ONLINE_RESULT.with(|r|{let r=r.borrow();let Some(s)=r.get(t as usize)else{return f64::NAN};match k{0=>s.budget as f64,1=>s.cost as f64,2=>s.allocations as f64,3=>s.idle as f64,4=>s.digest as f64,_=>f64::NAN}})}
#[cfg(test)]mod online_tests{use super::*;
#[test]fn prefix_noninterference(){let a=online_environment(1);let mut b=a.clone();for x in &mut b[48..]{*x=!*x;}let x=online_trial(&a,2048);let y=online_trial(&b,2048);assert_eq!(x[..48],y[..48]);assert_eq!(x[48].budget,y[48].budget);assert_eq!(x,online_trial(&a,2048));}
#[test]fn causal_cost_and_bounds(){for pattern in 0..4{let a=online_trial(&online_environment(pattern),2048);assert_eq!(a.len(),96);assert_eq!(a[0].budget,1536);assert!(a.iter().all(|s|RESOURCE_BUDGETS.contains(&s.budget)&&s.idle<=s.budget));assert!(a.windows(2).all(|w|w[1].cost>=w[0].cost&&w[1].allocations>=w[0].allocations));}}
}

pub mod qualification;
