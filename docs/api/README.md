# General RAG System - API Documentation

## Overview

The General RAG System provides a RESTful API for intelligent document retrieval and conversation. This documentation covers all available endpoints, request/response formats, and usage examples.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Currently, the API does not require authentication for development. For production, JWT-based authentication will be implemented.

## Rate Limiting

- **Rate Limit**: 60 requests per minute per IP
- **Burst Limit**: 1000 requests per hour per IP

## Common Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Endpoints

### Health Checks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/detailed` | GET | Detailed health with dependency status |
| `/health/readiness` | GET | Readiness check for orchestration |
| `/health/liveness` | GET | Liveness check for orchestration |
| `/health/metrics` | GET | Application metrics |
| `/health/info` | GET | System information |

### Chat

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Main chat endpoint |
| `/chat/intent` | POST | Intent recognition only |
| `/chat/intents` | GET | List available intent types |

### Documents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/documents/upload` | POST | Upload and process document |
| `/documents` | GET | List documents |
| `/documents/{id}` | GET | Get document details |
| `/documents/{id}` | DELETE | Delete document |
| `/documents/{id}/reprocess` | POST | Reprocess document |
| `/documents/{id}/chunks` | GET | List document chunks |

### Sessions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sessions` | POST | Create new session |
| `/sessions` | GET | List sessions |
| `/sessions/{id}` | GET | Get session details |
| `/sessions/{id}` | DELETE | Delete session |
| `/sessions/{id}/conversations` | GET | List session conversations |
| `/sessions/{id}/analytics` | GET | Get session analytics |

## Data Models

### Chat Request
```json
{
  "session_id": "string",
  "message": "string",
  "context": {
    "user_id": "string",
    "department": "string",
    "previous_intent": "string"
  }
}
```

### Chat Response
```json
{
  "response_id": "string",
  "answer": "string",
  "sources": [
    {
      "document_id": "string",
      "chunk_id": "string",
      "content": "string",
      "relevance_score": 0.95,
      "page_number": 1
    }
  ],
  "intent": "knowledge",
  "confidence": 0.85,
  "processing_time_ms": 123.45
}
```

### Document Upload
```json
{
  "metadata": {
    "title": "string",
    "author": "string",
    "tags": ["tag1", "tag2"],
    "description": "string"
  }
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMITED` | Rate limit exceeded | 429 |
| `INTERNAL_ERROR` | Internal server error | 500 |
| `SERVICE_UNAVAILABLE` | Dependency service unavailable | 503 |

## Examples

### Example 1: Basic Chat
```bash
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user-123-session-456",
    "message": "What is the company policy on remote work?",
    "context": {
      "user_id": "user-123",
      "department": "HR"
    }
  }'
```

### Example 2: Document Upload
```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@policy.pdf" \
  -F 'metadata={"title": "Company Policy", "author": "HR Department"}'
```

### Example 3: Health Check
```bash
curl "http://localhost:8000/api/v1/health/detailed"
```

## SDKs and Clients

### Python Client
```python
import requests

class GeneralRAGClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url.rstrip("/")
    
    def chat(self, session_id, message, context=None):
        url = f"{self.base_url}/api/v1/chat"
        data = {
            "session_id": session_id,
            "message": message,
            "context": context or {}
        }
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()
```

### JavaScript/TypeScript Client
```typescript
class GeneralRAGClient {
  constructor(private baseUrl: string = 'http://localhost:8000') {}
  
  async chat(sessionId: string, message: string, context?: object) {
    const response = await fetch(`${this.baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        context: context || {}
      })
    });
    return response.json();
  }
}
```

## Testing

Run the test suite:
```bash
# Run all tests
pytest

# Run specific test module
pytest tests/unit/test_health.py

# Run with coverage
pytest --cov=src tests/
```

## Monitoring

The API provides metrics at `/api/v1/health/metrics` and integrates with:
- Prometheus for metrics collection
- Grafana for visualization
- Structured logging with correlation IDs