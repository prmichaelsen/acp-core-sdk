# API Reference: Types

Complete reference for all types and functions exported from `src/types/`.

---

## Result Types (`src/types/result.types.ts`)

### `Result<T, E>`

A discriminated union representing either success or failure. Use instead of throwing for expected failures.

```typescript
type Result<T, E = Error> = Ok<T> | Err<E>;
```

#### `Ok<T>`

```typescript
interface Ok<T> {
  readonly success: true;
  readonly value: T;
}
```

#### `Err<E>`

```typescript
interface Err<E> {
  readonly success: false;
  readonly error: E;
}
```

---

### `ok<T>(value: T): Ok<T>`

Construct a successful result.

```typescript
function ok<T>(value: T): Ok<T>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `T` | The success value |

**Returns**: `Ok<T>`

**Example**:
```typescript
return ok(user);           // Ok<User>
return ok({ count: 42 }); // Ok<{ count: number }>
```

---

### `err<E>(error: E): Err<E>`

Construct a failed result.

```typescript
function err<E>(error: E): Err<E>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `error` | `E` | The error value |

**Returns**: `Err<E>`

**Example**:
```typescript
return err(new NotFoundError('User', id));
return err(new ValidationError('Invalid input', { email: ['Required'] }));
```

---

### `isOk<T, E>(result: Result<T, E>): result is Ok<T>`

Type guard — checks if a Result is successful. Narrows the type to `Ok<T>` in the true branch.

```typescript
function isOk<T, E>(result: Result<T, E>): result is Ok<T>
```

**Example**:
```typescript
const result = await service.findUser(id);
if (isOk(result)) {
  // result.value is User — TypeScript knows this
  console.log(result.value.name);
}
```

---

### `isErr<T, E>(result: Result<T, E>): result is Err<E>`

Type guard — checks if a Result is a failure. Narrows the type to `Err<E>` in the true branch.

```typescript
function isErr<T, E>(result: Result<T, E>): result is Err<E>
```

---

### `mapOk<T, U, E>(result, fn): Result<U, E>`

Apply a transform to the `Ok` value; pass `Err` through unchanged.

```typescript
function mapOk<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>
```

**Example**:
```typescript
const dtoResult = mapOk(result, toUserDTO); // Result<UserDTO, E>
```

---

### `mapErr<T, E, F>(result, fn): Result<T, F>`

Apply a transform to the `Err` value; pass `Ok` through unchanged.

```typescript
function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>
```

---

### `andThen<T, U, E>(result, fn): Result<U, E>`

Chain two Result-returning operations (flatMap).

```typescript
function andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>
```

**Example**:
```typescript
const result = andThen(
  service.parseUserId(raw),           // Result<UserId, ValidationError>
  (id) => service.findUser(id)        // Result<User, NotFoundError>
); // Result<User, ValidationError | NotFoundError> — note: requires same E
```

---

### `getOrElse<T, E>(result, defaultValue): T`

Unwrap the `Ok` value, or return a default if `Err`.

```typescript
function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T
```

---

### `tryCatch<T, E>(fn, onError): Result<T, E>`

Wrap a synchronous function that might throw into one returning `Result`.

```typescript
function tryCatch<T, E = Error>(fn: () => T, onError: (e: unknown) => E): Result<T, E>
```

---

### `tryCatchAsync<T, E>(fn, onError): Promise<Result<T, E>>`

Wrap an async function that might throw into one returning `Promise<Result<T, E>>`.

```typescript
async function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>,
  onError: (e: unknown) => E
): Promise<Result<T, E>>
```

---

## Shared Domain Types (`src/types/shared.types.ts`)

### Branded Primitives

Branded types prevent mixing semantically different string values at compile time.

#### `UserId`

```typescript
type UserId = Brand<string, 'UserId'>;
```

#### `EmailAddress`

```typescript
type EmailAddress = Brand<string, 'EmailAddress'>;
```

#### `Timestamp`

```typescript
type Timestamp = Brand<string, 'Timestamp'>;
```

---

### `toUserId(value: string): UserId`

Cast a raw string to `UserId`. Throws if the string is empty or whitespace.

```typescript
function toUserId(value: string): UserId
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `string` | Non-empty user ID string |

**Throws**: `Error` if `value` is empty or whitespace-only.

**Example**:
```typescript
const id = toUserId('usr_abc123'); // UserId
toUserId('');  // throws Error('UserId must be a non-empty string')
toUserId(' '); // throws Error('UserId must be a non-empty string')
```

---

### `toEmailAddress(value: string): EmailAddress`

Cast a raw string to `EmailAddress`. Validates basic email format (must contain `@`).

```typescript
function toEmailAddress(value: string): EmailAddress
```

**Throws**: `Error` if `value` does not contain `@`.

---

### `toTimestamp(value: string): Timestamp`

Cast a raw string to `Timestamp`. Validates it is a parseable ISO 8601 date.

```typescript
function toTimestamp(value: string): Timestamp
```

**Throws**: `Error` if `Date.parse(value)` returns `NaN`.

---

### `User`

Internal domain entity. Never expose this directly in API responses — use `UserDTO`.

```typescript
interface User {
  id:        UserId;
  email:     EmailAddress;
  name:      string;
  role:      'admin' | 'member' | 'viewer';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### `UserDTO`

Safe API response shape. Omits internal fields like `updatedAt`.

```typescript
interface UserDTO {
  id:        string;
  email:     string;
  name:      string;
  role:      string;
  createdAt: string;
}
```

---

### `toUserDTO(user: User): UserDTO`

Transform an internal `User` entity to a `UserDTO` for API responses.

```typescript
function toUserDTO(user: User): UserDTO
```

**Example**:
```typescript
res.json(toUserDTO(result.value)); // always use DTO, never raw entity
```

---

### `CreateUserInput`

Input for creating a new user.

```typescript
interface CreateUserInput {
  email: string;
  name:  string;
  role?: 'admin' | 'member' | 'viewer';
}
```

`role` defaults to `'member'` when omitted.

---

### `ListUsersInput`

Input for listing users with optional filtering and pagination.

```typescript
interface ListUsersInput {
  role?:   'admin' | 'member' | 'viewer';
  cursor?: string;
  limit?:  number; // default: 20, max: 100
}
```

---

### `PaginatedResult<T>`

A paginated list of items with cursor-based navigation.

```typescript
interface PaginatedResult<T> {
  items:   T[];
  total:   number;
  cursor:  string | null; // null when no more pages
  hasMore: boolean;       // true when cursor is non-null
}
```

---

### `createPaginatedResult<T>(items, total, cursor): PaginatedResult<T>`

Create a `PaginatedResult` from repository output.

```typescript
function createPaginatedResult<T>(items: T[], total: number, cursor: string | null): PaginatedResult<T>
```

---

## Generic Utility Types (`src/types/utils.types.ts`)

### `DeepPartial<T>`

Recursively makes all properties optional. Useful for test overrides.

```typescript
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
```

**Example**:
```typescript
createTestConfig({ database: { port: 5433 } }); // overrides single field
```

---

### `Nullable<T>`

`T | null`

### `Optional<T>`

`T | undefined`

### `Maybe<T>`

`T | null | undefined`

### `Immutable<T>`

Recursively marks all properties `readonly`. Useful for config objects.

### `RequireFields<T, K extends keyof T>`

Makes the specified keys required on an otherwise partial type.

### `OptionalFields<T, K extends keyof T>`

Makes the specified keys optional on an otherwise required type.

### `Values<T>`

Extract the value types of an object: `T[keyof T]`.

### `Constructor<T>`

Type of a class constructor: `new (...args: any[]) => T`.

---

## Error Types (`src/errors/`)

### `AppError`

Abstract base class for all application errors.

```typescript
abstract class AppError extends Error {
  abstract readonly kind: string;
  readonly context: Record<string, unknown>;

  toJSON(): { kind: string; message: string; context: Record<string, unknown> };
}
```

### Concrete Error Classes

| Class | `kind` | HTTP | Constructor |
|-------|--------|------|-------------|
| `ValidationError` | `'validation'` | 400 | `(message, fields?: Record<string, string[]>)` |
| `NotFoundError` | `'not_found'` | 404 | `(resource: string, id: string)` |
| `UnauthorizedError` | `'unauthorized'` | 401 | `(message?: string)` |
| `ForbiddenError` | `'forbidden'` | 403 | `(message?, requiredRole?)` |
| `ConflictError` | `'conflict'` | 409 | `(message, context?)` |
| `RateLimitError` | `'rate_limit'` | 429 | `(retryAfterSeconds: number)` |
| `ExternalError` | `'external'` | 502 | `(message, service: string)` |
| `InternalError` | `'internal'` | 500 | `(message?)` |

### `AppErrorUnion`

Discriminated union of all error classes:

```typescript
type AppErrorUnion =
  | ValidationError | NotFoundError | UnauthorizedError | ForbiddenError
  | ConflictError | RateLimitError | ExternalError | InternalError;
```

### `HTTP_STATUS`

Maps error `kind` to HTTP status code:

```typescript
const HTTP_STATUS: Record<AppErrorUnion['kind'], number> = {
  validation:   400,
  not_found:    404,
  unauthorized: 401,
  forbidden:    403,
  conflict:     409,
  rate_limit:   429,
  external:     502,
  internal:     500,
};
```

### `isAppError(value: unknown): value is AppErrorUnion`

Type guard that returns `true` when `value` is an `AppError` instance.

```typescript
function isAppError(value: unknown): value is AppErrorUnion
```

**Example**:
```typescript
if (isAppError(err)) {
  res.status(HTTP_STATUS[err.kind]).json({ error: { kind: err.kind, message: err.message } });
}
```
