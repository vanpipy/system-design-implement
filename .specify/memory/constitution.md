<!--
SYNC IMPACT REPORT
Version change: [NO_VERSION] → 1.0.0
Modified principles: N/A (initial creation)
Added sections: Core Principles (5 principles), Development Standards, Compliance & Review, Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Constitution Check alignment
  ✅ .specify/templates/spec-template.md - Scope/requirements alignment  
  ✅ .specify/templates/tasks-template.md - Task categorization
  ⚠ .specify/templates/commands/*.md - No command files found
Follow-up TODOs: RATIFICATION_DATE requires historical verification
-->

# Short Link System Constitution

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

Type safety takes priority over development speed. Strict type checking MUST be enabled and enforced. 
Circumventing the type system (e.g.,滥用 any/滥用 any类型) for rapid implementation is PROHIBITED.

**Rationale**: Type safety prevents runtime errors, improves code maintainability, and enables better tooling support.

### II. Architecture Constraints (NON-NEGOTIABLE)

Strict layered architecture MUST be followed. Controller/API layers are PROHIBITED from containing business logic - they ONLY handle request processing and response formatting. Business logic MUST be encapsulated in Service/Domain layers.

**Rationale**: Clear separation of concerns improves testability, maintainability, and enables independent evolution of presentation and business layers.

### III. Configuration-Driven, Composition First (NON-NEGOTIABLE)

Composition over inheritance. Business capabilities MUST be built through compositional abstractions. Core business rules are PROHIBITED from being hardcoded in presentation layers or entry logic.

**Rationale**: Composition creates more flexible, testable systems. Configuration-driven design enables runtime adaptability without code changes.

### IV. Quality Baseline (TDD-Driven)

Test-Driven Development (TDD) is the mandatory approach. Untestable code is considered incomplete. New core business logic MUST include corresponding unit tests. Test coverage target is 80%.

**Rationale**: TDD ensures code quality from inception, creates living documentation, and prevents regression. Measurable coverage targets maintain quality standards.

### V. Governance Rules

When tool default language conflicts with the team's primary language, Chinese takes precedence. This constitution is the highest arbitration agreement. When efficiency or tool default behavior conflicts with this constitution, the constitution takes precedence.

**Rationale**: Clear governance prevents ambiguity in decision-making and ensures consistency across the development lifecycle.

## Development Standards

### Code Organization
- Follow domain-driven design principles
- Package by feature, not by layer
- Clear separation between infrastructure, domain, and application concerns

### Testing Strategy
- Unit tests for all business logic
- Integration tests for cross-component interactions
- Contract tests for external dependencies
- Performance tests for critical paths

### Documentation
- API documentation for all public interfaces
- Architecture decision records for significant changes
- README files for each module with usage examples

## Compliance & Review

### Code Review Requirements
- All changes MUST pass constitution compliance check
- At least one senior developer approval for architectural changes
- Automated checks for type safety, test coverage, and code style

### Quality Gates
- 80% test coverage minimum for new code
- Zero type errors in strict mode
- All integration tests passing
- Performance benchmarks within acceptable ranges

### Change Management
- Breaking changes require migration plan
- Database schema changes require backward compatibility period
- API versioning follows semantic versioning

## Governance

This constitution supersedes all other development practices, tool defaults, and efficiency optimizations. Amendments require:

1. **Proposal**: Documented change request with rationale and impact analysis
2. **Review**: Team discussion and consensus building
3. **Approval**: Majority agreement from core contributors
4. **Implementation**: Update constitution and all dependent artifacts
5. **Communication**: Notify all stakeholders of changes

All pull requests and code reviews MUST verify compliance with this constitution. Complexity MUST be justified with measurable benefits. Use agent-specific guidance files for runtime development instructions when available.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Requires historical verification | **Last Amended**: 2026-03-31