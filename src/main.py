"""
General RAG System - Main Application Entry Point

This module initializes and runs the FastAPI application for the General RAG system.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import settings
from src.api.routes import chat, documents, sessions, health
from src.utils.logging import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for application startup and shutdown events.

    This handles:
    - Database connection pooling
    - Vector database connections
    - Cache connections
    - Service initialization
    """
    # Startup
    logger.info("Starting General RAG application...")

    # Initialize database connections
    # TODO: Initialize PostgreSQL, Qdrant, Redis connections

    # Initialize services
    # TODO: Initialize RAG, Chat, Question, Tool, Exception services

    logger.info("General RAG application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down General RAG application...")

    # Close database connections
    # TODO: Close all database connections

    logger.info("General RAG application shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        FastAPI: Configured application instance
    """
    app = FastAPI(
        title="General RAG System",
        description="A comprehensive Retrieval-Augmented Generation system with intelligent intent recognition",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.api.docs_enabled else None,
        redoc_url="/redoc" if settings.api.redoc_enabled else None,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
    app.include_router(documents.router, prefix="/api/v1", tags=["documents"])
    app.include_router(sessions.router, prefix="/api/v1", tags=["sessions"])
    app.include_router(health.router, prefix="/api/v1", tags=["health"])

    return app


# Create application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.api.host,
        port=settings.api.port,
        reload=settings.api.reload,
        log_level=settings.api.log_level.lower(),
    )
