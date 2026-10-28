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

## GEN2 · Known-physics calibration (2026-10-27)

This append-only revision adds **Section 08 · KNOWN PHYSICS / PHOTON REDSHIFT**, beneath the existing photonic lattice and exploratory Planck-scale panel. It does not overwrite GEN0 or GEN1.

### Physical inputs

- Vacuum light speed c = 299,792,458 m/s (exact).
- G = 6.67430 × 10^-11 m^3 kg^-1 s^-2 (CODATA 2022).
- Planck constant h = 6.62607015 × 10^-34 J s (exact), for possible photon energy extensions.
- Earth mass 5.9722 × 10^24 kg and mean radius 6,371 km (NASA).
- Sun mass 1.9884 × 10^30 kg and mean radius 695,700 km (NASA).
- Nominal GPS altitude 20,200 km (GPS.gov).
- One astronomical unit = 149,597,870,700 m (exact).
- Light wavelength comes from the existing photonic field setting (default 550 nm).

### Model used

For two *stationary* observers at radii \`r_e\` (emitter) and \`r_r\` (receiver), in the exterior of a nonrotating spherically symmetric source with mass \`M\`:

\`\`\`text
r_s = 2 G M / c^2
lapse(r) = sqrt(1 - r_s / r)
nu_r / nu_e = lapse(r_e) / lapse(r_r)
lambda_r / lambda_e = lapse(r_r) / lapse(r_e)

The receiver higher in the gravity well sees a redshift:
(nu_r - nu_e) / nu_e < 0.

The higher static clock gains time relative to the lower clock:
lapse(r_r) / lapse(r_e) - 1 > 0.
\`\`\`

Numerical implementation uses algebraically stable \`sqrt(1±x)-1\` identities to avoid cancellation when the expected fractional shift is ~10^-15.

### Numerical self-checks

These three reference values are computed in-browser, then checked against documented baseline constants. These are **arithmetic self-checks** rather than independent empirical tests:

| Case | Geometry | Predicted result |
|---|---|---|
| Pound–Rebka | Earth surface to surface + 22.5 m | Photon fraction \`-2.4584673e-15\` |
| GPS gravitational-only | Earth surface to +20,200 km | Upper stationary clock +\`45.7244267 µs/day\` |
| Solar redshift | Sun surface to 1 AU | Photon fraction \`-2.1126237e-6\` |

The real Pound–Rebka experiment used gamma rays, **not 550 nm green light**. The fractional gravitational shift is essentially frequency-independent in this idealized geometric-optics calculation. The GPS clock in motion additionally loses ~7 µs/day through special relativity, giving the familiar net +38 µs/day. The solar reference omits plasma, receiver gravity, solar rotation, and Doppler effects. Real Earth and Sun have nonspherical structure; for these reference comparisons, the Schwarzschild exterior is an approximation.

### Animation and provenance limits

- The colorful ray animation is **schematic**, not a null geodesic or coupled Einstein–Maxwell calculation.
- Visible separation of waveforms is greatly **exaggerated**; 10^-15 optical wavelength differences cannot be resolved visually at canvas scale.
- Each new append-only local capture retains both the GEN1 Planck exploration parameters and the GEN2 calibrated result as separate fields, alongside original A/B/C reports.
- Three software reports in one webpage **do not constitute three independent physical witnesses**.
- This section benchmarks classical relativity at real-world scales. It **does not validate** the 10^-28 through 10^-35 m probe model or assert discoveries below the Planck length.

### Source references

- [NIST CODATA 2022 constants](https://www.physics.nist.gov/cuu/pdf/wall_2022.pdf)
- [NASA Earth facts](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html)
- [NASA Sun facts](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html)
- [Pound & Rebka, 1960 measured gravitational frequency shift](https://doi.org/10.1103/PhysRevLett.4.337)
- [NIST relativity and GPS clocks](https://www.nist.gov/atomic-clocks/a-powerful-tool-for-science/putting-einstein-test)
- [GPS.gov space segment](https://www.gps.gov/space-segment)

\`.dlw\` · ROOT0 attribution preserved.


## GEN3 · Chemical colors, 118 elements and electromagnetic spectrum

GEN3 adds an embedded atlas to \`scalar-zero/index.html\`, with a directly accessible standalone page at \`scalar-zero/chemical-spectrum.html\` and local CSS/JavaScript assets. GEN0 through GEN2 remain intact.

### ROOT0 color registry (model-specific; **not** measured chemical emission)

| Registry interval | Anchor label | Assigned appearance | Signed Casimir slot |
|---|---|---|---|
| 0–120 degrees | H / Hydrogen | red gradient | +1k |
| 121–240 degrees | O / Oxygen | green gradient | 0k |
| 241–360 degrees | N / Nitrogen | blue gradient | -1k |

All 360 integer coordinates are accounted for. Color choice can optionally override **only the render color** of the original 81x81 classical wavefield, via parent/child browser messages. It does not change propagation, angular quantum polarization, particle identity, or the GEN2 gravitational equations. Here "Casimir slot" is a signed symbolic index and **not a kelvin temperature, force measurement, thermal Casimir correction, or physical prediction**. Negative Kelvin absolute temperature is not asserted.

### Periodic register

Includes IUPAC-recognized atomic numbers 1–118, symbols and names from H to Og, with familiar periods and 18 main groups plus separated lanthanoid and actinoid rows. Search by name, symbol or atomic number. Clicking an element moves to a **model-space color angle**; H, O and N are manually anchored at 60, 180 and 300 degrees. All other positions are a simple atomic-number interpolation, *not* a measured wavelength or element-specific spectral fingerprint.

### Physical electromagnetic ruler

Separate log10 wavelength slider (10^-13 to 10^-3 meters) with examples:

- Infrared: 10^-5 m (10 micrometers).
- Visible: 550 x 10^-9 m by default.
- X-ray: 10^-10 m (0.1 nm).
- Gamma: 10^-12 m (0.001 nm).

The browser calculates \`frequency = c / wavelength\` and \`photon energy (eV) = h * c / (wavelength * e)\` using exact SI definitions of c, h and elementary charge e. Approximate band boundaries are from NASA/HEASARC and are not perfect separators; X-ray versus gamma also depends on the photon generation mechanism. No actual elemental emission lines or radiographic measurements are invented.

### Assets and provenance

- \`scalar-zero/chemical-spectrum.html\`
- \`scalar-zero/chemical-spectrum.css\`
- \`scalar-zero/chem-data-{head,mid,late,heavy-a,heavy-b}.js\` — full element names/symbols
- \`scalar-zero/chem-core.js\` — color and table coordinates
- \`scalar-zero/chem-ui.js\` — RGB model controls
- \`scalar-zero/chem-table.js\` — periodic table
- \`scalar-zero/chemical-spectrum.js\` — physical EM ruler and integration

Sources: [IUPAC](https://iupac.org/what-we-do/periodic-table-of-elements/), [NASA/HEASARC](https://imagine.gsfc.nasa.gov/science/toolbox/spectrum_chart.html), [NIST constants](https://physics.nist.gov/cuu/Constants/).

**Independent verification boundary:** Element identities and physical conversion formulas are known. Three visual channels in a single browser do not become independent quantum witnesses. The Casimir levels and chemical gradients are explicit user-defined geometry.


## GEN4 · Scalar-zero toroidal chemical / astral structure (2026-10-27)

The original photonic 27-node lattice, classical 81×81 wavefield, gravity well, GR calibration, H/O/N gradient, full 118-element periodic table and three-report ledger remain unchanged.

A new **visual / geometric** layer adds:

- Embedded \`scalar-zero/toroid-chem-astral.html\` with an animated Canvas2D toroidal mesh and scalar-zero reference \`D=0\`.
- Ten real element identities, from hydrogen (H, atomic number 1) through neon (Ne, number 10).
- Straight **linear** connections between adjacent element nodes, with bracket-inspired extra connectors to the central reference and across grouped records.
- Five **data-rich globules** for \`[h]\`, \`[be]\`, \`[c]\`, \`[o]\`, and \`{neon}\`. These expose atomic number, number of electrons in a neutral atom, and standard ground-state shell occupancies.
- Interactive rotation / rate / phase / tube-radius controls, starfield toggle, edge toggle, globule toggle, point selection and a ten-element stepper.
- The user's original glyph preserved literally: \`{{ ([h]he)((li[be]\\(b[c]))((n[o]f)){neon} }}\`.

### Data model vs physics

| Entity | Ground-state neutral electron shells | Symbol in user grammar |
|---|---|---|
| H | 1 | \`[h]\` |
| He | 2 | \`he\` |
| Li | 2,1 | \`li\` |
| Be | 2,2 | \`[be]\` |
| B | 2,3 | \`b\` |
| C | 2,4 | \`[c]\` |
| N | 2,5 | \`n\` |
| O | 2,6 | \`[o]\` |
| F | 2,7 | \`f\` |
| Ne | 2,8 | \`{neon}\` |

The toroidal geometry, center-zero convention, bracket-inspired connections, stringlike rails, starfield, element palette and signed Casimir indices are **model structure**, not experimental confirmation of string theory or a sub-Planck physical lattice. Electron identities and ground-state shell distributions are the standard chemistry layer.

**Path:** \`scalar-zero/toroid-chem-astral.html\`. It runs without a CDN; the embedded copy is available from the original \`scalar-zero/index.html\` page. \`.dlw\` / ROOT0 attribution continues through repository and page history.
