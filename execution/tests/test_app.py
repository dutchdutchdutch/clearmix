"""
Clearmix Application Tests
"""
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
