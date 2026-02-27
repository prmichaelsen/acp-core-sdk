# API Reference: Services

Complete reference for `src/services/`.

---

## `BaseService<TConfig>` (`src/services/base.service.ts`)

Abstract base class for all services. Provides constructor injection of config and logger, and lifecycle hooks.

```typescript
abstract class BaseService<TConfig> {
  protected readonly config: TConfig;
  protected readonly logger: Logger;
  protected readonly name: string; // class name, e.g., 'UserService'

  constructor(config: TConfig, logger: Logger);

  async initialize(): Promise<void>;
  async shutdown(): Promise<void>;

  protected onInitialize(): Promise<void>;
  protected onShutdown(): Promise<void>;
}
```

### Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `TConfig` | Layer-scoped config slice (e.g., `ServiceConfig`) |
| `logger` | `Logger` | Structured logger instance |

### `initialize(): Promise<void>`

Call at application startup before accepting traffic. Calls `onInitialize()`.

```typescript
await service.initialize();
app.listen(port); // only listen after service is ready
```

### `shutdown(): Promise<void>`

Call during graceful shutdown. Calls `onShutdown()`.

```typescript
process.on('SIGTERM', async () => {
  await service.shutdown();
  process.exit(0);
});
```

### `onInitialize(): Promise<void>` (protected, override)

Override to run startup logic: connect to databases, warm caches, validate dependencies.

```typescript
class MyService extends BaseService<ServiceConfig> {
  protected async onInitialize(): Promise<void> {
    await this.repo.connect();
    this.logger.info('Connected to database', { service: this.name });
  }
}
```

### `onShutdown(): Promise<void>` (protected, override)

Override to run cleanup logic: close DB connections, drain queues, flush buffers.

```typescript
protected async onShutdown(): Promise<void> {
  await this.repo.disconnect();
}
```

---

## `Logger` Interface (`src/services/base.service.ts`)

```typescript
interface Logger {
  debug(message: string, context?: object): void;
  info(message:  string, context?: object): void;
  warn(message:  string, context?: object): void;
  error(message: string, context?: object): void;
}
```

The minimal logger interface accepted by `BaseService`. Compatible with `winston`, `pino`, or a simple inline object:

```typescript
const logger: Logger = {
  debug: (msg, ctx) => console.debug(JSON.stringify({ level: 'debug', msg, ...ctx })),
  info:  (msg, ctx) => console.info( JSON.stringify({ level: 'info',  msg, ...ctx })),
  warn:  (msg, ctx) => console.warn( JSON.stringify({ level: 'warn',  msg, ...ctx })),
  error: (msg, ctx) => console.error(JSON.stringify({ level: 'error', msg, ...ctx })),
};
```

---

## `UserRepository` Interface (`src/services/user.service.ts`)

Defines the data access contract for `UserService`. Implement this against your database; inject in tests as `MockUserRepository`.

```typescript
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(opts: {
    role?:   string;
    cursor?: string;
    limit:   number;
  }): Promise<{
    users:      User[];
    total:      number;
    nextCursor: string | null;
  }>;
  create(input: Omit<User, 'id'>): Promise<User>;
}
```

### `findById(id: UserId): Promise<User | null>`

Return the user with the given ID, or `null` if not found.

### `findByEmail(email: string): Promise<User | null>`

Return the user with the given email address, or `null` if not found.

### `findAll(opts): Promise<{ users, total, nextCursor }>`

Return a page of users.

| Field | Type | Description |
|-------|------|-------------|
| `opts.role` | `string?` | Filter to users with this role |
| `opts.cursor` | `string?` | Start after the user with this ID (exclusive) |
| `opts.limit` | `number` | Maximum number of users to return |
| Returns `.users` | `User[]` | The page of users |
| Returns `.total` | `number` | Total count across all pages (for pagination UI) |
| Returns `.nextCursor` | `string \| null` | ID of the last user in page, or `null` if no more |

### `create(input: Omit<User, 'id'>): Promise<User>`

Persist a new user and return it with a generated `id`.

---

## `UserService` (`src/services/user.service.ts`)

Manages users using `Result<T,E>` for expected failures.

```typescript
class UserService extends BaseService<ServiceConfig> {
  constructor(config: ServiceConfig, logger: Logger, repo: UserRepository);
}
```

### `findUser(id: UserId): Promise<Result<User, NotFoundError>>`

Look up a user by ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UserId` | The branded user ID |

**Returns**:
- `Ok<User>` — user found
- `Err<NotFoundError>` — no user with that ID

**Example**:
```typescript
const result = await service.findUser(toUserId('usr_abc123'));
if (isOk(result)) {
  return res.json(toUserDTO(result.value));
}
next(result.error); // NotFoundError → 404
```

---

### `createUser(input: CreateUserInput): Promise<Result<User, ValidationError | ConflictError>>`

Create a new user after validating input and checking for duplicate emails.

| Parameter | Type | Description |
|-----------|------|-------------|
| `input.email` | `string` | Must contain `@` |
| `input.name` | `string` | Must be at least 2 characters (trimmed) |
| `input.role` | `'admin' \| 'member' \| 'viewer'?` | Defaults to `'member'` |

**Returns**:
- `Ok<User>` — user created
- `Err<ValidationError>` — email or name failed validation; `.fields` contains per-field errors
- `Err<ConflictError>` — a user with that email already exists

**Example**:
```typescript
const result = await service.createUser({ email: 'alice@example.com', name: 'Alice' });
if (isOk(result)) return res.status(201).json(toUserDTO(result.value));
next(result.error); // ValidationError → 400, ConflictError → 409
```

---

### `listUsers(input?: ListUsersInput): Promise<PaginatedResult<User>>`

List users with optional role filter and cursor-based pagination. Never returns `Result` — always succeeds (repository errors propagate as thrown exceptions).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `input.role` | `'admin' \| 'member' \| 'viewer'?` | `undefined` | Filter to users with this role |
| `input.cursor` | `string?` | `undefined` | Pagination cursor from a previous response |
| `input.limit` | `number?` | `20` | Max results per page (capped at 100) |

**Returns**: `PaginatedResult<User>` with `{ items, total, cursor, hasMore }`

**Example**:
```typescript
const page = await service.listUsers({ role: 'admin', limit: 10 });
res.json({ ...page, items: page.items.map(toUserDTO) });
```

---

### `parseUserId(raw: string): Result<UserId, ValidationError>`

Parse a raw string into a validated `UserId`. Use at adapter boundaries before calling `findUser`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `raw` | `string` | Raw string from URL param, CLI arg, MCP input, etc. |

**Returns**:
- `Ok<UserId>` — valid non-empty string, cast to `UserId`
- `Err<ValidationError>` — empty or whitespace string

**Example**:
```typescript
// In a route handler
const parsed = service.parseUserId(req.params.id);
if (!isOk(parsed)) return next(parsed.error); // ValidationError → 400

const result = await service.findUser(parsed.value); // UserId, not string
```

---

## `ServiceConfig` Type

Layer-scoped config slice for the service layer. Services receive only what they need.

```typescript
type ServiceConfig = Pick<AppConfig, 'database' | 'logging'>;
```

Extracted from the full `AppConfig` in `main()`:

```typescript
const fullConfig    = loadConfig();
const serviceConfig = { database: fullConfig.database, logging: fullConfig.logging };
const service       = new UserService(serviceConfig, logger, repo);
```
