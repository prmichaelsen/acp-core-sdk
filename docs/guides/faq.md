# Frequently Asked Questions

---

## General

### What is core-sdk?

A collection of TypeScript patterns and template files that give you a production-ready foundation for building domain logic that runs across multiple deployment targets (REST API, MCP server, CLI tool, client library). The key idea is to separate your domain logic (the service layer) from how it's exposed.

### Who is this for?

Teams building TypeScript services that need to be consumed in multiple ways — for example, an API that also needs to be an MCP server for AI tooling, or a CLI for ops scripts. It's also for teams who want typed error handling, validated configuration, and a testable service layer without spending days setting up patterns from scratch.

### Do I have to use all the patterns?

No. Each pattern is independent. You can adopt just `Result<T,E>` and the error classes, or just the config schema. Start with the pieces that solve your most pressing problems.

### Is this a framework?

No. It's a set of patterns and pre-filled TypeScript files. There's no runtime to install, no `@core-sdk/runtime` package. You copy the files you need and own them — adapt them to your domain.

---

## Result<T, E>

### When should I use `Result<T,E>` vs just throwing?

Use `Result<T,E>` for **expected** failures — cases where callers need to handle both outcomes:
- Resource not found
- Input validation failed
- Email already taken (conflict)

Throw for **unexpected** failures — bugs and infrastructure problems:
- Database connection refused
- Null pointer on data that should always be there
- Network timeout to a required service

The test: if a caller should branch on the error (and you want TypeScript to enforce that branching), use `Result<T,E>`. If the error means "something is broken, crash loudly", let it throw.

### Can I use `Result<T,E>` with async functions?

Yes. `async findUser(...): Promise<Result<User, NotFoundError>>` is the standard pattern. `await` the call, then check `isOk()`.

### What if I have multiple possible error types?

Use a union: `Result<User, ValidationError | ConflictError>`. Callers can narrow the type:

```typescript
const result = await service.createUser(input);
if (!isOk(result)) {
  if (result.error.kind === 'validation') {
    // result.error is ValidationError — has .fields
  }
  if (result.error.kind === 'conflict') {
    // result.error is ConflictError
  }
}
```

### Why not use `neverthrow`, `fp-ts`, or another Result library?

The `Result<T,E>` in `src/types/result.types.ts` is intentionally minimal and dependency-free. If you already use `neverthrow` or `fp-ts`, you can replace it — the pattern is what matters, not the specific implementation.

---

## Error Classes

### How do I add a new error type?

1. Add a new class to `src/errors/app-errors.ts` extending `AppError` with a `readonly kind = 'my_kind' as const`
2. Add `'my_kind': <HTTP status>` to `HTTP_STATUS` in `src/errors/index.ts`
3. Add the class to `AppErrorUnion` in `src/errors/index.ts`
4. Re-export from `src/errors/index.ts`

### What's the difference between `ValidationError` and `InternalError`?

- `ValidationError` (400) — the caller sent bad input. They can fix it by sending different data.
- `InternalError` (500) — something is broken on the server side. The caller can't fix it — only the operator can.

Wrong usage: using `InternalError` for "DB returned unexpected data" (that's your bug, `InternalError` is correct) vs. using `ValidationError` for "email is already taken" (that's `ConflictError`).

### Should the `context` bag be used for logging or for API responses?

Both, but carefully. The context bag is attached to the error object and appears in logs. For API responses, the centralized error handler only sends `kind` and `message` to clients (plus `fields` for `ValidationError` and `retryAfterSeconds` for `RateLimitError`). The context bag is not sent to API clients by default.

---

## Configuration

### What if I need a config field that's not in the schema?

Add it to `AppConfigSchema` in `src/config/schema.ts`. If it should be read from an environment variable, also update `src/config/loader.ts` to map the env var to the config field.

### Can I use a `.env` file with `loadConfig()`?

`loadConfig()` doesn't load `.env` files automatically — it reads `process.env`. For local development, use `dotenv` to load `.env` before calling `loadConfig()`:

```typescript
import 'dotenv/config'; // loads .env into process.env
const config = loadConfig();
```

Install: `npm install dotenv`. Never commit `.env` to git — it's in the `.gitignore` template.

### Why are database fields required but server fields have defaults?

Database connection details vary per environment and should never have safe defaults (a wrong database URL could cause data corruption). Server settings like `port` and `host` have universally safe defaults (`3000`, `0.0.0.0`).

---

## Services

### Do I have to extend `BaseService`?

No, but it provides three things you'd otherwise write manually:
1. Constructor injection of `config` and `logger` with consistent types
2. `initialize()` / `shutdown()` lifecycle hooks
3. `this.name` computed from the class name (useful for logging)

If you don't need those, implement `UserRepository` directly on a plain class.

### Can one service call another service?

Yes. Inject the second service through the constructor, just like the repository:

```typescript
class OrderService extends BaseService<ServiceConfig> {
  constructor(config, logger, private repo: OrderRepository, private userService: UserService) {
    super(config, logger);
  }
}
```

The order of `initialize()` calls matters — initialize dependencies before dependents.

### What if my service needs to emit events?

Add an `EventEmitter` or a dedicated event bus to the constructor. The service emits events; adapters or other services subscribe. Keep the event schema typed:

```typescript
interface UserEvents {
  'user.created': { userId: UserId; email: EmailAddress };
}
```

---

## Adapters

### Can I run all three adapters (REST, MCP, CLI) in the same process?

Usually not recommended — REST and MCP both need to bind to ports or stdio. Run them as separate processes that share the same core library package. The `UserService` logic runs once in each process, but the code is identical.

### How do I add authentication to the REST adapter?

Add an Express middleware before your routes:

```typescript
app.use('/api/users', authenticate, userRoutes(service));

// middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new UnauthorizedError());
  // verify token...
  next();
}
```

The `UnauthorizedError` (kind: `'unauthorized'`) will be caught by `errorHandler` and return 401.

### Why does the MCP adapter use `server.tool()` and not lower-level APIs?

`server.tool()` is the high-level McpServer API — it handles input validation via Zod, serialization, and protocol framing. The lower-level `server.setRequestHandler()` is for protocol-level work. Use `server.tool()` unless you need direct protocol access.

---

## Testing

### Do I need a real database to run the integration tests?

No. The `MockUserRepository` in `examples/test/user.repository.mock.ts` provides an in-memory implementation. All integration tests use it — no database, no network, no file I/O.

### Can I use the `MockUserRepository` in my own tests?

Yes. Copy `examples/test/user.repository.mock.ts` to your test directory and adapt it to your repository interface. It's designed to be a template, not a fixed implementation.

### How do I test the MCP tools without the full MCP protocol?

Use the `ToolCapture` pattern from `examples/test/mcp.integration.spec.ts`:

```typescript
class ToolCapture {
  private handlers = new Map();
  tool(name, _desc, _schema, handler) { this.handlers.set(name, handler); }
  async call(name, args) { return this.handlers.get(name)(args); }
}

const capture = new ToolCapture();
registerUserTools(capture as unknown as McpServer, service);

// Test a tool handler directly
const result = await capture.call('get_user', { id: 'usr_abc123' });
```

### How do I test CLI commands without spawning a subprocess?

Use the approach from `examples/test/cli.integration.spec.ts`:

```typescript
jest.spyOn(process.stdout, 'write').mockImplementation(chunk => { out.stdout += chunk; return true; });
jest.spyOn(process.exit).mockImplementation(code => { throw Object.assign(new Error(), { isTestExit: true }); });

await program.parseAsync(['', '', 'user', 'get', 'usr_abc123']);
// check out.stdout, out.stderr, out.exitCode
```

---

## Deployment

### Does this work with Bun or Deno?

The patterns are standard TypeScript — they'll work wherever TypeScript runs. The examples use `express`, `@modelcontextprotocol/sdk`, and `commander`, which all work with Bun. Deno compatibility depends on the npm compatibility mode and the specific packages.

### Can I publish the core library as a private npm package?

Yes — that's the intended use case. The `package.json.template` includes subpath exports for tree-shaking, and `npmignore.template` excludes dev files. Replace the placeholders and publish with `npm publish --access restricted`.

### How do I handle secrets (API keys, credentials) that shouldn't be in config?

Use environment variables (loaded via `process.env`) and never put them in `AppConfigSchema` defaults. For production, use a secrets manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault) and inject the secret value as an environment variable at startup. See `agent/patterns/core-sdk.config-secrets.md` for the full pattern.
