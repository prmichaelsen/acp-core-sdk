# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.16.0] - 2026-02-27

### Added
- Integration Guides (Task 16, M3) in `docs/guides/`
  - `docs/guides/rest-integration.md` — full Express wiring: `UserRepository` → `UserService` → `userRoutes` → `errorHandler`; curl verification; customization (new routes, auth middleware)
  - `docs/guides/mcp-integration.md` — `McpServer` + `StdioServerTransport` wiring; Claude Desktop config; `ToolCapture` testing; stderr-only logging rule
  - `docs/guides/cli-integration.md` — Commander wiring; exit codes 0/1/2; shell composability (piping, stderr/stdout separation); `jest.spyOn` testing
  - `docs/guides/client-integration.md` — `createClient` and `createUserClient` usage; `Result<T,E>` response handling; pagination loop; `http.createServer` + port 0 testing
  - `docs/guides/multi-target.md` — Option A (separate entry points), Option B (single binary with mode flag), Option C (CLI → REST client); graceful shutdown across all targets; anti-patterns
- `docs/README.md` nav table updated with all 5 integration guides

## [1.15.0] - 2026-02-27

### Added
- API Documentation (Task 15, M3) in `docs/api/`
  - `docs/api/types.md` — `Result<T,E>`, combinators (`mapOk`, `andThen`, `tryCatch`), branded types, `User`/`UserDTO`/`toUserDTO`, `PaginatedResult`, `AppError` hierarchy, `HTTP_STATUS`, `isAppError`
  - `docs/api/services.md` — `BaseService<TConfig>` (constructor, lifecycle hooks), `Logger` interface, `UserRepository` interface (all 4 methods), `UserService` (findUser, createUser, listUsers, parseUserId), `ServiceConfig`
  - `docs/api/configuration.md` — all Zod schemas, layer-scoped config slices, `loadConfig()`, `createTestConfig(overrides?)`, complete environment variable reference table
  - `docs/api/adapters.md` — `userRoutes`, `errorHandler`, `registerUserTools`, `registerUserCommands`, `createClient`/`createUserClient`/`UserClient` with HTTP response mapping
  - `docs/api/testing.md` — `MockUserRepository` (`reset`/`seed`/`all`), `createTestConfig`, `ToolCapture` pattern for MCP testing, CLI test strategy with `jest.spyOn`, test isolation rules

## [1.14.0] - 2026-02-27

### Added
- Usage Documentation (Task 14, M3) in `docs/`
  - `docs/README.md` — documentation hub: nav table, architecture ASCII diagram, "what you get" summary
  - `docs/getting-started.md` — prerequisites, manual install steps, config env var reference, project structure
  - `docs/quick-start.md` — 15-minute walkthrough: `TodoService` + routes + Express server with curl test commands
  - `docs/guides/pattern-selection.md` — by-problem guide for all core patterns + decision tree
  - `docs/guides/best-practices.md` — `Result<T,E>`, error classes, service boundaries, DTOs, testing
  - `docs/guides/migration.md` — before/after for 5 scenarios: try/catch → Result, ad-hoc errors → AppError, config, God service → repository interface, fat routes → adapter pattern
  - `docs/guides/pitfalls.md` — 8 common mistakes with fixes and quick-reference table
  - `docs/guides/faq.md` — 20+ Q&A across general, Result, errors, config, adapters, testing, deployment

## [1.13.0] - 2026-02-27 — Milestone 2 Complete

### Added
- Example Documentation (Task 13) — `agent/files/README.md` fully updated
  - Directory structure expanded to include `src/client/` and `examples/`
  - **REST Client section**: `createClient({ baseUrl })` aggregator usage, `Result<T,E>` return types
  - **Examples section** for all three server adapters:
    - REST: endpoint table, how to run `server.ts` + `client-usage.ts`
    - MCP: tool table, how to run, Claude Desktop config entry
    - CLI: command examples, exit code convention, shell-composability
  - **Integration Tests section**: per-adapter test strategy, how to run
  - Installation section updated with `examples/` copy step + full dependency list

### Milestone 2 Complete

All 7 tasks complete — working examples for all deployment targets:
- Task 7: Shared core library (`src/types/`, `src/errors/`, `src/config/`, `src/services/`)
- Task 8: REST server example (`examples/rest/`)
- Task 9: REST client library (`src/client/`) with `createClient()` aggregator
- Task 10: MCP server example (`examples/mcp/`)
- Task 11: CLI tool example (`examples/cli/`)
- Task 12: Integration tests (`examples/test/`)
- Task 13: Documentation (`agent/files/README.md`)

## [1.12.0] - 2026-02-27

### Added
- Example Integration Testing (Task 12) in `agent/files/examples/test/`
  - `examples/test/user.repository.mock.ts` — `MockUserRepository` with `reset()`, `seed()`, `all()` — reusable across all test files; no real database
  - `examples/test/rest.integration.spec.ts` — supertest against Express app; covers GET/:id (200/404/400), POST (201/400/409), GET with filters, error handler 500, POST→GET round-trip; `UserClient` round-trip via `http.createServer` + port 0
  - `examples/test/mcp.integration.spec.ts` — `ToolCapture` shim intercepts `server.tool()` registrations; calls handlers directly; covers success + `McpError` error cases for all 3 tools
  - `examples/test/cli.integration.spec.ts` — `jest.spyOn(process.stdout/stderr/exit)` + `program.parseAsync`; covers success output, error stderr, exit codes 0/1 for all 3 commands

## [1.11.0] - 2026-02-27

### Added
- CLI Tool Example (Task 11) in `agent/files/examples/cli/`
  - `examples/cli/user.commands.ts` — `registerUserCommands(program, service)` registering three Commander commands:
    - `user get <id>` — calls `service.findUser(id)`, prints `UserDTO` JSON or error + exit 1
    - `user create <email> <name> [--role]` — calls `service.createUser(input)`, prints created `UserDTO`
    - `user list [--role] [--cursor] [--limit] [--json]` — calls `service.listUsers(opts)`, prints table (default) or JSON
  - `examples/cli/program.ts` — Commander program bootstrap: loads config, wires `UserService`, calls `registerUserCommands`, parses `process.argv`
- CLI exit code convention: 0 on success, 1 on application error (`AppError`), 2 on usage/config error
- Success output to stdout, errors to stderr — shell-composable; `--json` flag for machine-readable output

## [1.10.0] - 2026-02-27

### Added
- MCP Server Example (Task 10) in `agent/files/examples/mcp/`
  - `examples/mcp/user.tools.ts` — `registerUserTools(server, service)` registering three MCP tools:
    - `get_user` — calls `service.findUser(id)`, returns `UserDTO` JSON or `McpError(InvalidParams)`
    - `create_user` — calls `service.createUser(input)`, returns `UserDTO` or `McpError` on validation/conflict
    - `list_users` — calls `service.listUsers(opts)`, returns paginated `UserDTO[]` with cursor
  - `examples/mcp/server.ts` — `McpServer` wiring `UserService` to tools, `StdioServerTransport`, graceful SIGTERM/SIGINT shutdown; logs to stderr (not stdout) to avoid corrupting MCP protocol
- `AppError` kinds mapped to `McpError` codes via `MCP_CODE_MAP`: validation/not_found → `InvalidParams`, auth errors → `InvalidRequest`, system errors → `InternalError`

## [1.9.0] - 2026-02-27

### Added
- REST Client Library (Task 9) in `agent/files/src/client/`
  - `src/client/user.client.ts` — `createUserClient(baseUrl, init?)` factory returning typed methods:
    - `getUser(id)` → `Promise<Result<UserDTO, NotFoundError | ValidationError>>`
    - `createUser(input)` → `Promise<Result<UserDTO, ValidationError | ConflictError>>`
    - `listUsers(opts?)` → `Promise<PaginatedResult<UserDTO>>`
  - `src/client/index.ts` — top-level `createClient({ baseUrl, init? })` aggregator + barrel re-export
  - `examples/rest/client-usage.ts` — runnable round-trip demo (create, fetch, list, error branches)
- `createClient({ baseUrl })` returns a namespaced `Client` object — `client.users.getUser(id)` — single init point for auth headers and base URL; consumers extend `Client` with additional service namespaces as their domain grows
- HTTP 4xx responses mapped back to typed `AppError` subclasses using the same `ErrorKind` discriminant as the server; uses native `fetch` (no extra dependencies, Node 18+)

## [1.8.0] - 2026-02-27

### Added
- REST Server Example files (Task 8) in `agent/files/examples/rest/`
  - `examples/rest/error-handler.ts` — centralized Express error handler using `isAppError()` + `HTTP_STATUS` map
  - `examples/rest/user.routes.ts` — route handlers for `GET /:id`, `POST /`, `GET /` using `Result<T,E>`
  - `examples/rest/server.ts` — Express app wiring `UserService` to routes with graceful shutdown and `InMemoryUserRepository` stub

## [1.7.1] - 2026-02-27

### Changed
- Revised M2 task plan: REST server examples go in `agent/files/examples/`, REST client goes in `agent/files/src/client/` (installable)
- Renamed task-8 to REST Server Example, task-9 to REST Client Library, task-10 to MCP Server Example, task-11 to CLI Tool Example
- Added `examples/` section to `package.yaml` templates (rest, mcp, cli, test utilities)
- Updated M2 milestone notes to document `src/` vs `examples/` file convention

### Added
- Task documents for tasks 8-13 with detailed file structure and acceptance criteria

## [1.7.0] - 2026-02-27

### Added
- Shared Core Library implementation files (Task 7 of Milestone 2)
  - Replaced Firebase-specific `agent/files/src/` with generic core-sdk example files
  - `src/types/result.types.ts` — `Result<T,E>`, `ok`, `err`, `isOk`, `isErr`, combinators
  - `src/types/utils.types.ts` — `DeepPartial`, `Nullable`, `Maybe`, `Immutable`, `RequireFields`
  - `src/types/shared.types.ts` — Branded types (`UserId`, `EmailAddress`), `User` entity, `UserDTO`, `PaginatedResult`
  - `src/errors/base.error.ts` — `AppError` abstract base class with `ErrorKind` discriminant
  - `src/errors/app-errors.ts` — All 8 typed error subclasses (`ValidationError`, `NotFoundError`, etc.)
  - `src/errors/index.ts` — Barrel re-export with `AppErrorUnion`, `HTTP_STATUS`, `isAppError()`
  - `src/config/schema.ts` — Zod config schemas, inferred types, layer-scoped slices, `createTestConfig()`
  - `src/config/loader.ts` — `loadConfig()` with env var merging and Zod validation
  - `src/services/base.service.ts` — `BaseService<TConfig>` with lifecycle hooks
  - `src/services/user.service.ts` — `UserService` example using `Result<T,E>` and typed errors
  - Updated `agent/files/README.md` with new structure and customization guide
  - Updated `package.yaml` templates section to reference all new files

### Removed
- Firebase/Firestore-specific example files (replaced by generic core-sdk examples)

## [1.6.0] - 2026-02-27

### Added
- Pattern Validation completing Milestone 1 (Core Patterns & Templates)
  - Added `## Anti-Patterns` sections to 4 adapter patterns (`adapter-mcp`, `adapter-rest`, `adapter-cli`, `adapter-client`)
  - Updated `README.md` with all 25 patterns organized across 5 categories
  - Verified all cross-references — 25/25 patterns have valid related-pattern links
- Milestone 1 complete: 6/6 tasks, 25/25 patterns created and validated

## [1.5.0] - 2026-02-27

### Added
- Type System Patterns (5 comprehensive patterns)
  - `core-sdk.types-shared.md` - Branded primitives (`UserId`, `Money`), DTOs, pagination types, and DTO transformers
  - `core-sdk.types-config.md` - Zod-derived config types, layer-scoped slices (`ServiceConfig`, `AdapterConfig`), type guards
  - `core-sdk.types-generic.md` - `DeepPartial`, `Nullable`, `Maybe`, `RequireFields`, `Immutable`, `tryCatch` utilities
  - `core-sdk.types-error.md` - Discriminated union error hierarchy, `isAppError()` guard, HTTP/MCP status mapping
  - `core-sdk.types-result.md` - `Result<T,E>`, `ok`/`err` constructors, `mapOk`, `andThen`, `tryCatchAsync`
- Completed Task 5 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with 5 new type system patterns
- Milestone 1 now 83% complete (5/6 tasks done, 25/25 patterns created)

## [1.4.0] - 2026-02-27

### Added
- Testing Patterns (5 comprehensive patterns)
  - `core-sdk.testing-unit.md` - Jest unit tests with `jest.config.js` and colocated `.spec.ts`
  - `core-sdk.testing-integration.md` - Integration tests with `.integration.spec.ts` naming
  - `core-sdk.testing-mocks.md` - Typed mocks with `jest.Mocked<T>` and `__mocks__/` factories
  - `core-sdk.testing-fixtures.md` - Fixture factories in colocated `.fixtures.ts` files
  - `core-sdk.testing-coverage.md` - Coverage thresholds, `lcov` reporting, and CI enforcement
- Completed Task 4 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with 5 new testing patterns
- Milestone 1 now 67% complete (4/6 tasks done)

## [1.3.1] - 2026-02-27

### Changed
- `core-sdk.config-loading.md` - Switched config file format from JSON to YAML (`js-yaml` parse, `*.yaml` filenames)
- `core-sdk.config-multi-env.md` - Switched config file examples from JSON objects to YAML files; updated loader to use `js-yaml`

## [1.3.0] - 2026-02-27

### Added
- Configuration Patterns (5 comprehensive patterns)
  - `core-sdk.config-schema.md` - Type-safe configuration schema with Zod, composition, and custom validation
  - `core-sdk.config-environment.md` - Environment variable mapping with `EnvMapper`, type coercion, and auto-documentation
  - `core-sdk.config-loading.md` - Layered config loading (defaults → file → env → CLI) with hot reload support
  - `core-sdk.config-secrets.md` - `Secret<T>` wrapper preventing log exposure, file/vault loading, and rotation
  - `core-sdk.config-multi-env.md` - Environment inheritance model for dev/staging/prod with feature flags
- Completed Task 3 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with 5 new configuration patterns
- Milestone 1 now 50% complete (3/6 tasks done)

## [1.2.0] - 2026-02-26

### Added
- Adapter Layer Patterns (5 comprehensive patterns)
  - `core-sdk.adapter-base.md` - Base adapter class with lifecycle management
  - `core-sdk.adapter-mcp.md` - MCP server adapter for AI agent integration
  - `core-sdk.adapter-rest.md` - REST API adapter with Express support
  - `core-sdk.adapter-cli.md` - CLI tool adapter with Commander support
  - `core-sdk.adapter-client.md` - Client library adapter for direct integration
- Completed Task 2 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with 5 new adapter patterns
- Updated README.md with adapter pattern documentation
- Milestone 1 now 33% complete (2/6 tasks done)

## [1.1.0] - 2026-02-26

### Added
- Service Layer Patterns (5 comprehensive patterns)
  - `core-sdk.service-base.md` - Base service class with lifecycle management
  - `core-sdk.service-interface.md` - Service interfaces for dependency injection
  - `core-sdk.service-container.md` - DI container for service management
  - `core-sdk.service-error-handling.md` - Custom error classes and error handling
  - `core-sdk.service-logging.md` - Structured logging pattern
- Completed Task 1 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with pattern entries
- Updated README.md with pattern documentation

## [1.0.0] - 2026-02-26

### Added
- Initial release
- Package structure created with full ACP installation
