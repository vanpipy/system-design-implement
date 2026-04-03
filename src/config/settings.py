"""
Configuration management for the General RAG system.

This module loads configuration from YAML files and environment variables,
providing type-safe access to all system settings.
"""

import os
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import yaml


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""

    postgresql_host: str = Field(default="localhost", description="PostgreSQL host")
    postgresql_port: int = Field(default=5432, description="PostgreSQL port")
    postgresql_database: str = Field(
        default="general_rag", description="PostgreSQL database name"
    )
    postgresql_username: str = Field(
        default="postgres", description="PostgreSQL username"
    )
    postgresql_password: str = Field(
        default="postgres123", description="PostgreSQL password"
    )
    postgresql_pool_size: int = Field(
        default=20, description="PostgreSQL connection pool size"
    )
    postgresql_echo: bool = Field(default=False, description="SQLAlchemy echo mode")

    qdrant_host: str = Field(default="localhost", description="Qdrant host")
    qdrant_port: int = Field(default=6333, description="Qdrant port")
    qdrant_collection: str = Field(
        default="documents", description="Qdrant collection name"
    )
    qdrant_vector_size: int = Field(default=384, description="Vector dimension size")
    qdrant_distance: str = Field(default="Cosine", description="Distance metric")

    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_db: int = Field(default=0, description="Redis database number")
    redis_password: Optional[str] = Field(default=None, description="Redis password")
    redis_decode_responses: bool = Field(
        default=True, description="Redis decode responses"
    )


class ModelSettings(BaseSettings):
    """AI model configuration settings."""

    embedding_name: str = Field(
        default="BAAI/bge-small-zh-v1.5", description="Embedding model name"
    )
    embedding_device: str = Field(
        default="cpu", description="Device for embedding model"
    )
    embedding_max_length: int = Field(
        default=512, description="Maximum sequence length for embeddings"
    )
    embedding_normalize_embeddings: bool = Field(
        default=True, description="Normalize embeddings"
    )

    llm_primary_provider: str = Field(
        default="deepseek", description="Primary LLM provider"
    )
    llm_primary_api_key: str = Field(default="", description="Primary LLM API key")
    llm_primary_model: str = Field(
        default="deepseek-chat", description="Primary LLM model name"
    )
    llm_primary_temperature: float = Field(
        default=0.7, description="Primary LLM temperature"
    )
    llm_primary_max_tokens: int = Field(
        default=2000, description="Primary LLM max tokens"
    )

    llm_fallback_provider: str = Field(
        default="local", description="Fallback LLM provider"
    )
    llm_fallback_model_path: str = Field(
        default="./models/qwen2.5-1.5b.gguf", description="Fallback LLM model path"
    )
    llm_fallback_context_size: int = Field(
        default=4096, description="Fallback LLM context size"
    )
    llm_fallback_temperature: float = Field(
        default=0.7, description="Fallback LLM temperature"
    )


class APISettings(BaseSettings):
    """API configuration settings."""

    host: str = Field(default="0.0.0.0", description="API host")
    port: int = Field(default=8000, description="API port")
    workers: int = Field(default=4, description="Number of worker processes")
    timeout: int = Field(default=30, description="Request timeout in seconds")
    docs_enabled: bool = Field(default=True, description="Enable Swagger/OpenAPI docs")
    redoc_enabled: bool = Field(default=True, description="Enable ReDoc docs")
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"],
        description="CORS allowed origins",
    )
    log_level: str = Field(default="info", description="Log level")
    reload: bool = Field(default=True, description="Enable auto-reload in development")


class ServiceSettings(BaseSettings):
    """Service configuration settings."""

    intent_recognition_rule_matching_enabled: bool = Field(
        default=True, description="Enable rule-based intent matching"
    )
    intent_recognition_cache_matching_enabled: bool = Field(
        default=True, description="Enable cache-based intent matching"
    )
    intent_recognition_ml_classification_enabled: bool = Field(
        default=True, description="Enable ML-based intent classification"
    )
    intent_recognition_confidence_threshold: float = Field(
        default=0.6, description="Intent recognition confidence threshold"
    )

    rag_top_k: int = Field(default=5, description="Number of top documents to retrieve")
    rag_rerank_enabled: bool = Field(
        default=True, description="Enable document re-ranking"
    )
    rag_max_context_length: int = Field(
        default=4000, description="Maximum context length for RAG"
    )
    rag_similarity_threshold: float = Field(
        default=0.7, description="Similarity threshold for document retrieval"
    )

    caching_enabled: bool = Field(default=True, description="Enable response caching")
    caching_ttl_seconds: int = Field(default=3600, description="Cache TTL in seconds")
    caching_max_size_mb: int = Field(
        default=1000, description="Maximum cache size in MB"
    )

    rate_limiting_enabled: bool = Field(
        default=True, description="Enable rate limiting"
    )
    rate_limiting_requests_per_minute: int = Field(
        default=60, description="Requests per minute limit"
    )
    rate_limiting_requests_per_hour: int = Field(
        default=1000, description="Requests per hour limit"
    )


class Settings(BaseSettings):
    """Main settings class for the General RAG system."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        case_sensitive=False,
    )

    # Environment
    environment: str = Field(
        default="development",
        description="Environment: development, staging, production",
    )
    debug: bool = Field(default=True, description="Debug mode")
    log_level: str = Field(default="INFO", description="Log level")

    # Sub-configurations
    api: APISettings = Field(default_factory=lambda: APISettings())
    database: DatabaseSettings = Field(default_factory=lambda: DatabaseSettings())
    models: ModelSettings = Field(default_factory=lambda: ModelSettings())
    services: ServiceSettings = Field(default_factory=lambda: ServiceSettings())

    @classmethod
    def from_yaml(cls, yaml_path: Optional[Path] = None) -> "Settings":
        """
        Load settings from YAML file.

        Args:
            yaml_path: Path to YAML configuration file

        Returns:
            Settings instance
        """
        if yaml_path is None:
            yaml_path = Path(__file__).parent.parent.parent / "config" / "settings.yaml"

        if not yaml_path.exists():
            return cls()

        with open(yaml_path, "r", encoding="utf-8") as f:
            yaml_config = yaml.safe_load(f)

        # Extract general_rag section if present
        if "general_rag" in yaml_config:
            yaml_config = yaml_config["general_rag"]

        # Convert YAML config to dictionary compatible with Pydantic
        config_dict = cls._flatten_config(yaml_config)

        return cls(**config_dict)

    @staticmethod
    def _flatten_config(config: dict, prefix: str = "") -> dict:
        """
        Flatten nested configuration dictionary.

        Args:
            config: Nested configuration dictionary
            prefix: Current prefix for keys

        Returns:
            Flattened dictionary
        """
        result = {}
        for key, value in config.items():
            full_key = f"{prefix}{key}" if prefix else key

            if isinstance(value, dict):
                # Recursively flatten nested dictionaries
                result.update(Settings._flatten_config(value, f"{full_key}_"))
            else:
                result[full_key] = value

        return result

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value."""
        valid_environments = ["development", "staging", "production"]
        if v not in valid_environments:
            raise ValueError(f"Environment must be one of {valid_environments}")
        return v


# Global settings instance
settings = Settings.from_yaml()
