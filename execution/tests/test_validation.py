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
