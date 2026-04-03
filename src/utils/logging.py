"""
Logging configuration for the General RAG system.

This module provides structured logging with correlation IDs,
loguru integration, and consistent log formatting.
"""

import json
import sys
from contextvars import ContextVar
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4

from loguru import logger

from src.config.settings import settings

# Context variable for correlation IDs
correlation_id: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)


def setup_logging() -> None:
    """
    Configure logging for the application.

    This sets up:
    - Structured JSON logging in production
    - Human-readable logging in development
    - Correlation ID tracking
    - Log rotation and retention
    """

    # Remove default logger
    logger.remove()

    # Configure log format based on environment
    if settings.environment == "production":
        # JSON format for production (structured logging)
        log_format = (
            "{"
            '"timestamp": "{time:YYYY-MM-DD HH:mm:ss.SSS}", '
            '"level": "{level}", '
            '"correlation_id": "{extra[correlation_id]}", '
            '"module": "{name}", '
            '"function": "{function}", '
            '"line": "{line}", '
            '"message": "{message}"'
            "}"
        )
    else:
        # Human-readable format for development
        log_format = (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<magenta>{extra[correlation_id]}</magenta> | "
            "<level>{message}</level>"
        )

    # Add console handler
    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.log_level,
        colorize=True,
        backtrace=True,
        diagnose=True,
    )

    # Add file handler for production
    if settings.environment == "production":
        logger.add(
            "logs/general_rag.log",
            format=log_format,
            level=settings.log_level,
            rotation="1 day",
            retention="30 days",
            compression="zip",
            backtrace=True,
            diagnose=True,
        )

    # Configure correlation ID
    logger.configure(extra={"correlation_id": None})


def get_correlation_id() -> Optional[str]:
    """
    Get the current correlation ID.

    Returns:
        Current correlation ID or None if not set
    """
    return correlation_id.get()


def set_correlation_id(cid: Optional[str] = None) -> str:
    """
    Set the correlation ID for the current context.

    Args:
        cid: Correlation ID to set. If None, generates a new UUID.

    Returns:
        The correlation ID that was set
    """
    if cid is None:
        cid = str(uuid4())

    correlation_id.set(cid)
    logger.configure(extra={"correlation_id": cid})
    return cid


def clear_correlation_id() -> None:
    """Clear the correlation ID for the current context."""
    correlation_id.set(None)
    logger.configure(extra={"correlation_id": None})


class CorrelationIDMiddleware:
    """
    FastAPI middleware for correlation ID handling.

    This middleware:
    - Extracts correlation ID from request headers
    - Sets correlation ID in context
    - Adds correlation ID to response headers
    """

    def __init__(self, header_name: str = "X-Correlation-ID"):
        self.header_name = header_name

    async def __call__(self, request, call_next):
        # Get correlation ID from request headers or generate new one
        cid = request.headers.get(self.header_name)
        cid = set_correlation_id(cid)

        # Process request
        response = await call_next(request)

        # Add correlation ID to response headers
        response.headers[self.header_name] = cid

        # Clear correlation ID from context
        clear_correlation_id()

        return response


def log_request(
    method: str,
    path: str,
    status_code: int,
    duration: float,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log HTTP request details.

    Args:
        method: HTTP method (GET, POST, etc.)
        path: Request path
        status_code: HTTP status code
        duration: Request duration in seconds
        client_ip: Client IP address
        user_agent: User agent string
        extra: Additional log fields
    """
    log_data = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration * 1000, 2),
        "client_ip": client_ip,
        "user_agent": user_agent,
    }

    if extra:
        log_data.update(extra)

    logger.info("HTTP request", **log_data)


def log_error(
    error: Exception,
    context: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log error with context and correlation ID.

    Args:
        error: Exception to log
        context: Context where error occurred
        extra: Additional log fields
    """
    log_data = {
        "error_type": error.__class__.__name__,
        "error_message": str(error),
        "context": context,
    }

    if extra:
        log_data.update(extra)

    logger.error("Error occurred", **log_data)


def log_service_call(
    service_name: str,
    operation: str,
    duration: float,
    success: bool,
    error: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log service call details.

    Args:
        service_name: Name of the service
        operation: Operation performed
        duration: Call duration in seconds
        success: Whether the call was successful
        error: Error message if call failed
        extra: Additional log fields
    """
    log_data = {
        "service": service_name,
        "operation": operation,
        "duration_ms": round(duration * 1000, 2),
        "success": success,
        "error": error,
    }

    if extra:
        log_data.update(extra)

    level = "info" if success else "error"
    getattr(logger, level)(f"Service call: {service_name}.{operation}", **log_data)


# Initialize logging when module is imported
setup_logging()
