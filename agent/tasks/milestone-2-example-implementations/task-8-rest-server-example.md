# Task 8: REST Server Example

**Milestone**: M2 - Example Implementations
**Status**: Not Started
**Created**: 2026-02-27

---

## Objective

Create a working Express REST server example in `agent/files/examples/rest/` that demonstrates how to wire the shared core library (Task 7) into a REST API. Installed to `./examples/rest/` in consumer projects — not `src/`.

## File Structure

```
agent/files/examples/rest/
├── server.ts        # Express app setup, middleware, startup
├── user.routes.ts   # Route handlers calling UserService
└── error-handler.ts # Centralized error handler using HTTP_STATUS
```

## Design

### `server.ts`

- Creates an Express app
- Mounts `userRoutes(service)` at `/api/users`
- Registers the error handler middleware
- Calls `service.initialize()` before `app.listen()`
- Calls `service.shutdown()` on `SIGTERM`
- Loads config via `loadConfig()` from `../../src/config`
- Wires dependencies: `config → UserService → routes → app`

### `user.routes.ts`

Exports `userRoutes(service: UserService): Router` with:

| Method | Path         | Service call               | Success | Error codes       |
|--------|--------------|----------------------------|---------|-------------------|
| GET    | `/:id`       | `service.findUser(id)`     | 200     | 400, 404          |
| POST   | `/`          | `service.createUser(body)` | 201     | 400, 409          |
| GET    | `/`          | `service.listUsers(query)` | 200     | —                 |

- Uses `isOk(result)` to branch on Result<T,E>
- Returns `toUserDTO(user)` (never raw entities)
- On `Err`: reads `result.error.kind` to select status code

### `error-handler.ts`

- Express error handler middleware `(err, req, res, next)`
- Uses `isAppError(err)` + `HTTP_STATUS[err.kind]` from `../../src/errors`
- Falls back to 500 for unknown errors, never leaking stack traces

## Imports

All imports reference `../../src/` (the shared installable core library):

```typescript
import { UserService } from '../../src/services';
import { loadConfig } from '../../src/config';
import { isOk, toUserDTO } from '../../src/types';
import { isAppError, HTTP_STATUS } from '../../src/errors';
```

## Acceptance Criteria

- [ ] `server.ts` starts without errors, listens on `config.server.port`
- [ ] `GET /api/users/:id` returns 200 with UserDTO or 404
- [ ] `POST /api/users` returns 201 or 400/409 with typed error shape
- [ ] `GET /api/users` returns paginated list
- [ ] All errors go through the centralized error handler
- [ ] No business logic in route handlers (delegates to UserService)
- [ ] package.yaml templates updated with `examples/rest/` entries
- [ ] agent/files/README.md updated with examples/ section

---

**Related Patterns**:
- [Adapter REST](../../patterns/core-sdk.adapter-rest.md)
- [Service Error Handling](../../patterns/core-sdk.service-error-handling.md)
- [Result Types](../../patterns/core-sdk.types-result.md)
