# Common Pitfalls

The most frequent mistakes when using core-sdk patterns, and how to avoid them.

---

## Pitfall 1: Accessing `.value` Without Checking `isOk()`

**The mistake**:

```typescript
const result = await service.findUser(id);
console.log(result.value.name); // 💥 runtime error if result is Err
```

TypeScript won't catch this — `result.value` exists on `Ok<T>` but not on `Err<E>`, yet without the type guard you access a property that may be `undefined` at runtime.

**The fix**:

```typescript
const result = await service.findUser(id);
if (isOk(result)) {
  console.log(result.value.name); // ✓ TypeScript knows value is User here
} else {
  console.error(result.error.kind); // ✓ TypeScript knows error is NotFoundError
}
```

**When it's tempting**: when you "know" the operation will succeed (e.g., after seeding test data). Use `getOrElse` if you have a safe default, or assert in tests with `expect(isOk(result)).toBe(true)`.

---

## Pitfall 2: Logging to stdout in MCP Servers

**The mistake**:

```typescript
// examples/mcp/server.ts
const logger = {
  info: (msg: string) => console.log(JSON.stringify({ level: 'info', msg })), // 💥 corrupts MCP protocol
};
```

MCP servers communicate via stdout. Any `console.log()` (which writes to stdout) gets mixed into the JSON-RPC stream and causes the MCP client to crash with a parse error.

**The fix**:

```typescript
const logger = {
  debug: (msg: string, ctx?: object) => process.stderr.write(JSON.stringify({ level: 'debug', msg, ...ctx }) + '\n'),
  info:  (msg: string, ctx?: object) => process.stderr.write(JSON.stringify({ level: 'info',  msg, ...ctx }) + '\n'),
  warn:  (msg: string, ctx?: object) => process.stderr.write(JSON.stringify({ level: 'warn',  msg, ...ctx }) + '\n'),
  error: (msg: string, ctx?: object) => process.stderr.write(JSON.stringify({ level: 'error', msg, ...ctx }) + '\n'),
};
```

**Rule**: In MCP servers, all logging goes to `stderr`. stdout is owned by the MCP protocol.

---

## Pitfall 3: Returning Raw Entities from Adapters

**The mistake**:

```typescript
router.get('/:id', async (req, res, next) => {
  const result = await service.findUser(parsed.value);
  if (isOk(result)) return res.json(result.value); // 💥 leaks User entity
});
```

The raw `User` entity may contain fields you don't want to expose: `passwordHash`, `updatedAt`, internal IDs, audit fields.

**The fix**:

```typescript
router.get('/:id', async (req, res, next) => {
  const result = await service.findUser(parsed.value);
  if (isOk(result)) return res.json(toUserDTO(result.value)); // ✓ safe DTO
  next(result.error);
});
```

**Why**: `UserDTO` is a deliberate API contract. What's not in the DTO is not exposed. When the `User` entity gains new internal fields, the DTO stays unchanged.

---

## Pitfall 4: Business Logic in Adapters

**The mistake**:

```typescript
// Route handler doing validation that belongs in the service
router.post('/', async (req, res, next) => {
  if (!req.body.email.includes('@')) {                    // ❌ validation in adapter
    return res.status(400).json({ error: 'Bad email' }); // ❌ manual status code
  }
  if (req.body.name.trim().length < 2) {                  // ❌ more validation in adapter
    return res.status(400).json({ error: 'Short name' }); // ❌ inconsistent format
  }
  const result = await service.createUser(req.body);
  // ...
});
```

Problems:
- Validation duplicated if you add MCP or CLI adapters
- Status codes and error formats inconsistent across routes
- Can't test validation logic without HTTP

**The fix**:

```typescript
// Service handles all validation
async createUser(input: CreateUserInput): Promise<Result<User, ValidationError | ConflictError>> {
  const fieldErrors: Record<string, string[]> = {};
  if (!input.email.includes('@')) fieldErrors.email = ['Must be a valid email'];
  if (input.name.trim().length < 2) fieldErrors.name = ['Must be at least 2 characters'];
  if (Object.keys(fieldErrors).length > 0) {
    return err(new ValidationError('Invalid user input', fieldErrors));
  }
  // ...
}

// Thin route — delegates entirely
router.post('/', async (req, res, next) => {
  const result = await service.createUser(req.body);
  if (isOk(result)) return res.status(201).json(toUserDTO(result.value));
  next(result.error); // errorHandler sets correct status code
});
```

---

## Pitfall 5: Skipping `await service.initialize()`

**The mistake**:

```typescript
async function main() {
  const config  = loadConfig();
  const service = new UserService(serviceConfig, logger, repo);
  // forgot: await service.initialize()

  const app = express();
  app.use('/api/users', userRoutes(service));
  app.listen(config.server.port); // service not initialized!
}
```

If `onInitialize()` opens a DB connection, warms a cache, or validates external dependencies, skipping it means the first request may fail or use an uninitialized state.

**The fix**:

```typescript
async function main() {
  const config  = loadConfig();
  const service = new UserService(serviceConfig, logger, repo);
  await service.initialize(); // ✓ always await before serving traffic

  const app = express();
  app.use('/api/users', userRoutes(service));
  app.listen(config.server.port);
}
```

**Also**: remember `await service.shutdown()` in your graceful shutdown handler.

---

## Pitfall 6: Using `any` Instead of `AppErrorUnion` in Error Handling

**The mistake**:

```typescript
// MCP adapter
} catch (e: any) {
  throw new McpError(ErrorCode.InternalError, e.message); // loses error kind
}
```

This discards the typed error information and always returns `InternalError` even for validation errors (which should be `InvalidParams`).

**The fix**:

```typescript
const MCP_CODE_MAP: Record<AppErrorUnion['kind'], ErrorCode> = {
  validation:   ErrorCode.InvalidParams,
  not_found:    ErrorCode.InvalidParams,
  unauthorized: ErrorCode.InvalidRequest,
  // ...
};

if (!isOk(result)) {
  const code = MCP_CODE_MAP[result.error.kind];
  throw new McpError(code, result.error.message);
}
```

---

## Pitfall 7: Not Isolating Tests with `repo.reset()`

**The mistake**:

```typescript
describe('UserService', () => {
  const repo    = new MockUserRepository();
  const service = new UserService(createTestConfig(), mockLogger, repo);

  it('creates a user', async () => {
    await service.createUser({ email: 'alice@test.local', name: 'Alice' });
    const result = await service.listUsers();
    expect(result.items).toHaveLength(1); // passes
  });

  it('lists empty users', async () => {
    const result = await service.listUsers();
    expect(result.items).toHaveLength(0); // 💥 fails — alice is still there from previous test!
  });
});
```

**The fix**:

```typescript
beforeEach(() => {
  repo.reset(); // ✓ clear state between tests
});
```

**Rule**: Always call `repo.reset()` in `beforeEach`, never `beforeAll`. Test isolation is non-negotiable.

---

## Pitfall 8: Loading Config Inside Tests

**The mistake**:

```typescript
describe('UserService', () => {
  const config  = loadConfig(); // 💥 requires DB_NAME, DB_USER, DB_PASSWORD env vars
  const service = new UserService(config, logger, repo);
```

`loadConfig()` reads from real environment variables. CI may not have them set, causing tests to fail for the wrong reason.

**The fix**:

```typescript
describe('UserService', () => {
  const config  = createTestConfig(); // ✓ deterministic defaults, no env required
  const service = new UserService({ database: config.database, logging: config.logging }, mockLogger, repo);
```

`createTestConfig()` provides safe defaults and never reads `process.env`.

---

## Quick Reference

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Accessing `.value` without `isOk()` | Runtime crash on `Err` | Always use `isOk(result)` guard first |
| `console.log` in MCP server | MCP client parse errors | Use `process.stderr.write(...)` only |
| Returning raw entity | Leaking internal fields | Always call `toUserDTO(result.value)` |
| Validation in adapter | Duplicate logic, inconsistent errors | Move all validation to service layer |
| Skipping `initialize()` | Uninitialized state on first request | Always `await service.initialize()` |
| `any` in error handling | Wrong MCP error codes | Use `MCP_CODE_MAP[error.kind]` |
| Not calling `repo.reset()` | State bleeds between tests | `beforeEach(() => repo.reset())` |
| `loadConfig()` in tests | CI failures from missing env vars | Use `createTestConfig()` in tests |
