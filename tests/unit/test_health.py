"""
Unit tests for health check endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app


client = TestClient(app)


def test_health_check():
    """Test basic health check endpoint."""
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()

    assert "status" in data
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "service" in data
    assert data["service"] == "general-rag"


def test_detailed_health_check():
    """Test detailed health check endpoint."""
    response = client.get("/api/v1/health/detailed")

    assert response.status_code == 200
    data = response.json()

    assert "status" in data
    assert "dependencies" in data
    assert "postgresql" in data["dependencies"]
    assert "qdrant" in data["dependencies"]
    assert "redis" in data["dependencies"]


def test_readiness_check():
    """Test readiness check endpoint."""
    response = client.get("/api/v1/health/readiness")

    # Should return 200 if all dependencies are healthy (mock)
    assert response.status_code == 200
    data = response.json()

    assert "status" in data
    assert data["status"] == "ready"


def test_liveness_check():
    """Test liveness check endpoint."""
    response = client.get("/api/v1/health/liveness")

    assert response.status_code == 200
    data = response.json()

    assert "status" in data
    assert data["status"] == "alive"


def test_metrics_endpoint():
    """Test metrics endpoint."""
    response = client.get("/api/v1/health/metrics")

    assert response.status_code == 200
    data = response.json()

    assert "timestamp" in data
    assert "metrics" in data


def test_system_info():
    """Test system information endpoint."""
    response = client.get("/api/v1/health/info")

    assert response.status_code == 200
    data = response.json()

    assert "timestamp" in data
    assert "system" in data
    assert "api" in data
    assert "models" in data
