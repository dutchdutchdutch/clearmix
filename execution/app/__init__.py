"""
Clearmix Flask Application Factory

Peptide reconstitution calculator - helping users mix and measure with confidence.
"""
from flask import Flask


def create_app(config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Default configuration
    app.config.update(
        SECRET_KEY='dev-key-change-in-production',
        DEBUG=True,
    )
    
    # Override with custom config if provided
    if config:
        app.config.update(config)
    
    # Inject build time into templates
    from datetime import datetime, timezone
    
    @app.context_processor
    def inject_build_info():
        # Use UTC to match GitHub Actions environment
        now = datetime.now(timezone.utc)
        ts = now.strftime("%b %d, %Y - %H:%M UTC")
        return {'build_timestamp': ts}
    
    # Register routes
    from . import routes
    app.register_blueprint(routes.bp)
    
    return app
