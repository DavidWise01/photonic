# PHOTON-16 v0.81 — Rust migration

Native, dependency-free Rust prototype of v0.80's resource-aware predictor with direct contextual reads and separated observation/update phases. Existing JavaScript and GitHub Pages are preserved. The Rust CLI does not yet expose the full reciprocal stage ledger or a WASM frontend. Buffer payload counts are logical variant payloads: the inline enum reserves space for its largest variant, so these are not actual allocation savings. Cross-language numerical parity remains to be tested.

Run from repository root:

    cargo test --manifest-path rust/Cargo.toml
    cargo run --release --manifest-path rust/Cargo.toml

.dlw
