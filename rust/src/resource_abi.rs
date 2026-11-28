//! RI-002 bounded deterministic qualification interface. No production authority. .dlw
use crate::resource_governance::{Gate,Mode,Key};
use std::cell::RefCell;
const MAX_EVENTS:u32=4096;
#[derive(Default)]struct Session{gate:Gate,keys:[Option<Key>;3],events:u32}
thread_local!{static SESSION:RefCell<Session>=RefCell::new(Session::default());}
#[no_mangle]pub extern "C" fn photon_rg_abi()->u32{1}
#[no_mangle]pub extern "C" fn photon_rg_reset(){SESSION.with(|s|*s.borrow_mut()=Session::default());}
// Qualification only. 0 enqueue mode; 1 admit; 2 tick; 3 stop slot;
// 4 simulated acknowledgement; 5 cancel pending; 6 stale acknowledgement.
#[no_mangle]pub extern "C" fn photon_rg_step(op:u32,arg:u32)->u32{SESSION.with(|s|{let mut s=s.borrow_mut();if s.events>=MAX_EVENTS{return 3} s.events+=1;let ok=match op{
0=>match arg{0=>s.gate.enqueue(Mode::Kernel).is_some(),1=>s.gate.enqueue(Mode::Policy).is_some(),2=>s.gate.enqueue(Mode::Online).is_some(),_=>false},
1=>if let Some(k)=s.gate.admit(){s.keys[k.worker]=Some(k);true}else{false},
2=>if let Some(ks)=s.gate.tick(arg as u64){for k in ks{s.keys[k.worker]=Some(k);}true}else{false},
3=>if let Some(k)=s.keys.get(arg as usize).copied().flatten(){if let Some(t)=s.gate.stop(k){s.keys[t.worker]=Some(t);true}else{false}}else{false},
4|6=>if let Some(mut k)=s.keys.get(arg as usize).copied().flatten(){if op==6{k.generation=k.generation.saturating_sub(1);}s.gate.simulate_stop_observation(k)}else{false},
5=>s.gate.cancel_pending(arg as u64),_=>false};if !s.gate.conserved(){return 2}u32::from(ok)})}
// All counters fit u32 in this session: <=4096 events and <=13312 bytes/event.
#[no_mangle]pub extern "C" fn photon_rg_metric(i:u32)->u32{SESSION.with(|s|{let s=s.borrow();let x=s.gate.snapshot();match i{0=>x.active as u32,1=>x.bytes as u32,2=>x.budget as u32,3=>x.pending as u32,4=>x.admitted as u32,5=>x.returned as u32,6=>x.allocated as u32,7=>x.released as u32,8=>u32::from(s.gate.conserved()),9=>s.events,_=>u32::MAX}})}
