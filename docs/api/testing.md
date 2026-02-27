# API Reference: Testing Utilities

Complete reference for test helpers in `examples/test/`.

---

## `MockUserRepository` (`examples/test/user.repository.mock.ts`)

In-memory implementation of `UserRepository`. Inject in tests instead of a real database.

```typescript
class MockUserRepository implements UserRepository {
  reset(): void;
  seed(user: User): void;
  all(): User[];
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(opts: { role?: string; cursor?: string; limit: number }): Promise<{
    users: User[]; total: number; nextCursor: string | null;
  }>;
  create(input: Omit<User, 'id'>): Promise<User>;
}
```

### `reset(): void`

Clear all users from the store. Call in `beforeEach` to isolate tests.

```typescript
beforeEach(() => {
  repo.reset(); // never beforeAll — tests must not share state
});
```

### `seed(user: User): void`

Pre-load a known user fixture into the store before a test runs.

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `User` | Complete user object (must include `id`) |

```typescript
const fixture: User = {
  id: toUserId('usr_abc123'),
  email: 'alice@example.com' as EmailAddress,
  name: 'Alice',
  role: 'member',
  createdAt: toTimestamp(new Date('2024-01-01')),
};

beforeEach(() => {
  repo.reset();
  repo.seed(fixture);
});
```

### `all(): User[]`

Return all users currently in the store. Use in assertions to verify side effects.

```typescript
it('creates a user in the store', async () => {
  await service.createUser({ email: 'alice@test.local', name: 'Alice' });
  expect(repo.all()).toHaveLength(1);
  expect(repo.all()[0].email).toBe('alice@test.local');
});
```

### `findById(id: UserId): Promise<User | null>`

Return the user with the given ID, or `null`.

### `findByEmail(email: string): Promise<User | null>`

Return the user with the given email, or `null`.

### `findAll(opts): Promise<{ users, total, nextCursor }>`

Return a filtered, cursor-paginated page. Supports `role` filter and `cursor` (ID-based, exclusive).

### `create(input: Omit<User, 'id'>): Promise<User>`

Persist a new user with an auto-generated `id` (`usr_` + sequential counter). Returns the full `User`.

---

## `createTestConfig` (`src/config/index.ts`)

Returns a deterministic `AppConfig` with safe defaults. Does **not** read `process.env`.

```typescript
function createTestConfig(overrides?: DeepPartial<AppConfig>): AppConfig
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `overrides` | `DeepPartial<AppConfig>?` | Partial config merged over the defaults |

**Default values**:

| Field | Default |
|-------|---------|
| `server.port` | `3000` |
| `server.host` | `'0.0.0.0'` |
| `database.name` | `'test_db'` |
| `database.user` | `'test_user'` |
| `database.password` | `'test_pass'` |
| `database.host` | `'localhost'` |
| `database.port` | `5432` |
| `logging.level` | `'error'` |

**Usage**:

```typescript
// Simplest — all defaults
const config = createTestConfig();

// Override logging level
const config = createTestConfig({ logging: { level: 'debug' } });

// Override database name
const config = createTestConfig({ database: { name: 'my_test_db' } });
```

**ServiceConfig slice**:

```typescript
const config = createTestConfig();
const serviceConfig: ServiceConfig = {
  database: config.database,
  logging:  config.logging,
};
const service = new UserService(serviceConfig, mockLogger, repo);
```

---

## `mockLogger`

A `Logger` implementation that discards all output. Use as the second argument to `UserService`.

```typescript
const mockLogger: Logger = {
  debug: () => {},
  info:  () => {},
  warn:  () => {},
  error: () => {},
};
```

Defined inline — not exported from a file. Copy it into each test suite.

---

## REST Integration Testing

Test the REST adapter using `supertest` for route-level tests and a real HTTP server for `UserClient` tests.

### Route-level: `supertest`

```typescript
import request from 'supertest';
import express from 'express';
import { userRoutes, errorHandler } from '../rest/user.routes';

function makeTestApp() {
  const repo    = new MockUserRepository();
  const service = new UserService(createTestConfig(), mockLogger, repo);
  const app     = express();
  app.use(express.json());
  app.use('/api/users', userRoutes(service));
  app.use(errorHandler);
  return { app, repo, service };
}

it('GET /api/users/:id → 200', async () => {
  const { app, repo } = makeTestApp();
  repo.seed(fixture);
  const res = await request(app).get('/api/users/usr_abc123').expect(200);
  expect(res.body.id).toBe('usr_abc123');
});
```

### Client-level: real HTTP server

`UserClient` uses native `fetch`, which requires a real URL. Use `http.createServer` + port 0.

```typescript
import http from 'http';
import type { AddressInfo } from 'net';
import { createUserClient } from '../../src/client/user.client';

describe('UserClient', () => {
  let server: http.Server;
  let client: ReturnType<typeof createUserClient>;

  beforeAll(done => {
    const { app } = makeTestApp();
    server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      client = createUserClient(`http://localhost:${port}`);
      done();
    });
  });

  afterAll(done => { server.close(done); });

  it('getUser → Ok<UserDTO>', async () => {
    // seed via repo ...
    const result = await client.getUser('usr_abc123');
    expect(isOk(result)).toBe(true);
  });
});
```

---

## MCP Integration Testing: `ToolCapture`

`ToolCapture` is a test shim that intercepts `server.tool()` registrations so handlers can be called directly — no MCP transport required.

```typescript
type ToolArgs   = Record<string, unknown>;
type ToolResult = { content: Array<{ type: string; text: string }> };
type ToolHandler = (args: ToolArgs) => Promise<ToolResult>;

class ToolCapture {
  private handlers = new Map<string, ToolHandler>();

  tool(_name: string, _desc: string, _shape: unknown, handler: ToolHandler): void {
    this.handlers.set(_name, handler);
  }

  async call(name: string, args: ToolArgs): Promise<ToolResult> {
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`No tool registered: ${name}`);
    return handler(args);
  }

  registeredTools(): string[] {
    return Array.from(this.handlers.keys());
  }
}
```

**Usage**:

```typescript
import { registerUserTools } from '../mcp/user.tools';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('MCP user tools', () => {
  let capture: ToolCapture;
  let repo: MockUserRepository;

  beforeEach(() => {
    repo    = new MockUserRepository();
    capture = new ToolCapture();
    const service = new UserService(createTestConfig(), mockLogger, repo);
    registerUserTools(capture as unknown as McpServer, service);
  });

  it('registers 3 tools', () => {
    expect(capture.registeredTools()).toHaveLength(3);
    expect(capture.registeredTools()).toContain('get_user');
  });

  it('get_user returns UserDTO JSON', async () => {
    repo.seed(fixture);
    const result = await capture.call('get_user', { id: 'usr_abc123' });
    const dto = JSON.parse(result.content[0].text);
    expect(dto.id).toBe('usr_abc123');
  });

  it('get_user throws McpError for unknown ID', async () => {
    await expect(capture.call('get_user', { id: 'usr_unknown' }))
      .rejects.toMatchObject({ code: ErrorCode.InvalidParams });
  });
});
```

**Why `as unknown as McpServer`**: `ToolCapture` implements only the subset of `McpServer` called by `registerUserTools` (just `.tool()`). The cast avoids importing and mocking the full `McpServer` type.

---

## CLI Integration Testing

Test the CLI adapter by mocking `process.stdout`, `process.stderr`, and `process.exit`, then driving Commander via `program.parseAsync`.

### Setup

```typescript
import { Command } from 'commander';
import { registerUserCommands } from '../cli/user.commands';

type Out = { stdout: string[]; stderr: string[]; exitCode: number | null };

function makeTestProgram() {
  const repo    = new MockUserRepository();
  const service = new UserService(createTestConfig(), mockLogger, repo);
  const program = new Command().exitOverride();
  registerUserCommands(program, service);
  return { program, repo };
}
```

### Spy setup (per-test)

```typescript
let out: Out;
let stdoutSpy: jest.SpyInstance;
let stderrSpy: jest.SpyInstance;
let exitSpy:   jest.SpyInstance;

beforeEach(() => {
  out = { stdout: [], stderr: [], exitCode: null };

  stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    out.stdout.push(String(chunk)); return true;
  });
  stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    out.stderr.push(String(chunk)); return true;
  });
  exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
    out.exitCode = (code as number) ?? 0;
    throw Object.assign(new Error(`process.exit(${code})`), { isTestExit: true });
  });
});

afterEach(() => {
  stdoutSpy.restore();
  stderrSpy.restore();
  exitSpy.restore();
});
```

### `run()` helper

```typescript
async function run(program: Command, ...args: string[]): Promise<void> {
  try {
    await program.parseAsync(['', '', ...args]);
  } catch (e) {
    if (!(e as { isTestExit?: boolean }).isTestExit) throw e;
  }
}
```

**Why `['', '', ...args]`**: Commander's `parseAsync` expects `argv[0]` (node) and `argv[1]` (script) before the actual arguments.

### Usage

```typescript
it('user get <id> → stdout JSON, exit 0', async () => {
  const { program, repo } = makeTestProgram();
  repo.seed(fixture);
  await run(program, 'user', 'get', 'usr_abc123');
  const dto = JSON.parse(out.stdout.join(''));
  expect(dto.id).toBe('usr_abc123');
  expect(out.exitCode).toBeNull(); // exit(0) not called — natural completion
});

it('user get <unknown> → stderr error, exit 1', async () => {
  const { program } = makeTestProgram();
  await run(program, 'user', 'get', 'usr_unknown');
  expect(out.stderr.join('')).toContain('[not_found]');
  expect(out.exitCode).toBe(1);
});
```

### Exit code conventions

| Code | Meaning | When |
|------|---------|------|
| `null` (no exit call) | Success | Command completes without `process.exit(0)` |
| `1` | Application error | `AppError` from service |
| `2` | Usage / config error | Commander parse error, `loadConfig()` failure |

---

## Test Isolation Rules

1. **Always `repo.reset()` in `beforeEach`** — never `beforeAll`. State from one test must never affect another.
2. **Use `createTestConfig()`** — never `loadConfig()` in tests. CI environments may not have required env vars.
3. **Mock `process.exit`** — it terminates the test process if not intercepted.
4. **Close HTTP servers** in `afterAll` — open handles prevent Jest from exiting cleanly.
5. **Use `isOk(result)` in assertions** — not `result.success`. The type guard provides TypeScript narrowing.

```typescript
// ✓ Readable + type-narrowing
expect(isOk(result)).toBe(true);
if (isOk(result)) {
  expect(result.value.email).toBe('alice@example.com'); // TypeScript: User
}

// ✗ Bypasses narrowing
expect(result.success).toBe(true);
```
