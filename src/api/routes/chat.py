"""
Chat endpoints for the General RAG system.

This module provides the main chat API endpoints for user interactions.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# Request/Response Models
class ChatRequest(BaseModel):
    """Chat request model."""

    session_id: str = Field(
        ...,
        description="Unique session identifier for the user",
        min_length=1,
        max_length=100,
    )
    message: str = Field(
        ...,
        description="User message content",
        min_length=1,
        max_length=5000,
    )
    context: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional context/metadata for the request",
    )


class DocumentSource(BaseModel):
    """Document source information for RAG responses."""

    document_id: str = Field(..., description="Source document identifier")
    chunk_id: str = Field(..., description="Document chunk identifier")
    content: str = Field(..., description="Relevant content from the document")
    relevance_score: float = Field(
        ...,
        description="Relevance score (0.0 to 1.0)",
        ge=0.0,
        le=1.0,
    )
    page_number: Optional[int] = Field(
        None,
        description="Page number in the source document",
        ge=1,
    )


class ChatResponse(BaseModel):
    """Chat response model."""

    response_id: str = Field(
        ...,
        description="Unique response identifier",
    )
    answer: str = Field(
        ...,
        description="Generated answer",
    )
    sources: List[DocumentSource] = Field(
        default_factory=list,
        description="Source documents used for RAG responses",
    )
    intent: str = Field(
        ...,
        description="Recognized intent type",
        pattern="^(knowledge|chat|clarify|tool|exception)$",
    )
    confidence: float = Field(
        ...,
        description="Confidence score for intent recognition (0.0 to 1.0)",
        ge=0.0,
        le=1.0,
    )
    processing_time_ms: Optional[float] = Field(
        None,
        description="Processing time in milliseconds",
        ge=0.0,
    )


# API Endpoints
@router.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """
    Main chat endpoint for user interactions.

    This endpoint:
    1. Receives user message and session context
    2. Performs intent recognition
    3. Routes to appropriate service (RAG, Chat, Question, Tool, Exception)
    4. Generates and returns response

    Args:
        request: Chat request containing message and session info

    Returns:
        Chat response with answer, sources, and metadata
    """
    start_time = datetime.utcnow()

    try:
        logger.info(
            f"Processing chat request for session: {request.session_id}",
            extra={
                "session_id": request.session_id,
                "message_length": len(request.message),
            },
        )

        # TODO: Implement actual intent recognition and routing
        # For now, return a mock response
        end_time = datetime.utcnow()
        processing_time_ms = (end_time - start_time).total_seconds() * 1000

        return ChatResponse(
            response_id=str(uuid4()),
            answer="This is a mock response. The General RAG system is being initialized.",
            sources=[],
            intent="knowledge",
            confidence=0.8,
            processing_time_ms=round(processing_time_ms, 2),
        )

    except Exception as e:
        logger.error(
            f"Error processing chat request: {e}",
            extra={
                "session_id": request.session_id,
                "error": str(e),
            },
        )

        # Fallback response
        return ChatResponse(
            response_id=str(uuid4()),
            answer="I'm sorry, I encountered an error processing your request. Please try again.",
            sources=[],
            intent="exception",
            confidence=1.0,
            processing_time_ms=0.0,
        )
