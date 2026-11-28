use photon16::resource_abi::*;
use std::io::{self,BufRead};
fn main(){for line in io::stdin().lock().lines(){photon_rg_reset();let line=line.unwrap();let mut out=Vec::new();for token in line.split_whitespace(){let (op,arg)=token.split_once(':').unwrap();let status=photon_rg_step(op.parse().unwrap(),arg.parse().unwrap());let mut row=vec![status];row.extend((0..10).map(photon_rg_metric));out.push(row.iter().map(|x|x.to_string()).collect::<Vec<_>>().join(","));}println!("{}",out.join(";"));}}
