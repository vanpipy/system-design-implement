"""
Unit tests for chat endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app


client = TestClient(app)


def test_chat_endpoint():
    """Test main chat endpoint."""
    request_data = {
        "session_id": "test-session-123",
        "message": "Hello, how are you?",
        "context": {"user_id": "test-user"},
    }

    response = client.post("/api/v1/chat", json=request_data)

    assert response.status_code == 200
    data = response.json()

    assert "response_id" in data
    assert "answer" in data
    assert "sources" in data
    assert "intent" in data
    assert "confidence" in data
    assert data["intent"] in ["knowledge", "chat", "clarify", "tool", "exception"]
    assert 0 <= data["confidence"] <= 1


def test_chat_endpoint_empty_message():
    """Test chat endpoint with empty message."""
    request_data = {"session_id": "test-session-123", "message": "", "context": {}}

    response = client.post("/api/v1/chat", json=request_data)

    # Should return 422 (validation error) for empty message
    assert response.status_code == 422


def test_chat_endpoint_missing_session():
    """Test chat endpoint with missing session ID."""
    request_data = {"message": "Hello", "context": {}}

    response = client.post("/api/v1/chat", json=request_data)

    # Should return 422 (validation error) for missing session_id
    assert response.status_code == 422


def test_chat_endpoint_long_message():
    """Test chat endpoint with very long message."""
    long_message = "A" * 6000  # Exceeds max length of 5000

    request_data = {
        "session_id": "test-session-123",
        "message": long_message,
        "context": {},
    }

    response = client.post("/api/v1/chat", json=request_data)

    # Should return 422 (validation error) for message too long
    assert response.status_code == 422


def test_chat_endpoint_with_context():
    """Test chat endpoint with context."""
    request_data = {
        "session_id": "test-session-123",
        "message": "What is the company policy?",
        "context": {
            "user_id": "user-123",
            "department": "HR",
            "previous_intent": "knowledge",
        },
    }

    response = client.post("/api/v1/chat", json=request_data)

    assert response.status_code == 200
    data = response.json()

    assert "answer" in data
    assert isinstance(data["answer"], str)
    assert len(data["answer"]) > 0
