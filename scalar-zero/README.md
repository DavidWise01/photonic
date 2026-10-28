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

## GEN5 · Odd toroids, even boxes, seven noble-gas closures (2026-10-27)

GEN5 extends GEN4's ten-element toroidal H–Ne field to **all 118 recognized elements**, with seven completed periodic rings. It preserves GEN0–GEN4 assets and introduces a separate \`scalar-zero/noble-closures.html\` viewer, embedded in the original \`scalar-zero/index.html\`.

### Canonical geometry

- **Atomic number Z odd → toroid glyph \`(Symbol)\`**.
- **Atomic number Z even → box glyph \`[Symbol]\`**.
- Each ring stops at a **group-18 noble gas**. Because all seven terminal Z values are even, each terminal renders as a **box lid**.
- \`D=0\` stays the shared scalar-zero **coordinate reference**, not an observing agent, voting member, physical vacuum detector or atom.
- Straight chords connect each successive pair of elements in a period, ending at its noble gas. Noble-gas terminals have a reference spoke to D; there is no fabricated link from one period's terminal to the next period's start.
- Toroidal meshes are a coordinate visualization. They are **not** experimentally determined atomic morphology.
- Data-rich globules identify noble-gas terminals and the selected element; the visual rim and model hues indicate structural emphasis.
- Coloring reuses GEN3's H/O/N 360-step custom-sector map (H red/+1k, O green/0k, N blue/−1k). Those signed values are purely symbolic; they are not thermal, atomic-emission or measured Casimir data.
- All seven glyph systems can be rendered together or one at a time; click nodes to inspect their Z, element name, period, parity and model color; speed/phase/tube mesh controls are interactive.
- JSON export includes all 118 elements, all seven generated parity sequences, original user-provided glyph expressions, and the distinction between known chemistry and conceptual geometry.

| Ring | Atomic Z range | Element count | Nobel-gas endpoint |
|---|---|---|---|
| 1 | 1–2 | 2 | He, Z=2 |
| 2 | 3–10 | 8 | Ne, Z=10 |
| 3 | 11–18 | 8 | Ar, Z=18 |
| 4 | 19–36 | 18 | Kr, Z=36 |
| 5 | 37–54 | 18 | Xe, Z=54 |
| 6 | 55–86 | 32 | Rn, Z=86 |
| 7 | 87–118 | 32 | Og, Z=118 |

Oganesson's element name, atomic number and placement in group 18 are recognized; its physical chemistry is not thoroughly measured and expected noble-gas-like behaviors should not be asserted as experimentally established.

### Original author-supplied grammar

These are stored as literal text, **not** parsed or repaired, and remain attached to the first two authored closures:

\`\`\`text
{{ ([h]he)((li[be]\(b[c]))((n[o]f)){neon} }}
{{(na),[mg],(al)[si])){{(p)[s]}}(cl) argon }}
\`\`\`

The page **separately** constructs mechanically normalized sequences: odd Z in parentheses and even Z in brackets. Ring 3 (Na through Ar) thus normalizes to:

\`\`\`text
{{ (Na) [Mg] (Al) [Si] (P) [S] (Cl) [Ar] }}
\`\`\`

All subsequent closure strings are generated deterministically from the known element order, never by inventing new elements. As a visual metaphor, this is a periodic-toroidal register and not string-theory evidence.

### Assets

\`scalar-zero/noble-closures.html\`, \`noble-closures.css\`, \`noble-closures.js\`. Reuses GEN3's local \`chem-data-*.js\` and \`chem-core.js\` as the single element registry and color index sources. No CDN dependencies.

Scientific references: [IUPAC Periodic Table](https://iupac.org/what-we-do/periodic-table-of-elements/), [PubChem Oganesson](https://pubchem.ncbi.nlm.nih.gov/element/118).

**Author:** David Lee Wise / ROOT0. \`.dlw\` provenance preserved by prior Git history; GEN5 is added as new source files rather than rewriting earlier generation artifacts.

## GEN6 · Binary box/toroid geometry and 27 weighted cellular positions (2026-10-27)

GEN6 adds the author-supplied two-symbol weighted sequence as a separate **logical cellular overlay** and expands the simple 0/1 geometry through all **118 known elements**. The earlier GEN0–GEN5 pages and algorithms are left in place.

### Distinct registers — do not collapse

| Register | Exact rule | Meaning |
|---|---|---|
| **Geometry / binary** | 0 → □ box; 1 → ◉ toroid | Shapes only |
| **Atomic parity** | bit = Z modulo 2 (for Z=1 through 118) | Even Z = 0 box; odd Z = 1 toroid |
| **Scalar-zero** | D = Z 0 as a reference only | D is **not** element zero |
| **Weighted operator** | \`.\` = advance 1 cell; \`|\` = advance 2 cells | Independent of the geometry bit |
| **Response** | Fight / Flight / Hide | Three **human-selected symbolic** cell-response labels; never inferred automatically |
| **Closure** | Period ends at He, Ne, Ar, Kr, Xe, Rn, Og | The group-18 noble-gas terminals from known chemistry |

**Exact input, unmodified:**

\`\`\`text
..||..|....|||....|.
\`\`\`

Its literal count is **20 operator characters**: **13 dots** and **7 vertical bars**. Its weighted value is exactly **13 × 1 + 7 × 2 = 27**. The weight ratio for one bar versus one dot is **2:1**, not a claim that there are twice as many bars as dots.

The **only terminal weighted boundary is 27**, reached at source operator 20. GEN7 additionally folds the complete 27 addresses as 13 left + 1 center + 13 right. No intermediate checkpoint is a closure.

### Visualization and interaction

- Standalone: \`scalar-zero/cellular-war-27.html\` with \`cellular-war-27.js\`; also embedded in \`scalar-zero/index.html\`.
- 20 source tokens: selectable, with explicit weight and starting/ending cell span.
- 27 logical positions presented as three 3 × 3 layers; each cell displays its associated element index from H (Z=1) through Co (Z=27) and its **independently computed parity shape**.
- Full 0–118 selector: scalar-zero D shown as a reference box; the seven standard periods through Oganesson are selectable and every recognized element gets its corresponding odd/even glyph.
- Three possible response labels, **Fight / Flight / Hide**, can be set explicitly on any selected weighted cell. The program does not infer behaviors from chemistry, mimic actual biology or trigger external interventions.
- Each response assignment **appends** a timestamped local event, without deleting previous events; browser storage is not cryptographically immutable. JSON export includes all token spans, all 27 cells, all 118 element records, seven noble-gas closures, assigned response events and provenance caveats.
- Uses the already present IUPAC 118-element registry; no external runtime, no invented element values or hypothetical element 119.

### Scientific boundary

Atomic numbers, names, noble-gas period ends, and parity are ordinary arithmetic and established chemistry. The claim that odd-Z atoms are **physically** toroids or even-Z atoms are **physically** boxes is **not** an established atomic-physics result. It is the ROOT0 symbolic coordinate convention. "Cellular warfare" is a conceptual/visual labeling of three possible states, not evidence about immune systems, combat tactics or quantum biology. None of these invented model channels alter the physical optical or gravitational calculations in GEN0–GEN3.

**Source of element identities:** [IUPAC periodic table](https://iupac.org/what-we-do/periodic-table-of-elements/). GEN5 noble-gas closures retained.

**Attribution** \`.dlw\` — David Lee Wise / ROOT0. Original input sequence retained literally.


## GEN7 · Complete 27 boundary, mirrored as 13 | 1 | 13 (2026-10-27)

**Corrected boundary:** There is no separate intermediate checkpoint. The source sequence is still \`..||..|....|||....|.\`, exactly 20 symbols of which 13 are dots and seven are vertical bars. The weighted total is \`13*1 + 7*2 = 27\`.

The author's notation \`13x1x13\` is treated as a **three-part arrangement**, not arithmetic multiplication:

\`\`\`text
   13 LEFT CELLS     1 PIVOT       13 RIGHT CELLS

   01 ... 12 13       [14]          15 16 ... 27
                \       |        /
                  D = 0 REFERENCE

   13 + 1 + 13 = 27
   MIRROR: m(z) = 28 - z
   PAIRS: (13,15), (12,16), ... (01,27)
   CENTER ADDRESS: 14, EVEN BOX, SILICON
\`\`\`

Since \`z + m(z) = 28\` is even, opposite addresses always have the **same binary parity and therefore the same symbolic geometry** under \`bit = z mod 2\`. The two mirrored positions are otherwise independent: each can belong to a different weighted source token, have a different token weight, and carry a different fight/flight/hide response label.

- \`D=0\` remains the independent scalar-zero **coordinate reference**, not chemical atomic number zero. The central logical address \`14\` is silicon, an **even-numbered box** in the element mapping; placing it at the coordinate origin does not turn silicon into physical scalar zero.
- \`3 × 3 × 3 = 27\` remains an **alternative spatial arrangement** of the same 27 labeled positions, not a claim that its adjacency graph equals the 13 | 1 | 13 line/pair graph.
- \`13×1×13\` in the author's architectural usage **does not mean** arithmetic multiplication \`13·1·13=169\`. Explicitly expressing the intended partition as \`13 | 1 | 13\` prevents accidental inflation.
- Every response remains **manually assigned** and preserved separately; no vote, quorum, automatic correction, or inferred cellular behavior is added.
- The existing 118 known elements and seven noble-gas closures remain separate and unmodified.
- Standalone visual: \`scalar-zero/mirror-13-1-13.html\` with its own \`mirror-13-1-13.js\`, embedded as section 13 of the main \`scalar-zero/index.html\`.
- The new viewer can select each of the 27 atoms by known name, display the opposite address, compare weight and response differences, append an observation to GEN6's same-origin browser-local event log, and export a JSON snapshot with all 13 pairs and the full 27-cell expansion.
- The colored/box/toroid geometry is **conceptual indexing**, not evidence of physically box-shaped or toroidal atoms, quantum gravity, or actual cellular warfare.

**Formal invariants:** \`20 tokens\`, \`13 dots\`, \`7 bars\`, \`27 weighted positions\`, \`13 mirror pairs\`, \`1 center\`, \`m(m(z))=z\` for \`1≤z≤27\`, \`z%2===m(z)%2\`, and one external ground \`D=0\`. No unsupported biological or chemical inference is made.

Author: David Lee Wise / ROOT0; history preserved by append-only Git commits.

## GEN8 · 364 / 366 / 732 — 28×13 arms, ± terminals and one visual rotation (2026-10-27)

This generation builds a **separate, new 366-site scalar-zero toroidal registry** above the previously established GEN7 \`13 | 1 | 13 = 27\` mirror geometry. No earlier page or generation is replaced. The standalone page is \`scalar-zero/rotation-732.html\`, embedded in \`scalar-zero/index.html\`.

### Four independent counts and their meanings

| Calculation | Value | Interpretation |
|---|---:|---|
| \`364/13 = 28\` | 28 | Radial arms (13 logical positions on each arm) |
| \`28 + 4 = 32\` | 32 | 28 arm-address lanes plus **four independent nibble bit lanes** |
| \`364 + 2 = 366\` | 366 | Data positions plus two new **minus / plus axial terminal** positions |
| \`366 × 2 = 732\` | 732 | Two ordered **− and + phase events per position** during one complete \`360°\` model revolution |

A **nibble is four bits and therefore represents 16 distinct values**, not four values; it supplies four additional control *lanes*. The 32-channel control layout is different from the 366-position spatial register. They must not be added to each other. The two terminal sites 365/366 are symbolic polarity controls and **not** chemical elements. The two polarities are distinct phase *events*, so the same address is visited twice per turn, not 732 independent locations.

The 732-phase cyclic scanner is:

\`\`\`text
phase_tick ∈ {0,...,731}
address = floor(phase_tick / 2) + 1      // 1..366
polarity = (phase_tick mod 2 == 0) ? − : +
angle = 360° * phase_tick / 732         // degrees in visual space
next = (phase_tick + 1) mod 732
\`\`\`

At tick 731, the next tick wraps to 0, completing the 360-degree model period. No physical angular resolution or Planck-scale measurement is implied.

### Chemical overlay — 366 equal model slots

The new registry uses an **equal three-way partition** consistent with the 366-level extension, without changing the older GEN3 360-degree gradient:

- Positions **1–122**: H / red, signed Casimir slot **+1k**.
- Positions **123–244**: O / green, signed Casimir slot **0k**.
- Positions **245–366**: N / blue, signed Casimir slot **−1k**.

These H/O/N assignments are geometric palette labels; they are not chemical element Z values, emission-line measurements or absolute temperatures. Casimir is a user-defined signed model index; no experimentally established Casimir force is inferred. They do not assert the existence of 366 chemical elements. The only names, symbols, and atomic numbers presented as known are **Z=1–118** from the existing IUPAC element registry; **119–366** are unlabeled registry coordinates.

### Interaction, controls and retained boundaries

The new Canvas2D page renders all 364 data sites as 28 straight spokes of 13 positions on a radial/toroidal schematic, with two separate axial markers and D=0. The 366-site scanner runs through each register twice for 732 phase events per 360-degree visual revolution. User controls include phase-event rate, phase index, selected address, pause, reset, single-step, four nibble-bit toggles (0–15) and export of the complete JSON register.

The layout maintains parity encoding \`0 → □ box / 1 → ◉ toroid\`; it does **not** claim the atoms physically have these shapes. GEN7's distinct \`13 | 1 | 13\` mirror and GEN6's \`13 dots + 7 bars = 27 weighted cells\` remain unchanged; \`28 × 13\` is a **new higher-level topology**, not 28 copies of the full 27-cell mirror.

Key invariant checks embedded in the page: exactly 28 arms, 13 positions per arm, 364 data positions, 2 axial controls, 366 total registry sites, 4 nibble bits, 32 logical control lanes, 732 phase events, and three H/O/N blocks of precisely 122 positions.

Physical boundary: these are mathematical visualizations and labeled model structure. Neither Planck-scale probes, new atomic elements, newly measured spectra nor a physical quantum-gravity torus have been established.

**Authorship:** David Lee Wise / ROOT0 · \`.dlw\`. Original earlier source versions preserved in Git commits.

## GEN9 · OASIS 366-color pinwheel integration (2026-10-27)

GEN9 identifies the earlier color-wheel lineage in **\`DavidWise01/oasis\`** and imports its **source-defined hues**, rather than inventing a new palette or overwriting the earlier source.

### Original sources found

1. [OASIS \`apps/i-color-370/index.html\`](https://github.com/DavidWise01/oasis/blob/main/apps/i-color-370/index.html), an existing **370-color interactive wheel**. The earlier wheel's 370 address space remains intact. Four symbolic tail values 367 (white), 368 (black), 369 (gray) and 370 (purple) are outside the 366 carrier.
2. [OASIS N184 v9.4 \`hon_core.mjs\`](https://github.com/DavidWise01/oasis/blob/main/n184/elemental-hon-color-operants-v94/hon_core.mjs), the **366-position H/O/N canonical carrier mapping**, and its [source specification](https://github.com/DavidWise01/oasis/blob/main/n184/elemental-hon-color-operants-v94/spec.json).
3. [OASIS v9.1 color-core \`color_core.mjs\`](https://github.com/DavidWise01/oasis/blob/main/n184/generational-color-lattice-v91/color_core.mjs) for the exact HSV-to-RGB conversion and the three W/M/S brightness tiers.

OASIS's v9.4 README also references an original \`MN_PRIME_366_EXPLORER.html\` with 365 model stages plus a last-position nitrogen lid; that named file was not independently located in the checked default-branch trees. No claim is made that it was found or copied verbatim.

### Imported mapping (exact v9.4 contract)

| Root | Addresses | Hue interpolation in degrees | Neutral source RGB anchor | Symbolic display index |
|---|---|---|---|---|
| H | 1–122 | \`0 + (a-1)*30/121\` | \`#FF0000\` | GEN8 +1k |
| O | 123–244 | \`120 + (a-123)*60/121\` | \`#00FF00\` | GEN8 0k |
| N | 245–366 | \`240 + (a-245)*50/121\` | \`#0000FF\` | GEN8 −1k |

- **Source color conversion:** \`HSV(hue, saturation=1, value=W:1/3, M:2/3, S:1)\`, rounded to 8-bit RGB as the source does.
- **Last address 366** is the canonical N **lid/stitch** in OASIS's HON model.
- **GEN8 previously models addresses 365 and 366 as −/+ axial endpoints**, and this geometric designation is retained as a *separate overlay*. It must not be confused with the source v9.4 HON lid semantics.
- Five OASIS **display operants** retained in ordered chains of up to 5: Gravity, Expansion, Compression, Containment and Explosion. The formulas are ported as **display-only color transformations** from v9.4; the original \`oasis\` code remains read-only, unchanged.
- No synthetic element 119–366 is asserted. IUPAC named elements remain Z=1–118. No measured Casimir temperatures, photon emission line spectra or quantum-gravity evidence is claimed.

### Added working interfaces

- **\`scalar-zero/pinwheel-source-v94.js\`**: standalone browser adapter that ports the OASIS v9.4 H/O/N hue interpolation, HSV rounding, brightness tiers and five ordered operants. It is explicitly attributed to the OASIS source and exposes \`window.ROOT0_PINWHEEL_366\`.
- **\`scalar-zero/pinwheel-366.html\`** and **\`pinwheel-366.js\`**: animated 366 individually colored source segments with selectable address, W/M/S intensity, 28-spoke GEN8 overlay, five display operants, 732 event scanner, JSON export and source provenance links.
- **\`scalar-zero/rotation-732.html\`**: GEN8's 366 register glyphs now use the source adapter's full **per-address** HSV palette, instead of one flat RGB color per H/O/N group. Cardinalities and 732 event mechanics are unchanged.
- **\`scalar-zero/index.html\`**: embeds the GEN9 viewer and bridges user address/phase selections between the GEN8 and GEN9 frames. Incoming address and tick values are checked against 1..366 and 0..731; echo loops are avoided because auto-forwarded selections are not re-emitted.
- The original GEN0–GEN7 modules, the GEN8 count invariants and all earlier source versions remain available in prior commits. This is an additive integration with one intentional GEN8 color-rendering upgrade.

### GEN9 accretion disk projection (2026-10-27)

Inspired by the nearly edge-on wheel visible in the author's screenshot of the original **370-color Canvas 3D wheel**, the current **366-color HON viewer** now has a default **inclined accretion-disk presentation** as well as its previous fully visible face-on view.

- **Disk mode:** Each of the 366 authentic OASIS HON v9.4 color addresses becomes an individually colored projected annulus segment. The data palette, brightness tiers and five symbolic display operants remain unchanged.
- **Inclination:** 0° is face-on; 86° is nearly edge-on and produces a thin horizontal band like the original screenshot. Initial inclination is 68°. Drag horizontally to rotate the disk, vertically to adjust inclination, or use the slider.
- **Center:** An opaque dark silhouette and brighter inner rim display the scalar-zero reference \`D=0\` as a black-hole/accretion-disk **visual metaphor**.
- **Optional halo:** Decorative lensing-style arcs evoke a gravitationally distorted far side. These curves are **not computed photon geodesics**, measured gravitational lensing, event horizon radii, or a calibrated Schwarzschild/Kerr spacetime.
- **Preservation:** Flat original pinwheel remains selectable; GEN8 phase/index bridge remains active, all 366 HON colors still match OASIS v9.4; all 118 recognized chemistry records remain separate from the symbolic carrier registry. The original \`oasis/apps/i-color-370/index.html\` is unchanged.
- **Export:** GEN9 JSON now includes display mode, inclination and illustrative halo state, as well as exact source HON colors.

This is a **projection / visualization** built from known circular geometry and the frozen HON color registry, not an astrophysical ray tracer. The light emitted by a real astrophysical accretion disk is determined by temperature, composition, velocities, opacity and spacetime, **not** by the ROOT0 H/O/N mnemonic palette.

### Model versus observation

The pinwheel's **color calculations are deterministic and reproduce the documented OASIS palette math**, but the choice of H/O/N colors, three sectors and 366 cells is symbolic geometry. The five operants are *not physical effects of gravity, expansion, compression, containment or explosion*. The displayed wheel and 732-phase scanner are simulated animations, not measured optical frequencies, Casimir forces or newly identified elements.

**Authorship/provenance:** David Lee Wise / ROOT0, \`.dlw\`. OASIS source links retained explicitly rather than presenting the port as independent research.


## GEN10 · 732 independently pinnable signed vectors (2026-10-27)

GEN10 provides a **new, separate scalar-zero vector layer** over the existing GEN8/GEN9 366-color, 732-phase register. It **does not modify** OASIS's original 370-color source wheel, the frozen OASIS HON v9.4 366-color source mapping, or the physics calibrated in earlier photonic generations.

### One canonical vector address per GEN8 phase

\`\`\`text
VECTOR ID    0 .. 731
ADDRESS      floor(id / 2) + 1            # 1..366
PHASE        id even = −, id odd = +
PHASE PAIR   id XOR 1                    # same HON address
D            (0,0)                       # external scalar-zero ground
\`\`\`

**Every one of the 732 vectors** carries an independent model state:

\`\`\`json
{ "pinned": false, "sign": 1, "exponent": 0, "infinite": false }
\`\`\`

- **Pin to D=0:** \`pinned=true\` anchors the vector origin at the shared scalar-zero coordinate. \`exponent=0\` renders its tip exactly at D. The state can also be unpinned independently; \`PIN ALL\` and \`UNPIN ALL\` are explicit bulk operations.
- **Independent signed scale:** \`sign=−1\` reverses the visual direction of the selected vector; \`sign=+1\` uses its forward direction. The sign is independent of the vector's original \`−/+\` **phase address**.
- **Finite range:** \`exponent\` takes quarter-step values in \`[0,36]\`. Model scalar magnitude is \`abs(scale) = 10^exponent − 1\`, with exact \`scale=0\` at exponent zero. This is a **dimensionless model value**, not meters, meters per second, energy or a physical force.
- **Negative or positive infinity:** \`infinite=true\` records a **symbolic** \`−∞\` or \`+∞\` endpoint; the renderer maps it to the maximum visible disk radius. It never uses infinite screen coordinates, asserts an infinite physical distance, or numerically integrates a singularity.
- **Finite rendering projection:** Signed direction is an angle relative to the source phase; screen length is \`outerRadius × clamp(exponent/36,0,1)\`, with a maximum clipped radius for symbolic infinity. Negative scale points to the opposite direction of the chosen vector. Disk tilt compresses the Y axis, with no claim of calculated Kerr or Schwarzschild geodesics.
- **Parity geometry:** Each vector inherits the existing address-parity rule: even address → □ box endpoint, odd address → ◉ toroid endpoint. The two phases of one address share geometry; this is a symbolic model convention, not measured atomic shape.
- **Color provenance:** Color is \`OASIS HON v9.4(address, strength S)\`, so each \`−/+\` pair shares one of exactly 366 original source hues. The program neither creates 732 distinct chemical colors nor asserts atomic elements past the IUPAC 118.
- **Independence:** Pin, scale, sign and infinity changes to one phase vector do not mutate its paired vector. Each state is stored separately in a browser-local 732-entry array.
- **Append-only UI log:** Individual edits append timestamped event records. Bulk pin/unpin operations append one explicitly labeled \`BULK_...\` event instead of 732 false independent observations. Browser \`localStorage\` can be deleted or edited by the user: this is not a cryptographic ledger or externally witnessed experiment.
- **Export:** JSON includes all 732 vector identities, all current pin/scale/sign/infinity states, 366 palette addresses and the local event history.

### Interface / integration

- \`scalar-zero/vector-732-core.js\` — pure browser-side vector address/scale model, mapping and invariants.
- \`scalar-zero/vector-field-732.html\` — standalone interactive toroidal vector field, all 732 angle-address marks, pin/scale/±∞ controls, and an H/O/N source palette overlay.
- \`scalar-zero/vector-field-732.js\` — interactive UI, independent persistence, zero-origin projection, export and range-checked cross-frame synchronization.
- \`scalar-zero/index.html\` — embeds GEN10 after GEN9; a new message bridge relays GEN10 vector IDs to GEN8's 732-phase control and GEN9's 366-color selection. GEN8/GEN9 manual selection moves the GEN10 inspector. Relayed events do not emit return messages, so they don't enter a message loop.
- GEN8 and GEN9 standalone navigation now links to the GEN10 vector editor.

### Verification boundaries

Arithmetic test: \`732 = 366×2\`, all IDs 0..731 map bijectively to address-plus-phase pairs, \`phasePair = id XOR 1\`, and a zero exponent projects a pinned tip exactly to D. GUI tests include pinning zero, scaling, choosing \`−∞\`, selecting a paired phase, bulk pinning all 732, unpinning all, and verifying independent stored states. All are **software invariants**, not measurements of gravitational or chemical phenomena.

**Known physics:** Ordinary optical frequency/energy calculations and known element identities remain limited to earlier, independently marked sections. **ROOT0 model conventions:** 732 vectors, scalar zero pinning, model toroidal angles, display Casimir slots and formal infinities.

**Authorship:** David Lee Wise / ROOT0 · \`.dlw\`. Source lineage: [OASIS HON v9.4](https://github.com/DavidWise01/oasis/blob/main/n184/elemental-hon-color-operants-v94/hon_core.mjs).


## GEN11 · Signed power-of-ten metric for all 732 pinned vectors (2026-10-28)

GEN11 corrects the **metric domain** used by GEN10, without changing its vector identities, HON source colors, scalar-zero reference, GitHub Pages URL or GEN0–GEN9 modules. The earlier mapping \`10^exponent − 1\`, with exponent limited to \`[0,36]\`, is **superseded by this explicit-zero signed-power metric**.

### New authoritative scalar metric

\`\`\`text
vector ID:       0...731, unchanged
HON address:     floor(vector_id / 2) + 1        -> 1...366
phase:           vector_id even -> −; odd -> +
origin:          D=(0,0), shared scalar zero

metric state     {pinned, sign, zero, exponent, infinite}
sign             −1 / +1                  (independent of −/+ phase)
zero             true -> exact numeric 0
finite           zero=false, infinite=false -> sign × 10^exponent
exponent         −36 ... +36              (0.25 steps in slider)
infinite         true -> symbolic signed ∞ (NOT a finite number)

three distinct examples:
zero=true         -> EXACT 0
zero=false,e=−36  -> 10^−36       (smallest NONZERO finite magnitude)
zero=false,e=0    -> 1           (unit scale, NOT zero)
zero=false,e=36   -> 10^36       (largest finite magnitude)
infinite=true     -> ±∞          (symbolic outer boundary only)
\`\`\`

The finite scalar domain is \`[−10^36,−10^−36] ∪ {0} ∪ [10^−36,10^36]\`, with **discrete quarter-exponent steps** in the UI. The positive and negative ranges never cross zero by sliding; the **SET EXACT ZERO** control selects zero explicitly. The **USE FINITE 10^e** control exits zero/infinity into the selected finite exponent, while **SET SIGNED ∞** preserves the independent sign.

The display uses a finite *logarithmic level-of-detail projection*, not \`10^e\` pixels:

\`\`\`text
normalized display radius:
  0,                      zero=true
  0.08 + 0.86*(e+36)/72,  finite, e in [−36,+36]
  1,                      infinite=true

r_pixels = viewport_outer_radius × normalized_display_radius
\`\`\`

Thus **zero draws precisely at D**, \`10^−36\` is visible at nonzero radius 0.08, \`10^0\` at 0.51 and \`10^36\` at 0.94. Symbolic infinity alone reaches display ratio 1. The sign flips direction without changing magnitude. Parity remains address odd = ◉ toroid / even = □ box; source color remains the exact OASIS HON v9.4 color per address and is shared by each phase pair.

### Local storage migration and rollback

GEN10 v1 local storage is preserved unmodified under \`root0.gen10.vector-field.v1\`. GEN11 stores its new schema \`root0-vector732-metric-v2\` under \`root0.gen11.vector-field.metric.v2\`. The viewer loads v2 if present. Otherwise, if v1 exists, it migrates **all 732 states** and copies the saved event history, appending a labeled \`MIGRATION_V1_TO_METRIC_V2\` record.

- The legacy \`10^e − 1\` magnitude zero maps to \`zero=true\`.
- Legacy positive finite magnitudes are mapped to \`e_new = log10(10^e_old−1)\` and snapped to the nearest 0.25 exponent step, **so migration may approximate previous finite magnitudes**. The old unmodified data remains available for exact rollback or audit.
- Legacy symbolic infinity keeps its sign and remains symbolic.
- New state changes and JSON exports use v2, with the name \`ROOT0_GEN11_732_SIGNED_POWER10_METRIC.json\`.

### Updated files

- \`scalar-zero/vector-732-core.js\` — canonical v2 scale equation, exact zero bit, finite signed values, display-radius mapping and non-destructive v1 migration helper.
- \`scalar-zero/vector-field-732.js\` — controls, migration, independent vector persistence, event ledger and v2 export.
- \`scalar-zero/vector-field-732.html\` — the visible GEN11 signed metric (−36 to +36 exponent slider, exact-zero button, finite-mode button and numeric state readout).
- \`scalar-zero/index.html\` — GEN11 banner and embedded field, preserving the GEN10 standalone route.

**Boundary:** These are dimensionless simulation coordinates. The exponent \`10^−36\` is not a measured Planck-scale probe, and \`10^36\` and \`±∞\` are not claims of literal infinite physical distances or forces.

**Attribution:** David Lee Wise / ROOT0 · \`.dlw\`. All previous code versions remain in Git commit history.
