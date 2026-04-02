# General RAG System

A comprehensive Retrieval-Augmented Generation (RAG) system with intelligent intent recognition, multi-service routing, and conversational AI capabilities.

## Overview

General RAG is a production-ready chatbot system that combines document retrieval with large language models to provide accurate, context-aware responses. The system features intelligent intent recognition, automatic routing to specialized services, and a modular architecture for easy extension.

## Key Features

- **Intelligent Intent Recognition**: Rule-based matching, cache lookup, and ML-based classification
- **Multi-Service Architecture**: Dedicated services for different response types
- **Document Processing Pipeline**: Full document ingestion, chunking, and vectorization
- **Conversation Management**: Session tracking, context preservation, and user history
- **Fallback Mechanisms**: Graceful degradation when services are unavailable
- **Feedback System**: User feedback collection for continuous improvement

## Architecture

The system follows a layered architecture with three main planes:

### 1. Business Workflow
- User interacts with Chatbot UI
- Intent recognition determines user needs
- Routing to appropriate service (RAG, Chat, Question, Tool, or Exception)
- Response assembly and caching

### 2. Data Plane
- **User Management**: User profiles and authentication
- **Session Tracking**: Conversation history and context
- **Document Storage**: Original documents and metadata
- **Vector Storage**: Embeddings for semantic search
- **Response Logging**: Audit trail and analytics

### 3. Control Plane
- **Intent Recognition**: Determines user intent through multiple strategies
- **Routing Logic**: Directs requests to appropriate services
- **Confidence Scoring**: ML-based confidence calculation for routing decisions

## Services

### Core Services
1. **RAG Service** - Document retrieval and answer generation
2. **Chat Service** - Casual conversation and small talk
3. **Question Service** - Clarification and follow-up questions
4. **Tool Service** - External API integration and calculations
5. **Exception Service** - Error handling and graceful degradation
6. **Assemble Service** - Response formatting and caching

## Technical Stack

### Framework Layer
- **Python Version**: 3.12
- **Dependency Management**: `UV` - Package management and virtual environment
- **Embedding Framework**: `sentence-transformers` - Unified embedding and similarity calculation
- **Web Framework**: `FastAPI` - High-performance API service
- **Configuration**: `YAML` + `Pydantic` - Configuration-driven approach
- **Service Communication**: `HTTP/REST` + `OpenAI-compatible API` - Inter-service communication
- **Chatbot Framework**: `LangChain` - ChatPromptTemplate, PydanticOutputParser, BaseCallbackHandler, LCEL for LLM orchestration
- **Document Framework**: `LlamaIndex` - SimpleDirectoryReader, SemanticSplitterNodeParser, HuggingFaceEmbedding for document processing

### Model Layer
- **Embedding Model**: `BAAI/bge-small-zh-v1.5` (Chinese, 33MB, CPU-friendly)
- **Intent Classification**: `BAAI/bge-small-zh-v1.5` + Template Matching
- **Primary LLM**: `DeepSeek API` (cost-effective answer generation)
- **Fallback LLM**: `llama.cpp` + `Qwen2.5-1.5B` (local fallback)

### Storage Layer
- **Vector Database**: `Qdrant` (vector + text storage)
- **Relational Database**: `PostgreSQL` (structured data)
- **Cache**: `Redis` (session state and response caching)
- **Object Storage**: `MinIO` / File system (document storage)
- **Logging**: `loguru` (structured logging)

### Deployment
- **Development**: Linux with CPU
- **Containerization**: `Docker` + `Docker Compose`
- **Orchestration**: `Kubernetes` (optional, for production scaling)

## Getting Started

### Prerequisites
- Python 3.12+
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 7+
- Qdrant 1.7+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd general-rag
   ```

2. **Set up environment**
   ```bash
   # Create virtual environment
   uv venv
   source .venv/bin/activate
   
   # Install dependencies including LangChain and LlamaIndex
   uv pip install -r requirements.txt
   
   # Or install core dependencies directly
   uv pip install fastapi uvicorn langchain langchain-community llama-index llama-index-embeddings-huggingface sentence-transformers qdrant-client psycopg2-binary redis
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Initialize the database**
   ```bash
   # Run migrations
   alembic upgrade head
   
   # Seed initial data (if needed)
   python scripts/seed_data.py
   ```

6. **Start the application**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## Usage

### API Endpoints

The system exposes a RESTful API with the following main endpoints:

- `POST /api/v1/chat` - Main chat endpoint
- `POST /api/v1/documents/upload` - Document ingestion
- `GET /api/v1/documents` - List documents
- `GET /api/v1/sessions` - User sessions
- `POST /api/v1/feedback` - Submit feedback

### Example Request

```bash
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user-123",
    "message": "What is the company policy on remote work?",
    "context": {}
  }'
```

### Example Response

```json
{
  "response_id": "resp-456",
  "answer": "According to our company policy document...",
  "sources": [
    {
      "document": "Employee-Handbook-2024.pdf",
      "page": 42,
      "confidence": 0.92
    }
  ],
  "intent": "knowledge",
  "confidence": 0.88
}
```

## Framework Integration

### LangChain Components
The system uses LangChain for LLM orchestration and prompt engineering:

- **ChatPromptTemplate**: Structured prompt templates for consistent LLM interactions
- **PydanticOutputParser**: Type-safe parsing of LLM responses into structured data
- **BaseCallbackHandler**: Event handlers for monitoring LLM calls and streaming
- **LCEL (LangChain Expression Language)**: Declarative pipeline composition for RAG workflows

### LlamaIndex Components
LlamaIndex handles document processing and retrieval:

- **SimpleDirectoryReader**: Unified interface for reading documents from various formats (PDF, DOCX, TXT, etc.)
- **SemanticSplitterNodeParser**: Intelligent document chunking based on semantic boundaries
- **HuggingFaceEmbedding**: Integration with HuggingFace embedding models (complements sentence-transformers)

### Integration Pattern
The frameworks work together in a hybrid approach:

1. **Document Processing** (LlamaIndex):
   - `SimpleDirectoryReader` ingests documents
   - `SemanticSplitterNodeParser` creates semantically coherent chunks
   - `HuggingFaceEmbedding` generates embeddings for chunks

2. **Vector Storage** (Qdrant):
   - Store embeddings and chunk text
   - Enable semantic search via vector similarity

3. **Retrieval & Generation** (LangChain):
   - Retrieve relevant chunks from Qdrant
   - `ChatPromptTemplate` constructs context-aware prompts
   - LLM generates answers using retrieved context
   - `PydanticOutputParser` validates and structures responses

4. **Orchestration** (LangChain LCEL):
   - Compose the entire RAG pipeline declaratively
   - Handle error recovery and fallbacks
   - Enable streaming and async processing

## Development

### Project Structure

```
general-rag/
├── src/                    # Source code
│   ├── api/               # FastAPI routes and controllers
│   ├── services/          # Business logic services
│   ├── models/            # Data models and schemas
│   ├── utils/             # Utility functions
│   └── config/            # Configuration management
├── tests/                 # Test suite
├── docs/                  # Documentation
├── docker/                # Docker configurations
├── scripts/               # Utility scripts
└── alembic/               # Database migrations
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test module
pytest tests/test_rag_service.py

# Run with coverage
pytest --cov=src tests/
```

### Code Quality

```bash
# Format code
black src/
isort src/

# Lint code
flake8 src/
mypy src/

# Security check
bandit -r src/
```

## Deployment

### Docker Deployment

```bash
# Build and run
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale rag-service=3
```

### Kubernetes Deployment (Optional)

```bash
# Apply configurations
kubectl apply -f k8s/

# Check status
kubectl get pods
kubectl get services
```

## Monitoring and Observability

- **Metrics**: Prometheus metrics endpoint at `/metrics`
- **Logging**: Structured JSON logs with correlation IDs
- **Tracing**: OpenTelemetry distributed tracing
- **Health Checks**: `/health` endpoint for service status

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure tests pass and code follows the project's style guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Documentation

- **User Documentation**: This README.md file provides project overview and usage instructions
- **Agent Documentation**: See `AGENTS.md` for detailed technical specifications for AI agents
- **Design Documentation**: See `DESIGN.md` for system architecture and design decisions
- **Additional Docs**: See `docs/` directory for detailed documentation

## Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

## Acknowledgments

- Built with FastAPI for high-performance APIs
- Uses sentence-transformers for efficient embeddings
- Qdrant for vector similarity search
- Thanks to all contributors and the open-source community