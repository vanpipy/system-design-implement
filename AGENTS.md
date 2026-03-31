# Agent Guidelines for Short Link System

This document provides guidelines for AI agents working on the Short Link System project. Follow these instructions for consistent development practices.

## Project Overview

**Short Link System** - A scalable URL shortening service with Java 21, Spring Boot, and distributed architecture.

**Key Technologies**:
- Language: Java 21
- Framework: Spring Boot 4.x
- Build Tool: Gradle
- Database: PostgreSQL
- Cache: Redis (Lettuce + Redisson)
- ORM: MyBatis-Plus
- Distributed Framework: ShardingSphere-JDBC
- Testing: JUnit 5, Mockito

## Build and Development Commands

### Project Setup
```bash
# Clone and initialize (when project structure exists)
git clone <repository-url>
cd system-design-implement

# Expected Gradle commands (when build.gradle is created)
./gradlew build          # Build the project
./gradlew clean          # Clean build artifacts
./gradlew test           # Run all tests
./gradlew bootRun        # Run the application
```

### Testing Commands
```bash
# Run specific test class
./gradlew test --tests "com.example.ShortLinkServiceTest"

# Run tests with specific pattern
./gradlew test --tests "*ServiceTest"

# Run integration tests
./gradlew integrationTest

# Generate test coverage report
./gradlew jacocoTestReport
```

### Code Quality
```bash
# Check code style (when configured)
./gradlew checkstyleMain checkstyleTest

# Static analysis (when configured)
./gradlew spotlessCheck
./gradlew spotlessApply   # Auto-format code

# Dependency vulnerability check
./gradlew dependencyCheckAnalyze
```

## Code Style Guidelines

### Core Principles (NON-NEGOTIABLE)
1. **Type Safety First**: Strict type checking MUST be enabled. Avoid `any`/`Object` types unless absolutely necessary.
2. **Architecture Constraints**: Follow strict layered architecture:
   - Controllers/API layers: ONLY handle request/response
   - Business logic: Encapsulated in Service/Domain layers
   - Infrastructure: Separate layer for external dependencies
3. **Composition over Inheritance**: Build capabilities through composition. Avoid deep inheritance hierarchies.
4. **TDD-Driven Development**: Write tests first. Target 80% test coverage for new code.

### Package Structure
```
src/main/java/com/shortlink/
├── application/          # Application services, DTOs
├── domain/              # Domain models, business logic
├── infrastructure/      # Database, cache, external clients
└── presentation/        # Controllers, API definitions
```

### Naming Conventions
- **Classes**: PascalCase (e.g., `ShortLinkService`, `UrlValidator`)
- **Methods**: camelCase (e.g., `createShortLink`, `validateUrl`)
- **Variables**: camelCase (e.g., `shortCode`, `longUrl`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_URL_LENGTH`)
- **Packages**: lowercase with dots (e.g., `com.shortlink.domain`)

### Import Organization
```java
// 1. Java standard library
import java.time.LocalDateTime;
import java.util.List;

// 2. Third-party libraries
import org.springframework.stereotype.Service;
import lombok.Data;

// 3. Project imports
import com.shortlink.domain.ShortLink;
import com.shortlink.application.ShortLinkDto;

// Static imports last
import static com.shortlink.util.ValidationUtils.validateUrl;
```

### Error Handling
```java
// Use checked exceptions for recoverable errors
public class ShortLinkException extends RuntimeException {
    private final ErrorCode errorCode;
    
    public ShortLinkException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}

// Use global exception handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ShortLinkException.class)
    public ResponseEntity<ErrorResponse> handleShortLinkException(ShortLinkException ex) {
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus())
               .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }
}
```

### Testing Standards
```java
// Follow Arrange-Act-Assert pattern
@Test
void createShortLink_ValidUrl_ReturnsShortCode() {
    // Arrange
    String longUrl = "https://example.com";
    ShortLinkService service = new ShortLinkService();
    
    // Act
    String shortCode = service.createShortLink(longUrl);
    
    // Assert
    assertNotNull(shortCode);
    assertEquals(8, shortCode.length());
}

// Use @ParameterizedTest for multiple test cases
@ParameterizedTest
@ValueSource(strings = {"https://valid.com", "http://valid.org"})
void isValidUrl_ValidUrls_ReturnsTrue(String url) {
    assertTrue(UrlValidator.isValid(url));
}
```

## Database Guidelines

### Entity Definition
```java
@Data
@TableName("short_link")
public class ShortLink {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("code")
    private String code;
    
    @TableField("long_url")
    private String longUrl;
    
    @TableField("status")
    private ShortLinkStatus status;
    
    @TableField("create_time")
    private LocalDateTime createTime;
    
    @Version
    private Integer version;
}
```

### Repository Pattern
```java
public interface ShortLinkRepository extends BaseMapper<ShortLink> {
    @Select("SELECT * FROM short_link WHERE code = #{code}")
    Optional<ShortLink> findByCode(@Param("code") String code);
    
    @Select("SELECT * FROM short_link WHERE status = #{status} AND expire_time < NOW()")
    List<ShortLink> findExpiredLinks(@Param("status") ShortLinkStatus status);
}
```

## API Design

### RESTful Endpoints
```
POST   /api/v1/short-links          # Create short link
GET    /api/v1/short-links/{code}   # Get short link details
GET    /r/{code}                    # Redirect to original URL (public)
PUT    /api/v1/short-links/{code}   # Update short link
DELETE /api/v1/short-links/{code}   # Delete short link
```

### Request/Response Examples
```java
@PostMapping("/short-links")
public ResponseEntity<ShortLinkResponse> createShortLink(
    @Valid @RequestBody CreateShortLinkRequest request) {
    
    ShortLinkDto dto = shortLinkService.createShortLink(request);
    return ResponseEntity.status(HttpStatus.CREATED)
           .body(ShortLinkResponse.fromDto(dto));
}

@Data
public class CreateShortLinkRequest {
    @NotBlank
    @URL
    private String longUrl;
    
    @Min(60)
    @Max(2592000) // 30 days
    private Integer ttlSeconds = 604800; // 7 days default
}
```

## Configuration Management

### Application Properties
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/shortlink
    # 开发环境使用 H2 内存数据库
    # url: jdbc:h2:mem:shortlinkdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1
    # username: sa
    # password:
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    
  redis:
    host: localhost
    port: 6379
    
shortlink:
  code:
    length: 8
    alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  cache:
    ttl-seconds: 3600
```

### Development Environment Setup

**H2 Database for Local Development:**

1. **No PostgreSQL Required**: For local development, the application uses H2 in-memory database by default
2. **H2 Console**: Access database via http://localhost:8080/h2-console
   - JDBC URL: jdbc:h2:mem:shortlinkdb
   - Username: sa
   - Password: (empty)
3. **Automatic Schema Creation**: Tables are created automatically on application startup
4. **Data Persistence**: Data persists while application is running, resets on restart

## Development Workflow

### 1. Before Starting
- Read DESIGN.md for system architecture
- Review constitution.md for core principles
- Check existing code patterns

### 2. Implementation Steps
1. Write failing tests (TDD)
2. Implement minimal code to pass tests
3. Refactor for clean code
4. Run all tests
5. Verify type safety

### 3. Code Review Checklist
- [ ] Follows layered architecture
- [ ] Type-safe implementation
- [ ] Adequate test coverage (80%+)
- [ ] Proper error handling
- [ ] Clear documentation
- [ ] No business logic in controllers

### 4. Commit Messages
Use conventional commits format:
```
feat(shortlink): add URL validation service
fix(cache): resolve Redis connection leak
docs(api): update endpoint documentation
test(service): add unit tests for ShortLinkService
chore(deps): update Spring Boot to 3.2.0
```

## Tool Configuration

### IDE Setup
- Java 21 SDK
- Lombok annotation processing enabled
- MapStruct annotation processing enabled
- Spring Boot support

### Git Hooks (Recommended)
```bash
#!/bin/sh
# pre-commit hook
./gradlew test
./gradlew checkstyleMain
```

## Performance Considerations

### Caching Strategy
- Use Redis for distributed caching
- Implement cache-aside pattern
- Set appropriate TTL based on usage patterns

### Database Optimization
- Add indexes on frequently queried columns
- Use connection pooling (HikariCP)
- Implement read/write separation
- Consider sharding for scale

## Monitoring and Observability

### Logging
- Use structured logging (JSON format)
- Include correlation IDs for request tracing
- Log at appropriate levels (DEBUG, INFO, WARN, ERROR)

### Metrics
- Expose metrics via Spring Boot Actuator
- Track key business metrics (short links created, redirects served)
- Monitor system health (CPU, memory, database connections)

## Security Guidelines

### Input Validation
- Validate all user inputs
- Sanitize URLs before processing
- Implement rate limiting to prevent abuse

### Data Protection
- Never log sensitive data
- Use HTTPS for all API endpoints
- Implement proper authentication/authorization for admin endpoints

## References

- [DESIGN.md](./DESIGN.md) - System architecture and design
- [.specify/memory/constitution.md](./.specify/memory/constitution.md) - Core development principles
- Spring Boot Documentation
- MyBatis-Plus Documentation
- ShardingSphere Documentation