# Task 12: Example Integration Testing

**Milestone**: M2 - Example Implementations
**Status**: Not Started
**Created**: 2026-02-27

---

## Objective

Write integration tests that validate all examples compose correctly with the shared core library. Tests live in `agent/files/examples/` alongside the examples they test. Uses an in-memory `UserRepository` (no real database) so tests run without external dependencies.

## File Structure

```
agent/files/examples/
├── test/
│   ├── user.repository.mock.ts       # In-memory UserRepository for tests
│   ├── rest.integration.spec.ts      # REST server + client round-trip tests
│   ├── mcp.integration.spec.ts       # MCP tool registration + handler tests
│   └── cli.integration.spec.ts       # Commander command handler tests
```

## Design

### In-Memory Repository (`user.repository.mock.ts`)

Implements `UserRepository` using a `Map<UserId, User>`. Pre-seeded with fixture data. Reusable across all integration test files.

### REST Integration Tests (`rest.integration.spec.ts`)

Uses `supertest` against the Express app from Task 8:
- `GET /api/users/:id` — 200 with UserDTO, 404 for unknown
- `POST /api/users` — 201 with UserDTO, 400 on validation, 409 on conflict
- `GET /api/users` — 200 with paginated list
- Error handler — unknown errors return 500 without stack trace

Also tests the `UserClient` (Task 9) against a live `supertest` server — verifies the client correctly maps HTTP responses back to `Result<T, E>`.

### MCP Integration Tests (`mcp.integration.spec.ts`)

Tests tool handlers directly (not through full MCP transport):
- Each tool handler called with valid input → returns expected content
- Each tool handler called with invalid input → throws `McpError` with `InvalidParams`
- `not_found` error → `McpError` with `InvalidParams`

### CLI Integration Tests (`cli.integration.spec.ts`)

Tests command handlers directly (not through full Commander parse):
- `user get` with known ID → prints UserDTO to stdout
- `user get` with unknown ID → prints error to stderr, calls `process.exit(1)`
- `user create` with invalid email → prints validation error, exits 1
- `user list` → prints paginated output

## Acceptance Criteria

- [ ] All integration tests pass with the in-memory repository
- [ ] REST round-trip test: `POST /users` → `GET /users/:id` → same UserDTO
- [ ] Client maps 404 → `Err<NotFoundError>`, 409 → `Err<ConflictError>`
- [ ] MCP tool tests cover success + error cases for all 3 tools
- [ ] CLI tests cover success + error cases for all 3 commands
- [ ] Tests run with `npm test` via the jest.config.js from Task 7
- [ ] No real database, network calls, or file I/O in tests

---

**Related Patterns**:
- [Testing Integration](../../patterns/core-sdk.testing-integration.md)
- [Testing Mocks](../../patterns/core-sdk.testing-mocks.md)
- [Testing Fixtures](../../patterns/core-sdk.testing-fixtures.md)
