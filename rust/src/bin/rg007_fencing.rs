// RG-007: deterministic identity fencing; witness is simulated, not authenticated. .dlw
use std::collections::BTreeMap;
const MAX:usize=17408;
#[derive(Clone,Copy,Debug,PartialEq,Eq)]struct Key{allocation:u64,worker:usize,generation:u64,request:u64}
#[derive(Clone,Copy,Debug,PartialEq,Eq)]enum State{Running,Stopping,Returned}
struct Lease{key:Key,weight:usize,deadline:u64,state:State}
#[derive(Default)]struct Gate{now:u64,next:u64,requests:u64,generations:[u64;3],leases:BTreeMap<u64,Lease>,admitted:usize,returned:usize,allocated:usize,released:usize}
impl Gate{
 fn used(&self)->usize{self.leases.values().filter(|l|l.state!=State::Returned).map(|l|l.weight).sum()}
 fn admit(&mut self,w:usize)->Option<Key>{if ![13312,256,3840].contains(&w)||self.used()+w>MAX{return None}let worker=(0..3).find(|&i|!self.leases.values().any(|l|l.key.worker==i&&l.state!=State::Returned))?;let id=self.next.checked_add(1)?;let gen=self.generations[worker].checked_add(1)?;let deadline=self.now.checked_add(8)?;self.next=id;self.generations[worker]=gen;let key=Key{allocation:id,worker,generation:gen,request:0};self.leases.insert(id,Lease{key,weight:w,deadline,state:State::Running});self.admitted+=1;self.allocated+=w;Some(key)}
 fn stop(&mut self,k:Key)->Option<Key>{let l=self.leases.get_mut(&k.allocation)?;if l.key!=k||l.state!=State::Running{return None}self.requests=self.requests.checked_add(1)?;l.key.request=self.requests;l.state=State::Stopping;Some(l.key)}
 fn tick(&mut self,t:u64)->bool{if t<self.now{return false}self.now=t;let due:Vec<_>=self.leases.values().filter(|l|l.state==State::Running&&l.deadline<=t).map(|l|l.key).collect();for k in due{self.stop(k).expect("stop request overflow");}true}
 // Only an exact simulated observer event is accepted. Real observer authority remains HOLD.
 fn observe(&mut self,k:Key)->bool{let Some(l)=self.leases.get_mut(&k.allocation)else{return false};if l.key!=k||l.state!=State::Stopping{return false}l.state=State::Returned;self.returned+=1;self.released+=l.weight;true}
 fn check(&self){let active:Vec<_>=self.leases.values().filter(|l|l.state!=State::Returned).collect();assert_eq!(self.admitted,self.returned+active.len());assert_eq!(self.allocated,self.released+self.used());assert!(active.len()<=3&&self.used()<=MAX);for i in 0..3{assert!(active.iter().filter(|l|l.key.worker==i).count()<=1);}}
}
fn main(){let mut checks=0;let mut rejected=0;
 for seed in 0..256{let mut g=Gate::default();let ids=[g.admit(3840).unwrap(),g.admit(3840).unwrap(),g.admit(3840).unwrap()];g.check();checks+=1;
 assert!(!g.observe(ids[0]));rejected+=1;assert!(g.tick(8));assert!(!g.tick(7));assert_eq!(g.used(),11520);assert!(g.admit(13312).is_none());g.check();checks+=1;
 for j in 0..3{let old=ids[(seed+j)%3];let key=g.leases[&old.allocation].key;
 let bad=[old,Key{worker:(key.worker+1)%3,..key},Key{generation:key.generation+1,..key},Key{request:key.request+1,..key},Key{allocation:999,..key}];
 for b in bad{assert!(!g.observe(b));rejected+=1;g.check();checks+=1;}
 assert!(g.observe(key));g.check();checks+=1;
 let new=g.admit(256).unwrap();assert_eq!(new.worker,key.worker);assert!(new.generation>key.generation);let terminal=g.stop(new).unwrap();
 for b in [key,Key{allocation:new.allocation,..key},Key{generation:key.generation,..terminal}]{assert!(!g.observe(b));rejected+=1;g.check();checks+=1;}
 assert!(g.observe(terminal));assert!(!g.observe(terminal));rejected+=1;g.check();checks+=1;
 }
 assert_eq!(g.used(),0);assert_eq!(g.admitted,g.returned);
 }println!("RG-007: 256 schedules; {checks} checkpoints; {rejected} rejected acknowledgements; simulated observer only");}
