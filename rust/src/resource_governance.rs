//! RI-001: logical resource governance; no physical termination authority. .dlw
use std::collections::{BTreeMap,VecDeque};
pub const MAX:usize=17408;
pub const MIN:usize=13312;
#[derive(Clone,Copy,Debug,PartialEq,Eq)] pub enum Mode{Kernel,Policy,Online}
impl Mode{pub fn bytes(self)->usize{match self{Self::Kernel=>13312,Self::Policy=>256,Self::Online=>3840}}}
#[derive(Clone,Copy,Debug,PartialEq,Eq)] pub struct Key{pub allocation:u64,pub worker:usize,pub generation:u64,pub request:u64}
#[derive(Clone,Copy,Debug,PartialEq,Eq)] enum State{Running,Stopping,Returned}
struct Lease{key:Key,mode:Mode,deadline:u64,state:State}
#[derive(Default)] pub struct Gate{now:u64,next:u64,requests:u64,generations:[u64;3],queue:VecDeque<(u64,Mode)>,leases:BTreeMap<u64,Lease>,admitted:u128,returned:u128,allocated:u128,released:u128}
#[derive(Debug,PartialEq,Eq)]pub struct Snapshot{pub active:usize,pub bytes:usize,pub budget:usize,pub pending:usize,pub admitted:u128,pub returned:u128,pub allocated:u128,pub released:u128}
impl Gate{
 pub fn snapshot(&self)->Snapshot{let active=self.leases.values().filter(|l|l.state!=State::Returned).count();let bytes=self.leases.values().filter(|l|l.state!=State::Returned).map(|l|l.mode.bytes()).sum();Snapshot{active,bytes,budget:if self.queue.is_empty(){MIN.max(bytes)}else{MAX},pending:self.queue.len(),admitted:self.admitted,returned:self.returned,allocated:self.allocated,released:self.released}}
 pub fn enqueue(&mut self,mode:Mode)->Option<u64>{if self.queue.len()>=32{return None}self.next=self.next.checked_add(1)?;self.queue.push_back((self.next,mode));Some(self.next)}
 pub fn admit(&mut self)->Option<Key>{let &(id,mode)=self.queue.front()?;let s=self.snapshot();if s.active>=3||s.bytes+mode.bytes()>s.budget{return None}let worker=(0..3).find(|&i|!self.leases.values().any(|l|l.key.worker==i&&l.state!=State::Returned))?;let generation=self.generations[worker].checked_add(1)?;let deadline=self.now.checked_add(8)?;self.queue.pop_front();self.generations[worker]=generation;let key=Key{allocation:id,worker,generation,request:0};self.leases.insert(id,Lease{key,mode,deadline,state:State::Running});self.admitted+=1;self.allocated+=mode.bytes() as u128;Some(key)}
 pub fn cancel_pending(&mut self,id:u64)->bool{if let Some(i)=self.queue.iter().position(|x|x.0==id){self.queue.remove(i);true}else{false}}
 pub fn stop(&mut self,k:Key)->Option<Key>{let l=self.leases.get_mut(&k.allocation)?;if l.key!=k||l.state!=State::Running{return None}self.requests=self.requests.checked_add(1)?;l.key.request=self.requests;l.state=State::Stopping;Some(l.key)}
 pub fn tick(&mut self,t:u64)->Option<Vec<Key>>{if t<self.now{return None}let due:Vec<_>=self.leases.values().filter(|l|l.state==State::Running&&l.deadline<=t).map(|l|l.key).collect();self.requests.checked_add(due.len() as u64)?;self.now=t;Some(due.into_iter().map(|k|self.stop(k).expect("prechecked")).collect())}
 /// Simulation only: exact key matching does not authenticate an observer.
 pub fn simulate_stop_observation(&mut self,k:Key)->bool{let Some(l)=self.leases.get_mut(&k.allocation)else{return false};if l.key!=k||l.state!=State::Stopping{return false}l.state=State::Returned;self.returned+=1;self.released+=l.mode.bytes() as u128;true}
 pub fn conserved(&self)->bool{let s=self.snapshot();s.admitted==s.returned+s.active as u128&&s.allocated==s.released+s.bytes as u128&&s.active<=3&&s.bytes<=s.budget&&s.budget<=MAX&&s.pending<=32&&(0..3).all(|i|self.leases.values().filter(|l|l.key.worker==i&&l.state!=State::Returned).count()<=1)}
}
#[cfg(test)]mod tests{use super::*;
#[test]fn mixed_fifo_fencing(){for seed in 0..256{let mut g=Gate::default();let mut keys=vec![];for _ in 0..3{g.enqueue(Mode::Online).unwrap();keys.push(g.admit().unwrap());assert!(g.conserved());}let k=g.enqueue(Mode::Kernel).unwrap();for _ in 0..31{g.enqueue(Mode::Policy).unwrap();}assert!(g.enqueue(Mode::Policy).is_none());assert!(g.admit().is_none());let stop=g.tick(8).unwrap();assert_eq!(g.snapshot().bytes,11520);assert!(g.tick(7).is_none());for j in 0..2{let i=(seed+j)%3;assert!(!g.simulate_stop_observation(keys[i]));assert!(g.simulate_stop_observation(stop[i]));assert!(!g.simulate_stop_observation(stop[i]));assert!(g.conserved());}let kernel=g.admit().unwrap();assert_eq!(kernel.allocation,k);assert_eq!(g.snapshot().bytes,17152);assert!(g.simulate_stop_observation(stop[(seed+2)%3]));let terminal=g.stop(kernel).unwrap();assert!(!g.simulate_stop_observation(Key{generation:terminal.generation-1,..terminal}));assert!(g.simulate_stop_observation(terminal));while g.snapshot().pending>0{let p=g.admit().unwrap();let s=g.stop(p).unwrap();assert!(g.simulate_stop_observation(s));assert!(g.conserved());}assert_eq!(g.snapshot().bytes,0);assert_eq!(g.snapshot().budget,MIN);}}
#[test]fn cancellation_and_expiration(){let mut g=Gate::default();let p=g.enqueue(Mode::Policy).unwrap();assert!(g.cancel_pending(p));assert!(!g.cancel_pending(p));assert!(g.admit().is_none());g.enqueue(Mode::Kernel).unwrap();let k=g.admit().unwrap();assert!(g.tick(7).unwrap().is_empty());assert_eq!(g.tick(8).unwrap().len(),1);assert!(!g.simulate_stop_observation(k));assert_eq!(g.snapshot().bytes,13312);assert!(g.conserved());}
}
