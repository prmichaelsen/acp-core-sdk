# Task 7: Shared Core Library

**Milestone**: M2 - Example Implementations
**Status**: In Progress
**Created**: 2026-02-27

---

## Objective

Implement the shared core library files that all deployment-specific examples (MCP, REST, CLI, client) build on. These files live in `agent/files/src/` and are installed into consumer projects via the ACP package install mechanism.

## Approach

Use the `agent/files/` directory to bundle pre-filled TypeScript source files alongside the pattern documentation. This allows consumers to install working example code directly into their projects — not just read about patterns, but start with a working foundation.

## Files to Create

### Type System (`agent/files/src/types/`)

- **`result.types.ts`** — `Result<T, E>`, `Ok<T>`, `Err<E>`, `ok()`, `err()`, `isOk()`, `isErr()`, combinators (`mapOk`, `mapErr`, `andThen`, `getOrElse`, `tryCatch`, `tryCatchAsync`)
- **`utils.types.ts`** — `DeepPartial<T>`, `Nullable<T>`, `Optional<T>`, `Maybe<T>`, `RequireFields<T, K>`, `OptionalFields<T, K>`, `Immutable<T>`, `AsyncReturnType<T>`
- **`shared.types.ts`** — Branded primitives (`UserId`, `EmailAddress`, `Timestamp`), `PaginatedResult<T>`, `UserDTO`, `User` entity, `CreateUserInput`
- **`index.ts`** — Barrel re-exports for all types

### Error Hierarchy (`agent/files/src/errors/`)

- **`base.error.ts`** — `ErrorKind`, `ErrorContext`, `AppError` abstract base class
- **`app-errors.ts`** — `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `RateLimitError`, `ExternalError`, `InternalError`
- **`index.ts`** — Barrel re-exports + `AppErrorUnion`, `isAppError()`

### Configuration (`agent/files/src/config/`)

- **`schema.ts`** — `DatabaseConfigSchema`, `ServerConfigSchema`, `LoggingConfigSchema`, `AppConfigSchema`, derived types via `z.infer`
- **`loader.ts`** — `loadConfig()`, `createTestConfig()`
- **`index.ts`** — Barrel re-exports

### Services (`agent/files/src/services/`)

- **`base.service.ts`** — `BaseService` abstract class with lifecycle (`initialize`, `shutdown`), config, and logger
- **`user.service.ts`** — Example `UserService` implementing `findUser()`, `createUser()`, `listUsers()` using `Result<T, E>` pattern
- **`index.ts`** — Barrel re-exports

## Files to Remove (Obsolete Firebase-Specific Files)

Replace existing Firebase/Firestore-specific files in `agent/files/src/` with generic core-sdk examples:

- `src/client.ts` — Firebase client wrapper (remove)
- `src/constant/collections.ts` — Firestore collection helpers (remove)
- `src/dto/example.dto.ts` — Firebase-specific DTO (remove)
- `src/dto/index.ts` — Firebase DTO barrel (remove)
- `src/dto/transformers.ts` — Firebase DTO transformers (remove)
- `src/errors/task-errors.ts` — Firebase task errors (replace with generic errors)
- `src/errors/task-errors.spec.ts` — Firebase error tests (remove)
- `src/errors/index.ts` — Firebase error barrel (replace)
- `src/schemas/example.schema.ts` — Keep schema pattern but update
- `src/services/example.service.ts` — Firebase service (replace with UserService)

## Acceptance Criteria

- [ ] All type files created and compile correctly
- [ ] Error hierarchy covers all 8 error kinds from M1 patterns
- [ ] Config schema uses Zod with inferred types (never written manually)
- [ ] BaseService provides initialize/shutdown lifecycle + config + logger
- [ ] UserService demonstrates Result<T,E> pattern for findUser, createUser, listUsers
- [ ] All barrel exports provide clean public API surface
- [ ] package.yaml templates section updated to reference new files
- [ ] agent/files/README.md updated with new structure
- [ ] Old Firebase-specific files removed

---

**Related Patterns**:
- [Result Types](../../patterns/core-sdk.types-result.md)
- [Error Types](../../patterns/core-sdk.types-error.md)
- [Service Base](../../patterns/core-sdk.service-base.md)
- [Config Schema](../../patterns/core-sdk.config-schema.md)
- [Generic Utility Types](../../patterns/core-sdk.types-generic.md)
