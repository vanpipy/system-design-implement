# Short Link System

A scalable, distributed URL shortening service built with Java 21 and Spring Boot.

## Overview

The Short Link System is a high-performance URL shortening service designed for scalability and reliability. It converts long URLs into short, memorable codes that redirect to the original URLs.

## Features

- **URL Shortening**: Convert long URLs to short codes
- **Redirection**: Fast redirects from short codes to original URLs
- **Expiration Management**: Configurable TTL for short links
- **Analytics**: Track usage statistics (planned)
- **Admin Dashboard**: Manage short links (planned)
- **API Access**: RESTful API for integration

## Architecture

### Technology Stack

- **Language**: Java 21
- **Framework**: Spring Boot 4.x
- **Build Tool**: Gradle
- **Database**: PostgreSQL
- **Cache**: Redis (Lettuce + Redisson)
- **ORM**: MyBatis-Plus
- **Distributed Framework**: ShardingSphere-JDBC
- **Testing**: JUnit 5, Mockito

### System Design

The system follows a layered architecture:

1. **Presentation Layer**: REST API controllers
2. **Application Layer**: Business logic and services
3. **Domain Layer**: Core business models and rules
4. **Infrastructure Layer**: Database, cache, external services

### Data Model

- **ShortLink**: Core entity storing short codes and original URLs
- **ShortLinkOperation**: Audit trail for link operations
- **Archived Tables**: Historical data storage for compliance

## Getting Started

### Prerequisites

- Java 21 or later
- **Development**: No database installation required (uses H2 in-memory database)
- **Production**: PostgreSQL 15+ and Redis 7+
- Gradle 8+

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd system-design-implement
   ```

2. **Development Setup**: No configuration needed for H2 database (default)
   - H2 Console: http://localhost:8080/h2-console
   - For production, configure PostgreSQL in `application-prod.yml`

3. Build the project:
   ```bash
   ./gradlew build
   ```

4. Run the application:
   ```bash
   ./gradlew bootRun
   ```

### Quick Start for Development

1. Clone the repository
2. Build: `./gradlew build`
3. Run: `./gradlew bootRun`
4. Access: http://localhost:8080
5. Database Console: http://localhost:8080/h2-console

**Note**: No external database setup required for development.

### API Usage

#### Create Short Link
```bash
POST /api/v1/short-links
Content-Type: application/json

{
  "longUrl": "https://example.com/very/long/url/path",
  "ttlSeconds": 604800
}
```

Response:
```json
{
  "code": "abc123de",
  "longUrl": "https://example.com/very/long/url/path",
  "shortUrl": "https://short.link/abc123de",
  "expireTime": "2026-04-07T10:30:00Z"
}
```

#### Redirect to Original URL
```bash
GET /r/{code}
```

#### Get Short Link Details
```bash
GET /api/v1/short-links/{code}
```

## Development

### Project Structure
```
src/main/java/com/shortlink/
├── presentation/        # Controllers, API definitions
├── application/         # Application services, DTOs
├── domain/             # Domain models, business logic
└── infrastructure/     # Database, cache, external clients
```

### Code Style

Follow the guidelines in [AGENTS.md](./AGENTS.md) for:
- Type safety requirements
- Layered architecture constraints
- TDD-driven development
- Import organization
- Error handling patterns

### Testing

Run tests with:
```bash
./gradlew test          # Run all tests
./gradlew test --tests "com.shortlink.service.ShortLinkServiceTest"  # Run specific test
./gradlew jacocoTestReport  # Generate coverage report
```

## Deployment

### Docker
```bash
docker build -t shortlink-system .
docker run -p 8080:8080 shortlink-system
```

### Kubernetes
See `k8s/` directory for deployment manifests.

## Monitoring

- **Metrics**: Spring Boot Actuator endpoints
- **Logging**: Structured JSON logs with correlation IDs
- **Health Checks**: Database, Redis, and application health
- **Tracing**: Distributed request tracing

## Performance

- **Caching**: Redis cache with cache-aside pattern
- **Database**: Read/write separation with sharding
- **Connection Pooling**: HikariCP for optimal database connections
- **Rate Limiting**: Resilience4j for API protection

## Security

- **Input Validation**: All user inputs validated
- **Rate Limiting**: Protection against abuse
- **HTTPS**: All endpoints secured
- **Authentication**: JWT-based auth for admin endpoints

## Contributing

1. Read [DESIGN.md](./DESIGN.md) for system architecture
2. Review [.specify/memory/constitution.md](./.specify/memory/constitution.md) for core principles
3. Follow the development workflow in [AGENTS.md](./AGENTS.md)
4. Write tests for all new functionality
5. Ensure 80%+ test coverage

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Documentation

- [DESIGN.md](./DESIGN.md) - System architecture and design
- [AGENTS.md](./AGENTS.md) - Development guidelines for AI agents
- [.specify/memory/constitution.md](./.specify/memory/constitution.md) - Core development principles