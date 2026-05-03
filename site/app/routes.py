"""
Clearmix Route Handlers

Main routes for the peptide reconstitution calculator. Each variant
(`default`, `glp1`, ...) is served from its own URL but shares the same
`index.html` template; the variant config is injected as `variant`.
"""
from flask import Blueprint, render_template

from .variants import VARIANTS, VariantConfig

bp = Blueprint('main', __name__)


def _render_variant(variant: VariantConfig):
    """Render index.html with both the dataclass (for `variant.*` attribute
    access) and a JSON-serializable dict (for the JS data island).

    A separate `variant_json` is needed because Jinja's dot operator on a
    dict resolves `variant.copy` to `dict.copy` (a method), not the key.
    """
    return render_template(
        'index.html',
        variant=variant,
        variant_json=variant.to_dict(),
    )


@bp.route('/')
def index():
    """Render the main (research-peptide) calculator at /."""
    return _render_variant(VARIANTS['default'])


@bp.route('/glp1/')
def glp1():
    """Render the GLP-1 calculator at /glp1/."""
    return _render_variant(VARIANTS['glp1'])


@bp.route('/health')
def health():
    """Health check endpoint for monitoring."""
    return {'status': 'ok', 'app': 'clearmix'}
