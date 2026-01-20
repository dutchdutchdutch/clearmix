# Clearmix PRD (Draft v0.2) — Peptide Reconstitution Calculator (Consumer Web)

> **Owner:** Product Lead (Retail Health)
> **Status:** Draft
> **Links:** *(insert doc links: roadmap, designs, research, analytics, risk review)*

---

## 1. Summary

**Clearmix** is a consumer-facing web application that provides calm, step-by-step guidance for reconstituting injectable peptides and drawing the correct volume into a syringe based on a prescribed/desired dose.

Consumers often receive vials labeled in **mg** (milligrams) while doses are prescribed in **mcg** (micrograms) and syringes are marked in **mL** or **units**. The math is simple, but the *stress* is real. Clearmix reduces confusion by translating inputs into clear actions and verification steps.

> **Unit convention:** Vial contents are typically labeled in mg (e.g., 5 mg, 10 mg). Doses are typically prescribed in mcg (e.g., 250 mcg, 500 mcg). 1 mg = 1000 mcg.

**Positioning sentence (retail health style):**
Clearmix turns confusing mcg-to-mL conversions into clear, verified steps—so people can mix and measure with confidence.

### Primary Use Cases

**Scenario A — “Dose-first”**

* User knows: amount of peptide in vial (mg) + target dose (mg)
* App calculates:

  * suggested diluent volume to add (mL), based on a chosen concentration target or user preference
  * how many **mL** (and optional “units”) to draw per dose

**Scenario B — “Doses-per-vial”**

* User knows: amount of peptide in vial (mg) + desired number of doses
* App calculates:

  * diluent volume to add (mL) to make dose measurement straightforward
  * how many **mL** (and optional “units”) to draw per dose

### MVP Goal

Deliver a functional web app that:

* explains the full process at a high level
* guides users step-by-step with confirmation checkpoints
* produces clear, unambiguous measurement outputs (mL + syringe markings)

> **Safety note (product stance):** Clearmix provides math + measurement guidance only. It does not provide medical advice, does not recommend specific peptides, and does not replace instructions from a clinician/pharmacist. Users must confirm dosing and diluent type/volume with their prescribing information.

---

## 2. Mission

**Mission Statement:** Make mixing and measuring feel simple, guided, and confident — from start to finish.

### Product Principles

1. **Simplicity First** — Minimal features, maximum clarity. No clutter.
2. **Continuous Guidance** — Users always know “what’s next” and “why.”
3. **Confidence Through Verification** — Built-in checks that prevent common mistakes.
4. **Respect the Moment** — Design for stress: short steps, plain language, readable numbers.

---

## 3. Target Users

### Primary Persona: Adult reconstituting at home

* **Who:** patient/consumer, or a helper (partner, family member, caregiver)
* **Context:** low prior experience with mg/mL conversions, reconstitution, or self-injection
* **Goals**

  * Reconstitute a vial correctly (add diluent, mix appropriately)
  * Draw the correct amount into the syringe for the intended dose
  * Adjust confidently if they add a different diluent volume than planned

* **Pain Points**

  * Fear of making an irreversible mistake (“did I ruin it?” / “am I overdosing?”)
  * Unit confusion (mg vs mL vs units)
  * Unfamiliar supplies (vial sizes, syringe sizes, markings)
  * Low trust in “random internet calculators” without verification steps

### Secondary Personas (Future)

* Clinicians/pharmacists who want a simple “shareable” guidance link
* Repeat users who want fast re-entry for the same vial/dose

---
## 4. Problem Statement

Consumers are asked to perform multi-step measurement tasks under stress with unfamiliar units and tools. Even when instructions exist, they are often:

* generic, inconsistent, or hard to interpret
* not aligned with the user’s exact vial strength or syringe type
* missing verification steps that build confidence

### Problem Hypotheses
* H1: Users struggle to convert mg-to-mL/units correctly for their exact setup.
* H2: Under stress, users need guided steps + verification to feel confident and avoid mistakes.

## 5. Solution Statement

**Opportunity:** Provide guided, mistake-resistant calculation and measurement support in a retail-health style experience (clear, calm, validated).

### Solution  Hypotheses
* SH1: A guided, checklist-based experience increases completion and confidence vs a plain calculator.

* SH2: Outputs expressed in how people actually measure (mL + syringe markings + practical rounding) reduce errors and confusion.

* SH3: Guardrails + verification checkpoints prevent common mistakes without adding too much friction.



---

## 6. Product Scope

### In Scope

#### A) Guided Experience

* Step-by-step flow with progress indicator:

  1. Confirm what you have (vial mg, diluent, syringe type)
  2. Choose your goal (Dose-first vs Doses-per-vial)
  3. Enter values
  4. Review concentration + results
  5. Confirm & generate step card instructions
  6. Optional: “I added a different amount” recalculation

#### B) Core Calculator

* Inputs:

  * peptide amount in vial (mg): presets (5, 10, 15) + custom
  * diluent volume to add (mL): suggested + custom override
  * target dose per injection (mg) OR number of doses
  * syringe size selection: 0.3 mL, 0.5 mL, 1.0 mL (+ “other” with manual scale)
  * optional: “units per mL” mapping for common insulin syringes (clearly labeled)
* Outputs (always show both):

  * concentration: mg/mL
  * per-dose draw: mL
  * per-dose draw in syringe markings (units if applicable)
  * number of doses available (derived), and “leftover” if any

#### C) Compatibility / “What fits” Guardrails

* Vial capacity presets: 2, 5, 10, 20, 30, 40 mL + custom
* If user-entered diluent volume exceeds vial capacity:

  * show warning + recommended alternatives (split volume, different vial, confirm supplies)

#### D) Verification & Error Prevention

* Confirmations at key points:

  * “You entered mg, not mL” reinforcement
  * “This is your concentration” plain-language explanation
  * Range checks (e.g., extremely concentrated/dilute values) → “double-check” prompt
* Rounding rules:

  * Always show an “exact” value + a “practical draw” value based on syringe granularity
  * Make rounding explicit: “rounded to nearest tick mark”

#### E) Retail-Health Trust Features (MVP-lite)

* Disclaimers and “confirm with label/prescriber” prompts
* Simple glossary tooltips: mg, mL, concentration, syringe units
* Accessibility basics: large type, high contrast, mobile-first

---

## 6. Out of Scope (MVP)

* Medical recommendations (dose selection, frequency, or peptide choice)
* Brand-specific peptide catalogs or shopping flows
* Automated detection via camera/OCR (vial label scanning)
* Injection technique training (needle angle, site selection)
* Cold-chain/storage guidance beyond “follow label instructions”
* Account systems, reminders, subscriptions (can be later)

---

## 7. Key User Journey (MVP)

### Entry → Results in under 60 seconds

1. **Landing:** “Mix with confidence” + safety disclaimer
      1.1 **Process Steps:** Overview of steps
      Same page or next:
      1.2 **Setup:**: vial mg, syringe type, [vial size]
      1.3 **Choose goal:** Dose-first vs Doses-per-vial
      1.4 **Inputs:** vial mg, desired dose or number of doses, diluent volume (suggested)
      1.5 **Review screen or section:** concentration + per-dose draw + sanity check prompts
3. **Step cards:** short checklist with confirmations
4. **Adjustments:** “I used a different diluent amount” → instant recalculation

---

## 8. Functional Requirements

### Calculations (must be transparent)

* Concentration: `mg_per_mL = vial_mg / diluent_mL`
* Dose draw volume: `dose_mL = dose_mg / mg_per_mL`
* If using “units” (optional display):

  * `dose_units = dose_mL * units_per_mL` (e.g., 100 units per 1 mL)
* Derived doses per vial: `num_doses = vial_mg / dose_mg`
* Guardrails:

  * If `dose_mL` exceeds syringe capacity → warn and suggest larger syringe or different concentration
  * If `diluent_mL` exceeds vial capacity → warn and suggest alternatives

### UX Requirements

* Numbers are the product:

  * large, high-contrast results
  * consistent formatting (e.g., 0.12 mL, not .12)
  * copy-friendly (tap to copy)
* “Explain it to me” toggles:

  * default simple view, expandable math explanation

### Device / Platform

* Mobile web first, responsive desktop
* Offline-ish behavior: results persist in-session (local storage) without account

---

## 9. Non-Functional Requirements

* **Performance:** interactive calculations <100ms
* **Reliability:** deterministic calculation outputs; unit tests for edge cases
* **Accessibility:** WCAG-aligned typography and contrast; screen-reader labels for inputs/results
* **Privacy:** no PHI required; avoid storing personally identifying dosing regimens
* **Compliance posture:** clear disclaimers, audit trail of calculation logic, and content review sign-off


**Technical**
Tech stack: https://github.com/dutchdutchdutch/ACME/blob/main/directives/tech_stack.md
- ✅ Local development setup

### Out of initial Scope

**Deferred Features for later stages**
- ❌ Asking questions
- ❌ FAQ
- ❌ External references
- ❌ Save common setups (no account: “save as preset” locally)
- ❌ QR/shareable link that encodes parameters (privacy-safe)
- ❌ Barcode/OCR label assist (guardrailed)
- ❌ Pharmacist-reviewed templates (“most common mixes”) without recommending doses
- ❌ Multilingual support (Spanish first)

---

## 9. Security & Configuration

### Security Scope

**In Scope:**
- ✅ Input validation on all API endpoints (Pydantic)
- ✅ SQL injection prevention (SQLAlchemy ORM)
## - ✅ CORS configuration for local development

**Out of Scope:**
- ❌ Authentication/authorization (single local user)
- ❌ HTTPS (local development only)
- ❌ Rate limiting
- ❌ CSRF protection

---


## 10. Implementation Phases

### Phase 1: UI Prototype

**Goal:** Confirm the user experience direction

**Deliverables:**
- ✅ Project structure and Python virtual environment
- ✅ 2 or 3 key screens with the major Steps
- ✅ Happy path screen flow
- ✅ user flow instrumentation
- ✅ Screen layout and Style guide

## EPIC 1 — Experiment + Analytics Foundation

**Goal:** Enable A/B assignment + core event tracking (privacy-safe, no PHI).

**Stories**

* **US1.1 Variant assignment** — Persist `flow_variant` + `results_variant` for session.

  * AC: assign on first load; persist in session; attach to all events.
* **US1.2 Core events** — Emit required funnel + action events.

  * AC: events fire once per action; include timestamp + variant props; QA in staging.
* **US1.3 Dashboard** — Provide funnel + KPIs by variant.

  * AC: funnel view live; KPIs: completion, time-to-results, rework, guardrail adoption, recalc completion.
* **US1.4 Privacy config** — Ensure analytics is PHI-safe.

  * AC: no free text; no raw inputs unless approved; follow retention/access standards.

**Telemetry (min)**
`session_start, flow_variant_assigned, goal_selected, inputs_validated, results_viewed, step_cards_viewed, flow_completed, edit_inputs_from_results, guardrail_triggered, guardrail_action_taken, recalc_completed`

**DoD:** events verified; dashboard live; privacy review complete.

## EPIC 2 — A/B: Wizard Flow vs Single-Screen

**Hypothesis:** Wizard increases completion/confidence vs single-screen.

**Variants**

* A: single-screen inputs+results
* B: wizard (goal → inputs → review → step cards)

**Stories**

* **US2.1 Wizard screens** — Implement wizard flow screens + progress.

  * AC: required fields enforced; next/back works; state persists across steps.
* **US2.2 Review step** — Show input summary + results preview + confirm CTA.

  * AC: summary shows vial mg, diluent mL, dose mg or #doses, syringe type; confirm generates step cards.
* **US2.3 Step cards** — Render short ordered step cards.

  * AC: readable on mobile; includes “verify inputs” checkpoint.

**Success**

* Completion +15–25% (B vs A)
* Confidence +0.5 (optional)
* Time-to-results not worse than +15%

**Telemetry**
Ensure `flow_variant` on: `goal_selected, results_viewed, step_cards_viewed, flow_completed, abandon_at_step, backtrack`

**DoD:** both variants stable; results reported by variant.

---

### Phase 2: Accurate calculations

**Goal:** Trustworthy results

**Deliverables:**
- ✅ Calculation logic
- ✅ Test framework

**Validation:** Return accurate results when entering setup, goals, and inputs



---

### Phase 3: Output format and presentation

**Goal:** User completes steps with confidence/reaffirmation

## EPIC 3 — Results Display Format

**Hypothesis:** mL + syringe markings + practical rounding reduces rework/confusion.

**Variants**

* A: mL exact only
* B: mL + units/ticks + exact vs practical (rounded) + rounding note

**Stories**

* **US3.1 Results layout** — Render variant A/B results view.

  * AC: mL always shown; units/ticks shown only when applicable; labels explicit.
* **US3.2 Rounding** — Implement “exact” and “practical (tick-rounded)” outputs.

  * AC: rounding uses syringe granularity; rounding note shown.
* **US3.3 Copy values** — Tap-to-copy mL/units.

  * AC: copy toast; no PHI logged.

**Success**

* Rework rate -20% (B vs A)
* Help rate -15% (B vs A)
* No increase in results abandonment

**Telemetry**
`results_variant_assigned, results_viewed, help_tooltip_opened, edit_inputs_from_results, copy_value_clicked`

**DoD:** rounding deterministic; QA on common syringes.


---

### Phase 4: Guardrails and Fix Suggestions

**Goal:** Production-ready MVP to test beyond pilot users

## EPIC 4 — A/B: Guardrails + Fixes

**Hypothesis:** Guardrails reduce invalid setups reaching step cards with minimal friction.

**Variants**

* A: required-field validation only
* B: capacity + syringe-fit + unusual concentration prompts + one-tap fixes

**Stories**

* **US4.1 Capacity checks** — Warn when `diluent_mL > vial_capacity_mL`.

  * AC: blocking or prominent warning; suggests fix options.
* **US4.2 Syringe-fit checks** — Warn when `dose_mL > syringe_capacity_mL`.

  * AC: warning + suggested fix options.
* **US4.3 Fix actions** — One-tap apply fix updates inputs + recalculates.

  * AC: fix is reversible; recalculation <100ms.
* **US4.4 Outlier prompt** — Show “double-check” for unusual concentration.

  * AC: no medical advice language; non-blocking.

**Success**

* Extreme setups reaching step cards -30–50%
* Guardrail action rate ≥40%
* Abandon-after-guardrail ≤ +5% absolute

**Telemetry**
`guardrail_triggered(type), guardrail_shown, guardrail_action_taken(action), flow_abandoned_after_guardrail`

**DoD:** guardrails deterministic; fixes apply cleanly.



---
### Phase 5: Improve

# EPIC 5 — A/B: One-Tap Recalculation

**Hypothesis:** Recalc CTA reduces restarts and increases confidence when actual diluent differs.

**Variants**

* A: manual edits only
* B: results CTA → single field `actual_diluent_mL` → refresh outputs + step cards

**Stories**

* **US5.1 Recalc CTA** — Add CTA on results.

  * AC: opens modal/screen; one numeric input; cancel returns unchanged.
* **US5.2 Recalc apply** — Apply actual diluent and refresh results/steps.

  * AC: recalculates <100ms; state persists in session; label “based on actual diluent”.
* **US5.3 Restart reduction** — Provide “restart flow” but track usage.

  * AC: restart resets state; event logged.

**Success**

* Recalc completion ≥70% once started
* Restart rate -25%
* Confidence +0.3 among recalc users (optional)

**Telemetry**
`recalc_cta_shown, recalc_cta_clicked, recalc_completed, restart_flow_clicked`

**DoD:** recalc does not reset other inputs; updated steps visible.

---

## EPIC 6 — Usability + Teach-Back Validation

**Goal:** Validate comprehension and reduce unit confusion.

**Stories**

* **US6.1 Moderated study** — Run 5–8 usability sessions with сценарios.

  * AC: capture completion, errors, confusion points; deliver top-5 fixes.
* **US6.2 Teach-back (optional)** — Add 1-question comprehension check after results.

  * AC: multiple-choice preferred; privacy-safe; can be disabled via config.

**Success**

* ≥80% complete without help
* ≥80% teach-back correct first try

**Telemetry (if teach-back shipped)**
`teachback_shown, teachback_answered, teachback_correct, teachback_recovered`

**DoD:** findings documented; backlog created from top issues.

----

## 11. Risks & Mitigations

* **Risk: Misuse as medical advice**

  * Mitigation: explicit language, no dosing recommendations, confirm prompts, “not medical advice”
* **Risk: Unit confusion persists**

  * Mitigation: show mg/mL clearly, label units everywhere, tooltips, verification steps
* **Risk: Rounding leads to incorrect draws**

  * Mitigation: show exact + practical; explain rounding; align to syringe tick marks
* **Risk: Brand trust**

  * Mitigation: professional tone, transparent math, retail-health UX patterns, content review

---

## 12. Open Questions

* Should “units” be shown by default, or only as an optional toggle?
* Do we support only insulin-style syringes for unit conversion, or allow custom “units per mL”?
* What’s the minimal set of vial/syringe presets that covers 80% of use cases without overwhelming?
* Do we include a “print/share” step card (PDF) in MVP, or Phase 2?

---
