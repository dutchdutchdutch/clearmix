"""
Freezer post-step: ensure that running `python site/freeze.py` produces
a non-empty `build/index.html` and `build/glp1/index.html`. This catches
accidental route loss before a deploy.

The test also asserts that `freezer.all_urls()` enumerates both `/` and
`/glp1/` so a missing route generator would fail loudly.
"""
import os
import shutil
import tempfile

import pytest

from app import create_app
from flask_frozen import Freezer


@pytest.fixture
def frozen_build():
    """Freeze the app into a temp directory and yield its path."""
    app = create_app({'TESTING': True, 'DEBUG': False})
    tmp = tempfile.mkdtemp(prefix='clearmix-freeze-')
    app.config['FREEZER_DESTINATION'] = tmp
    app.config['FREEZER_RELATIVE_URLS'] = True
    freezer = Freezer(app)
    try:
        urls = list(freezer.all_urls())
        freezer.freeze()
        yield tmp, urls
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def test_both_variants_frozen(frozen_build):
    build_dir, _ = frozen_build
    default_html = os.path.join(build_dir, 'index.html')
    glp1_html = os.path.join(build_dir, 'glp1', 'index.html')

    assert os.path.exists(default_html), f"missing {default_html}"
    assert os.path.getsize(default_html) > 0, f"{default_html} is empty"

    assert os.path.exists(glp1_html), f"missing {glp1_html}"
    assert os.path.getsize(glp1_html) > 0, f"{glp1_html} is empty"


def test_freezer_enumerates_both_variant_urls(frozen_build):
    _, urls = frozen_build
    assert '/' in urls
    assert '/glp1/' in urls
