//! PHOTON-16 v0.83 — native dimensional kernel. .dlw
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
struct Epoch{widths:[u8;8],rates:[usize;8],bytes:usize,mae:f64}
#[derive(Debug,PartialEq)]
struct Run{epochs:Vec<Epoch>,count:usize,updates:usize,traffic:usize}
fn run()->Run{
 let paths=paths();let mut mem:[Buffer;8]=std::array::from_fn(|_|Buffer::new(64));let mut applied:[[Option<usize>;8];8]=[[None;8];8];let mut rates=[1usize;8];let mut out=Run{epochs:vec![],count:0,updates:0,traffic:0};
 for g in 0..8{
 let widths=std::array::from_fn(|c|mem[c].width());let mut loss=[[0.;4];8];let mut probe=[[0.;4];8];let mut samples=[0usize;8];let mut errors=[0.;8];let mut counts=[0usize;8];
 for t in 0..360{
 let mut sum=[[0.;8];8];let mut n=[[0usize;8];8];
 // Read phase: no writes to predictor storage until every path has observed this tick.
 for &(c,_f,_e,l0,l1) in &paths{let l=if t%2==0{l0}else{l1};let x=signal(c,l,t,g);let m=mem[c].get(l);errors[c]+=(x-m).abs();counts[c]+=1;out.count+=1;sum[c][l]+=x;n[c][l]+=1;
 if let Some(a)=applied[c][l]{for k in 0..4{loss[c][k]+=(x-(m+(RATES[k]-RATES[a])*mem[c].get(8+l))).abs();}}}
 // Write phase: each address updated once, after observation completes.
 for c in 0..8{for l in 0..8{if n[c][l]==0{continue}let m=mem[c].get(l);let d=sum[c][l]/n[c][l] as f64-m;let ideal=m+RATES[rates[c]]*d;samples[c]+=1;for(k,&b)in WIDTHS.iter().enumerate(){probe[c][k]+=(quant(ideal,1.,b)-ideal).abs()+0.5*(quant(d,2.,b)-d).abs();}mem[c].set(l,ideal);mem[c].set(8+l,d);applied[c][l]=Some(rates[c]);out.updates+=1;}}
 }
 out.epochs.push(Epoch{widths,rates,bytes:mem.iter().map(Buffer::bytes).sum(),mae:errors.iter().sum::<f64>()/(360.*192.)});
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
#[no_mangle] pub extern "C" fn photon_metric(g:u32,kind:u32,c:u32)->f64 { RESULT.with(|s| { let s=s.borrow(); let Some(r)=s.as_ref() else{return f64::NAN}; if kind==4{return r.count as f64} if kind==5{return r.updates as f64} if kind==6{return r.traffic as f64} let Some(e)=r.epochs.get(g as usize) else{return f64::NAN}; match kind {0=>e.mae,1=>e.bytes as f64,2=>e.widths.get(c as usize).map_or(f64::NAN,|v|*v as f64),3=>e.rates.get(c as usize).map_or(f64::NAN,|v|*v as f64),_=>f64::NAN} }) }
#[cfg(test)] mod bridge_tests {use super::*; #[test] fn bridge(){assert_eq!(photon_abi(),83);assert!(photon_metric(0,0,0).is_nan());assert_eq!(photon_run(),552960);assert_eq!(photon_metric(7,5,0),161280.);assert!(photon_metric(99,0,0).is_nan());assert!(photon_metric(0,2,99).is_nan());}}
