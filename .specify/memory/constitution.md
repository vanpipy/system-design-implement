<!--
Sync Impact Report
==================
Version Change: [ALL_PLACEHOLDERS] → 1.0.0
Change Type: MAJOR (first concrete version with 6 principles)

Modified Principles:
- [PRINCIPLE_1_NAME] → I. Type-First, Safety First (NON-NEGOTIABLE)
- [PRINCIPLE_2_NAME] → II. Architectural Layering (NON-NEGOTIABLE)
- [PRINCIPLE_3_NAME] → III. Configuration-Driven Composition
- [PRINCIPLE_4_NAME] → IV. Quality Baseline (NON-NEGOTIABLE)
- [PRINCIPLE_5_NAME] → V. Language Governance
- Added: VI. Constitutional Supremacy (6th principle from user input)

Added Sections:
- Development Standards (code quality, testing strategy)
- Governance (amendment procedure, compliance, versioning)

Removed Sections:
- [SECTION_2_NAME] and [SECTION_2_CONTENT] (replaced with Development Standards)
- [SECTION_3_NAME] and [SECTION_3_CONTENT] (replaced with Governance)

Templates Requiring Updates:
✅ .specify/templates/plan-template.md - Constitution Check section will auto-populate
✅ .specify/templates/spec-template.md - No direct references to update
✅ .specify/templates/tasks-template.md - No direct references to update
✅ .specify/templates/constitution-template.md - Source template unchanged
✅ .opencode/command/speckit.*.md - Command files reference constitution generically

Follow-up TODOs:
- TODO(RATIFICATION_DATE): Original adoption date unknown - needs manual resolution
-->

# General RAG Constitution

## Core Principles

### I. Type-First, Safety First (NON-NEGOTIABLE)

Type safety takes precedence over development speed. Strict type checking MUST be enabled across all codebases. All new code MUST be fully typed, and existing code MUST be gradually typed where feasible. Runtime type validation is required for external interfaces.

**Rationale:** Type safety prevents entire classes of runtime errors, improves code maintainability, enables better tooling support, and reduces cognitive load during development and code review.

### II. Architectural Layering (NON-NEGOTIABLE)

Strictly adhere to layered architecture. The Controller/API layer MUST NOT contain business logic; it is solely responsible for request handling, validation, and response formatting. Business logic MUST be encapsulated in the Service/Domain layer. Data access MUST be isolated in Repository/DAO layers.

**Rationale:** Clear separation of concerns enables independent testing, reduces coupling, facilitates team scaling, and allows technology stack evolution without business logic disruption.

### III. Configuration-Driven Composition

Composition is preferred over inheritance for code reuse. Business capabilities MUST be abstracted via composable abstractions (interfaces, protocols, traits). Core business rules MUST NOT be hardcoded in presentation or entry logic. Configuration files define behavior where possible.

**Rationale:** Composition over inheritance increases flexibility, reduces coupling, enables runtime behavior changes, and simplifies testing through dependency injection and mocking.

### IV. Quality Baseline (NON-NEGOTIABLE)

Untestable code is considered incomplete. New core business logic MUST include corresponding unit tests with a target test coverage of 80%. Test code quality is held to the same standards as production code. Integration tests are required for cross-component interactions.

**Rationale:** Comprehensive testing ensures correctness, enables safe refactoring, documents expected behavior, and reduces regression risk during maintenance and enhancement cycles.

### V. Language Governance

When tool defaults or framework conventions conflict with team communication needs, English takes precedence. Documentation, comments, variable names, and error messages MUST use clear, concise English. Technical accuracy is paramount, but accessibility to the broader team is essential.

**Rationale:** Consistent language usage reduces cognitive overhead, enables knowledge sharing across diverse team members, and facilitates onboarding of new developers regardless of their primary language.

### VI. Constitutional Supremacy

This Constitution is the highest governing protocol. In case of conflict with efficiency goals, tool defaults, framework conventions, or any other rule, this Constitution prevails. All team members MUST understand and uphold these principles.

**Rationale:** Establishing clear, non-negotiable principles creates consistency, reduces decision fatigue, enables autonomous work within defined boundaries, and ensures long-term architectural integrity.

## Development Standards

### Code Quality & Review
- All code changes MUST pass automated linting and type checking
- Pull requests MUST include tests for new functionality
- Code reviews MUST verify constitutional compliance
- Technical debt MUST be documented and prioritized

### Testing Strategy
- Unit tests: Isolated business logic testing (80% coverage target)
- Integration tests: Cross-component interaction validation
- Contract tests: API/interface compatibility verification
- Performance tests: For performance-critical paths

## Governance

### Amendment Procedure
1. Proposed amendments MUST be documented with rationale and impact analysis
2. Amendments require team consensus or designated approver approval
3. Version MUST be incremented according to semantic versioning
4. All dependent templates and documentation MUST be updated

### Compliance Enforcement
- All PRs/reviews MUST verify constitutional compliance
- Complexity additions MUST be justified against principles
- Violations MUST be caught during code review or CI/CD pipelines
- Regular architecture reviews assess ongoing compliance

### Versioning Policy
- **MAJOR**: Backward incompatible governance/principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance  
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date unknown | **Last Amended**: 2026-04-03