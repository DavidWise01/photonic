//! OI-003: ordered qualification decisions, not a cryptographic verifier. .dlw
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum Stage { Protocol=0, Checkpoint=1, Fork=2, Custody=3, Artifact=4, Reproduction=5 }
pub const ORDER: [Stage;6]=[Stage::Protocol,Stage::Checkpoint,Stage::Fork,Stage::Custody,Stage::Artifact,Stage::Reproduction];
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Observation { Match, Reject, Missing }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Rejection { OutOfOrder, Rejected(Stage), Missing(Stage), Terminal }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Decision { Awaiting(Stage), Held(Rejection), DeclaredCompositionMatch }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Authority { Hold }
pub struct Machine { cursor:usize, decision:Decision }
impl Default for Machine { fn default()->Self { Self::new() } }
impl Machine {
 pub fn new()->Self { Self {cursor:0,decision:Decision::Awaiting(Stage::Protocol)} }
 pub fn decision(&self)->Decision {self.decision}
 pub fn authority(&self)->Authority {Authority::Hold}
 pub fn observe(&mut self,stage:Stage,observation:Observation)->Result<Decision,Rejection>{
  if !matches!(self.decision,Decision::Awaiting(_)){return Err(Rejection::Terminal);}
  let rejection=if stage!=ORDER[self.cursor]{Some(Rejection::OutOfOrder)}else{match observation{Observation::Match=>None,Observation::Reject=>Some(Rejection::Rejected(stage)),Observation::Missing=>Some(Rejection::Missing(stage))}};
  if let Some(reason)=rejection {self.decision=Decision::Held(reason);return Err(reason);}
  self.cursor+=1;
  self.decision=if self.cursor==ORDER.len(){Decision::DeclaredCompositionMatch}else{Decision::Awaiting(ORDER[self.cursor])};
  Ok(self.decision)
 }
}
#[cfg(test)]
mod tests {
 use super::*;
 #[test] fn complete_order(){let mut m=Machine::new();for stage in ORDER{assert!(m.observe(stage,Observation::Match).is_ok());assert_eq!(m.authority(),Authority::Hold);}assert_eq!(m.decision(),Decision::DeclaredCompositionMatch);assert_eq!(m.observe(Stage::Protocol,Observation::Match),Err(Rejection::Terminal));}
 #[test] fn every_failure_is_terminal(){for (i,stage) in ORDER.into_iter().enumerate(){for observation in [Observation::Reject,Observation::Missing]{let mut m=Machine::new();for prior in &ORDER[..i]{m.observe(*prior,Observation::Match).unwrap();}let reason=if observation==Observation::Reject{Rejection::Rejected(stage)}else{Rejection::Missing(stage)};assert_eq!(m.observe(stage,observation),Err(reason));assert_eq!(m.decision(),Decision::Held(reason));assert_eq!(m.observe(stage,Observation::Match),Err(Rejection::Terminal));assert_eq!(m.authority(),Authority::Hold);}}}
 #[test] fn every_wrong_stage_is_terminal(){for (i,expected) in ORDER.into_iter().enumerate(){for wrong in ORDER{if wrong==expected{continue;}let mut m=Machine::new();for prior in &ORDER[..i]{m.observe(*prior,Observation::Match).unwrap();}assert_eq!(m.observe(wrong,Observation::Match),Err(Rejection::OutOfOrder));assert_eq!(m.decision(),Decision::Held(Rejection::OutOfOrder));assert_eq!(m.authority(),Authority::Hold);}}}
}
