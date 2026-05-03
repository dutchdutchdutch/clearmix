"""
Tests for the variant registry and unit-conversion helpers.
"""
import pytest

from app.variants import (
    VARIANTS,
    VariantConfig,
    format_mg,
    mcg_to_mg,
    mg_to_mcg,
)


SUPPORTED_DOSE_UNITS = {"mg", "mcg"}


# ------------------------------------------------------------------
# Registry shape
# ------------------------------------------------------------------

def test_default_and_glp1_registered():
    assert "default" in VARIANTS
    assert "glp1" in VARIANTS
    assert VARIANTS["default"].url_path == "/"
    assert VARIANTS["glp1"].url_path == "/glp1/"


def test_unique_slugs_and_url_paths():
    slugs = [v.slug for v in VARIANTS.values()]
    paths = [v.url_path for v in VARIANTS.values()]
    assert len(slugs) == len(set(slugs)), "variant slugs must be unique"
    assert len(paths) == len(set(paths)), "variant url_paths must be unique"


@pytest.mark.parametrize("slug,variant", list(VARIANTS.items()))
def test_variant_schema(slug: str, variant: VariantConfig):
    # Required scalar/string fields.
    assert variant.slug == slug
    assert variant.display_name
    assert variant.url_path.startswith("/") and variant.url_path.endswith("/")

    # Dose unit invariants.
    assert variant.dose_default_unit in SUPPORTED_DOSE_UNITS
    assert variant.dose_default_unit in variant.dose_supported_units
    for unit in variant.dose_supported_units:
        assert unit in SUPPORTED_DOSE_UNITS

    # Preset lists must be sorted ascending.
    for name in ("vial_presets", "water_presets", "dose_presets"):
        values = getattr(variant, name)
        assert list(values) == sorted(values), f"{name} on '{slug}' must be sorted ascending"

    # Dose presets must lie within dose_input_range.
    lo, hi = variant.dose_input_range
    assert lo < hi
    for d in variant.dose_presets:
        assert lo <= d <= hi, f"{d} on '{slug}' outside dose_input_range {variant.dose_input_range}"

    # Defaults must appear in their preset lists.
    assert variant.vial_default in variant.vial_presets
    assert variant.water_default in variant.water_presets
    assert variant.mixing_syringe_default in variant.mixing_syringe_presets
    assert variant.dosing_syringe_default in variant.dosing_syringe_presets

    # Theme class is a string (may be empty for the default variant).
    assert isinstance(variant.theme_class, str)

    # Copy block must have the four required strings.
    for key in ("title", "tagline", "label", "example", "disclaimer"):
        assert getattr(variant.copy, key), f"copy.{key} must be present on '{slug}'"


def test_to_dict_round_trips_to_json():
    """Variant config must be JSON-serializable for the data island."""
    import json
    for slug, variant in VARIANTS.items():
        payload = json.dumps(variant.to_dict())
        restored = json.loads(payload)
        assert restored["slug"] == slug
        assert isinstance(restored["vial_presets"], list)
        assert isinstance(restored["dose_supported_units"], list)


# ------------------------------------------------------------------
# Unit-conversion contract
# ------------------------------------------------------------------

@pytest.mark.parametrize("mg,expected_mcg", [
    (0.25, 250),
    (0.5, 500),
    (1.0, 1000),
    (2.5, 2500),
])
def test_mg_to_mcg(mg, expected_mcg):
    assert mg_to_mcg(mg) == expected_mcg


@pytest.mark.parametrize("mcg,expected_mg", [
    (250, 0.25),
    (500, 0.5),
    (1000, 1.0),
])
def test_mcg_to_mg(mcg, expected_mg):
    assert mcg_to_mg(mcg) == expected_mg


@pytest.mark.parametrize("mg", [0.05, 0.25, 0.5, 1.0, 2.0, 5.0])
def test_mg_mcg_round_trip(mg):
    assert mcg_to_mg(mg_to_mcg(mg)) == pytest.approx(mg)


# ------------------------------------------------------------------
# Leading-zero formatter
# ------------------------------------------------------------------

@pytest.mark.parametrize("value,expected", [
    (0.25, "0.25"),
    (0.5, "0.50"),
    (0.05, "0.05"),
    (1, "1.00"),
    (2.5, "2.50"),
])
def test_format_mg_leading_zero(value, expected):
    out = format_mg(value)
    assert out == expected
    # Belt-and-suspenders: never starts with a bare decimal point.
    assert not out.startswith("."), f"format_mg({value}) -> {out!r} must have a leading zero"
