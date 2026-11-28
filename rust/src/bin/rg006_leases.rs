// RG-006 isolated logical lease model; no physical termination claim. .dlw
use std::collections::{BTreeMap,VecDeque};
const MAX:usize=17408;
#[derive(Clone,Copy,Debug,PartialEq,Eq)] enum State{Running,Stopping,Returned}
#[derive(Debug)] struct Lease{weight:usize,deadline:u64,state:State}
#[derive(Default)] struct Gate{now:u64,next:u64,queue:VecDeque<(u64,usize)>,leases:BTreeMap<u64,Lease>,admitted:usize,returned:usize,allocated:usize,released:usize}
impl Gate{
 fn used(&self)->usize{self.leases.values().filter(|l|l.state!=State::Returned).map(|l|l.weight).sum()}
 fn active(&self)->usize{self.leases.values().filter(|l|l.state!=State::Returned).count()}
 fn enqueue(&mut self,w:usize)->Option<u64>{if self.queue.len()>=32||![13312,256,3840].contains(&w){return None}self.next=self.next.checked_add(1)?;self.queue.push_back((self.next,w));Some(self.next)}
 fn admit(&mut self)->Option<u64>{let &(id,w)=self.queue.front()?;if self.active()>=3||self.used()+w>MAX{return None}let deadline=self.now.checked_add(8)?;self.queue.pop_front();assert!(self.leases.insert(id,Lease{weight:w,deadline,state:State::Running}).is_none());self.admitted+=1;self.allocated+=w;Some(id)}
 fn cancel(&mut self,id:u64)->bool{if let Some(i)=self.queue.iter().position(|x|x.0==id){self.queue.remove(i);return true}match self.leases.get_mut(&id){Some(l) if l.state==State::Running=>{l.state=State::Stopping;true},_=>false}}
 fn tick(&mut self,t:u64)->bool{if t<self.now{return false}self.now=t;for l in self.leases.values_mut(){if l.state==State::Running&&l.deadline<=t{l.state=State::Stopping;}}true}
 // Acknowledgement is simulated; caller authentication and actual worker fencing are not qualified.
 fn acknowledge_stop(&mut self,id:u64)->bool{match self.leases.get_mut(&id){Some(l) if l.state==State::Stopping=>{l.state=State::Returned;self.returned+=1;self.released+=l.weight;true},_=>false}}
 fn check(&self){assert_eq!(self.admitted,self.returned+self.active());assert_eq!(self.allocated,self.released+self.used());assert!(self.used()<=MAX&&self.active()<=3&&self.queue.len()<=32);assert_eq!(self.admitted,self.leases.len());}
}
fn main(){
 let mut checks=0;
 for seed in 0..256{
  let mut g=Gate::default();let ids=[g.enqueue(3840).unwrap(),g.enqueue(3840).unwrap(),g.enqueue(3840).unwrap()];
  for id in ids{assert_eq!(g.admit(),Some(id));g.check();checks+=1;}
  let k=g.enqueue(13312).unwrap();let q=g.enqueue(256).unwrap();assert!(g.cancel(q));assert!(!g.cancel(q));g.check();checks+=1;
  assert!(!g.acknowledge_stop(ids[0]));assert!(g.cancel(ids[seed%3]));g.check();checks+=1;
  assert!(g.tick(7));assert_eq!(g.used(),11520);g.check();checks+=1;
  assert!(g.tick(8));assert!(!g.tick(7));assert_eq!(g.used(),11520);assert_eq!(g.admit(),None);g.check();checks+=1;
  for j in 0..2{let id=ids[(seed+j)%3];assert!(g.acknowledge_stop(id));assert!(!g.acknowledge_stop(id));g.check();checks+=1;}
  assert_eq!(g.admit(),Some(k));assert_eq!(g.used(),17152);g.check();checks+=1;
  assert!(!g.acknowledge_stop(999));assert!(g.acknowledge_stop(ids[(seed+2)%3]));g.check();checks+=1;
  assert!(g.cancel(k));assert!(g.acknowledge_stop(k));assert!(!g.acknowledge_stop(k));g.check();checks+=1;
  assert_eq!(g.used(),0);assert_eq!(g.admitted,4);assert_eq!(g.returned,4);
 }
 println!("RG-006: 256 schedules; {checks} conservation checkpoints; simulated stop acknowledgements only");
}
