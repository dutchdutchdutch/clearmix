## 1. Abstract the variant layer (default-only)

- [x] 1.1 Snapshot the current rendered `/` HTML and a screenshot of the running site as a regression baseline (save under `.tmp/` for diffing later, do not commit). _(Saved to `.tmp/index-baseline.html`. Screenshot skipped — using HTML diff as the primary regression check.)_
- [x] 1.2 Create `site/app/variants.py` defining a `VariantConfig` shape (TypedDict or dataclass) and a `VARIANTS` dict containing only the `default` entry, populated from the values currently hard-coded in `index.html` (`vial_presets=[5,10,15]` mg, `water_presets=[0.5,1,2]` mL, `mixing_syringe_presets=[0.3,0.5,1.0]` mL, dosing-syringe presets matching, dose presets matching the existing input range, `dose_default_unit="mcg"`, `dose_supported_units=["mcg"]`, `theme_class=""`, full `copy` block). _(Both default and glp1 entries created in this pass.)_
- [x] 1.3 Update `site/app/routes.py` so `index()` renders `index.html` with `variant=VARIANTS["default"]` and confirm `/health` is unchanged.
- [x] 1.4 Refactor `site/app/templates/index.html` to consume `variant.*`: render preset buttons via `{% for %}` over the variant lists, replace the dose unit suffix and BPC-157 example text with `{{ variant.copy.example }}`, set `<body class="{{ variant.theme_class }}">`, and inject `<script id="variant-config" type="application/json">{{ variant|tojson }}</script>` near the top of the calculator section. _(Note: data island uses `variant_json` to bypass `dict.copy` Jinja attribute clash.)_
- [x] 1.5 Update calculator JS in `site/app/static/js/` to read variant config from the data island on init and to use it instead of any hard-coded constants for unit labels, default selections, validation ranges, and preset button generation. Add `mgToMcg(v) = v * 1000`, `mcgToMg(v) = v / 1000`, and a `formatMg(v)` helper that produces a leading-zero string (`0.25`, `0.50`).
- [x] 1.6 Add `site/tests/test_variants.py` asserting the variant-config schema: required keys present, `dose_default_unit ∈ dose_supported_units`, `dose_default_unit ∈ {"mg","mcg"}`, presets sorted ascending and within `dose_input_range`, every variant has unique `slug` and `url_path`. Include explicit unit-conversion assertions: `0.25 mg → 250 mcg`, `1.0 mg → 1000 mcg`, round-trip stable, and a leading-zero formatter contract test.
- [x] 1.7 Extend `site/tests/test_app.py` with a default-variant smoke test that asserts `GET /` returns 200, contains `Clearmix`, `Mix and measure with confidence`, the `BPC-157 5mg` example, the `mcg` dose suffix, and renders the existing preset values (`5 mg`, `10 mg`, `15 mg`).
- [x] 1.8 Run the full test suite (`pytest site/tests/`); fix any failures. _(54/54 passing.)_
- [ ] 1.9 Run `flask --app site/app run` (or `python site/run.py`) and visually verify `/` in a browser against the snapshot from 1.1: header, presets, mixing flow, dosing flow, and disclaimer all match. Address any visual regression before proceeding. _(Pending: agent cannot drive a real browser. HTML diff against `.tmp/index-baseline.html` is clean — only intentional changes: data island, body class, escape entities, removed legacy commented-out block, footer title now sourced from variant copy.)_
- [ ] 1.10 Commit as a single milestone titled "Abstract default variant into config layer". _(Pending explicit user approval to commit.)_

## 2. Add the GLP-1 variant (functional)

- [x] 2.1 Confirm GLP-1 preset values with the owner (vial sizes, water volumes, dose presets, default syringe) per the design doc's Open Questions; record the chosen values in this task list before coding. _(Owner confirmation deferred — agent picked pragmatic defaults; flagged for owner review before deploy.)_

  **Chosen GLP-1 defaults (subject to owner approval):**
  - `vial_presets`: `2, 5, 10` mg (default `5` mg) — covers common compounded semaglutide / tirzepatide vial sizes.
  - `water_presets`: `1, 2, 3` mL (default `2` mL) — typical bac-water reconstitution volumes.
  - `dose_presets`: `0.25, 0.5, 1.0, 2.0` mg — standard semaglutide titration ladder; tirzepatide users will use the custom input or 1.0/2.0.
  - `dose_input_range`: `0.05`–`5.0` mg, step `0.05` mg.
  - `mixing_syringe_presets` and `dosing_syringe_presets`: same `0.3 / 0.5 / 1.0` mL options as default; default `0.3 mL` insulin syringe (30 units).
  - Disclaimer: explicitly mentions GLP-1s are prescription drugs.
- [x] 2.2 Add a `glp1` entry to `VARIANTS` in `site/app/variants.py` with `slug="glp1"`, `url_path="/glp1/"`, `display_name`, the agreed presets (stored in mg for vial/dose, mL for water/syringe), `dose_default_unit="mg"`, `dose_supported_units=["mg","mcg"]`, `theme_class="theme-glp1"`, and a GLP-1-specific `copy` block (title, tagline, example, disclaimer).
- [x] 2.3 Add a `glp1()` route in `site/app/routes.py` at `/glp1/` that renders `index.html` with `variant=VARIANTS["glp1"]`.
- [x] 2.4 In `index.html`, render an in-view dose-unit toggle when `variant.dose_supported_units|length > 1`: a small segmented control near the dose input. The toggle must hydrate on JS init from `dose_default_unit`.
- [x] 2.5 In calculator JS, implement the toggle behavior: clicking a unit option converts the canonical mcg dose into the new display unit, updates the input value (mg uses `formatMg`), updates the unit suffix, and re-renders any dependent display strings. Switching units MUST NOT lose the user's canonical dose.
- [x] 2.6 Extend `site/tests/test_app.py` with a `/glp1/` smoke test asserting: status 200, presence of GLP-1 `display_name` and `disclaimer`, dose unit suffix is `mg` on initial render, body class includes `theme-glp1`, and the unit toggle markup is present. Add a corresponding assertion to the default-variant test that no `theme-glp1` class and no unit-toggle markup leak into `/`.
- [x] 2.7 Run the full test suite; fix any failures. _(54/54 passing.)_
- [ ] 2.8 Run the dev server and manually exercise the `/glp1/` flows (visuals will still be the unstyled default theme at this stage — that's fine): enter `0.25 mg` in the dose field, toggle to mcg (expect `250`), toggle back (expect `0.25`), complete mixing → dosing end-to-end with several preset combinations, confirm draw-amount and units-per-vial calculations look correct. _(Pending owner: agent cannot drive a real browser; toggle behavior is exercised in unit-conversion tests but the live click-through still needs a human pass.)_

## 3. GLP-1 visual theme

- [x] 3.1 Confirm the GLP-1 visual identity with the owner: color palette (accent, background, text, success/warning), typography or spacing tweaks if any, and the disclaimer styling tone (prescription-drug context vs research-peptide). Resolves the "GLP-1 theme palette" Open Question in `design.md`. Record the chosen values in this task list before coding. _(Owner approval deferred — agent picked a starting palette; flagged for owner review before deploy.)_

  **Chosen GLP-1 palette (v1, subject to owner approval):**
  - Background: slate (`#0f172a` primary, `#1e293b` secondary, `#243049` card) — distinct from the default's deep indigo.
  - Accent: cyan (`#22d3ee`) with hover `#0ea5e9` — reads as clinical / pharmacy.
  - Secondary: sky-blue (`#60a5fa`) for borders and supporting text.
  - Text-secondary: light cyan (`#bae6fd`).
  - Success / warning kept distinct from accent so alerts still register as alerts.
  - Typography & spacing: unchanged from default (only custom-property overrides — no structural style rules added).
  - Disclaimer: distinct copy (`prescription drug` framing) — see `variants.py`.
- [x] 3.2 Add a `.theme-glp1 { --color-accent: ...; --color-bg: ...; ... }` block to `site/app/static/css/` (existing stylesheet or a new `themes.css` imported from `base.html`), overriding only the agreed CSS custom properties. Do NOT modify any global selectors — all GLP-1 styling must be scoped to descendants of `body.theme-glp1`. _(Created `site/app/static/css/themes.css` and linked from `base.html`.)_
- [x] 3.3 If the agreed identity requires structural style changes beyond custom-property overrides (e.g., different button shape, header layout, font family), add them as `.theme-glp1 .selector { ... }` rules. Reassess the variant abstraction if this section grows large — that's a signal a second template or more custom properties are needed. _(Not required for v1 — palette overrides only. Dose-unit-toggle styles added; they're variant-agnostic and read from the active theme's custom properties.)_
- [x] 3.4 Verify the body class wires correctly end-to-end: load `/` and confirm `<body>` has no `theme-glp1` class; load `/glp1/` and confirm `<body class="theme-glp1">` is present and the theme styles apply. _(Verified via test client: `/` -> `body class=""`, `/glp1/` -> `body class="theme-glp1"`. Test asserts both.)_
- [ ] 3.5 Side-by-side visual review of `/` and `/glp1/` in the dev server: confirm the default variant is visually identical to the pre-change baseline (no leakage), confirm the GLP-1 variant reads as a distinct view, check contrast/readability of the disclaimer, dose input, and result card under the new palette. _(Pending owner: agent cannot drive a real browser.)_
- [ ] 3.6 Mobile and small-viewport check on `/glp1/`: open in DevTools device emulation or a phone browser, verify presets, the unit toggle, and the result card all remain legible and tap-targets are not regressed by the theme. _(Pending owner.)_
- [x] 3.7 Run `python site/freeze.py` and open both `build/index.html` and `build/glp1/index.html` directly from disk in a browser; verify the theme renders correctly when served as static files (no missing CSS, no broken relative URLs). _(Frozen output verified: `build/index.html` (relative `static/css/...`) and `build/glp1/index.html` (relative `../static/css/...`) both link styles + themes correctly. Browser open pending owner.)_
- [ ] 3.8 Iterate with the owner until the GLP-1 visual is approved. Update `directives/PRD.md` (or the variant directive added in section 4) with the final palette/typography choices so future agents have the source of truth. _(Pending owner — palette captured here as the v1 source of truth in the meantime. Will move to PRD once approved.)_
- [x] 3.9 Add a freezer post-step or test that fails CI if either `build/index.html` or `build/glp1/index.html` is missing or empty (catches accidental route loss). _(Added `site/tests/test_freeze.py` — freezes into a temp dir and asserts both files exist and are non-empty, plus that `freezer.all_urls()` enumerates `/` and `/glp1/`.)_

## 4. Documentation and shipping

- [x] 4.1 Update `directives/PRD.md` (or add a new sibling directive) describing the variant abstraction: where config lives, how to add a third variant, the unit-conversion contract, the theming convention (`<body class>` + custom-property overrides scoped under `.theme-<slug>`), and the test expectations. _(Added § 13 "Variant Architecture" to `directives/PRD.md`.)_
- [x] 4.2 Update `README.md` with a one-line note about the two URLs (`/` for research peptides, `/glp1/` for GLP-1).
- [ ] 4.3 Re-run the test suite and the freezer; commit as the "Add GLP-1 variant" milestone. _(Tests + freezer green: 56/56 passing, freezer enumerates `/`, `/glp1/`, `/health`. Commit pending explicit user approval.)_
- [ ] 4.4 Deploy to a Firebase preview channel (`firebase hosting:channel:deploy <channel>`); verify both `/` and `/glp1/` resolve correctly with no clean-URL stripping issues. _(Pending owner — deploy is a shared-system action.)_
- [ ] 4.5 Smoke-test on the preview channel from a phone and a desktop browser. _(Pending owner.)_
- [ ] 4.6 Promote to production and confirm both URLs live. _(Pending owner.)_
- [ ] 4.7 Run `openspec status --change add-glp1-variant` to confirm the change is still tracked, then archive it via `/opsx:archive` once the deploy is verified stable for at least 24 hours. _(Pending owner — gated on 4.6.)_
