## Why

ClearMix today is implicitly tuned for research peptides like TB-500 and BPC-157: mg-scale vials, mcg-scale doses, and visual styling that matches that audience. GLP-1 users (semaglutide, tirzepatide, etc.) have meaningfully different reconstitution math and dose conventions — doses are typically expressed in mg (e.g., `0.25 mg`, `0.5 mg`) rather than mcg, vial sizes are different, and users expect a distinct look so they aren't second-guessing whether they're on the right calculator. We want to serve GLP-1 users without compromising the existing experience for peptide users.

## What Changes

- Introduce a **variant** concept for the calculator. The current behavior becomes the `default` (research-peptide) variant; a new `glp1` variant is added.
- Serve each variant from a distinct URL on the same Frozen-Flask site:
  - `/` → existing default variant (unchanged behavior)
  - `/glp1/` → new GLP-1 variant
- Variant-aware **dose units**:
  - Default variant keeps `mcg` as the dose unit (existing behavior — no in-view toggle).
  - GLP-1 variant uses `mg` as the **default** input/display unit (e.g., `0.25 mg`, `0.5 mg`, `1.0 mg`) and offers `mcg` as a **secondary backup** unit toggle within the same view. `1 mg = 1000 mcg`.
  - mg values are rendered with a leading zero by convention (`0.25 mg`, not `.25 mg`).
- Variant-aware **presets**: vial size, water volume, syringe size, and dose presets are defined per variant rather than hard-coded in the template.
- Variant-aware **theme**: CSS custom-property overrides (colors, accents, possibly typography) scoped to the GLP-1 variant so the two views are visually distinguishable.
- Variant-aware **copy**: header title/tagline and any peptide-specific examples (e.g., "BPC-157 5mg" example text) are sourced from the variant config.
- Calculation logic stays shared — only inputs/outputs/presentation differ. Internally, math continues to operate in a single canonical unit (mcg or mg base) with a display-unit conversion at the edges.
- Freezer must enumerate both variant URLs so `build/` contains both views after `python site/freeze.py`.

Non-goals: no backend persistence, no per-user accounts, no medical advice content beyond the existing disclaimer, no additional GLP-1-specific safety logic beyond preset ranges. The existing `/` URL and behavior are preserved exactly — this is additive.

## Capabilities

### New Capabilities
- `peptide-variants`: Defines variant configurations (units, presets, copy, theme) and the routing/rendering layer that serves each variant from its own URL while sharing one calculator engine and template structure.

### Modified Capabilities
<!-- None — there are no existing specs in openspec/specs/ to modify. -->

## Impact

- **Code**: `site/app/routes.py` (new variant route(s)); `site/app/__init__.py` (likely unchanged); `site/app/templates/` (template parameterized by variant config, possibly split into `base.html` + a shared `calculator.html` partial); `site/app/static/css/` (new theme overrides scoped to GLP-1); `site/app/static/js/` (calculator JS reads variant config injected by the template instead of hard-coded constants); `site/freeze.py` (Freezer must discover both variant URLs — typically automatic via `url_for`, but verify).
- **New code**: a small variant-config module (e.g., `site/app/variants.py`) that exposes the per-variant config dict consumed by the route and template.
- **Tests**: `site/tests/` — extend `test_app.py` to assert both `/` and `/glp1/` return 200 and contain the expected variant-specific markers; add `test_variants.py` for the variant-config module.
- **Build/deploy**: `firebase.json` rewrites should already handle nested static paths, but verify `/glp1/` resolves correctly from the frozen `build/` directory and on Firebase Hosting.
- **Directives**: update `directives/PRD.md` (or add a sibling) to describe the variant concept so future agents understand why config lives in `variants.py` rather than the template.
- **Dependencies**: none expected — Flask + Frozen-Flask cover this.
