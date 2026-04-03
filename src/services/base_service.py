"""
Base service interface for the General RAG system.

This module defines the base service interface that all services
should implement for consistent behavior and error handling.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from src.config.settings import settings
from src.utils.logging import log_service_call

logger = logging.getLogger(__name__)


class BaseService(ABC):
    """Base service interface for all General RAG services."""

    def __init__(self, service_name: str):
        """
        Initialize the service.

        Args:
            service_name: Name of the service for logging and identification
        """
        self.service_name = service_name
        self.logger = logging.getLogger(f"{__name__}.{service_name}")

    @abstractmethod
    async def process(
        self, request: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a request.

        Args:
            request: Request data
            context: Additional context for processing

        Returns:
            Processed response
        """
        pass

    async def execute(
        self, request: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute service processing with error handling and logging.

        Args:
            request: Request data
            context: Additional context for processing

        Returns:
            Processed response or error response
        """
        import time

        start_time = time.time()

        try:
            self.logger.info(
                f"Processing {self.service_name} request",
                extra={"request_type": type(request).__name__},
            )

            # Process the request
            result = await self.process(request, context)

            # Log successful execution
            duration = time.time() - start_time
            log_service_call(
                service_name=self.service_name,
                operation="process",
                duration=duration,
                success=True,
            )

            return result

        except Exception as e:
            # Log failed execution
            duration = time.time() - start_time
            log_service_call(
                service_name=self.service_name,
                operation="process",
                duration=duration,
                success=False,
                error=str(e),
            )

            self.logger.error(
                f"Error processing {self.service_name} request: {e}",
                exc_info=True,
            )

            # Re-raise the exception for higher-level handling
            raise

    def validate_request(self, request: Dict[str, Any]) -> bool:
        """
        Validate request data.

        Args:
            request: Request data to validate

        Returns:
            True if request is valid, False otherwise
        """
        # Basic validation - can be overridden by subclasses
        if not request:
            self.logger.warning("Empty request received")
            return False

        return True

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check for the service.

        Returns:
            Health status information
        """
        return {
            "service": self.service_name,
            "status": "healthy",
            "timestamp": time.time(),
        }


class ServiceError(Exception):
    """Base exception for service errors."""

    def __init__(
        self, message: str, service_name: str, error_code: str = "SERVICE_ERROR"
    ):
        super().__init__(message)
        self.service_name = service_name
        self.error_code = error_code
        self.message = message

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for API responses."""
        return {
            "error_code": self.error_code,
            "service": self.service_name,
            "message": self.message,
        }


class ServiceUnavailableError(ServiceError):
    """Exception raised when a service is unavailable."""

    def __init__(self, service_name: str, message: str = "Service unavailable"):
        super().__init__(message, service_name, "SERVICE_UNAVAILABLE")


class InvalidRequestError(ServiceError):
    """Exception raised when a request is invalid."""

    def __init__(self, service_name: str, message: str = "Invalid request"):
        super().__init__(message, service_name, "INVALID_REQUEST")


class ProcessingError(ServiceError):
    """Exception raised when processing fails."""

    def __init__(self, service_name: str, message: str = "Processing failed"):
        super().__init__(message, service_name, "PROCESSING_ERROR")
