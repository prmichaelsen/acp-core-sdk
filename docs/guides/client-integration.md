# REST Client Integration Guide

How to consume a core-sdk REST API from another application using the typed client library.

---

## Overview

`UserClient` wraps all user REST endpoints as typed functions that return `Result<T,E>`. Callers never write `fetch` or parse HTTP status codes — error types are part of the function signature.

```
Application code
  → client.getUser(id)
    → fetch GET /api/users/:id
      → 200: Ok<UserDTO>
      → 400: Err<ValidationError>
      → 404: Err<NotFoundError>
      → network error: Err<ExternalError>
```

---

## Prerequisites

Install dependencies:

```bash
npm install --save-dev @types/node typescript
```

Copy the client library:

```bash
cp -r core-sdk/src/types   ./src/types
cp -r core-sdk/src/errors  ./src/errors
cp -r core-sdk/src/client  ./src/client
```

**Node.js version**: The client uses native `fetch` — requires Node.js 18+. For Node.js < 18, polyfill with `node-fetch`:

```bash
npm install node-fetch
```

```typescript
// Add to the top of your entry point
import fetch from 'node-fetch';
globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
```

---

## Step 1: Create the Client

### Aggregator (recommended)

`createClient` returns a namespaced client with all sub-clients:

```typescript
import { createClient } from './src/client/index.js';

const client = createClient({ baseUrl: 'https://api.example.com' });

// Access sub-clients via namespace
const { users } = client;
```

### Standalone user client

```typescript
import { createUserClient } from './src/client/user.client.js';

const users = createUserClient('https://api.example.com');
```

### With authentication

```typescript
const { users } = createClient({
  baseUrl: 'https://api.example.com',
  init: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});
```

The `init` object is merged into every `fetch` call. Use it for default headers, credentials mode, timeouts, etc.

---

## Step 2: Use the Client

### Get a user

```typescript
import { isOk } from './src/types/result.types.js';

const result = await users.getUser('usr_abc123');

if (isOk(result)) {
  console.log(result.value.name); // UserDTO — TypeScript knows the type
} else {
  switch (result.error.kind) {
    case 'not_found':
      console.log('User does not exist');
      break;
    case 'validation':
      console.log('Invalid ID:', result.error.message);
      break;
  }
}
```

### Create a user

```typescript
const result = await users.createUser({
  email: 'alice@example.com',
  name:  'Alice Smith',
  role:  'admin', // optional — defaults to 'member'
});

if (isOk(result)) {
  console.log('Created:', result.value.id);
} else {
  switch (result.error.kind) {
    case 'validation':
      console.log('Validation errors:', result.error.fields);
      // { email: ['Must be a valid email'], name: [...] }
      break;
    case 'conflict':
      console.log('Email already taken');
      break;
  }
}
```

### List users

```typescript
// List all users (no filters)
const page = await users.listUsers();
console.log(page.items);    // UserDTO[]
console.log(page.total);    // total count across all pages
console.log(page.hasMore);  // whether more pages exist
console.log(page.cursor);   // cursor for the next page

// Filter by role
const admins = await users.listUsers({ role: 'admin' });

// Paginate
let cursor: string | undefined;
do {
  const page = await users.listUsers({ limit: 10, cursor });
  for (const user of page.items) {
    console.log(user.name);
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
```

`listUsers` does not return `Result<T,E>` — it throws on network or server errors (5xx). Use try/catch for those cases:

```typescript
try {
  const page = await users.listUsers();
  // ...
} catch (err) {
  // Network failure or server 5xx
  console.error('Failed to list users:', err);
}
```

---

## Step 3: Result Type Reference

| Method | Success | Error types |
|--------|---------|-------------|
| `getUser(id)` | `Ok<UserDTO>` | `Err<ValidationError \| NotFoundError>` |
| `createUser(input)` | `Ok<UserDTO>` | `Err<ValidationError \| ConflictError>` |
| `listUsers(opts?)` | `PaginatedResult<UserDTO>` | throws `ExternalError` |

### HTTP to Result mapping

| HTTP status | `getUser` | `createUser` |
|-------------|-----------|--------------|
| 200/201 | `Ok<UserDTO>` | `Ok<UserDTO>` |
| 400 | `Err<ValidationError>` | `Err<ValidationError>` |
| 404 | `Err<NotFoundError>` | — |
| 409 | — | `Err<ConflictError>` |
| network / 5xx | `Err<ExternalError>` | `Err<ExternalError>` |

---

## Step 4: Complete Example

```typescript
// src/user-sync.ts — sync users from a remote service
import { createClient } from './src/client/index.js';
import { isOk } from './src/types/result.types.js';

const { users } = createClient({ baseUrl: 'https://api.example.com' });

async function syncUsers(): Promise<void> {
  let cursor: string | undefined;
  const synced: string[] = [];

  do {
    const page = await users.listUsers({ limit: 50, cursor });
    for (const user of page.items) {
      synced.push(user.id);
      console.log(`Synced user: ${user.name} (${user.email})`);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  console.log(`Total synced: ${synced.length}`);
}

async function createAdminUser(email: string, name: string): Promise<void> {
  const result = await users.createUser({ email, name, role: 'admin' });
  if (isOk(result)) {
    console.log(`Admin created: ${result.value.id}`);
    return;
  }

  if (result.error.kind === 'conflict') {
    console.log(`Admin already exists for ${email}`);
    return;
  }

  if (result.error.kind === 'validation' && result.error.fields) {
    for (const [field, messages] of Object.entries(result.error.fields)) {
      console.error(`  ${field}: ${messages.join(', ')}`);
    }
    throw new Error('Invalid admin user data');
  }
}

syncUsers().catch(console.error);
```

---

## Testing

Use `http.createServer` + port 0 to run a real server and point the client at it:

```typescript
// examples/test/rest.integration.spec.ts (already provided)
import http from 'http';
import type { AddressInfo } from 'net';
import { createUserClient } from '../../src/client/user.client.js';

describe('UserClient', () => {
  let server: http.Server;
  let users: ReturnType<typeof createUserClient>;

  beforeAll(done => {
    const { app } = makeTestApp(); // Express app with MockUserRepository
    server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      users = createUserClient(`http://localhost:${port}`);
      done();
    });
  });

  afterAll(done => server.close(done));

  it('getUser → Ok on success', async () => {
    // seed repo before test
    const result = await users.getUser(fixture.id);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value.email).toBe(fixture.email);
  });

  it('getUser → Err<NotFoundError>', async () => {
    const result = await users.getUser('usr_unknown');
    expect(isOk(result)).toBe(false);
    if (!isOk(result)) expect(result.error.kind).toBe('not_found');
  });
});
```

---

## Customization

### Add a custom base class

```typescript
// Wrap createClient with project-specific defaults
export function createAppClient(token: string) {
  return createClient({
    baseUrl: process.env.API_URL ?? 'https://api.example.com',
    init: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}
```

### Extend with a new resource

```typescript
// src/client/order.client.ts — follow the same pattern as user.client.ts
export interface OrderClient {
  getOrder(id: string): Promise<Result<OrderDTO, NotFoundError | ValidationError>>;
  createOrder(input: CreateOrderInput): Promise<Result<OrderDTO, ValidationError>>;
}

export function createOrderClient(baseUrl: string, defaultInit?: RequestInit): OrderClient {
  const base = baseUrl.replace(/\/$/, '');
  return {
    async getOrder(id) { /* fetch GET /api/orders/:id, map result */ },
    async createOrder(input) { /* fetch POST /api/orders, map result */ },
  };
}

// In index.ts — add to Client interface and createClient factory
export interface Client {
  users:  UserClient;
  orders: OrderClient;  // add
}

export function createClient(config: ClientConfig): Client {
  return {
    users:  createUserClient(config.baseUrl, config.init),
    orders: createOrderClient(config.baseUrl, config.init),  // add
  };
}
```

See [API Reference: Adapters](../api/adapters.md#client-adapter-srcclient) for the full `UserClient`, `createClient`, and `createUserClient` API.
