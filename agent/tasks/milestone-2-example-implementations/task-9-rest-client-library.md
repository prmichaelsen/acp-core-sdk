# Task 9: REST Client Library

**Milestone**: M2 - Example Implementations
**Status**: Not Started
**Created**: 2026-02-27

---

## Objective

Create a typed REST client in `agent/files/src/client/` (installable) that wraps all endpoints defined by the REST server (Task 8). Consumers install this alongside the shared core library and use typed functions instead of writing their own `fetch` calls.

Also add `agent/files/examples/rest/client-usage.ts` (example) showing the client wired against the REST server.

## File Structure

```
agent/files/src/client/          ← installable
├── user.client.ts               # Typed HTTP client wrapping user endpoints
└── index.ts                     # Barrel re-export

agent/files/examples/rest/       ← example (extends Task 8)
└── client-usage.ts              # Shows UserClient fetching from the REST server
```

## Design

### `src/client/user.client.ts`

Factory function `createUserClient(baseUrl: string)` returns an object with:

| Method          | HTTP call               | Returns                              |
|-----------------|-------------------------|--------------------------------------|
| `getUser(id)`   | `GET /api/users/:id`    | `Promise<Result<UserDTO, NotFoundError \| ValidationError>>` |
| `createUser(input)` | `POST /api/users`   | `Promise<Result<UserDTO, ValidationError \| ConflictError>>` |
| `listUsers(opts?)` | `GET /api/users`     | `Promise<PaginatedResult<UserDTO>>`  |

Key design choices:
- Returns `Result<T, E>` for operations that can fail with expected errors — mirrors the service API surface
- Maps HTTP 4xx responses back to typed errors using the same `ErrorKind` discriminant
- Uses `fetch` (native, no extra dependency)
- Accepts an optional `RequestInit` for auth headers, timeouts, etc.

```typescript
// Usage
const client = createUserClient('https://api.example.com');
const result = await client.getUser('usr_123');
if (isOk(result)) {
  console.log(result.value.name);
} else {
  console.error(result.error.kind); // 'not_found' | 'validation'
}
```

### `examples/rest/client-usage.ts`

A short runnable script that:
1. Starts (or assumes) the REST server from Task 8
2. Creates a `UserClient` pointed at `http://localhost:3000`
3. Creates a user, fetches it back, lists all users
4. Demonstrates the full round-trip with typed results

## Acceptance Criteria

- [ ] `createUserClient(baseUrl)` returns all three methods
- [ ] `getUser` returns `Result<UserDTO, NotFoundError | ValidationError>`
- [ ] `createUser` returns `Result<UserDTO, ValidationError | ConflictError>`
- [ ] `listUsers` returns `PaginatedResult<UserDTO>`
- [ ] HTTP errors are mapped back to typed `AppError` subclasses (not raw status codes)
- [ ] `client-usage.ts` runs end-to-end against the Task 8 server
- [ ] No dependency beyond native `fetch` (Node 18+)
- [ ] package.yaml templates updated with `src/client/` entries

---

**Related Patterns**:
- [Adapter Client](../../patterns/core-sdk.adapter-client.md)
- [Result Types](../../patterns/core-sdk.types-result.md)
- [Error Types](../../patterns/core-sdk.types-error.md)
