# Pattern Selection Guide

Use this guide to choose the right core-sdk pattern for each problem.

---

## By Problem

### "I need to represent an operation that can fail in an expected way"

**Use**: `Result<T, E>` from `src/types/result.types.ts`

```typescript
// Don't throw for expected failures
async function findUser(id: UserId): Promise<Result<User, NotFoundError>> {
  const user = await db.find(id);
  if (!user) return err(new NotFoundError('User', id));
  return ok(user);
}

// Caller must handle both cases — no silent failures
const result = await service.findUser(id);
if (isOk(result)) console.log(result.value.name);
else console.error(result.error.kind); // 'not_found'
```

**Don't use** `Result<T,E>` for: unexpected errors (let them throw and bubble up as 500).

---

### "I need a typed error that maps to the right HTTP status"

**Use**: The appropriate `AppError` subclass from `src/errors/app-errors.ts`

| Error class | HTTP status | When to use |
|------------|-------------|-------------|
| `ValidationError` | 400 | Input failed validation |
| `NotFoundError` | 404 | Resource doesn't exist |
| `UnauthorizedError` | 401 | Not authenticated |
| `ForbiddenError` | 403 | Not permitted |
| `ConflictError` | 409 | Resource already exists / state conflict |
| `RateLimitError` | 429 | Too many requests |
| `ExternalError` | 502 | Upstream service failed |
| `InternalError` | 500 | Unexpected internal failure |

**Pattern**: `HTTP_STATUS[err.kind]` maps kind → status code automatically.

---

### "I need to share a string type that means something specific"

**Use**: Branded primitives from `src/types/shared.types.ts`

```typescript
// Without branding — silent bug: swapped args compile fine
function findUser(id: string, tenantId: string) { ... }
findUser(tenantId, userId); // wrong order, TypeScript doesn't catch it

// With branding — TypeScript catches this
type UserId   = Brand<string, 'UserId'>;
type TenantId = Brand<string, 'TenantId'>;

function findUser(id: UserId, tenantId: TenantId) { ... }
findUser(tenantId, userId); // ✗ Type error — TenantId is not UserId
```

**Create**: New branded types in `src/types/shared.types.ts` alongside your domain entity.

---

### "I need a service class with lifecycle and config injection"

**Use**: `BaseService<TConfig>` from `src/services/base.service.ts`

```typescript
class MyService extends BaseService<ServiceConfig> {
  constructor(config: ServiceConfig, logger: Logger, private repo: MyRepository) {
    super(config, logger);
  }

  // Called during app startup — connect to DB, warm up caches
  async onInitialize(): Promise<void> {
    await this.repo.connect();
  }

  // Called during graceful shutdown — close connections
  async onShutdown(): Promise<void> {
    await this.repo.disconnect();
  }
}
```

**ServiceConfig** is `Pick<AppConfig, 'database' | 'logging'>` — services only get what they need.

---

### "I need to expose my service as a REST API"

**Use**: The REST adapter pattern (`agent/patterns/core-sdk.adapter-rest.md`)

Key files to copy/adapt from `examples/rest/`:
1. `user.routes.ts` — route handlers that call service + branch on `Result<T,E>`
2. `error-handler.ts` — centralized `AppError` → HTTP status mapping
3. `server.ts` — bootstrap: config → service → routes → app.listen

**Rules**:
- Routes call service; business logic stays in service
- Always check `isOk(result)` before accessing `.value`
- Use `next(error)` — never `res.status(500).json(...)` inline
- Return `UserDTO`, never the raw `User` entity

---

### "I need to expose my service as an MCP tool"

**Use**: The MCP adapter pattern (`agent/patterns/core-sdk.adapter-mcp.md`)

Key files from `examples/mcp/`:
1. `user.tools.ts` — `server.tool(name, desc, zodShape, handler)`
2. `server.ts` — `McpServer` + `StdioServerTransport` bootstrap

**Rules**:
- All logging goes to `stderr` — stdout is the MCP protocol
- Use Zod shapes for input validation — SDK validates before handler runs
- Map `AppError` → `McpError` using `MCP_CODE_MAP`
- On `Err<E>`: throw `toMcpError(error)` — don't return partial content

---

### "I need to expose my service as a CLI command"

**Use**: The CLI adapter pattern (`agent/patterns/core-sdk.adapter-cli.md`)

Key files from `examples/cli/`:
1. `user.commands.ts` — `registerUserCommands(program, service)`
2. `program.ts` — Commander bootstrap with `program.exitOverride()`

**Exit code convention**:
- `0` — success (no `process.exit` call needed)
- `1` — application error (`AppError`)
- `2` — usage or config error

**Output convention**:
- Success → `process.stdout.write(...)` (JSON or table)
- Errors → `process.stderr.write(...)` (shell-composable)

---

### "I need to consume my service's REST API from another service"

**Use**: The client adapter pattern (`agent/patterns/core-sdk.adapter-client.md`)

```typescript
// src/client/index.ts provides createClient()
const { users } = createClient({ baseUrl: 'https://api.example.com' });

const result = await users.getUser('usr_abc123');
if (isOk(result)) console.log(result.value.name);
else console.error(result.error.kind); // 'not_found' | 'validation'
```

**Rules**:
- Parse HTTP error bodies back to typed `AppError` subclasses
- Return `Result<T,E>` for 4xx responses
- Throw `ExternalError` for network failures and 5xx responses

---

### "I need typed, validated configuration"

**Use**: The config schema pattern (`agent/patterns/core-sdk.config-schema.md`)

```typescript
// Schema defines shape + defaults
const AppConfigSchema = z.object({
  env:      z.enum(['development', 'staging', 'production']).default('development'),
  database: DatabaseConfigSchema,
  server:   ServerConfigSchema,
});

// Types are always derived — never written manually
type AppConfig = z.infer<typeof AppConfigSchema>;

// Load once at startup
const config = loadConfig(); // throws ZodError if invalid
```

**Layer-scoped slices**:
- Services get `ServiceConfig = Pick<AppConfig, 'database' | 'logging'>`
- Adapters get `AdapterConfig = Pick<AppConfig, 'server' | 'logging'>`
- Neither gets more than it needs

---

### "I need to write a test that doesn't hit the database"

**Use**: Repository interface pattern + `MockRepository`

```typescript
// Service depends on the interface, not the implementation
class TodoService extends BaseService<ServiceConfig> {
  constructor(config, logger, private repo: TodoRepository) { // ← interface
    super(config, logger);
  }
}

// In tests: inject a mock
class MockTodoRepository implements TodoRepository {
  private store = new Map<string, Todo>();
  reset(): void { this.store.clear(); }
  seed(todo: Todo): void { this.store.set(todo.id, todo); }
  // ... implement interface methods
}

// Test
const repo    = new MockTodoRepository();
const service = new TodoService(createTestConfig(), mockLogger, repo);
repo.seed({ id: toTodoId('todo_1'), title: 'Buy milk', done: false, createdAt: '...' });
const result = await service.findTodo(toTodoId('todo_1'));
expect(isOk(result)).toBe(true);
```

See `examples/test/user.repository.mock.ts` for a complete example.

---

## Decision Tree

```
What are you trying to do?
│
├─ Represent a possibly-failing operation?
│    └─► Result<T, E>
│
├─ Signal a specific failure kind?
│    └─► AppError subclass (ValidationError, NotFoundError, etc.)
│
├─ Distinguish two string values at compile time?
│    └─► Branded primitive (UserId, OrderId, etc.)
│
├─ Share business logic across multiple targets?
│    └─► BaseService + Repository interface
│
├─ Expose logic over HTTP?
│    └─► REST adapter (userRoutes + errorHandler)
│
├─ Expose logic to AI models?
│    └─► MCP adapter (registerUserTools + McpServer)
│
├─ Expose logic as shell commands?
│    └─► CLI adapter (registerUserCommands + Commander)
│
├─ Consume a REST API with typed errors?
│    └─► Client adapter (createClient)
│
└─ Load validated configuration?
     └─► Config schema (AppConfigSchema + loadConfig)
```

## Related Patterns

All 25 patterns are in `agent/patterns/` — each has rationale, full code, and anti-patterns:

- [Result Types](../../agent/patterns/core-sdk.types-result.md)
- [Error Types](../../agent/patterns/core-sdk.types-error.md)
- [Shared Types](../../agent/patterns/core-sdk.types-shared.md)
- [Service Base](../../agent/patterns/core-sdk.service-base.md)
- [Config Schema](../../agent/patterns/core-sdk.config-schema.md)
- [Adapter REST](../../agent/patterns/core-sdk.adapter-rest.md)
- [Adapter MCP](../../agent/patterns/core-sdk.adapter-mcp.md)
- [Adapter CLI](../../agent/patterns/core-sdk.adapter-cli.md)
- [Adapter Client](../../agent/patterns/core-sdk.adapter-client.md)
