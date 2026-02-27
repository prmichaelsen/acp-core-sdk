# Quick Start: REST Server in 15 Minutes

Build a working REST API for a `Todo` domain using the core-sdk patterns. You'll have a running Express server with typed errors, `Result<T,E>` responses, and a client library in about 15 minutes.

**Prerequisites**: Complete [Getting Started](getting-started.md) first.

---

## What We're Building

```
TodoService (domain logic)
    │
    └──► Express REST server
             GET  /api/todos/:id   → TodoDTO or 404
             POST /api/todos       → 201 TodoDTO or 400
             GET  /api/todos       → PaginatedResult<TodoDTO>
```

---

## Minute 1–3: Define Your Types

Create `src/types/todo.types.ts`:

```typescript
// src/types/todo.types.ts

// Branded primitive to prevent mixing Todo IDs with other strings
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };
export type TodoId = Brand<string, 'TodoId'>;

export function toTodoId(value: string): TodoId {
  if (!value || value.trim().length === 0) {
    throw new Error('TodoId must be non-empty');
  }
  return value as TodoId;
}

// Internal entity (stored in DB)
export interface Todo {
  id: TodoId;
  title: string;
  done: boolean;
  createdAt: string;
}

// API response shape (never expose internals directly)
export interface TodoDTO {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export function toTodoDTO(todo: Todo): TodoDTO {
  return { id: todo.id, title: todo.title, done: todo.done, createdAt: todo.createdAt };
}

// Input types
export interface CreateTodoInput { title: string; }
export interface ListTodosInput  { cursor?: string; limit?: number; }
```

---

## Minute 4–6: Create the Service

Create `src/services/todo.service.ts`:

```typescript
// src/services/todo.service.ts
import { BaseService, Logger } from './base.service';
import { ServiceConfig } from '../config/schema';
import { Result, ok, err } from '../types/result.types';
import { toTodoId, Todo, TodoId, CreateTodoInput, ListTodosInput } from '../types/todo.types';
import { createPaginatedResult, PaginatedResult } from '../types/shared.types';
import { NotFoundError, ValidationError } from '../errors/app-errors';

// Define the repository interface — implement this for your database
export interface TodoRepository {
  findById(id: TodoId): Promise<Todo | null>;
  findAll(opts: { cursor?: string; limit: number }): Promise<{
    todos: Todo[];
    total: number;
    nextCursor: string | null;
  }>;
  create(input: Omit<Todo, 'id'>): Promise<Todo>;
}

export class TodoService extends BaseService<ServiceConfig> {
  constructor(config: ServiceConfig, logger: Logger, private repo: TodoRepository) {
    super(config, logger);
  }

  async findTodo(id: TodoId): Promise<Result<Todo, NotFoundError>> {
    const todo = await this.repo.findById(id);
    if (!todo) return err(new NotFoundError('Todo', id));
    return ok(todo);
  }

  async createTodo(input: CreateTodoInput): Promise<Result<Todo, ValidationError>> {
    if (input.title.trim().length < 2) {
      return err(new ValidationError('Invalid input', { title: ['Must be at least 2 characters'] }));
    }
    const todo = await this.repo.create({
      title: input.title.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    });
    return ok(todo);
  }

  async listTodos(input: ListTodosInput = {}): Promise<PaginatedResult<Todo>> {
    const limit = Math.min(input.limit ?? 20, 100);
    const { todos, total, nextCursor } = await this.repo.findAll({ cursor: input.cursor, limit });
    return createPaginatedResult(todos, total, nextCursor);
  }

  parseTodoId(raw: string): Result<TodoId, ValidationError> {
    try { return ok(toTodoId(raw)); }
    catch { return err(new ValidationError(`Invalid todo ID: ${raw}`)); }
  }
}
```

---

## Minute 7–9: Wire the Routes

Create `examples/rest/todo.routes.ts`:

```typescript
// examples/rest/todo.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TodoService } from '../../src/services/todo.service';
import { isOk } from '../../src/types';
import { toTodoDTO } from '../../src/types/todo.types';

export function todoRoutes(service: TodoService): Router {
  const router = Router();

  // GET /api/todos/:id
  router.get('/:id', async (req, res, next) => {
    const parsed = service.parseTodoId(req.params.id);
    if (!isOk(parsed)) return next(parsed.error);

    const result = await service.findTodo(parsed.value);
    if (isOk(result)) return res.json(toTodoDTO(result.value));
    next(result.error); // NotFoundError → 404
  });

  // POST /api/todos
  router.post('/', async (req, res, next) => {
    const result = await service.createTodo(req.body);
    if (isOk(result)) return res.status(201).json(toTodoDTO(result.value));
    next(result.error); // ValidationError → 400
  });

  // GET /api/todos
  router.get('/', async (req, res, next) => {
    try {
      const result = await service.listTodos({
        cursor: req.query.cursor as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ ...result, items: result.items.map(toTodoDTO) });
    } catch (err) { next(err); }
  });

  return router;
}
```

---

## Minute 10–12: Bootstrap the Server

Create `examples/rest/todo.server.ts`:

```typescript
// examples/rest/todo.server.ts
import express from 'express';
import { loadConfig } from '../../src/config';
import { TodoService, TodoRepository } from '../../src/services/todo.service';
import { toTodoId, Todo } from '../../src/types/todo.types';
import { todoRoutes } from './todo.routes';
import { errorHandler } from './error-handler'; // reuse from examples/rest/

// In-memory repository — replace with your real DB adapter
class InMemoryTodoRepository implements TodoRepository {
  private store = new Map<string, Todo>();

  async findById(id: string) { return this.store.get(id) ?? null; }

  async findAll(opts: { cursor?: string; limit: number }) {
    const todos = Array.from(this.store.values());
    const total = todos.length;
    const start = opts.cursor ? todos.findIndex(t => t.id === opts.cursor) + 1 : 0;
    const page  = todos.slice(start, start + opts.limit);
    return { todos: page, total, nextCursor: page.length === opts.limit ? (page.at(-1)?.id ?? null) : null };
  }

  async create(input: Omit<Todo, 'id'>) {
    const id = toTodoId(`todo_${Math.random().toString(36).slice(2, 10)}`);
    const todo: Todo = { id, ...input };
    this.store.set(id, todo);
    return todo;
  }
}

async function main() {
  const config  = loadConfig();
  const logger  = { debug: console.debug, info: console.info, warn: console.warn, error: console.error };
  const repo    = new InMemoryTodoRepository();
  const service = new TodoService({ database: config.database, logging: config.logging }, logger, repo);
  await service.initialize();

  const app = express();
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/todos', todoRoutes(service));
  app.use(errorHandler);

  const { port, host } = config.server;
  app.listen(port, host, () => console.info(`Server running on http://${host}:${port}`));
}

main().catch(err => { console.error(err); process.exit(1); });
```

---

## Minute 13–15: Run It

Set config and start the server:

```bash
export DB_NAME=mydb DB_USER=user DB_PASSWORD=secret
npx ts-node examples/rest/todo.server.ts
# Server running on http://0.0.0.0:3000
```

Test it:

```bash
# Create a todo
curl -s -X POST http://localhost:3000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy groceries"}' | jq .
# { "id": "todo_abc123", "title": "Buy groceries", "done": false, "createdAt": "..." }

# Get the todo by ID
curl -s http://localhost:3000/api/todos/todo_abc123 | jq .

# List todos
curl -s http://localhost:3000/api/todos | jq .

# Test error handling — short title
curl -s -X POST http://localhost:3000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"X"}' | jq .
# { "error": { "kind": "validation", "message": "Invalid input", "fields": { "title": [...] } } }

# Test 404
curl -s http://localhost:3000/api/todos/todo_nonexistent | jq .
# { "error": { "kind": "not_found", "message": "Todo not found: todo_nonexistent" } }
```

---

## What Just Happened

| Layer | File | Role |
|-------|------|------|
| Types | `src/types/todo.types.ts` | `TodoId`, `Todo`, `TodoDTO`, `toTodoDTO` |
| Service | `src/services/todo.service.ts` | Business logic; returns `Result<T,E>` |
| Repository | `InMemoryTodoRepository` | Data access interface (swap for real DB) |
| Routes | `examples/rest/todo.routes.ts` | HTTP → service → DTO mapping |
| Error handler | `examples/rest/error-handler.ts` | `AppError` → HTTP status |
| Bootstrap | `examples/rest/todo.server.ts` | Wires everything together |

**Key patterns used:**
- `Result<T,E>` — service returns `Ok<Todo>` or `Err<ValidationError>`, never throws for expected failures
- Repository interface — service depends on the interface, not the implementation; swap in tests
- DTO separation — `Todo` is the internal entity; `TodoDTO` is what the API returns
- Error handler — centralized: catches all `AppError` subclasses and maps to correct HTTP codes

## Next Steps

- **Add MCP tools** → copy `examples/mcp/user.tools.ts`, replace `UserService` with `TodoService`
- **Add CLI commands** → copy `examples/cli/user.commands.ts`, replace `UserService` with `TodoService`
- **Write tests** → copy `examples/test/`, replace `UserRepository` with `TodoRepository`
- **Use patterns correctly** → [Best Practices](guides/best-practices.md)
