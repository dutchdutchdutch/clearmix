## ADDED Requirements

### Requirement: Variant registry
The system SHALL expose a registry of variant configurations keyed by a unique kebab-case `slug`. Each variant configuration MUST include: `slug`, `display_name`, `url_path`, `dose_default_unit`, `dose_supported_units`, `vial_presets`, `water_presets`, `syringe_presets`, `dose_presets`, `dose_input_range`, `copy` (with at least `title`, `tagline`, `example`, `disclaimer`), and `theme_class`. The registry MUST contain at least the `default` and `glp1` variants.

#### Scenario: Default and glp1 variants are registered
- **WHEN** the application loads the variant registry
- **THEN** the registry exposes a `default` variant whose `url_path` is `/` and a `glp1` variant whose `url_path` is `/glp1/`
- **AND** both variants pass the variant-config schema check (all required keys present and well-typed)

#### Scenario: Variant slug is unique
- **WHEN** the variant registry is loaded
- **THEN** no two variants share the same `slug` or the same `url_path`

### Requirement: Variant routing
Each registered variant SHALL be reachable at its declared `url_path` via the Flask app, and each route MUST render the shared calculator template with that variant's configuration injected as the `variant` template context variable.

#### Scenario: Default variant served at root
- **WHEN** a client requests `GET /`
- **THEN** the response status is `200`
- **AND** the rendered HTML contains the `default` variant's `display_name` and uses `mcg` as the dose unit suffix in the dosing input

#### Scenario: GLP-1 variant served at /glp1/
- **WHEN** a client requests `GET /glp1/`
- **THEN** the response status is `200`
- **AND** the rendered HTML contains the `glp1` variant's `display_name` and uses `mg` as the dose unit suffix in the dosing input on initial render

#### Scenario: Unknown variant URL returns 404
- **WHEN** a client requests `GET /not-a-variant/`
- **THEN** the response status is `404`

### Requirement: Variant-scoped presets
The vial-amount, water-volume, mixing-syringe, dosing-syringe, and dose preset buttons SHALL be rendered from the active variant's configuration. The shared template MUST NOT contain hard-coded preset values; preset buttons MUST be produced by iterating the corresponding list on `variant`.

#### Scenario: Default variant renders its declared presets
- **WHEN** `GET /` is rendered
- **THEN** the vial-preset buttons in the HTML correspond exactly to the `default` variant's `vial_presets` list (same values, same order)
- **AND** the water-preset, syringe-preset, and dose-preset buttons likewise correspond to the `default` variant's respective lists

#### Scenario: GLP-1 variant renders its declared presets
- **WHEN** `GET /glp1/` is rendered
- **THEN** the vial-preset, water-preset, syringe-preset, and dose-preset buttons in the HTML correspond exactly to the `glp1` variant's respective preset lists

### Requirement: Variant-scoped copy
Header title, tagline, the in-step example text, and the disclaimer SHALL be sourced from the active variant's `copy` configuration. The shared template MUST NOT contain hard-coded peptide-specific examples (e.g., `BPC-157 5mg`).

#### Scenario: Variant-specific example renders
- **WHEN** `GET /` is rendered
- **THEN** the rendered HTML contains the `default` variant's `copy.example` text
- **AND** does not contain any peptide-specific example string from a different variant

#### Scenario: GLP-1 variant copy renders
- **WHEN** `GET /glp1/` is rendered
- **THEN** the rendered HTML contains the `glp1` variant's `copy.title`, `copy.tagline`, `copy.example`, and `copy.disclaimer` strings

### Requirement: Variant-scoped theming
The rendered HTML SHALL apply the active variant's `theme_class` to the `<body>` element. CSS theme overrides MUST be implemented via custom-property overrides under that class so that no theme-class on `<body>` produces the default visual appearance.

#### Scenario: GLP-1 body class
- **WHEN** `GET /glp1/` is rendered
- **THEN** the `<body>` element has the class `theme-glp1`
- **AND** the page's computed accent color differs from the default variant's accent color

#### Scenario: Default variant has no GLP-1 theme leakage
- **WHEN** `GET /` is rendered
- **THEN** the `<body>` element does NOT have the class `theme-glp1`
- **AND** the page's visual presentation matches the pre-change default site

### Requirement: Dose-unit handling
The calculator SHALL use the active variant's `dose_default_unit` for initial dose input and display. For variants whose `dose_supported_units` has more than one entry, the view SHALL render an in-view unit toggle that switches the displayed unit without losing the user's current canonical dose value. Internal calculations MUST use `mcg` canonically; user-facing values are converted at the input/display boundary using `1 mg = 1000 mcg`. mg values rendered to the user MUST include a leading zero (e.g., `0.25 mg`, never `.25 mg`).

#### Scenario: GLP-1 view boots in mg
- **WHEN** `GET /glp1/` is rendered and the dose input is empty
- **THEN** the dose input's unit suffix is `mg`
- **AND** an in-view unit toggle offering `mg` and `mcg` is present
- **AND** the toggle's selected option is `mg`

#### Scenario: Toggling mcg preserves canonical dose
- **GIVEN** the GLP-1 view is loaded with the unit toggle on `mg` and the user has entered `0.25` into the dose input
- **WHEN** the user switches the toggle to `mcg`
- **THEN** the dose input value displays `250` with a unit suffix of `mcg`
- **AND** switching back to `mg` displays `0.25` again

#### Scenario: mg values render with a leading zero
- **WHEN** any mg value less than `1` is rendered to the user (input, preset, or result)
- **THEN** the value string starts with `0.` (e.g., `0.25`, `0.5`, `0.75`), never `.25` or `.5`

#### Scenario: Default variant has no unit toggle
- **WHEN** `GET /` is rendered
- **THEN** no in-view unit toggle is present
- **AND** the dose input's unit suffix is `mcg`

### Requirement: Frozen output
Running `python site/freeze.py` SHALL produce one rendered HTML file per registered variant under the `build/` directory at a path corresponding to that variant's `url_path`. Each generated file MUST open and render correctly when loaded directly from the filesystem.

#### Scenario: Both variants frozen
- **WHEN** `python site/freeze.py` completes successfully
- **THEN** `build/index.html` exists and is non-empty
- **AND** `build/glp1/index.html` exists and is non-empty
- **AND** `freezer.all_urls()` enumerates both `/` and `/glp1/`

### Requirement: Default-variant non-regression
After this change ships, the rendered `/` page SHALL be functionally and visually equivalent to the pre-change site: the same preset values appear, the same copy strings appear, the same dose unit (`mcg`) is used, and no GLP-1-specific theme class or unit toggle is rendered.

#### Scenario: Default preset values unchanged
- **WHEN** `GET /` is rendered after this change
- **THEN** the vial-preset buttons render `5 mg`, `10 mg`, and `15 mg` (matching the pre-change site)
- **AND** the water-preset buttons render `0.5 mL`, `1 mL`, and `2 mL`
- **AND** the mixing-syringe-preset buttons render `0.3 mL`, `0.5 mL`, and `1.0 mL`

#### Scenario: Default copy unchanged
- **WHEN** `GET /` is rendered after this change
- **THEN** the page contains the title `Clearmix`, the tagline `Mix and measure with confidence`, and the existing `BPC-157 5mg` example text
