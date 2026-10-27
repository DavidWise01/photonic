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

## GEN1 · Gravitational scale explorer (2026-10-27)

The original 27-node, 81×81 scalar-zero photonic lab remains intact. GEN1 adds a new on-page **gravity-well schematic** and a logarithmic virtual-probe scale, spanning radii **10^-28 m to 10^-35 m**. The well has a three-track A/B/C overlay referenced to scalar-zero D, maintaining independent reports without any majority vote. It also links to the separate [THE GRAVITY WELL sphere](https://github.com/DavidWise01/the-gravity-well).

- **Reference constants:** Planck length `1.616255e-35 m` and Planck mass `2.176434e-8 kg` (CODATA/NIST; approximate, for illustration).
- **Source mass control:** 0.10 to 2.00 Planck masses. Model Schwarzschild radius `r_s = 2 * l_P * (M/m_P)`.
- **Clock display:** Only for `r > r_s`, display `sqrt(1 - r_s/r)`: classical gravitational redshift / proper-time factor for a static observer outside an idealized, spherically symmetric, non-rotating source. For `r <= r_s`, show **not defined** rather than a fabricated static reading.
- **Caution at the Planck frontier:** Near the Planck scale classical GR can no longer be assumed valid; the `10 l_P` band is a visual caution threshold, **not** a predicted phase boundary. Below one Planck length no established sub-Planck measurement or verified physics is being represented.
- **Visualization:** A stylized, logarithmically navigated gravity-well mesh is a qualitative picture only, not a computed embedding surface, spacetime solver, experimentally measured well, or validated photon trajectory.
- **Witness captures:** New ledger entries now additionally store `gravity` with probe exponent, radius, horizon proxy, Planck-length ratio, and any valid classical lapse. Prior records remain readable. The browser ledger is UI-append-only; the user or browser can still edit/delete storage externally.
- **Original field remains classical:** The gravitational parameters do not alter the 81×81 wave-solver dynamics. The panel is a scale comparison and an independent visual companion; it does **not** claim coupled Maxwell–Einstein simulation or that light was physically measured at 10^-35 m.

**Source references:** [NIST CODATA constants](https://www.nist.gov/programs-projects/codata-values-fundamental-physical-constants) · [JILA Schwarzschild time-dilation description](https://jila-amo.colorado.edu/~ajsh/bh/schwp.html).

**Commit provenance:** Previous GEN0 remains accessible through Git history. GEN1 extends the page rather than erasing historical revisions.
