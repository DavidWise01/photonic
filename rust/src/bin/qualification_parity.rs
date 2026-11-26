//! OI-004 numeric transition trace adapter; no evidence authentication.
use photon16::qualification::{Machine,Stage,Observation,Decision,Rejection,ORDER};
fn state(d:Decision)->String {match d {
 Decision::Awaiting(s)=>format!("A{}",s as u8),
 Decision::Held(Rejection::OutOfOrder)=>"H:ORDER".into(),
 Decision::Held(Rejection::Rejected(s))=>format!("H:R{}",s as u8),
 Decision::Held(Rejection::Missing(s))=>format!("H:M{}",s as u8),
 Decision::Held(Rejection::Terminal)=>"H:TERMINAL".into(),
 Decision::DeclaredCompositionMatch=>"MATCH".into()
}}
fn main(){
 use std::io::{self,BufRead};
 for line in io::stdin().lock().lines(){
  let line=line.expect("input");let mut m=Machine::new();let mut trace=vec![state(m.decision())];
  for token in line.split_whitespace(){
   let (a,b)=token.split_once(':').expect("stage:observation");
   let stage:Stage=ORDER[a.parse::<usize>().expect("stage")];
   let o=match b{"0"=>Observation::Match,"1"=>Observation::Reject,"2"=>Observation::Missing,_=>panic!("observation")};
   let result=m.observe(stage,o);
   let event=if result==Err(Rejection::Terminal){"TERMINAL"}else if result.is_err(){"REJECT"}else{"OK"};
   trace.push(format!("{}:{}",event,state(m.decision())));
  }
  println!("{}|HOLD",trace.join(","));
 }
}
