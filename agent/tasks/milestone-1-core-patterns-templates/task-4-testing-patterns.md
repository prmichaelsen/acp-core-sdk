# Task 4: Testing Patterns

**Milestone**: [M1 - Core Patterns & Templates](../../milestones/milestone-1-core-patterns-templates.md)
**Estimated Time**: 6-8 hours
**Dependencies**: Task1 (Service Layer Patterns), Task2 (Adapter Layer Patterns), Task3 (Configuration Patterns)
**Status**: In Progress

---

## Objective

Create 5 comprehensive testing patterns that establish best practices for testing reusable core libraries. These patterns use Jest with colocated `.spec.ts` files and cover unit testing, integration testing, mocks/stubs, test fixtures, and coverage configuration.

---

## Context

Testing is essential for ensuring core library reliability across all deployment targets. Since the core library is shared by MCP servers, REST APIs, CLI tools, and client applications, it must be thoroughly tested in isolation. Proper testing patterns ensure:

- Business logic is verified independently of deployment targets
- Tests are colocated with the code they test
- Mocks and fixtures are reusable across test files
- Coverage requirements are enforced consistently

**Testing conventions for this project**:
- Test runner: **Jest**
- Config: **`jest.config.js`** (at project root)
- Test files: **colocated `.spec.ts`** files alongside source
- Example: `src/services/user.service.ts` → `src/services/user.service.spec.ts`

---

## Steps

### 1. Create Unit Testing Pattern

Create `agent/patterns/core-sdk.testing-unit.md`:
- Define pattern for unit testing service classes
- Show jest.config.js setup with TypeScript and ESM support
- Document colocated .spec.ts file structure
- Provide examples for testing service methods in isolation

### 2. Create Integration Testing Pattern

Create `agent/patterns/core-sdk.testing-integration.md`:
- Define pattern for integration tests across multiple units
- Show how to test service + adapter interactions
- Document test lifecycle (setup/teardown) patterns
- Provide examples for end-to-end service flows

### 3. Create Mocks and Stubs Pattern

Create `agent/patterns/core-sdk.testing-mocks.md`:
- Define pattern for creating typed mocks and stubs
- Show Jest mock factories for services and adapters
- Document spy patterns for method call verification
- Provide examples for mocking external dependencies

### 4. Create Test Fixtures Pattern

Create `agent/patterns/core-sdk.testing-fixtures.md`:
- Define pattern for reusable test data and fixtures
- Show fixture factory functions and builders
- Document fixture file organization alongside source
- Provide examples for typed fixture creation

### 5. Create Coverage Pattern

Create `agent/patterns/core-sdk.testing-coverage.md`:
- Define pattern for configuring Jest coverage thresholds
- Show jest.config.js coverage configuration
- Document coverage reporting and CI integration
- Provide examples for coverage enforcement

---

## Verification

- [ ] All 5 pattern files created in `agent/patterns/`
- [ ] Each pattern uses Jest with jest.config.js
- [ ] Each pattern shows colocated .spec.ts files
- [ ] Each pattern includes TypeScript code examples
- [ ] Each pattern has clear usage guidelines
- [ ] Each pattern identifies anti-patterns
- [ ] progress.yaml updated with task completion

---

## Notes

- All patterns use `jest.config.js` (not `.ts` or JSON)
- Test files are always colocated: `foo.ts` → `foo.spec.ts`
- No `__tests__/` directories — keep tests next to source
- Follow the pattern format from existing service/config patterns

---

**Next Task**: [Task5 - Type System Patterns](task-5-type-system-patterns.md)
