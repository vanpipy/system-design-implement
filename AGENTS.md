# General RAG System - Agent Documentation

This document provides detailed technical information for AI agents working with the General RAG system. It includes system architecture, API specifications, data models, and implementation guidelines.

## System Overview

**Project**: General RAG (Retrieval-Augmented Generation) Assistant System  
**Status**: Design/Planning Phase  
**Development Mode**: AI-assisted development using OpenCode/Specify  
**Core Principles**: Type-First Safety, Architectural Layering, Configuration-Driven Composition

## Architecture Layers

### 1. Business Workflow Layer
```
User → ChatbotUI → Gateway → Intent Recognition → Routing → Services → Response Assembly → User
```

### 2. Service Layer Components
- **RAG Service**: Document retrieval and answer generation
- **Knowledge Service**: Structured knowledge querying
- **Chat Service**: Casual conversation handling
- **Question Service**: Clarification and follow-up
- **Tool Service**: External API integration
- **Exception Service**: Error handling and fallback
- **Assemble Service**: Response formatting and caching

### 3. Data Layer Components
- **Vector Database**: Qdrant for embeddings and semantic search
- **Relational Database**: PostgreSQL for structured data
- **Cache**: Redis for session state and response caching
- **Object Storage**: MinIO/File system for documents
- **Logging**: Structured logging with correlation IDs

## API Specifications

### Core API Endpoints

#### Chat API
```yaml
POST /api/v1/chat:
  description: Main chat endpoint for user interactions
  request:
    content:
      application/json:
        schema:
          type: object
          properties:
            session_id:
              type: string
              description: Unique session identifier
            message:
              type: string
              description: User message content
            context:
              type: object
              description: Additional context/metadata
          required: [session_id, message]
  response:
    200:
      description: Successful response
      content:
        application/json:
          schema:
            type: object
            properties:
              response_id:
                type: string
              answer:
                type: string
              sources:
                type: array
                items:
                  type: object
                  properties:
                    document: {type: string}
                    page: {type: integer}
                    confidence: {type: number}
              intent:
                type: string
                enum: [knowledge, chat, clarify, tool, exception]
              confidence:
                type: number
                minimum: 0
                maximum: 1
```

#### Document Management API
```yaml
POST /api/v1/documents/upload:
  description: Upload and process documents
  request:
    content:
      multipart/form-data:
        schema:
          type: object
          properties:
            file:
              type: string
              format: binary
            metadata:
              type: object
  response:
    201:
      description: Document processed successfully
      content:
        application/json:
          schema:
            type: object
            properties:
              document_id: {type: string}
              status: {type: string}
              chunks_created: {type: integer}
```

#### Session Management API
```yaml
GET /api/v1/sessions/{session_id}:
  description: Retrieve session history
  response:
    200:
      description: Session data
      content:
        application/json:
          schema:
            type: object
            properties:
              session_id: {type: string}
              user_id: {type: string}
              conversations:
                type: array
                items:
                  type: object
                  properties:
                    timestamp: {type: string}
                    request: {type: string}
                    response: {type: string}
                    intent: {type: string}
```

## Data Models

### Core Entities

#### User Entity
```typescript
interface User {
  id: bigint;           // Primary key, auto-increment
  user_id: uuid;        // Unique user identifier
  user_name: string;    // User display name
  created_at: datetime;
  updated_at: datetime;
}
```

#### Session Entity
```typescript
interface Session {
  id: bigint;           // Primary key
  session_id: uuid;     // Unique session identifier
  user_id: bigint;      // Foreign key to User.id
  title: string;        // Session title/description
  is_deleted: boolean;
  create_time: datetime;
  update_time: datetime;
  delete_time: datetime;
}
```

#### Conversation Entity
```typescript
interface Conversation {
  id: bigint;           // Primary key
  conversation_id: uuid; // Unique conversation identifier
  session_id: bigint;   // Foreign key to Session.id
  is_deleted: boolean;
  create_time: datetime;
  delete_time: datetime;
}
```

#### Request Entity
```typescript
interface Request {
  id: bigint;           // Primary key
  request_id: uuid;     // Unique request identifier
  conversation_id: bigint; // Foreign key to Conversation.id
  content: text;        // User message content
  intent_id: bigint;    // Foreign key to Intent.id
  created_at: datetime;
}
```

#### Response Entity
```typescript
interface Response {
  id: bigint;           // Primary key
  response_id: uuid;    // Unique response identifier
  request_id: bigint;   // Foreign key to Request.id
  answer: text;         // Generated answer
  confidence: number;   // Confidence score (0-1)
  created_at: datetime;
}
```

#### Document Entity
```typescript
interface Document {
  id: bigint;           // Primary key
  doc_id: uuid;         // Unique document identifier
  name: string;         // Document name
  size: bigint;         // File size in bytes
  path: string;         // Storage path
  create_time: datetime;
  update_time: datetime;
  version: integer;     // Document version
}
```

### Vector Storage Models

#### Chunk Entity (Business Abstraction)
```typescript
interface Chunk {
  id: string;           // Unique chunk identifier
  content: text;        // Text content
  source: string;       // Source document/URL
  metadata: object;     // Additional metadata
}
```

#### Vector Entity (Business Abstraction)
```typescript
interface Vector {
  id: string;           // Unique vector identifier
  values: float[];      // Embedding vector values
  model: string;        // Embedding model used
  dimension: integer;   // Vector dimension
}
```

#### Point Entity (Physical Storage)
```typescript
interface Point {
  id: string;           // Unique point identifier
  vector: Vector;       // Vector data
  payload: Chunk;       // Chunk payload
  created_at: datetime;
}
```

## Service Contracts

### Intent Recognition Service
```python
class IntentRecognitionService:
    async def recognize_intent(
        self, 
        message: str, 
        context: Dict[str, Any]
    ) -> IntentRecognitionResult:
        """
        Recognize user intent using multiple strategies:
        1. Rule-based matching
        2. Cache lookup
        3. ML-based classification
        
        Returns:
            IntentRecognitionResult with intent type and confidence
        """
        pass

class IntentRecognitionResult:
    intent: str  # knowledge, chat, clarify, tool, exception
    confidence: float  # 0.0 to 1.0
    matched_rules: List[str]
    fallback_reason: Optional[str]
```

### RAG Service
```python
class RAGService:
    async def generate_answer(
        self,
        query: str,
        context: Dict[str, Any],
        top_k: int = 5
    ) -> RAGResponse:
        """
        Generate answer using retrieval-augmented generation.
        
        Steps:
        1. Query vector database for relevant chunks
        2. Re-rank chunks by relevance
        3. Build context with top chunks
        4. Generate answer using LLM
        5. Format response with sources
        """
        pass

class RAGResponse:
    answer: str
    sources: List[DocumentSource]
    confidence: float
    processing_time: float

class DocumentSource:
    document_id: str
    chunk_id: str
    content: str
    relevance_score: float
    page_number: Optional[int]
```

### Routing Service
```python
class RoutingService:
    async def route_request(
        self,
        intent_result: IntentRecognitionResult,
        request: ChatRequest
    ) -> RouteDecision:
        """
        Route request to appropriate service based on intent.
        
        Routing logic:
        - knowledge → RAGService
        - chat → ChatService  
        - clarify → QuestionService
        - tool → ToolService
        - exception → ExceptionService
        - others → QuestionService (fallback)
        """
        pass

class RouteDecision:
    target_service: str
    routing_reason: str
    confidence_threshold: float = 0.6
    fallback_service: Optional[str]
```

## Configuration Schema

### Main Configuration
```yaml
# config/settings.yaml
general_rag:
  environment: development  # development, staging, production
  debug: true
  log_level: INFO
  
  api:
    host: 0.0.0.0
    port: 8000
    workers: 4
    timeout: 30
  
  database:
    postgresql:
      host: localhost
      port: 5432
      database: general_rag
      username: postgres
      password: ${POSTGRES_PASSWORD}
      pool_size: 20
    
    qdrant:
      host: localhost
      port: 6333
      collection: documents
      vector_size: 384
    
    redis:
      host: localhost
      port: 6379
      db: 0
      password: ${REDIS_PASSWORD}
  
  models:
    embedding:
      name: BAAI/bge-small-zh-v1.5
      device: cpu
      max_length: 512
    
    llm:
      primary:
        provider: deepseek
        api_key: ${DEEPSEEK_API_KEY}
        model: deepseek-chat
        temperature: 0.7
      
      fallback:
        provider: local
        model_path: ./models/qwen2.5-1.5b.gguf
        context_size: 4096
  
  frameworks:
    langchain:
      prompt_templates:
        rag_template: |
          You are a helpful assistant. Use the following context to answer the question.
          
          Context: {context}
          
          Question: {question}
          
          Answer:
        chat_template: |
          You are a friendly chatbot. Respond to the user conversationally.
          
          Conversation history: {history}
          
          User: {input}
          
          Assistant:
      output_parsers_enabled: true
      streaming_enabled: false
      callbacks_enabled: true
    
    llamaindex:
      document_reader:
        supported_formats: [".pdf", ".docx", ".txt", ".md", ".html"]
        chunk_size: 1000
        chunk_overlap: 200
      node_parser:
        type: semantic
        buffer_size: 1
        breakpoint_percentile_threshold: 95
      embedding:
        provider: huggingface
        model_name: BAAI/bge-small-zh-v1.5
        device: cpu
  
  services:
    intent_recognition:
      rule_matching_enabled: true
      cache_matching_enabled: true
      ml_classification_enabled: true
      confidence_threshold: 0.6
    
    rag:
      top_k: 5
      rerank_enabled: true
      max_context_length: 4000
    
    caching:
      enabled: true
      ttl_seconds: 3600
      max_size_mb: 1000
```

## Implementation Guidelines

### Development Principles

1. **Type-First Safety**: All data structures must have explicit type definitions
2. **Architectural Layering**: Clear separation between business, data, and control planes
3. **Configuration-Driven Composition**: Services should be configurable without code changes
4. **Error Handling**: Graceful degradation with meaningful error messages
5. **Observability**: Comprehensive logging, metrics, and tracing

### Code Structure Template

```
src/
├── api/
│   ├── routes/
│   │   ├── chat.py          # Chat endpoints
│   │   ├── documents.py     # Document management
│   │   └── sessions.py      # Session management
│   ├── middleware/          # Authentication, logging, error handling
│   └── dependencies.py      # FastAPI dependencies
├── services/
│   ├── rag_service.py       # RAG implementation
│   ├── chat_service.py      # Chat conversation
│   ├── question_service.py  # Clarification handling
│   ├── tool_service.py      # External tool integration
│   ├── exception_service.py # Error handling
│   ├── assemble_service.py  # Response assembly
│   └── intent_service.py    # Intent recognition
├── models/
│   ├── database.py          # SQLAlchemy models
│   ├── pydantic.py          # Pydantic schemas
│   ├── vector.py            # Vector storage models
│   └── enums.py             # Enumerations
├── utils/
│   ├── embeddings.py        # Embedding utilities
│   ├── chunking.py          # Document chunking
│   ├── caching.py           # Cache management
│   └── logging.py           # Structured logging
├── config/
│   ├── settings.py          # Configuration loading
│   └── constants.py         # Constants
└── main.py                  # Application entry point
```

### Agent-Specific Notes

1. **When implementing new features**:
   - Always check DESIGN.md for architectural constraints
   - Follow the data models defined in this document
   - Use the configuration schema for any new settings
   - Leverage LangChain LCEL for declarative pipeline composition
   - Use LlamaIndex components for document processing tasks

2. **When debugging**:
   - Check intent recognition confidence scores
   - Verify vector database connectivity
   - Monitor service routing decisions
   - Review response assembly logic
   - Check LangChain callback handlers for LLM interaction issues
   - Verify LlamaIndex document parsing and chunking

3. **When extending the system**:
   - Add new intent types to the enum list
   - Extend service contracts with new methods
   - Update configuration schema with new options
   - Maintain backward compatibility
   - Follow LangChain and LlamaIndex best practices for new components

4. **Framework Integration Guidelines**:
   - **LangChain**: Use for LLM orchestration, prompt engineering, and response parsing
   - **LlamaIndex**: Use for document ingestion, chunking, and initial embedding generation
   - **Hybrid Approach**: LlamaIndex for document processing → Qdrant for storage → LangChain for retrieval/generation
   - **Configuration**: All framework settings should be configurable via YAML
   - **Type Safety**: Use Pydantic models with LangChain's PydanticOutputParser for structured outputs

### Testing Guidelines

- **Unit Tests**: Test individual service methods in isolation
- **Integration Tests**: Test service interactions and API endpoints
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test vector search and LLM response times

### Deployment Checklist

- [ ] Database migrations applied
- [ ] Vector database collection created
- [ ] Environment variables configured
- [ ] Service dependencies running
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place

## Quick Reference

### Intent Types
- `knowledge`: Document-based questions → RAG Service
- `chat`: Casual conversation → Chat Service
- `clarify`: Need clarification → Question Service
- `tool`: External operations → Tool Service
- `exception`: Error handling → Exception Service

### Confidence Thresholds
- > 0.8: High confidence, direct routing
- 0.6-0.8: Medium confidence, may need verification
- < 0.6: Low confidence, requires clarification

### Error Codes
- `400`: Bad request (invalid input)
- `401`: Unauthorized (missing/invalid auth)
- `404`: Not found (resource doesn't exist)
- `429`: Rate limited (too many requests)
- `500`: Internal server error
- `503`: Service unavailable (dependencies down)