## Context

ClearMix is a Frozen-Flask static site (`site/app/` → `build/`) that today ships a single `index.html` with hard-coded presets and copy tuned for research peptides (TB-500/BPC-157 class): mg vials, mcg doses, neutral/clinical styling. The calculator is rendered server-side from one Jinja template; client-side JS in `site/app/static/js/` handles interaction and live calculation.

We need to add a second consumer audience — GLP-1 users — who expect mg-scale doses (`0.25 mg`, `0.5 mg`), different vial/water/syringe presets, and a visually distinct theme. Both audiences will be served from the same site under different URLs (`/` for the existing default, `/glp1/` for the new variant).

Constraints:
- Must remain a static site freezable by `python site/freeze.py` and deployable to Firebase Hosting via `firebase.json`.
- Existing `/` URL must remain byte-compatible enough to not break current users (no behavior regression on the default variant).
- Calculation logic must not be duplicated — bug fixes to the math should land in one place.
- Stack stays Flask + Jinja + vanilla JS + CSS custom properties; no new build tooling.

Stakeholders: end users (peptide users today, GLP-1 users next); the project owner (single maintainer, prefers pragmatic small-scope changes per CLAUDE.md).

## Goals / Non-Goals

**Goals:**
- A clean variant abstraction so adding a third audience later (e.g., growth-hormone peptides) is a config edit, not a fork.
- Per-variant: URL, dose unit handling (default + supported), preset button values, copy strings (title, tagline, examples), and theme (CSS custom-property overrides).
- Single source of truth for calculation math, shared between variants.
- Bookmarkable variant URLs that survive the freezer (`/` and `/glp1/index.html` both present in `build/`).
- Tests cover both variants returning 200 and rendering their distinguishing markers.

**Non-Goals:**
- No runtime variant *switching* UI between variants (e.g., a "go to GLP-1 view" dropdown). Users land on the variant URL directly.
- No persistence, accounts, or analytics in this change.
- No new dependencies (no Tailwind, no SCSS, no React) — stay with vanilla CSS custom properties and a JSON `<script>` data island.
- No content/safety logic specific to GLP-1 beyond preset ranges and the existing disclaimer.
- No restructuring of the existing default variant's UI — only parameterize the values it already uses.

## Decisions

### 1. Variant config lives in a single Python module, not the template
**Decision:** Add `site/app/variants.py` exporting `VARIANTS: dict[str, VariantConfig]` mapping variant slug → config. Each entry contains: `slug`, `display_name`, `url_path`, `dose_default_unit` (`"mg"` or `"mcg"`), `dose_supported_units` (list), `vial_presets`, `water_presets`, `syringe_presets`, `dose_presets`, `dose_input_range`, `copy` (title/tagline/example/disclaimer), and `theme_class` (CSS class applied to `<body>`).

**Why:** Centralizes the GLP-1-vs-default delta in one diffable file. Keeps the template generic. Lets tests assert variant config independent of rendering. Aligns with the "deterministic execution" layer per CLAUDE.md — config is data, not branching template logic.

**Alternatives considered:**
- *YAML/JSON config under `site/data/`*: Slightly nicer for non-developers to edit, but requires loader + schema validation, and we have no non-dev editors today. Reject — over-engineered.
- *Inline `{% if variant == 'glp1' %}` branches in the template*: Fastest to write, worst to maintain. Reject — duplicates the problem we're trying to fix.

### 2. Routing: one Flask route per variant, both freezer-discoverable
**Decision:** Replace the current single `@bp.route('/')` with two zero-argument routes that render the same template with a different variant key:

```python
@bp.route('/')
def index():
    return render_template('index.html', variant=VARIANTS['default'])

@bp.route('/glp1/')
def glp1():
    return render_template('index.html', variant=VARIANTS['glp1'])
```

Frozen-Flask discovers both via `freezer.all_urls()` automatically (zero-argument routes need no generator).

**Why:** Trivial, explicit, freezer-friendly. No URL converter complexity needed for two known variants. Easy to grep.

**Alternatives considered:**
- *Single dynamic `/<variant>/` route + `@freezer.register_generator`*: More elegant for N variants but complicates the default-at-`/` case. Reject for now — revisit at the third variant.
- *Subdomain per variant*: Overkill for a static site; Firebase Hosting config complexity not justified.

### 3. Template stays as one `index.html`, parameterized by `variant`
**Decision:** Keep `site/app/templates/index.html` as the single calculator template. Replace hard-coded values (preset buttons, header copy, dose unit suffix, the BPC-157 example) with `{{ variant.* }}` accesses. Loop over `variant.vial_presets` etc. to render preset buttons rather than hard-coding three of them.

**Why:** Avoids template drift between variants. Structural HTML is identical; only data differs.

**Trade-off:** The template gets a bit more Jinja and a bit less plain HTML. Acceptable — it's already a Jinja template, the loops are shallow, and the alternative is two diverging templates.

### 4. JS reads variant config from an injected JSON data island
**Decision:** In `index.html`, render the variant config as JSON inside a `<script id="variant-config" type="application/json">{{ variant|tojson }}</script>` block. Calculator JS reads it via `JSON.parse(document.getElementById('variant-config').textContent)` on init and uses it instead of hard-coded constants for unit labels, default selections, and validation ranges.

**Why:** Keeps JS variant-agnostic without inventing a build step. `type="application/json"` is the standard "data island" pattern; Jinja's `tojson` filter is XSS-safe. The freezer captures it as static text.

**Alternatives considered:**
- *Separate `variants.js` per variant*: Doubles the JS surface and risks divergence. Reject.
- *Read variant from URL path in JS*: Couples JS to routing scheme and duplicates the variant lookup. Reject.

### 5. Theming via `<body class>` + CSS custom-property overrides
**Decision:** Existing CSS already uses `--color-*` custom properties. Add a `.theme-glp1 { --color-accent: ...; --color-text-primary: ...; ... }` block (in existing CSS or a new `themes.css`) that overrides whichever properties differ for GLP-1. `index.html` sets `<body class="{{ variant.theme_class }}">`.

**Why:** Zero JS to apply themes. No CSS duplication — only deltas live in the theme block. Default variant keeps current look (empty theme_class, or `theme-default` no-op).

**Trade-off:** If GLP-1 needs structural style differences (not just colors), we'd need either more custom properties or scoped style blocks. Acceptable to defer — start with colors/accents and reassess.

### 6. Dose-unit handling: canonical mcg internally; per-variant default + optional in-view toggle
**Decision:** All internal calculations stay in mcg (matches existing JS math). Variant config declares two fields:
- `dose_default_unit`: the unit the view boots with.
- `dose_supported_units`: the units the view exposes via an in-view toggle.

Per-variant settings:
- **Default variant**: `dose_default_unit="mcg"`, `dose_supported_units=["mcg"]` (no toggle rendered — single-unit fast path).
- **GLP-1 variant**: `dose_default_unit="mg"`, `dose_supported_units=["mg","mcg"]` — an in-view unit toggle is rendered, mg is selected on load, switching to mcg shows the same canonical dose in mcg without losing user input.

Conversion at the boundary:
- `mg → mcg` (input/canonicalize): `value * 1000`.
- `mcg → mg` (display): `value / 1000`.
- mg display normalization: render with a fixed two-decimal precision and a leading zero (`0.25 mg`, never `.25 mg`). Implementation: `value.toFixed(2).replace(/^\./, '0.')` (or just rely on `toFixed` which already produces `"0.25"`).

Preset values in the variant config are stored in the variant's natural human unit (mg for GLP-1 presets, mcg for default presets) for readability and converted at the boundary on read. The data island carries both the raw preset list and the unit it's expressed in so JS doesn't need to guess.

**Why:** Avoids re-deriving the math; minimizes risk of regression on the default variant. Localizes unit logic to a tiny conversion layer. Keeps the GLP-1 config file human-readable (`0.25` looks like `0.25` mg, not `250`).

**Alternative considered:** Storing all preset values in canonical mcg always. Rejected — makes the GLP-1 config file harder to sanity-check at a glance.

### 7. Testing: smoke per variant + schema on `variants.py` + explicit unit-conversion tests
**Decision:**
- Extend `site/tests/test_app.py` with a parameterized test that fetches each registered variant URL and asserts (a) HTTP 200, (b) presence of variant-specific markers (variant `display_name` in the rendered HTML, variant's default dose-unit suffix, body class for non-default variants).
- Add `site/tests/test_variants.py` asserting config schema: required keys present, `dose_default_unit ∈ dose_supported_units`, `dose_default_unit ∈ {"mg","mcg"}`, presets sorted ascending and within `dose_input_range`, every variant has a `slug` and `url_path`.
- Add explicit unit-conversion assertions (Python-side, since the conversion logic is small enough to mirror in a tiny helper or asserted at JS-boundary contract level): `0.25 mg → 250 mcg`, `1.0 mg → 1000 mcg`, round-trip stable, leading-zero formatter produces `"0.25"` for `0.25` and `"0.50"` for `0.5`. JS-side tests can be added if/when a JS test runner is introduced; for now assert the contract via DOM-rendered text in a freezer/integration test.

**Why:** Catches accidental route loss, theme-class typos, config drift, and unit-conversion bugs cheaply. Aligns with CI tests already running per recent commit `d6b1b12`.

## Risks / Trade-offs

- **Risk:** Default-variant HTML/CSS subtly changes when we replace hard-coded presets with template loops, breaking the current bookmark/cache or causing a visual regression. → **Mitigation:** snapshot the current rendered `/` HTML before the refactor; diff after; visually verify in the browser per CLAUDE.md UI guidance. Tests assert key elements still present.
- **Risk:** GLP-1 mg/mcg conversion introduces a math bug only the GLP-1 variant exhibits, and we don't notice because the default variant's tests still pass. → **Mitigation:** explicit unit-conversion tests (`0.25 mg ↔ 250 mcg`, round-trip stable, boundary cases, leading-zero formatting). Manually exercise GLP-1 dosing in the browser before shipping.
- **Risk:** Frozen-Flask doesn't pick up `/glp1/` if the route signature is unusual. → **Mitigation:** `site/freeze.py` already prints `freezer.all_urls()`; CI builds `build/` and a test asserts `build/glp1/index.html` exists.
- **Risk:** Firebase Hosting rewrites or `firebase.json` clean-URL settings strip the trailing slash and break `/glp1/`. → **Mitigation:** verify `firebase.json` after the freeze; deploy to a Firebase preview channel first; confirm both URLs resolve.
- **Risk:** Users land on the wrong variant URL and don't realize a different view exists. → **Mitigation:** out of scope to add a switcher in this change, but flag for a future small follow-up if support traffic shows confusion.
- **Trade-off:** One template serving two variants means the GLP-1 variant inherits any structural change to the default. That's a feature (consistency) until a variant truly needs a different layout — at which point we revisit (template inheritance or a second template).
- **Trade-off:** The mg/mcg toggle in GLP-1 adds UI surface area on a calculator that values simplicity. Mitigated by hiding the toggle entirely on variants with `dose_supported_units` of length 1 (default variant looks unchanged).

## Migration Plan

This is purely additive — no data migration; existing `/` keeps working. Two-step rollout:

1. **Abstract the default first.** Land the variant abstraction with **only `default` populated** and `/` rewired to use it. Verify zero visible diff on the existing site (snapshot test + manual browser check per CLAUDE.md). Ship.
2. **Add GLP-1.** Add the `glp1` variant config + `/glp1/` route + theme + in-view mg/mcg toggle. Verify both URLs in `build/`. Deploy to a Firebase preview channel. Manually exercise mixing+dosing flows on `/glp1/` toggling between mg and mcg. Promote to production. Default users see no change; GLP-1 users get a working URL to bookmark.

**Rollback:** revert the offending commit(s); `/` is unaffected by step 1 if done correctly, and `/glp1/` simply 404s until reintroduced. No data, no DB, no external service to roll back.

## Open Questions

- **GLP-1 preset values.** Vial sizes (2 mg? 5 mg? 10 mg?), water volumes, dose presets (`0.25 / 0.5 / 1.0 / 2.0` mg?), default syringe (insulin-style `0.3 mL` / 30u is likely correct for GLP-1). Owner to confirm before placeholders in `variants.py` get hard-coded.
- **GLP-1 theme palette.** Single accent change vs fuller restyle (typography, spacing). Start with accent + background, iterate.
- **Disclaimer copy for GLP-1.** Likely needs different wording (prescription-drug context vs research-peptide context). Owner to provide.
- **Default mixing-syringe selection** for GLP-1 — confirm whether the existing `0.3 mL` default is appropriate, or whether GLP-1 users typically use a different size.
- **mg display precision.** Current plan: two decimals (`0.25`, `1.00`). Should we show one decimal for whole/half values (`1.0` instead of `1.00`)? Defer to first manual review.
- **SEO/meta tags per variant** — out of scope for this change unless owner wants them now.
