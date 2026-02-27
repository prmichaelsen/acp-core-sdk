# REST API Integration Guide

How to wire a service to an Express REST API using core-sdk patterns.

---

## Overview

The REST adapter translates HTTP requests into service calls and maps `Result<T,E>` responses to HTTP status codes. Business logic lives entirely in the service — the adapter is thin.

```
HTTP Request
  → Express route handler
    → service.parseUserId / service.createUser / etc.
      → Result<T,E>
        → toUserDTO (on success)
        → next(error) → errorHandler (on failure)
          → HTTP response
```

---

## Prerequisites

Install dependencies:

```bash
npm install express
npm install --save-dev @types/express @types/node typescript
```

Copy source files into your project:

```bash
# Core library
cp -r core-sdk/src/types   ./src/types
cp -r core-sdk/src/errors  ./src/errors
cp -r core-sdk/src/config  ./src/config
cp -r core-sdk/src/services ./src/services

# REST adapter
cp -r core-sdk/examples/rest ./examples/rest
```

---

## Step 1: Implement UserRepository

Create a concrete `UserRepository` that matches your data store. The service depends only on the interface.

```typescript
// src/repositories/postgres.user.repository.ts
import type { User, UserId } from '../types/shared.types.js';
import type { UserRepository } from '../services/user.service.js';
import { Pool } from 'pg';

export class PostgresUserRepository implements UserRepository {
  constructor(private pool: Pool) {}

  async findById(id: UserId): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] ?? null;
  }

  async findAll(opts: { role?: string; cursor?: string; limit: number }) {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (opts.role) {
      params.push(opts.role);
      conditions.push(`role = $${params.length}`);
    }
    if (opts.cursor) {
      params.push(opts.cursor);
      conditions.push(`id > $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(opts.limit);

    const { rows } = await this.pool.query(
      `SELECT * FROM users ${where} ORDER BY id LIMIT $${params.length}`,
      params
    );
    const { rows: countRows } = await this.pool.query(
      `SELECT COUNT(*) AS total FROM users ${where}`,
      params.slice(0, -1)
    );

    return {
      users:      rows,
      total:      parseInt(countRows[0].total, 10),
      nextCursor: rows.length === opts.limit ? rows[rows.length - 1].id : null,
    };
  }

  async create(input: Omit<User, 'id'>): Promise<User> {
    const id = `usr_${Date.now()}`;
    const { rows } = await this.pool.query(
      'INSERT INTO users (id, email, name, role, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, input.email, input.name, input.role, input.createdAt]
    );
    return rows[0];
  }
}
```

For tests, use `MockUserRepository` from `examples/test/user.repository.mock.ts` — no database required.

---

## Step 2: Configure and Wire in `main()`

```typescript
// src/main.ts
import express from 'express';
import { Pool } from 'pg';
import { loadConfig } from './config/index.js';
import { UserService } from './services/user.service.js';
import { userRoutes } from '../examples/rest/user.routes.js';
import { errorHandler } from '../examples/rest/error-handler.js';
import { PostgresUserRepository } from './repositories/postgres.user.repository.js';

const logger = {
  debug: (msg: string, ctx?: object) => console.debug(JSON.stringify({ level: 'debug', msg, ...ctx })),
  info:  (msg: string, ctx?: object) => console.info( JSON.stringify({ level: 'info',  msg, ...ctx })),
  warn:  (msg: string, ctx?: object) => console.warn( JSON.stringify({ level: 'warn',  msg, ...ctx })),
  error: (msg: string, ctx?: object) => console.error(JSON.stringify({ level: 'error', msg, ...ctx })),
};

async function main(): Promise<void> {
  // 1. Load and validate config — throws ZodError if env vars are missing
  const config = loadConfig();

  // 2. Build dependencies
  const pool = new Pool({
    host:     config.database.host,
    port:     config.database.port,
    database: config.database.name,
    user:     config.database.user,
    password: config.database.password,
  });

  const repo    = new PostgresUserRepository(pool);
  const service = new UserService(
    { database: config.database, logging: config.logging },
    logger,
    repo
  );

  // 3. Initialize service — connects to DB, runs health checks
  await service.initialize();

  // 4. Build Express app
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes(service));
  app.use(errorHandler); // must be last

  // 5. Start listening
  const server = app.listen(config.server.port, config.server.host, () => {
    logger.info('Server started', {
      host: config.server.host,
      port: config.server.port,
    });
  });

  // 6. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info('Shutdown signal received', { signal });
    server.close(async () => {
      await service.shutdown();
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
```

---

## Step 3: Environment Variables

Set before running:

```bash
export DB_NAME=myapp
export DB_USER=myuser
export DB_PASSWORD=secret
export DB_HOST=localhost
export DB_PORT=5432
export SERVER_PORT=3000
export LOG_LEVEL=info
```

Or use a `.env` file with `dotenv`:

```bash
npm install dotenv
```

```typescript
// Add to top of main.ts, before any other imports
import 'dotenv/config';
```

---

## Step 4: Run

```bash
npx ts-node --esm src/main.ts
```

Or compile first:

```bash
npx tsc && node dist/main.js
```

---

## Step 5: Verify with curl

```bash
# Create a user
curl -s -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","name":"Alice","role":"admin"}' | jq

# Get the user (replace ID with one from the create response)
curl -s http://localhost:3000/api/users/usr_1234567890 | jq

# List users
curl -s 'http://localhost:3000/api/users?role=admin&limit=5' | jq

# Validation error (400)
curl -s -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"notanemail","name":"X"}' | jq

# Not found (404)
curl -s http://localhost:3000/api/users/usr_nonexistent | jq
```

---

## Route Summary

The `userRoutes` adapter registers three routes:

| Method | Path | Handler flow | Success | Error |
|--------|------|-------------|---------|-------|
| `GET` | `/:id` | `parseUserId` → `findUser` → `toUserDTO` | 200 `UserDTO` | 400, 404 |
| `POST` | `/` | `createUser` → `toUserDTO` | 201 `UserDTO` | 400, 409 |
| `GET` | `/` | `listUsers` → `items.map(toUserDTO)` | 200 `PaginatedResult<UserDTO>` | — |

---

## Error Handling

`errorHandler` is registered last and handles all `AppError` instances:

```typescript
// examples/rest/error-handler.ts
app.use(errorHandler); // after all routes
```

HTTP status mapping:

| `AppError.kind` | HTTP Status |
|-----------------|-------------|
| `validation` | 400 |
| `unauthorized` | 401 |
| `forbidden` | 403 |
| `not_found` | 404 |
| `conflict` | 409 |
| `rate_limit` | 429 |
| `internal` | 500 |
| `external` | 502 |

Unrecognized errors (thrown, not `AppError`) are caught as 500 and logged server-side. Stack traces are never sent to clients.

---

## Testing

Run integration tests using `MockUserRepository` — no real database needed:

```typescript
// examples/test/rest.integration.spec.ts (already provided)
import request from 'supertest';
import { makeTestApp } from './helpers.js';

it('POST / creates a user', async () => {
  const { app } = makeTestApp();
  const res = await request(app)
    .post('/api/users')
    .send({ email: 'alice@test.local', name: 'Alice' })
    .expect(201);
  expect(res.body.email).toBe('alice@test.local');
});
```

See [API Reference: Adapters](../api/adapters.md) for the full `userRoutes` and `errorHandler` API.

---

## Customization

### Add a new route

```typescript
// In your own routes file — extend the pattern
router.delete('/:id', async (req, res, next) => {
  const parsed = service.parseUserId(req.params.id);
  if (!isOk(parsed)) return next(parsed.error);

  const result = await service.deleteUser(parsed.value); // your new method
  if (isOk(result)) return res.status(204).send();
  next(result.error);
});
```

### Add authentication middleware

```typescript
// Middleware — runs before routes, calls next() on success or next(err) on failure
app.use('/api', requireAuth); // add before routes
app.use('/api/users', userRoutes(service));
app.use(errorHandler); // still last
```

### Change the base path

```typescript
app.use('/v1/users', userRoutes(service)); // mount at a different prefix
```
