//! EO-003 test driver: explicit stdin handshake, no journal recovery authority.
use photon16::{evidence_journal::Journal,qualification::{Observation,ORDER}};
use std::io::{self,BufRead,Write};
fn main()->io::Result<()>{
 let mut args=std::env::args().skip(1);
 let mode=args.next().expect("mode");
 let path=args.next().expect("journal path");
 if mode=="inspect"{let (count,_)=Journal::inspect(&path)?;println!("{count}");return Ok(());}
 if mode=="create"{drop(Journal::create(&path)?);return Ok(());}
 assert_eq!(mode,"hold");
 let mut j=Journal::create(&path)?;
 j.append(ORDER[0],Observation::Match)?;
 println!("READY");io::stdout().flush()?;
 let mut command=String::new();io::stdin().lock().read_line(&mut command)?;
 if command.trim()!="RELEASE"{return Err(io::Error::new(io::ErrorKind::InvalidInput,"missing release command"));}
 for stage in ORDER.into_iter().skip(1){j.append(stage,Observation::Match)?;}
 drop(j);println!("RELEASED");Ok(())
}
