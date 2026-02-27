# Task 17: Testing Infrastructure

**Milestone**: M3 — Documentation & Testing
**Status**: in_progress
**Estimated Hours**: 10-14

## Objective

Create reusable test utilities, fixtures, and helpers that consumers can copy into their projects to bootstrap testing quickly.

## Files to Create

- `agent/files/src/testing/fixtures.ts` — shared User fixtures (seeded users with known IDs, emails, roles)
- `agent/files/src/testing/helpers.ts` — `makeTestService()`, `makeTestApp()`, `makeTestProgram()` factory helpers
- `agent/files/src/testing/index.ts` — barrel re-export
- `agent/files/examples/test/helpers.ts` — shared test setup (mockLogger, ToolCapture class, run() helper)

## Requirements

- All test utilities must be self-contained (no real DB, no env vars, no network)
- Fixtures must use stable IDs and emails (not random/timestamp-based) for predictable assertions
- Factory helpers must accept overrides via `DeepPartial<>`
- `makeTestApp()` returns `{ app, repo, service }` — usable by both supertest and UserClient tests
- Must work with `createTestConfig()` from `src/config/`

## Verification

- [ ] All 4 files created
- [ ] Fixtures export at least 3 seeded user objects with distinct roles
- [ ] `makeTestService()` wires MockUserRepository + UserService + createTestConfig
- [ ] `makeTestApp()` returns usable Express app with routes + error handler
- [ ] `makeTestProgram()` returns usable Commander program with user commands
- [ ] `ToolCapture` exported from helpers for MCP tests
- [ ] All exports documented with JSDoc
