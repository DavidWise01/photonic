// RG-005 isolated deterministic reservation model. .dlw
use std::collections::VecDeque;
const MAX: usize=17408;
const MIN: usize=13312;
#[derive(Default)]
struct Gate { queue: VecDeque<usize>, active: Vec<usize>, admitted:usize, returned:usize, allocated:usize, released:usize }
impl Gate {
 fn used(&self)->usize {self.active.iter().sum()}
 fn budget(&self)->usize {if self.queue.is_empty(){MIN.max(self.used())}else{MAX}}
 fn push(&mut self,w:usize)->bool {if ![13312,256,3840].contains(&w)||self.queue.len()>=32{return false}self.queue.push_back(w);true}
 fn admit(&mut self)->bool {let Some(&w)=self.queue.front() else{return false};if self.active.len()>=3||self.used()+w>self.budget(){return false}self.queue.pop_front();self.active.push(w);self.admitted+=1;self.allocated+=w;true}
 fn finish(&mut self,i:usize){let w=self.active.remove(i);self.returned+=1;self.released+=w;}
 fn check(&self){assert_eq!(self.admitted,self.returned+self.active.len());assert_eq!(self.allocated,self.released+self.used());assert!(self.used()<=self.budget()&&self.budget()<=MAX&&self.active.len()<=3);}
}
fn main(){
 let mut checks=0;
 for seed in 0..256 {
  let mut g=Gate::default();
  for _ in 0..3 {assert!(g.push(3840));assert!(g.admit());g.check();checks+=1;}
  assert!(g.push(13312));
  for _ in 0..31 {assert!(g.push(256));}
  assert!(!g.push(256));
  assert!(!g.admit());
  for _ in 0..2 {let i=seed%g.active.len();g.finish(i);g.check();checks+=1;if g.active.len()>1 {assert!(!g.admit());}}
  assert!(g.admit());assert_eq!(g.active.last(),Some(&13312));g.check();checks+=1;
  while !g.queue.is_empty()||!g.active.is_empty(){while g.admit(){g.check();checks+=1;}if !g.active.is_empty(){let i=seed%g.active.len();g.finish(i);g.check();checks+=1;}}
  assert_eq!(g.admitted,35);assert_eq!(g.admitted,g.returned);assert_eq!(g.budget(),MIN);
 }
 println!("RG-005: 256 deterministic schedules; {checks} conservation checkpoints");
}
