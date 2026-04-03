"""
Pytest configuration and fixtures for the General RAG system tests.
"""

import asyncio
import pytest
from typing import Generator

from src.config.settings import settings


def pytest_configure(config):
    """Configure pytest."""
    # Set test environment
    settings.environment = "testing"
    settings.debug = True


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_settings():
    """Provide test settings."""
    return settings
