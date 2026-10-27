# PHOTONIC / SCALAR ZERO — field lab v1.0

Part of [ROOT0 Photonic Processor](https://github.com/DavidWise01/photonic).

**Live:** https://davidwise01.github.io/photonic/scalar-zero/  
**Entry point:** [index.html](index.html)  
**Attribution:** `.dlw` · David Lee Wise / ROOT0

## Model
- Spatial scaffold: 3 × 3 × 3 = **27 logical nodes** with one scalar-zero center and **54 undirected lattice edges**.
- Field view: **81 × 81 = 6,561** sampled points.
- State per field point: two complex Jones amplitudes (Ex and Ey). Displayed intensity is the sum of their squared magnitudes, calculated from one or three coherent emitters.
- User controls: optical wavelength (400–700 nm), normalized visual spatial scale, relative phase, rotation angle, amplitude, elapsed model time, and linear/elliptical/circular polarization.
- Three *simulated* witnesses use different analyzer angles **A = 0°, B = −15°, C = +15°** and preserve distinct reports. **D = scalar-zero ground** and does not vote.
- Capture appends one event containing all three witness reports to a local browser ledger. Export produces a portable JSON file. No automatic merger, no majority gate.
- Single-file HTML/CSS/Canvas2D/JavaScript: no CDN, external runtime, account, or backend.

## Scientific boundary

This is a **classical electromagnetic-wave and Jones-calculus visualization**. It is not a physical BB84 quantum key distribution device, a single-photon transport simulation, a verification of quantum security, or proof of historical provenance. The optical wavelength is used for spectral display color and a normalized spatial-frequency proxy; an 81-cell image is not a resolved 550 nm wave across a real 32 cm optical path.

The A/B/C reports come from three distinct computational analyzer functions **sharing one software model**; they are not independent laboratory instruments. Local browser timestamps and append-only UI behavior do not provide cryptographic immutability or independent historical authentication.

## Documented invariants

- Exactly 27 lattice nodes
- Exactly 54 nearest-neighbor undirected edges
- Exactly one coordinate origin (0,0,0)
- Exactly 6,561 field points
- Exactly three readings per capture
- Nonnegative, finite calculated intensity
- No quorum / forced agreement

## Historical context

The BB84 protocol uses the polarization of photons and authenticated public classical discussion to generate a shared cryptographic key. This page is a **separate illustrative field-lattice workbench** inspired by that optical context, not a reproduction of the original hardware.

`ROOT0-ATTRIBUTION-v1.0 · David Lee Wise · .dlw`
