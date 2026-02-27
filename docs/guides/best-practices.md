# Best Practices

How to use core-sdk patterns correctly and get the most out of them.

---

## Result<T, E>

### Always check before accessing `.value`

```typescript
// ✗ Wrong — runtime error if result is Err
const user = result.value; // throws if result.success === false

// ✓ Correct — TypeScript narrows the type after the guard
if (isOk(result)) {
  console.log(result.value.name); // User
} else {
  console.error(result.error.kind); // 'not_found' | 'validation'
}
```

### Use `Result<T,E>` for expected failures only

```typescript
// ✓ Expected failure — user might not exist
async findUser(id: UserId): Promise<Result<User, NotFoundError>> { ... }

// ✗ Don't wrap unexpected failures in Result
async saveUser(user: User): Promise<Result<User, DatabaseError>> { ... }
// ^ If the DB is down, that's unexpected — let it throw and surface as 500
```

**Rule**: Expected failures (not found, validation, conflict) → `Result<T,E>`. Unexpected failures (network timeout, null reference) → let them throw.

### Return typed errors, not strings

```typescript
// ✗ Loses type information
return err(new Error('user not found'));

// ✓ Callers can pattern-match on .kind
return err(new NotFoundError('User', id));
// result.error.kind === 'not_found'
// result.error.resource === 'User'
// result.error.id === id
```

---

## Error Classes

### Choose the right error class

```typescript
// ✗ Wrong — ValidationError is for input validation, not business rules
return err(new ValidationError('Email already taken'));

// ✓ Email taken is a conflict, not invalid input
return err(new ConflictError(`User with email ${email} already exists`, { email }));

// ✗ Wrong — 'internal' should be reserved for truly unexpected errors
return err(new InternalError('Could not connect to email service'));

// ✓ Upstream service failure is ExternalError
return err(new ExternalError('Email service unavailable', 'email-service'));
```

### Add structured context

```typescript
// ✗ Message-only — hard to parse programmatically
return err(new ValidationError('Invalid fields'));

// ✓ Structured fields — clients can highlight specific inputs
return err(new ValidationError('Invalid user input', {
  email: ['Must be a valid email address'],
  name:  ['Must be at least 2 characters'],
}));
```

---

## Services

### Services receive only the config they need

```typescript
// ✗ Wrong — service has access to server config it doesn't use
class UserService extends BaseService<AppConfig> { ... }

// ✓ Layer-scoped config slice
class UserService extends BaseService<ServiceConfig> { ... }
// ServiceConfig = Pick<AppConfig, 'database' | 'logging'>
```

### Business logic belongs in the service

```typescript
// ✗ Wrong — validation in the route handler
router.post('/', async (req, res, next) => {
  if (!req.body.email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const user = await service.createUser(req.body);
  // ...
});

// ✓ Route handler is thin — delegates to service
router.post('/', async (req, res, next) => {
  const result = await service.createUser(req.body);
  if (isOk(result)) return res.status(201).json(toUserDTO(result.value));
  next(result.error); // service already validated input
});
```

### Initialize before serving traffic

```typescript
// ✓ Always await initialize() before accepting requests
await service.initialize(); // connects to DB, warms caches
app.listen(port);
```

---

## Repository Interface

### Define the interface in the service file

```typescript
// src/services/user.service.ts — interface lives with its consumer
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(opts: { role?: string; cursor?: string; limit: number }): Promise<...>;
  create(input: Omit<User, 'id'>): Promise<User>;
}
```

**Why**: Interface is defined by what the service needs, not by what the DB can provide.

### Keep the interface minimal

```typescript
// ✗ Wrong — interface exposes DB-specific methods
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  beginTransaction(): Promise<Transaction>;   // leaks DB concern
  executeRaw(sql: string): Promise<unknown>;  // leaks DB concern
}

// ✓ Interface only exposes what the service calls
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: Omit<User, 'id'>): Promise<User>;
}
```

---

## DTOs

### Always return DTOs from adapters, never internal entities

```typescript
// ✗ Wrong — leaks internal entity (includes updatedAt, passwordHash, etc.)
router.get('/:id', async (req, res, next) => {
  const result = await service.findUser(parsed.value);
  if (isOk(result)) return res.json(result.value); // raw User entity!
  next(result.error);
});

// ✓ Transform to DTO before sending
router.get('/:id', async (req, res, next) => {
  const result = await service.findUser(parsed.value);
  if (isOk(result)) return res.json(toUserDTO(result.value)); // safe DTO
  next(result.error);
});
```

### Keep the DTO transformation colocated with the type

```typescript
// src/types/shared.types.ts — transformation lives next to the types
export interface UserDTO { id: string; email: string; name: string; }

export function toUserDTO(user: User): UserDTO {
  return { id: user.id, email: user.email, name: user.name };
  // updatedAt, passwordHash, etc. are deliberately excluded
}
```

---

## Configuration

### Load config once at startup — fail fast

```typescript
// ✗ Wrong — lazy loading hides config errors until a request arrives
app.get('/', async (req, res) => {
  const config = loadConfig(); // might throw here!
  // ...
});

// ✓ Load at startup — crashes immediately if config is invalid
async function main() {
  const config = loadConfig(); // throws ZodError if DB_NAME is missing
  await service.initialize();
  app.listen(config.server.port);
}
```

### Use `createTestConfig()` in all tests

```typescript
// ✗ Don't rely on real environment variables in tests
const config = loadConfig(); // might fail in CI if env vars not set

// ✓ Deterministic test config — always works, no env required
const config = createTestConfig({ logging: { level: 'error' } });
```

---

## Adapters

### Each adapter handles one concern

- REST adapter: HTTP parsing → service call → HTTP response
- MCP adapter: MCP input → service call → MCP content
- CLI adapter: CLI args → service call → stdout/stderr
- Client adapter: typed call → HTTP request → typed Result

**Cross-concerns** (auth, rate limiting, tracing) → middleware, not inside adapters.

### Never duplicate error handling across adapters

```typescript
// ✗ Wrong — each adapter re-implements error → status mapping
// In REST route:
if (result.error.kind === 'not_found') return res.status(404).json({ ... });
// In another route:
if (result.error.kind === 'not_found') return res.status(404).json({ ... });

// ✓ Centralized error handler — one place to maintain
app.use(errorHandler); // uses HTTP_STATUS[err.kind] — always consistent
```

---

## Testing

### Test services with mock repositories

```typescript
const repo    = new MockUserRepository();
const service = new UserService(createTestConfig(), mockLogger, repo);

beforeEach(() => repo.reset()); // isolate each test

it('returns NotFoundError for unknown user', async () => {
  const result = await service.findUser(toUserId('usr_nonexistent'));
  expect(isOk(result)).toBe(false);
  expect(result.error.kind).toBe('not_found');
});
```

### Test adapters via integration tests

```typescript
// REST integration: supertest against real Express app
const res = await request(app).get('/api/users/usr_abc').expect(200);
expect(res.body.id).toBe('usr_abc');

// MCP integration: ToolCapture to bypass transport
const result = await capture.call('get_user', { id: 'usr_abc' });
const dto = JSON.parse(result.content[0].text);
expect(dto.id).toBe('usr_abc');
```

### Use `isOk` / `isErr` in assertions — not `.success`

```typescript
// ✓ Readable and uses the type guard
expect(isOk(result)).toBe(true);

// ✗ Works but bypasses TypeScript narrowing
expect(result.success).toBe(true);
```
