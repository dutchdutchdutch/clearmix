# tests/test_validation.py
"""
Additional unit tests for Clearmix input validation.
These tests cover format/character validation, range enforcement, decimal handling,
dose‑threshold alerts, and vial amount validation.
"""
import pytest

# ----------------------------------------------------------------------
# Helper functions – re‑implementation of the JS validation logic in Python
# ----------------------------------------------------------------------

CONSTRAINTS = {
    "water": {"min": 1, "max": 10},
    "dose": {"cautionThreshold": 500, "warningThreshold": 1000},
    "vial": {"min": 0.1, "max": 30, "commonMin": 5, "commonMax": 10},
}


def _is_number(value):
    """Return True if value can be interpreted as a float and is not NaN/inf."""
    try:
        f = float(value)
        return not (f != f or f == float('inf') or f == float('-inf'))
    except Exception:
        return False


def validate_water_volume(value):
    """Mimic the JS `validateWaterVolume`.
    Returns a dict with keys: valid, correctedValue, alertType, message.
    """
    if value is None or not _is_number(value):
        return {"valid": False, "correctedValue": None, "alertType": None, "message": None}
    v = float(value)
    min_v = CONSTRAINTS["water"]["min"]
    max_v = CONSTRAINTS["water"]["max"]
    if v < min_v:
        return {
            "valid": False,
            "correctedValue": min_v,
            "alertType": "error",
            "message": f"Water volume must be at least {min_v} mL.",
        }
    if v > max_v:
        return {
            "valid": True,
            "correctedValue": max_v,
            "alertType": "info",
            "message": f"{max_v} mL is the maximum Clearmix supports.",
        }
    return {"valid": True, "correctedValue": v, "alertType": None, "message": None}


def validate_dose(value):
    """Mimic the JS `validateDose`.
    Returns dict with keys: valid, alertType, message.
    """
    if value is None or not _is_number(value) or float(value) <= 0:
        return {"valid": True, "alertType": None, "message": None}
    v = float(value)
    ct = CONSTRAINTS["dose"]["cautionThreshold"]
    wt = CONSTRAINTS["dose"]["warningThreshold"]
    if v > wt:
        return {
            "valid": True,
            "alertType": "warning",
            "message": f"{v} mcg is a high dosage for those new to self‑administering peptides.",
        }
    if v > ct:
        return {
            "valid": True,
            "alertType": "info",
            "message": f"Most common peptide doses are up to {ct} mcg.",
        }
    return {"valid": True, "alertType": None, "message": None}


def validate_vial_amount(value):
    """Mimic the JS `validateVialAmount`."""
    if value is None or not _is_number(value):
        return {"valid": False, "correctedValue": None, "alertType": None, "message": None}
    v = float(value)
    min_v = CONSTRAINTS["vial"]["min"]
    max_v = CONSTRAINTS["vial"]["max"]
    common_min = CONSTRAINTS["vial"]["commonMin"]
    common_max = CONSTRAINTS["vial"]["commonMax"]
    
    if v <= 0:
        return {
            "valid": False, 
            "correctedValue": None, 
            "alertType": "error", 
            "message": "Vial amount must be a positive number."
        }
    if v > max_v:
        return {
            "valid": False, 
            "correctedValue": max_v, 
            "alertType": "error", 
            "message": f"Exceeded max vial amount ({max_v} mg)."
        }
    if v > common_max:
        return {
            "valid": True, 
            "correctedValue": v, 
            "alertType": "info", 
            "message": f"Vial amount {v} mg is above the typical {common_min}-{common_max} mg range."
        }
    return {"valid": True, "correctedValue": v, "alertType": None, "message": None}

# ----------------------------------------------------------------------
# Tests – format / character validation
# ----------------------------------------------------------------------

@pytest.mark.parametrize(
    "bad_input",
    ["e", "5mg", "‑5", " ", "", "NaN", None],
)
def test_water_invalid_strings(bad_input):
    result = validate_water_volume(bad_input)
    assert result["valid"] is False
    assert result["correctedValue"] is None
    assert result["alertType"] is None

# ----------------------------------------------------------------------
# Negative / zero handling
# ----------------------------------------------------------------------

@pytest.mark.parametrize("val,expected", [(-5, 1), (0, 1)])
def test_water_negative_clamps(val, expected):
    res = validate_water_volume(val)
    assert res["valid"] is False
    assert res["correctedValue"] == expected
    assert res["alertType"] == "error"

# ----------------------------------------------------------------------
# Upper‑bound enforcement
# ----------------------------------------------------------------------

def test_water_above_max():
    res = validate_water_volume(15)
    assert res["valid"] is True
    assert res["correctedValue"] == 10
    assert res["alertType"] == "info"

# ----------------------------------------------------------------------
# Decimal precision
# ----------------------------------------------------------------------

def test_water_decimal():
    res = validate_water_volume(2.5)
    assert res["valid"] is True
    assert res["correctedValue"] == 2.5
    assert res["alertType"] is None

# ----------------------------------------------------------------------
# Large‑number safety (treated as above‑max)
# ----------------------------------------------------------------------

def test_water_huge_number():
    res = validate_water_volume(1_000_000)
    assert res["valid"] is True
    assert res["correctedValue"] == 10
    assert res["alertType"] == "info"

# ----------------------------------------------------------------------
# Dose‑specific thresholds
# ----------------------------------------------------------------------

@pytest.mark.parametrize(
    "dose,expected_type",
    [
        (250, None),
        (600, "info"),
        (1500, "warning"),
    ],
)
def test_dose_alerts(dose, expected_type):
    res = validate_dose(dose)
    assert res["valid"] is True
    assert res["alertType"] == expected_type

# ----------------------------------------------------------------------
# Empty / null handling for dose
# ----------------------------------------------------------------------

def test_dose_null_and_zero():
    for val in (None, "", "e", 0):
        res = validate_dose(val)
        assert res["valid"] is True
        assert res["alertType"] is None

# ----------------------------------------------------------------------
# Vial Amount Validation Tests
# ----------------------------------------------------------------------

def test_vial_common_range():
    # 5-10 mg is common range
    for val in [5, 7.5, 10]:
        res = validate_vial_amount(val)
        assert res["valid"] is True
        assert res["correctedValue"] == val
        assert res["alertType"] is None

def test_vial_small_amount():
    # 0.1-5 mg is valid with no alert
    res = validate_vial_amount(2)
    assert res["valid"] is True
    assert res["alertType"] is None

def test_vial_zero_or_negative():
    for val in [0, -5]:
        res = validate_vial_amount(val)
        assert res["valid"] is False
        assert res["alertType"] == "error"

def test_vial_above_common_range():
    # >10 mg up to 30 mg -> info alert
    res = validate_vial_amount(15)
    assert res["valid"] is True
    assert res["correctedValue"] == 15
    assert res["alertType"] == "info"

def test_vial_above_absolute_max():
    # >30 mg -> error alert and clamp to 30
    res = validate_vial_amount(50)
    assert res["valid"] is False
    assert res["correctedValue"] == 30
    assert res["alertType"] == "error"


# ----------------------------------------------------------------------
# Dose Precision Calculation Tests (x.1 unit / 3-decimal mL)
# ----------------------------------------------------------------------

def calculate_dose_precision(dose_mcg, concentration_mcg_per_ml):
    """
    Mimic the JS calculateDosing logic for precision.
    Returns: dose_ml (3 decimal), dose_units (0.1 precision).
    """
    dose_ml = dose_mcg / concentration_mcg_per_ml
    # 3-decimal mL precision
    dose_ml_practical = round(dose_ml * 1000) / 1000
    # 0.1 unit precision (1 mL = 100 units)
    dose_units = round(dose_ml * 1000) / 10
    return dose_ml_practical, dose_units


def format_dose_ml(dose_ml_practical):
    """Format mL: show 0.025 or 0.05 (not 0.050)."""
    # Use integer comparison to avoid floating-point precision issues
    # Multiply by 1000, check if divisible by 10 (i.e., ends in 0)
    as_int = round(dose_ml_practical * 1000)
    if as_int % 10 == 0:
        return f"{dose_ml_practical:.2f}"
    return f"{dose_ml_practical:.3f}"


def format_dose_units(dose_units):
    """Format units: show 2.5 or 5 (not 5.0)."""
    if dose_units == int(dose_units):
        return str(int(dose_units))
    return f"{dose_units:.1f}"


class TestDosePrecision:
    """Tests for x.1 unit precision and 3-decimal mL precision."""

    def test_250mcg_at_10000_concentration(self):
        """250 mcg at 10000 mcg/mL = 0.025 mL = 2.5 units (NOT 3)."""
        ml, units = calculate_dose_precision(250, 10000)
        assert ml == 0.025, f"Expected 0.025, got {ml}"
        assert units == 2.5, f"Expected 2.5, got {units}"
        assert format_dose_ml(ml) == "0.025"
        assert format_dose_units(units) == "2.5"

    def test_250mcg_at_5000_concentration(self):
        """250 mcg at 5000 mcg/mL = 0.05 mL = 5 units (NOT 5.0)."""
        ml, units = calculate_dose_precision(250, 5000)
        assert ml == 0.05, f"Expected 0.05, got {ml}"
        assert units == 5, f"Expected 5, got {units}"
        assert format_dose_ml(ml) == "0.05"
        assert format_dose_units(units) == "5"

    def test_500mcg_at_5000_concentration(self):
        """500 mcg at 5000 mcg/mL = 0.1 mL = 10 units."""
        ml, units = calculate_dose_precision(500, 5000)
        assert ml == 0.1, f"Expected 0.1, got {ml}"
        assert units == 10, f"Expected 10, got {units}"
        assert format_dose_ml(ml) == "0.10"
        assert format_dose_units(units) == "10"

    def test_375mcg_at_10000_concentration(self):
        """375 mcg at 10000 mcg/mL = 0.0375 -> rounds to 0.038 mL = 3.8 units."""
        ml, units = calculate_dose_precision(375, 10000)
        assert ml == 0.038, f"Expected 0.038, got {ml}"
        assert units == 3.8, f"Expected 3.8, got {units}"
        assert format_dose_ml(ml) == "0.038"
        assert format_dose_units(units) == "3.8"

    def test_100mcg_at_10000_concentration(self):
        """100 mcg at 10000 mcg/mL = 0.01 mL = 1 unit."""
        ml, units = calculate_dose_precision(100, 10000)
        assert ml == 0.01, f"Expected 0.01, got {ml}"
        assert units == 1, f"Expected 1, got {units}"
        assert format_dose_ml(ml) == "0.01"
        assert format_dose_units(units) == "1"
