# Core SDK — Template Files

This directory contains pre-filled TypeScript source files that implement the core-sdk patterns. Install these into your project to start with a working foundation instead of building from scratch.

## Directory Structure

```
agent/files/
├── config/                          # Project configuration files
│   ├── package.json.template        # npm package with subpath exports
│   ├── tsconfig.json                # TypeScript: ESM, strict, declarations
│   ├── jest.config.js               # Jest: ESM + TypeScript + colocated tests
│   ├── esbuild.build.js             # esbuild: multiple entry points
│   ├── esbuild.watch.js             # esbuild: watch mode for development
│   ├── gitignore.template           # Git ignore rules
│   └── npmignore.template           # npm ignore rules
│
└── src/                             # Source code templates
    ├── types/
    │   ├── result.types.ts          # Result<T,E>, ok, err, combinators
    │   ├── utils.types.ts           # DeepPartial, Nullable, Maybe, Immutable
    │   ├── shared.types.ts          # Branded types, User entity, DTOs, pagination
    │   └── index.ts                 # Barrel re-export
    │
    ├── errors/
    │   ├── base.error.ts            # AppError abstract base class
    │   ├── app-errors.ts            # Typed error subclasses (8 kinds)
    │   └── index.ts                 # Barrel re-export + AppErrorUnion + HTTP_STATUS
    │
    ├── config/
    │   ├── schema.ts                # Zod schemas + inferred types + test helper
    │   ├── loader.ts                # loadConfig (env var merging + validation)
    │   └── index.ts                 # Barrel re-export
    │
    └── services/
        ├── base.service.ts          # BaseService abstract class with lifecycle
        ├── user.service.ts          # UserService: Result<T,E> + validation example
        └── index.ts                 # Barrel re-export
```

## What Each File Provides

### Configuration Files (`config/`)

| File | Purpose |
|------|---------|
| `package.json.template` | npm package with 6 subpath exports for tree-shaking |
| `tsconfig.json` | TypeScript strict mode, ESM, declaration generation |
| `jest.config.js` | Jest with `ts-jest`, `extensionsToTreatAsEsm`, colocated `.spec.ts` files |
| `esbuild.build.js` | Bundle multiple entry points to `dist/` |
| `esbuild.watch.js` | Watch mode for development |
| `gitignore.template` | Node.js `.gitignore` rules |
| `npmignore.template` | Exclude `src/`, `agent/`, tests from published package |

### Type System (`src/types/`)

- **`result.types.ts`** — `Result<T, E>` discriminated union with `ok()`, `err()`, `isOk()`, `isErr()`, and combinators (`mapOk`, `mapErr`, `andThen`, `getOrElse`, `tryCatch`, `tryCatchAsync`). Use for operations where failure is expected.

- **`utils.types.ts`** — Generic type utilities: `DeepPartial<T>` for test fixtures, `Nullable<T>` / `Maybe<T>` for optional fields, `Immutable<T>` for config objects, `RequireFields<T, K>` for endpoint-specific inputs.

- **`shared.types.ts`** — Branded primitive types (`UserId`, `EmailAddress`, `Timestamp`) that prevent mixing semantically different strings at compile time. Also includes the `User` entity, `UserDTO` (API response shape), `PaginatedResult<T>`, and their factory/transformer functions.

### Error Hierarchy (`src/errors/`)

- **`base.error.ts`** — `AppError` abstract base class with `kind` discriminant, `context` bag, and `toJSON()`. All application errors extend this.

- **`app-errors.ts`** — Eight typed error classes: `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `RateLimitError`, `ExternalError`, `InternalError`. Each has typed constructor parameters and a `kind` literal.

- **`index.ts`** — Barrel re-export plus `AppErrorUnion` (the discriminated union type), `HTTP_STATUS` (the kind → HTTP status code map), and `isAppError()` type guard.

### Configuration (`src/config/`)

- **`schema.ts`** — Zod schemas for `Database`, `Server`, `Logging`, and `App` config. Types are always derived via `z.infer<>` — never written manually. Includes layer-scoped slices (`ServiceConfig`, `AdapterConfig`) and a `createTestConfig()` helper for tests.

- **`loader.ts`** — `loadConfig()` merges environment variables (highest priority) on top of a raw config object, then validates through the Zod schema. Call once at startup.

### Service Layer (`src/services/`)

- **`base.service.ts`** — `BaseService<TConfig>` abstract class. Provides constructor injection of config + logger, `initialize()` and `shutdown()` lifecycle hooks, and `this.name` from the class name.

- **`user.service.ts`** — `UserService` example implementing `findUser()`, `createUser()`, `listUsers()`, and `parseUserId()`. Demonstrates `Result<T, E>` for expected failures, typed error subclasses, and the `UserRepository` interface (inject a real DB adapter or a mock in tests).

## Installation

### With ACP Package Install (coming soon)

```bash
@acp.package-install --repo https://github.com/prmichaelsen/acp-core-sdk.git
```

### Manual Installation

Copy configuration files:

```bash
cp agent/files/config/tsconfig.json ./
cp agent/files/config/jest.config.js ./
cp agent/files/config/esbuild.build.js ./
cp agent/files/config/esbuild.watch.js ./
cp agent/files/config/gitignore.template ./.gitignore
cp agent/files/config/npmignore.template ./.npmignore
```

Customize `package.json.template`:
- Replace `{{PACKAGE_NAME}}`, `{{PACKAGE_DESCRIPTION}}`, `{{AUTHOR_NAME}}`

Copy source files:

```bash
cp -r agent/files/src/* ./src/
```

Install dependencies:

```bash
npm install zod
npm install --save-dev typescript jest ts-jest @types/jest esbuild
```

## Customization Guide

### Adapting to Your Domain

The `src/types/shared.types.ts` and `src/services/user.service.ts` files use a `User` domain as an example. To adapt to your domain:

1. **Rename types**: Replace `User`, `UserId`, `UserDTO`, `UserRepository` with your domain entity
2. **Update `CreateUserInput`**: Add the fields your entity needs
3. **Update `UserService`**: Add your business logic methods, keep the `Result<T, E>` pattern
4. **Implement `UserRepository`**: Write a concrete implementation for your database (Firestore, Postgres, etc.)

### Adding Error Kinds

To add new error types:

1. Add a `kind` to `ErrorKind` in `src/errors/base.error.ts`
2. Add a class to `src/errors/app-errors.ts`
3. Add it to `AppErrorUnion` and `HTTP_STATUS` in `src/errors/index.ts`
4. Re-export from `src/errors/index.ts`

## Related Patterns

See the pattern documentation in `agent/patterns/` for detailed rationale and usage guidelines:

- [Result Types](../patterns/core-sdk.types-result.md)
- [Error Types](../patterns/core-sdk.types-error.md)
- [Service Base](../patterns/core-sdk.service-base.md)
- [Config Schema](../patterns/core-sdk.config-schema.md)
- [Shared Types](../patterns/core-sdk.types-shared.md)
- [Generic Utility Types](../patterns/core-sdk.types-generic.md)
