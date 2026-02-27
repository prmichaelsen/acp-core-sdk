# API Reference: Adapters

Complete reference for all four adapter entry points in `examples/` and `src/client/`.

---

## REST Adapter (`examples/rest/`)

### `userRoutes(service: UserService): Router`

Factory that creates an Express `Router` with three user endpoints.

```typescript
function userRoutes(service: UserService): Router
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `service` | `UserService` | Initialized UserService instance |

**Returns**: Express `Router`

**Mount**:
```typescript
app.use('/api/users', userRoutes(service));
```

**Endpoints**:

| Method | Path | Success | Errors |
|--------|------|---------|--------|
| `GET` | `/:id` | 200 `UserDTO` | 400 validation, 404 not_found |
| `POST` | `/` | 201 `UserDTO` | 400 validation, 409 conflict |
| `GET` | `/` | 200 `PaginatedResult<UserDTO>` | — |

**`GET /:id` query flow**:
1. `service.parseUserId(req.params.id)` — returns `Err<ValidationError>` on empty/whitespace → 400
2. `service.findUser(id)` — returns `Err<NotFoundError>` if missing → 404
3. Returns `toUserDTO(result.value)` — never the raw `User` entity

**`POST /` body**:
```typescript
{ email: string; name: string; role?: 'admin' | 'member' | 'viewer' }
```

**`GET /` query params**:
```
?role=admin&cursor=usr_abc&limit=10
```

---

### `errorHandler(err, req, res, next): void`

Centralized Express error handler. Register **last**, after all routes.

```typescript
function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void
```

**Behavior**:
- If `isAppError(err)`: responds with `HTTP_STATUS[err.kind]` and `{ error: { kind, message } }`
  - `ValidationError`: also includes `{ error: { fields } }`
  - `RateLimitError`: also includes `{ error: { retryAfterSeconds } }`
- Otherwise: responds with 500 and `{ error: { kind: 'internal', message: 'Internal server error' } }`; logs `err` server-side; never leaks stack trace to client

**Register**:
```typescript
app.use('/api/users', userRoutes(service));
app.use(errorHandler); // must be last
```

**Response shape** (on `AppError`):
```json
{
  "error": {
    "kind": "not_found",
    "message": "User not found: usr_abc123"
  }
}
```

**Response shape** (on `ValidationError`):
```json
{
  "error": {
    "kind": "validation",
    "message": "Invalid user input",
    "fields": {
      "email": ["Must be a valid email address"],
      "name":  ["Must be at least 2 characters"]
    }
  }
}
```

---

## MCP Adapter (`examples/mcp/`)

### `registerUserTools(server: McpServer, service: UserService): void`

Register all user-related MCP tools on an `McpServer`. Call once before connecting transport.

```typescript
function registerUserTools(server: McpServer, service: UserService): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `server` | `McpServer` | MCP server instance |
| `service` | `UserService` | Initialized UserService instance |

**Registered tools**:

#### `get_user`

| Field | Value |
|-------|-------|
| Input schema | `{ id: z.string() }` |
| Success | `content: [{ type: 'text', text: JSON.stringify(UserDTO) }]` |
| Error (invalid ID) | `McpError(InvalidParams, message)` |
| Error (not found) | `McpError(InvalidParams, 'User not found: ...')` |

#### `create_user`

| Field | Value |
|-------|-------|
| Input schema | `{ email: z.string().email(), name: z.string().min(1), role?: z.enum([...]) }` |
| Success | `content: [{ type: 'text', text: JSON.stringify(UserDTO) }]` |
| Error (validation) | `McpError(InvalidParams, message)` |
| Error (conflict) | `McpError(InvalidRequest, message)` |

#### `list_users`

| Field | Value |
|-------|-------|
| Input schema | `{ role?: z.enum([...]), cursor?: z.string(), limit?: z.number().int().min(1).max(100) }` |
| Success | `content: [{ type: 'text', text: JSON.stringify({ items, total, cursor, hasMore }) }]` |
| Error | Never (list always succeeds) |

**MCP error code mapping**:

| `AppError.kind` | `ErrorCode` |
|-----------------|-------------|
| `validation`, `not_found` | `InvalidParams` (-32602) |
| `unauthorized`, `forbidden`, `conflict` | `InvalidRequest` (-32600) |
| `rate_limit`, `external`, `internal` | `InternalError` (-32603) |

**Important**: All logging in MCP servers must use `process.stderr.write(...)`. stdout is the MCP protocol wire — any `console.log()` corrupts the JSON-RPC stream.

---

## CLI Adapter (`examples/cli/`)

### `registerUserCommands(program: Command, service: UserService): void`

Register all user subcommands on a Commander `Command`. Call before `program.parseAsync()`.

```typescript
function registerUserCommands(program: Command, service: UserService): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `program` | `Command` | Commander program or parent command |
| `service` | `UserService` | Initialized UserService instance |

**Registered commands**:

#### `user get <id>`

```
my-app user get <id> [--json]
```

| Outcome | stdout | stderr | Exit code |
|---------|--------|--------|-----------|
| Found | `JSON.stringify(UserDTO, null, 2)` | — | 0 |
| Invalid ID | — | `Error [validation]: ...` | 1 |
| Not found | — | `Error [not_found]: ...` | 1 |

#### `user create <email> <name>`

```
my-app user create <email> <name> [--role admin|member|viewer] [--json]
```

| Outcome | stdout | stderr | Exit code |
|---------|--------|--------|-----------|
| Created | `JSON.stringify(UserDTO, null, 2)` | — | 0 |
| Validation error | — | `Error [validation]: ...` | 1 |
| Conflict | — | `Error [conflict]: ...` | 1 |

#### `user list`

```
my-app user list [--role admin|member|viewer] [--cursor <cursor>] [--limit <n>] [--json]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--role` | string | — | Filter by role |
| `--cursor` | string | — | Pagination cursor |
| `--limit` | number | 20 | Max results |
| `--json` | boolean | false | JSON instead of table |

Default output: aligned text table with columns auto-sized to content. Last line: `Total: N  hasMore: true/false  next: --cursor <id>`

**Exit code convention**:
- `0` — success (no explicit `process.exit` call)
- `1` — application error (`AppError`)
- `2` — usage or config error (Commander parse error, `loadConfig()` failure)

**Shell-composability**:
- Success data → stdout (pipeable)
- Errors → stderr (doesn't pollute pipes)

---

## Client Adapter (`src/client/`)

### `createClient(config: ClientConfig): Client`

Top-level SDK factory. Returns namespaced sub-clients.

```typescript
interface ClientConfig {
  baseUrl: string;
  init?:   RequestInit; // merged into every fetch call
}

interface Client {
  users: UserClient;
}

function createClient(config: ClientConfig): Client
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config.baseUrl` | `string` | Base URL of the REST server (trailing slash stripped) |
| `config.init` | `RequestInit?` | Default fetch options (auth headers, timeouts, etc.) |

**Returns**: `Client` with `users` namespace.

**Example**:
```typescript
const { users } = createClient({ baseUrl: 'https://api.example.com' });

// With auth header
const { users } = createClient({
  baseUrl: 'https://api.example.com',
  init: { headers: { Authorization: `Bearer ${token}` } },
});
```

---

### `createUserClient(baseUrl: string, defaultInit?: RequestInit): UserClient`

Lower-level factory for standalone use (when you only need the user client, not an aggregator).

```typescript
function createUserClient(baseUrl: string, defaultInit?: RequestInit): UserClient
```

---

### `UserClient` Interface

```typescript
interface UserClient {
  getUser(id: string): Promise<Result<UserDTO, NotFoundError | ValidationError>>;
  createUser(input: CreateUserInput): Promise<Result<UserDTO, ValidationError | ConflictError>>;
  listUsers(opts?: ListUsersInput): Promise<PaginatedResult<UserDTO>>;
}
```

#### `getUser(id: string): Promise<Result<UserDTO, NotFoundError | ValidationError>>`

Fetch a single user by ID.

| HTTP | Result |
|------|--------|
| 200 | `Ok<UserDTO>` |
| 400 | `Err<ValidationError>` |
| 404 | `Err<NotFoundError>` |
| Network error | `Err<ExternalError>` (as `never` — unexpected) |
| Other 4xx/5xx | `Err<ExternalError>` (as `never` — unexpected) |

**Example**:
```typescript
const result = await users.getUser('usr_abc123');
if (isOk(result)) console.log(result.value.name);
else if (result.error.kind === 'not_found') console.log('User not found');
```

#### `createUser(input): Promise<Result<UserDTO, ValidationError | ConflictError>>`

Create a new user.

| HTTP | Result |
|------|--------|
| 201 | `Ok<UserDTO>` |
| 400 | `Err<ValidationError>` (with `.fields` if present) |
| 409 | `Err<ConflictError>` |

#### `listUsers(opts?): Promise<PaginatedResult<UserDTO>>`

List users. Throws `ExternalError` on network or server failure (5xx).

| Field | Type | Default |
|-------|------|---------|
| `opts.role` | `'admin' \| 'member' \| 'viewer'?` | — |
| `opts.cursor` | `string?` | — |
| `opts.limit` | `number?` | server default (20) |

**Returns**: `PaginatedResult<UserDTO>` — never returns `Result<T,E>`, throws instead.

**Note**: Requires Node.js 18+ for native `fetch`. In Node.js < 18, polyfill with `node-fetch`.
