//! OI-005: local append-only decision journal; no external anti-rollback proof. .dlw
use crate::qualification::{Machine,Observation,Stage,Decision,ORDER};
use std::{fs::{File,OpenOptions},io::{self,Read,Write},path::{Path,PathBuf}};
const MAGIC:&[u8]=b"PHOTON16-JOURNAL-V1\n";
fn invalid()->io::Error{io::Error::new(io::ErrorKind::InvalidData,"invalid journal history")}
fn code(o:Observation)->u8{match o{Observation::Match=>0,Observation::Reject=>1,Observation::Missing=>2}}
fn decode(o:u8)->io::Result<Observation>{match o{0=>Ok(Observation::Match),1=>Ok(Observation::Reject),2=>Ok(Observation::Missing),_=>Err(invalid())}}
struct Guard{path:PathBuf,_file:File}
impl Guard{fn acquire(path:&Path)->io::Result<Self>{let mut name=path.as_os_str().to_os_string();name.push(".observe.lock");let path=PathBuf::from(name);let file=OpenOptions::new().write(true).create_new(true).open(&path)?;Ok(Self{path,_file:file})}}
impl Drop for Guard{fn drop(&mut self){let _=std::fs::remove_file(&self.path);}}
pub struct Journal{file:File,_guard:Guard,machine:Machine,count:u64,poisoned:bool}
impl Journal{
 /// Cooperative exclusive creation; all participants must use the same path.
 pub fn create(path:impl AsRef<Path>)->io::Result<Self>{
  let path=path.as_ref();let guard=Guard::acquire(path)?;
  let mut file=OpenOptions::new().read(true).append(true).create_new(true).open(path)?;
  file.write_all(MAGIC)?;file.sync_all()?;
  Ok(Self{file,_guard:guard,machine:Machine::new(),count:0,poisoned:false})
 }
 /// Read-only replay. Incomplete or malformed records fail closed.
 pub fn inspect(path:impl AsRef<Path>)->io::Result<(u64,Decision)>{
  let path=path.as_ref();let _guard=Guard::acquire(path)?;
  let mut file=File::open(path)?;let mut header=vec![0;MAGIC.len()];file.read_exact(&mut header)?;
  if header!=MAGIC{return Err(invalid());}
  let mut m=Machine::new();let mut count=0u64;
  loop{
   let mut row=[0u8;18];
   if file.read(&mut row[..1])?==0{break;}
   file.read_exact(&mut row[1..])?;
   let seq=u64::from_le_bytes(row[..8].try_into().unwrap());
   let prev=u64::from_le_bytes(row[8..16].try_into().unwrap());
   if seq!=count+1||prev!=count||!matches!(m.decision(),Decision::Awaiting(_)){return Err(invalid());}
   let stage=*ORDER.get(row[16] as usize).ok_or_else(invalid)?;
   let observation=decode(row[17])?;
   let _=m.observe(stage,observation);count=seq;
  }
  Ok((count,m.decision()))
 }
 pub fn append(&mut self,stage:Stage,observation:Observation)->io::Result<Decision>{
  if self.poisoned||!matches!(self.machine.decision(),Decision::Awaiting(_)){return Err(invalid());}
  let seq=self.count.checked_add(1).ok_or_else(invalid)?;
  let mut row=[0u8;18];row[..8].copy_from_slice(&seq.to_le_bytes());row[8..16].copy_from_slice(&self.count.to_le_bytes());row[16]=stage as u8;row[17]=code(observation);
  // A failed write may leave a partial record. Never retry on this handle.
  self.poisoned=true;self.file.write_all(&row)?;self.file.sync_all()?;
  let _=self.machine.observe(stage,observation);self.count=seq;self.poisoned=false;
  Ok(self.machine.decision())
 }
}
#[cfg(test)]mod tests{
 use super::*;
 fn path(tag:&str)->std::path::PathBuf{std::env::temp_dir().join(format!("photon16-{}-{}-{}",std::process::id(),tag,std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()))}
 #[test]fn shared_lock(){let p=path("shared");let j=Journal::create(&p).unwrap();assert!(Journal::inspect(&p).is_err());assert!(Journal::create(&p).is_err());drop(j);assert_eq!(Journal::inspect(&p).unwrap().0,0);let g=Guard::acquire(&p).unwrap();assert!(Journal::inspect(&p).is_err());drop(g);std::fs::remove_file(p).unwrap();}
 #[test]fn complete_replay(){let p=path("complete");let mut j=Journal::create(&p).unwrap();for s in ORDER{j.append(s,Observation::Match).unwrap();}assert!(j.append(Stage::Protocol,Observation::Match).is_err());drop(j);assert_eq!(Journal::inspect(&p).unwrap(),(6,Decision::DeclaredCompositionMatch));assert!(Journal::create(&p).is_err());std::fs::remove_file(p).unwrap();}
 #[test]fn reject_replay(){let p=path("reject");let mut j=Journal::create(&p).unwrap();let d=j.append(Stage::Custody,Observation::Match).unwrap();assert!(j.append(Stage::Protocol,Observation::Match).is_err());drop(j);assert_eq!(Journal::inspect(&p).unwrap(),(1,d));std::fs::remove_file(p).unwrap();}
 #[test]fn torn_record(){let p=path("torn");drop(Journal::create(&p).unwrap());OpenOptions::new().append(true).open(&p).unwrap().write_all(&[1]).unwrap();assert!(Journal::inspect(&p).is_err());std::fs::remove_file(p).unwrap();}
 #[test]fn wrong_predecessor(){let p=path("prev");drop(Journal::create(&p).unwrap());let mut row=[0u8;18];row[0]=1;row[8]=7;OpenOptions::new().append(true).open(&p).unwrap().write_all(&row).unwrap();assert!(Journal::inspect(&p).is_err());std::fs::remove_file(p).unwrap();}
}
