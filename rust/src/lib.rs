//! PHOTON-16 v0.91 — native dimensional kernel. .dlw
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
#[derive(Debug,PartialEq)]
struct Epoch{widths:[u8;8],rates:[usize;8],bytes:usize,mae:f64,seal:Seal}
#[derive(Debug,PartialEq)]
struct Run{epochs:Vec<Epoch>,count:usize,updates:usize,traffic:usize,stages:usize,lineage:u32}
fn run()->Run{run_order(0)}
fn run_order(order:usize)->Run{
 let paths=paths();let mut mem:[Buffer;8]=std::array::from_fn(|_|Buffer::new(64));let mut applied:[[Option<usize>;8];8]=[[None;8];8];let mut rates=[1usize;8];let mut out=Run{epochs:vec![],count:0,updates:0,traffic:0,stages:0,lineage:2166136261};
 for g in 0..8{
 let widths=std::array::from_fn(|c|mem[c].width());let mut loss=[[0.;4];8];let mut probe=[[0.;4];8];let mut samples=[0usize;8];let mut errors=[0.;8];let mut counts=[0usize;8];
 for t in 0..360{
 let mut pending=PendingTick::new(g,t,&mem);
 // Read phase: no writes to predictor storage until every path has observed this tick.
 for i in 0..192{let slot=match order{1=>191-i,2=>(i*37+g+t)%192,_=>i};let(c,f,e,l0,l1)=paths[slot];let l=if t%2==0{l0}else{l1};let x=signal(c,l,t,g);let m=mem[c].get(l);let obs=Observation{id:CodonId{g,t,c,f,e,l},value:x,prior:m};pending.observe(slot,&obs,&paths);}
 let records=pending.seal(&paths);let mut sum=[[0.;8];8];let mut n=[[0usize;8];8];
 for obs in records {let c=obs.id.c;let l=obs.id.l;let x=obs.value;let m=obs.prior;let stages=reciprocal(&obs);for stage in &stages{assert_eq!(stage.parent,obs.id);out.lineage=(out.lineage ^ stage.code()).wrapping_mul(16777619);out.stages+=1;}errors[c]+=(x-m).abs();counts[c]+=1;out.count+=1;sum[c][l]+=x;n[c][l]+=1;
 if let Some(a)=applied[c][l]{for k in 0..4{loss[c][k]+=(x-(m+(RATES[k]-RATES[a])*mem[c].get(8+l))).abs();}}}
 // Consume the observation accumulator before acquiring mutable predictor access.
 // Canonical records have been fully consumed.
 // Write phase: each address updated once, after observation completes.
 for c in 0..8{for l in 0..8{if n[c][l]==0{continue}let m=mem[c].get(l);let d=sum[c][l]/n[c][l] as f64-m;let ideal=m+RATES[rates[c]]*d;samples[c]+=1;for(k,&b)in WIDTHS.iter().enumerate(){probe[c][k]+=(quant(ideal,1.,b)-ideal).abs()+0.5*(quant(d,2.,b)-d).abs();}mem[c].set(l,ideal);mem[c].set(8+l,d);applied[c][l]=Some(rates[c]);out.updates+=1;}}
 }
 let parent=out.epochs.last().map_or(0,|e|e.seal.chain);let seal=Seal::new(g,parent,out.lineage,out.count,out.stages,out.updates,&mem,&applied,&rates);out.epochs.push(Epoch{widths,rates,bytes:mem.iter().map(Buffer::bytes).sum(),mae:errors.iter().sum::<f64>()/(360.*192.),seal});
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
#[no_mangle] pub extern "C" fn photon_metric(g:u32,kind:u32,c:u32)->f64 { RESULT.with(|s| { let s=s.borrow(); let Some(r)=s.as_ref() else{return f64::NAN}; if kind==4{return r.count as f64} if kind==5{return r.updates as f64} if kind==6{return r.traffic as f64} if kind==7{return r.stages as f64} if kind==8{return r.lineage as f64} let Some(e)=r.epochs.get(g as usize) else{return f64::NAN}; match kind {9=>e.seal.chain as f64,10=>e.seal.state as f64,11=>e.seal.parent as f64,12=>e.seal.codons as f64,13=>e.seal.stages as f64,14=>e.seal.updates as f64,15=>e.seal.lineage as f64,0=>e.mae,1=>e.bytes as f64,2=>e.widths.get(c as usize).map_or(f64::NAN,|v|*v as f64),3=>e.rates.get(c as usize).map_or(f64::NAN,|v|*v as f64),_=>f64::NAN} }) }
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

struct PendingTick<'a>{g:usize,t:usize,records:[f64;192],memory:&'a [Buffer;8],count:usize,coverage:[u64;3],topology:Option<&'a [(usize,usize,usize,usize,usize)]>}
impl<'a> PendingTick<'a>{
 fn new(g:usize,t:usize,memory:&'a [Buffer;8])->Self{Self{g,t,records:[0.;192],memory,count:0,coverage:[0;3],topology:None}}
 fn observe(&mut self,slot:usize,o:&Observation,paths:&'a [(usize,usize,usize,usize,usize)]){assert_eq!((o.id.g,o.id.t),(self.g,self.t));assert!(slot<192 && paths.len()==192);let(c,f,e,l0,l1)=paths[slot];let l=if self.t%2==0{l0}else{l1};assert_eq!((o.id.c,o.id.f,o.id.e,o.id.l),(c,f,e,l));assert!(o.value.is_finite()&&o.prior.is_finite());let mask=1u64<<(slot%64);assert_eq!(self.coverage[slot/64]&mask,0,"duplicate codon");if let Some(bound)=self.topology{assert!(std::ptr::eq(bound,paths),"topology changed");}else{self.topology=Some(paths);}assert_eq!(self.memory[c].get(l).to_bits(),o.prior.to_bits(),"conflicting contextual prior");self.records[slot]=o.value;self.coverage[slot/64]|=mask;self.count+=1;}
 fn seal(self,paths:&'a [(usize,usize,usize,usize,usize)])->impl Iterator<Item=Observation>+'a{assert_eq!(self.count,192);assert_eq!(self.coverage,[u64::MAX;3]);assert!(std::ptr::eq(self.topology.expect("missing topology"),paths));let(g,t)=(self.g,self.t);let memory=self.memory;self.records.into_iter().enumerate().map(move |(slot,s)|{let(c,f,e,l0,l1)=paths[slot];Observation{id:CodonId{g,t,c,f,e,l:if t%2==0{l0}else{l1}},value:s,prior:memory[c].get(if t%2==0{l0}else{l1})}})}
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
#[test]#[should_panic]fn incomplete_tick(){PendingTick::new(0,0,&fixture(0.)).close();}
#[test]#[should_panic]fn foreign_tick(){let mem=fixture(0.);let mut p=PendingTick::new(0,0,&mem);let topology=paths();p.observe(0,&Observation{id:CodonId{g:0,t:1,c:0,f:0,e:0,l:0},value:0.,prior:0.},&topology);}}

#[cfg(test)]mod coverage_tests{use super::*;
fn obs(p:&[(usize,usize,usize,usize,usize)],slot:usize,t:usize)->Observation{let(c,f,e,l0,l1)=p[slot];Observation{id:CodonId{g:0,t,c,f,e,l:if t%2==0{l0}else{l1}},value:0.5,prior:0.25}}
#[test]fn complete_reverse_order(){let p=paths();for t in [0,1]{let mem=fixture(0.25);let mut a=PendingTick::new(0,t,&mem);for i in (0..192).rev(){a.observe(i,&obs(&p,i,t),&p);}assert_eq!(std::mem::size_of_val(&a.coverage),24);let(_,n)=a.close();assert_eq!(n.iter().flatten().sum::<usize>(),192);}}
#[test]#[should_panic(expected="duplicate codon")]fn duplicate(){let p=paths();let mem=fixture(0.25);let mut a=PendingTick::new(0,0,&mem);a.observe(0,&obs(&p,0,0),&p);a.observe(0,&obs(&p,0,0),&p);}
#[test]#[should_panic]fn false_slot(){let p=paths();PendingTick::new(0,0,&fixture(0.25)).observe(1,&obs(&p,0,0),&p);}
#[test]#[should_panic]fn wrong_endpoint(){let p=paths();let mut o=obs(&p,0,0);o.id.l=(o.id.l+1)%8;PendingTick::new(0,0,&fixture(0.25)).observe(0,&o,&p);}
#[test]#[should_panic]fn missing_last(){let p=paths();let mem=fixture(0.25);let mut a=PendingTick::new(0,0,&mem);for i in 0..191{a.observe(i,&obs(&p,i,0),&p);}a.close();}
#[test]#[should_panic]fn out_of_range(){let p=paths();PendingTick::new(0,0,&fixture(0.25)).observe(192,&obs(&p,0,0),&p);}
}

#[cfg(test)]mod ordering_tests{use super::*;#[test]fn full_run_order_invariance(){let a=run_order(0);assert_eq!(a,run_order(1));assert_eq!(a,run_order(2));}}

#[cfg(test)]mod compact_tests{use super::*;#[test]fn payload_size(){assert_eq!(std::mem::size_of::<[f64;192]>(),1536);assert_eq!(std::mem::size_of::<[u64;3]>(),24);assert!(std::mem::size_of::<f64>()<std::mem::size_of::<Option<Observation>>());}#[test]fn reconstruct(){let p=paths();for t in [0,1]{let mem=fixture(-0.25);let mut a=PendingTick::new(0,t,&mem);for slot in (0..192).rev(){let(c,f,e,l0,l1)=p[slot];let o=Observation{id:CodonId{g:0,t,c,f,e,l:if t==0{l0}else{l1}},value:slot as f64/192.,prior:-0.25};a.observe(slot,&o,&p);}for(slot,o)in a.seal(&p).enumerate(){let(c,f,e,l0,l1)=p[slot];assert_eq!(o.id,CodonId{g:0,t,c,f,e,l:if t==0{l0}else{l1}});assert_eq!(o.value,slot as f64/192.);assert_eq!(o.prior,-0.25);}}}#[test]#[should_panic(expected="topology changed")]fn foreign_topology(){let p=paths();let q=p.clone();let mem=fixture(0.);let mut a=PendingTick::new(0,0,&mem);for (slot,top) in [(0,&p),(1,&q)]{let(c,f,e,l,_)=top[slot];a.observe(slot,&Observation{id:CodonId{g:0,t:0,c,f,e,l},value:0.,prior:0.},top);}}}

#[cfg(test)]mod prior_tests{use super::*;
#[test]fn contextual_prior_reconstruction(){let p=paths();for t in [0,1]{let mut mem=fixture(0.);for c in 0..8{for l in 0..8{mem[c].set(l,(c*8+l) as f64/64.);}}let mut a=PendingTick::new(0,t,&mem);for slot in (0..192).rev(){let(c,f,e,l0,l1)=p[slot];let l=if t==0{l0}else{l1};a.observe(slot,&Observation{id:CodonId{g:0,t,c,f,e,l},value:slot as f64/192.,prior:(c*8+l) as f64/64.},&p);}for o in a.seal(&p){assert_eq!(o.prior,(o.id.c*8+o.id.l) as f64/64.);}}}
#[test]#[should_panic(expected="conflicting contextual prior")]fn conflicting_prior(){let p=paths();let(c,_,_,l,_)=p[0];let j=(1..192).find(|&i|p[i].0==c&&p[i].3==l).unwrap();let mem=fixture(0.25);let mut a=PendingTick::new(0,0,&mem);for(slot,prior)in [(0,0.25),(j,0.5)]{let(c,f,e,l,_)=p[slot];a.observe(slot,&Observation{id:CodonId{g:0,t:0,c,f,e,l},value:0.,prior},&p);}}
}

#[cfg(test)]fn fixture(value:f64)->[Buffer;8]{std::array::from_fn(|_|{let mut b=Buffer::new(64);for l in 0..8{b.set(l,value);}b})}
