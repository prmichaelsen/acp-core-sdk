# Migration Guide

Move from common patterns to core-sdk patterns incrementally.

---

## From `try/catch` to `Result<T,E>`

**Before** — try/catch with type-unsafe errors:

```typescript
// Service throws, callers must remember to catch
async function getUser(id: string): Promise<User> {
  const user = await db.find(id);
  if (!user) throw new Error(`User ${id} not found`);
  return user;
}

// Route handler — try/catch boilerplate everywhere
router.get('/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (err) {
    if ((err as Error).message.includes('not found')) {
      res.status(404).json({ error: (err as Error).message });
    } else {
      res.status(500).json({ error: 'Internal error' });
    }
  }
});
```

**After** — `Result<T,E>` with typed errors:

```typescript
// Service returns Result — callers must handle both cases
async function findUser(id: UserId): Promise<Result<User, NotFoundError>> {
  const user = await db.find(id);
  if (!user) return err(new NotFoundError('User', id));
  return ok(user);
}

// Route handler — thin, no try/catch needed for expected failures
router.get('/:id', async (req, res, next) => {
  const parsed = service.parseUserId(req.params.id);
  if (!isOk(parsed)) return next(parsed.error); // ValidationError → 400

  const result = await service.findUser(parsed.value);
  if (isOk(result)) return res.json(toUserDTO(result.value));
  next(result.error); // NotFoundError → 404 via centralized error handler
});

// One error handler instead of per-route try/catch
app.use(errorHandler); // HTTP_STATUS[err.kind] maps all kinds
```

**Migration steps**:
1. Add `src/errors/` to your project
2. Replace `throw new Error(...)` with `return err(new NotFoundError(...))`
3. Change function return type from `Promise<T>` to `Promise<Result<T, E>>`
4. Add `app.use(errorHandler)` to Express
5. Update call sites to use `isOk(result)` / `result.error`

---

## From Untyped Error Strings to AppError Subclasses

**Before** — untyped errors with string matching:

```typescript
// Service
throw new Error('User already exists');
throw new Error('Invalid email');
throw new Error('Not authorized');

// Route
if (err.message === 'User already exists') res.status(409).json(...);
if (err.message === 'Invalid email') res.status(400).json(...);
if (err.message === 'Not authorized') res.status(401).json(...);
// Brittle — string changes break the mapping
```

**After** — typed error classes with kind discriminant:

```typescript
// Service
return err(new ConflictError(`User with email ${email} already exists`, { email }));
return err(new ValidationError('Invalid user input', { email: ['Must be a valid email'] }));
return err(new UnauthorizedError());

// Centralized handler — kind → status, no string matching
export function errorHandler(err, _req, res, _next) {
  if (isAppError(err)) {
    res.status(HTTP_STATUS[err.kind]).json({ error: { kind: err.kind, message: err.message } });
  } else {
    res.status(500).json({ error: { kind: 'internal', message: 'Internal server error' } });
  }
}
```

**Migration steps**:
1. Add `src/errors/` to your project
2. Replace `throw new Error(...)` → return `err(new <ErrorClass>(...))`
3. Replace per-route status code logic with `app.use(errorHandler)`

---

## From Ad-Hoc Config to Zod Schema

**Before** — ad-hoc config with no validation:

```typescript
const config = {
  port: parseInt(process.env.PORT ?? '3000'),
  dbUrl: process.env.DATABASE_URL!, // runtime crash if missing
  logLevel: process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
};
// No validation — wrong values cause cryptic errors later
```

**After** — Zod schema with fail-fast validation:

```typescript
const AppConfigSchema = z.object({
  server: z.object({
    port: z.number().int().default(3000),
    host: z.string().default('0.0.0.0'),
  }),
  database: z.object({
    url: z.string().url(), // required — throws immediately if missing
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

type AppConfig = z.infer<typeof AppConfigSchema>; // derived, never manual

// Fail fast at startup — not during a request
const config = loadConfig(); // throws ZodError with field-level details if invalid
```

**Migration steps**:
1. Add `src/config/` to your project
2. Model your existing config fields in `AppConfigSchema`
3. Replace all `process.env.*` reads with `loadConfig()` at startup
4. Update your service constructors to take `ServiceConfig` (layer-scoped slice)

---

## From a God Service to Service + Repository Interface

**Before** — God service: business logic mixed with data access:

```typescript
class UserService {
  private pool: pg.Pool; // direct DB dependency

  async getUser(id: string): Promise<User | null> {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id=$1', [id]);
    return rows[0] ?? null;
  }
}
// Can't test without a real Postgres database
```

**After** — Thin service over a repository interface:

```typescript
// Interface defined by what the service needs
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
}

// Service depends on interface — testable with any implementation
export class UserService extends BaseService<ServiceConfig> {
  constructor(config, logger, private repo: UserRepository) {
    super(config, logger);
  }

  async findUser(id: UserId): Promise<Result<User, NotFoundError>> {
    const user = await this.repo.findById(id);
    if (!user) return err(new NotFoundError('User', id));
    return ok(user);
  }
}

// Production: real Postgres implementation
class PostgresUserRepository implements UserRepository {
  async findById(id: UserId) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id=$1', [id]);
    return rows[0] ?? null;
  }
}

// Tests: in-memory implementation — no database needed
class MockUserRepository implements UserRepository {
  private store = new Map<string, User>();
  async findById(id: UserId) { return this.store.get(id) ?? null; }
}
```

**Migration steps**:
1. Identify all DB calls in the service (find, create, update, delete)
2. Extract them as `async` methods on an interface
3. Move the DB implementation to a concrete class that implements the interface
4. Update the service constructor to take the interface
5. Inject the concrete class in `main()`, the mock in tests

---

## From Express Routes Scattered Across Files to Adapter Pattern

**Before** — mixed concerns:

```typescript
// routes/users.ts — validation, business logic, and HTTP mixed
router.post('/users', async (req, res) => {
  if (!req.body.email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const existing = await db.query('SELECT * FROM users WHERE email=$1', [req.body.email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email taken' });
  }
  const user = await db.query('INSERT INTO users ...', [...]);
  res.status(201).json(user.rows[0]);
});
```

**After** — thin adapter over service:

```typescript
// src/services/user.service.ts — all business logic
async createUser(input: CreateUserInput): Promise<Result<User, ValidationError | ConflictError>> {
  if (!input.email.includes('@')) return err(new ValidationError('Invalid input', { email: [...] }));
  const existing = await this.repo.findByEmail(input.email);
  if (existing) return err(new ConflictError(`User with email ${input.email} already exists`));
  const user = await this.repo.create({ ... });
  return ok(user);
}

// examples/rest/user.routes.ts — thin, delegates everything
router.post('/', async (req, res, next) => {
  const result = await service.createUser(req.body);
  if (isOk(result)) return res.status(201).json(toUserDTO(result.value));
  next(result.error); // ValidationError → 400, ConflictError → 409
});
```

---

## Incremental Migration Strategy

You don't have to rewrite everything at once. Start with the most valuable piece:

1. **Start with error classes** — replace raw `throw new Error(...)` with typed `AppError` subclasses and add the centralized `errorHandler`

2. **Add `Result<T,E>` to one service method** — pick a method that has multiple failure modes and convert it; measure the clarity improvement

3. **Extract one repository interface** — take one service with direct DB calls and introduce the interface + mock, enabling tests without a database

4. **Add Zod config schema** — replace ad-hoc `process.env.*` reads with a validated schema loaded at startup

5. **Add a second adapter** — once you have a clean service, add MCP or CLI support to demonstrate reusability with zero service changes
