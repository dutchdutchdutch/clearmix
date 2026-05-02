"""
Clearmix Route Handlers

Main routes for the peptide reconstitution calculator.
"""
from flask import Blueprint, render_template

bp = Blueprint('main', __name__)


@bp.route('/')
def index():
    """Render the main calculator page."""
    return render_template('index.html')


@bp.route('/health')
def health():
    """Health check endpoint for monitoring."""
    return {'status': 'ok', 'app': 'clearmix'}



