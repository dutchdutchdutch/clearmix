"""
Variant configurations for the Clearmix calculator.

Each variant defines the inputs, presets, copy, and theming for one
audience (research peptides, GLP-1, etc.). The shared `index.html`
template renders any registered variant; routes choose which variant
to inject as the `variant` template context.

Adding a third variant: add a new `VariantConfig` to `VARIANTS` below
and register a route in `routes.py`. See `directives/PRD.md`.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class VariantCopy:
    title: str
    tagline: str
    label: str          # e.g., "Peptide Calculator", "GLP-1 Calculator"
    example: str        # in-step example string (replaces hard-coded "BPC-157 5mg")
    disclaimer: str


@dataclass(frozen=True)
class VariantConfig:
    slug: str
    display_name: str
    url_path: str
    dose_default_unit: str                    # "mg" | "mcg"
    dose_supported_units: tuple[str, ...]     # e.g., ("mcg",) or ("mg", "mcg")
    vial_presets: tuple[float, ...]           # mg
    vial_default: float                        # mg
    water_presets: tuple[float, ...]          # mL
    water_default: float                       # mL
    mixing_syringe_presets: tuple[tuple[float, int], ...]  # (mL, units)
    mixing_syringe_default: tuple[float, int]
    dosing_syringe_presets: tuple[tuple[float, int], ...]
    dosing_syringe_default: tuple[float, int]
    dose_presets: tuple[float, ...]            # in dose_default_unit
    dose_input_range: tuple[float, float]      # (min, max) in dose_default_unit
    dose_step: float                           # input step in dose_default_unit
    theme_class: str                           # CSS class for <body>
    copy: VariantCopy

    def to_dict(self) -> dict[str, Any]:
        """Serialize for `tojson` injection into the template data island."""
        d = asdict(self)
        # Normalize tuples to lists for JSON.
        d["dose_supported_units"] = list(self.dose_supported_units)
        d["vial_presets"] = list(self.vial_presets)
        d["water_presets"] = list(self.water_presets)
        d["mixing_syringe_presets"] = [list(p) for p in self.mixing_syringe_presets]
        d["mixing_syringe_default"] = list(self.mixing_syringe_default)
        d["dosing_syringe_presets"] = [list(p) for p in self.dosing_syringe_presets]
        d["dosing_syringe_default"] = list(self.dosing_syringe_default)
        d["dose_presets"] = list(self.dose_presets)
        d["dose_input_range"] = list(self.dose_input_range)
        return d


# Canonical conversion helpers (1 mg = 1000 mcg). Mirrored in calculator.js.
def mg_to_mcg(v: float) -> float:
    return v * 1000


def mcg_to_mg(v: float) -> float:
    return v / 1000


def format_mg(v: float) -> str:
    """Format a mg value with a leading zero (`0.25`, `0.50`, never `.25`)."""
    return f"{v:.2f}"


_DEFAULT = VariantConfig(
    slug="default",
    display_name="Clearmix",
    url_path="/",
    dose_default_unit="mcg",
    dose_supported_units=("mcg",),
    vial_presets=(5, 10, 15),
    vial_default=5,
    water_presets=(0.5, 1, 2),
    water_default=0.5,
    mixing_syringe_presets=((0.3, 30), (0.5, 50), (1.0, 100)),
    mixing_syringe_default=(0.3, 30),
    dosing_syringe_presets=((0.3, 30), (0.5, 50), (1.0, 100)),
    dosing_syringe_default=(0.3, 30),
    dose_presets=(),  # default variant has no dose preset row
    dose_input_range=(50, 1000),
    dose_step=50,
    theme_class="",
    copy=VariantCopy(
        title="Clearmix",
        tagline="Mix and measure with confidence",
        label="Peptide Calculator",
        example='Example: A vial labeled "BPC-157 5mg" contains 5 mg.',
        disclaimer="For measurement guidance only. Always confirm with your prescriber.",
    ),
)


# GLP-1 preset values are pragmatic defaults based on common semaglutide /
# tirzepatide reconstitution practice (vial sizes 2/5/10 mg; bac water 1/2/3 mL;
# weekly dose presets 0.25/0.5/1.0/2.0 mg; insulin syringe 0.3 mL / 30 units).
# Owner can adjust the values here without touching the template or JS.
_GLP1 = VariantConfig(
    slug="glp1",
    display_name="Clearmix GLP-1",
    url_path="/glp1/",
    dose_default_unit="mg",
    dose_supported_units=("mg", "mcg"),
    vial_presets=(2, 5, 10),
    vial_default=5,
    water_presets=(1, 2, 3),
    water_default=2,
    mixing_syringe_presets=((0.3, 30), (0.5, 50), (1.0, 100)),
    mixing_syringe_default=(0.3, 30),
    dosing_syringe_presets=((0.3, 30), (0.5, 50), (1.0, 100)),
    dosing_syringe_default=(0.3, 30),
    dose_presets=(0.25, 0.5, 1.0, 2.0),
    dose_input_range=(0.05, 5.0),     # mg
    dose_step=0.05,
    theme_class="theme-glp1",
    copy=VariantCopy(
        title="Clearmix GLP-1",
        tagline="Reconstitute your GLP-1 with confidence",
        label="GLP-1 Calculator",
        example='Example: A vial labeled "Semaglutide 5mg" contains 5 mg.',
        disclaimer=(
            "For measurement guidance only. GLP-1 medications are prescription drugs — "
            "always follow your prescriber's dosing instructions."
        ),
    ),
)


VARIANTS: dict[str, VariantConfig] = {
    "default": _DEFAULT,
    "glp1": _GLP1,
}
