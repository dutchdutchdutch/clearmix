"""
Clearmix Application Tests
"""
import re

import pytest
from app import create_app


@pytest.fixture
def client():
    """Create test client."""
    app = create_app({'TESTING': True})
    with app.test_client() as client:
        yield client


def test_index_loads(client):
    """Test that the main page loads successfully."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Clearmix' in response.data


def test_health_check(client):
    """Test health endpoint returns OK."""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'


# ------------------------------------------------------------------
# Default variant smoke
# ------------------------------------------------------------------

def test_default_variant_renders_expected_markers(client):
    """Default variant at / preserves the pre-change copy and presets."""
    response = client.get('/')
    assert response.status_code == 200
    body = response.data.decode('utf-8')

    # Copy
    assert 'Clearmix' in body
    assert 'Mix and measure with confidence' in body
    assert 'BPC-157 5mg' in body

    # Default-variant unit suffix is mcg.
    assert 'id="dose-unit-suffix">mcg<' in body

    # Vial presets render `5 mg`, `10 mg`, `15 mg` (no whitespace assumptions
    # beyond a single space).
    for label in ('5 mg', '10 mg', '15 mg'):
        assert label in body, f"missing default vial preset {label!r} in /"

    # No GLP-1 theme leakage on the default variant.
    body_tag_match = re.search(r'<body[^>]*class="([^"]*)"', body)
    assert body_tag_match is not None, "no <body class=...> on /"
    assert 'theme-glp1' not in body_tag_match.group(1)

    # No unit toggle should leak onto the single-unit default variant.
    assert 'id="dose-unit-toggle"' not in body

    # Default variant has no dose presets, so no suggestions row should render.
    assert 'id="dose-suggestions"' not in body

    # Vial-concentration card on the default variant remains in mcg/mL.
    assert 'mcg/mL' in body


def test_unknown_variant_url_404s(client):
    """An unregistered variant URL returns 404."""
    response = client.get('/not-a-variant/')
    assert response.status_code == 404


# ------------------------------------------------------------------
# GLP-1 variant smoke
# ------------------------------------------------------------------

def test_glp1_variant_loads(client):
    response = client.get('/glp1/')
    assert response.status_code == 200
    body = response.data.decode('utf-8')

    # Display name + GLP-1-specific disclaimer.
    assert 'Clearmix GLP-1' in body
    assert 'GLP-1 medications are prescription drugs' in body

    # Boots in mg and exposes the unit toggle.
    assert 'id="dose-unit-suffix">mg<' in body
    assert 'id="dose-unit-toggle"' in body

    # Body must carry the theme class.
    body_tag_match = re.search(r'<body[^>]*class="([^"]*)"', body)
    assert body_tag_match is not None
    assert 'theme-glp1' in body_tag_match.group(1)

    # Dose suggestions render as the subtle quick-fill row, not a preset-button group.
    assert 'id="dose-suggestions"' in body
    assert 'id="dose-presets"' not in body
    assert 'Common doses:' in body
    # No "Other" button in the dose row — the input field is the entry path.
    suggestions_block = re.search(
        r'<div class="dose-suggestions"[^>]*>.*?</div>', body, re.DOTALL
    )
    assert suggestions_block is not None
    assert 'data-value="custom"' not in suggestions_block.group(0)

    # Vial-concentration card on /glp1/ shows mg/mL, not mcg/mL.
    conc_card = re.search(
        r'<span class="highlight"><span id="dose-concentration">[^<]*</span>([^<]*)</span>',
        body,
    )
    assert conc_card is not None, "could not find dose-concentration markup"
    assert 'mg/mL' in conc_card.group(1)
    assert 'mcg' not in conc_card.group(1)
