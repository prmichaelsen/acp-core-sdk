# MCP Integration Guide

How to expose a service as MCP tools that AI models can discover and call.

---

## Overview

The MCP adapter registers service methods as named tools on an `McpServer`. The server communicates over stdin/stdout using the JSON-RPC MCP protocol. All logging **must** go to stderr — stdout is reserved for the wire protocol.

```
AI model calls tool
  → McpServer dispatches to registered handler
    → service.findUser / service.createUser / etc.
      → Result<T,E>
        → content: [{ type: 'text', text: JSON.stringify(UserDTO) }]  (success)
        → McpError(code, message)  (failure)
```

---

## Prerequisites

Install dependencies:

```bash
npm install @modelcontextprotocol/sdk
npm install --save-dev @types/node typescript
```

Copy source files:

```bash
# Core library
cp -r core-sdk/src/types    ./src/types
cp -r core-sdk/src/errors   ./src/errors
cp -r core-sdk/src/config   ./src/config
cp -r core-sdk/src/services ./src/services

# MCP adapter
cp -r core-sdk/examples/mcp ./examples/mcp
```

---

## Step 1: Implement UserRepository

Same as REST — the service accepts any `UserRepository` implementation. See the [REST Integration Guide](./rest-integration.md#step-1-implement-userrepository) for a full Postgres example, or use `MockUserRepository` for testing.

---

## Step 2: Wire the MCP Server

```typescript
// examples/mcp/server.ts (already provided — shown here for reference)
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from '../../src/config/index.js';
import { UserService } from '../../src/services/user.service.js';
import { registerUserTools } from './user.tools.js';

// CRITICAL: never console.log — stdout is the MCP protocol wire
const log = (level: string, msg: string, ctx?: object): void => {
  process.stderr.write(JSON.stringify({ level, msg, ...ctx }) + '\n');
};

async function main(): Promise<void> {
  const config  = loadConfig();
  const repo    = /* your UserRepository implementation */;
  const service = new UserService(
    { database: config.database, logging: config.logging },
    { debug: (m,c) => log('debug',m,c), info: (m,c) => log('info',m,c),
      warn: (m,c) => log('warn',m,c),   error: (m,c) => log('error',m,c) },
    repo
  );

  await service.initialize();

  const server = new McpServer({
    name:    'my-app',
    version: '1.0.0',
  });

  registerUserTools(server, service);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log('info', 'MCP server running');

  const shutdown = async (signal: string): Promise<void> => {
    log('info', 'Shutdown', { signal });
    await server.close();
    await service.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  process.stderr.write(`Startup failed: ${err}\n`);
  process.exit(1);
});
```

**Key constraint**: The `StdioServerTransport` owns stdout. Never write to stdout in an MCP server — use `process.stderr.write(...)` for all logging.

---

## Step 3: Registered Tools

`registerUserTools(server, service)` registers three tools:

### `get_user`

Fetch a single user by ID.

```
Input:  { id: string }
Output: content: [{ type: 'text', text: '{"id":"...","email":"...","name":"...","role":"..."}' }]
Errors: McpError(InvalidParams) — empty ID or user not found
```

### `create_user`

Create a new user.

```
Input:  { email: string, name: string, role?: 'admin' | 'member' | 'viewer' }
Output: content: [{ type: 'text', text: JSON.stringify(UserDTO) }]
Errors: McpError(InvalidParams)  — validation failure
        McpError(InvalidRequest) — email already in use (conflict)
```

### `list_users`

List users with optional filters and cursor-based pagination.

```
Input:  { role?: 'admin'|'member'|'viewer', cursor?: string, limit?: number (1-100) }
Output: content: [{ type: 'text', text: JSON.stringify({ items, total, cursor, hasMore }) }]
Errors: never — list always succeeds
```

---

## Step 4: MCP Error Code Mapping

The adapter maps `AppError.kind` → `ErrorCode`:

| `AppError.kind` | `ErrorCode` | JSON-RPC code |
|-----------------|-------------|---------------|
| `validation`, `not_found` | `InvalidParams` | -32602 |
| `unauthorized`, `forbidden`, `conflict` | `InvalidRequest` | -32600 |
| `rate_limit`, `external`, `internal` | `InternalError` | -32603 |

---

## Step 5: Connect to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "my-app": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/dist/examples/mcp/server.js"],
      "env": {
        "DB_NAME":     "myapp",
        "DB_USER":     "myuser",
        "DB_PASSWORD": "secret",
        "DB_HOST":     "localhost",
        "DB_PORT":     "5432"
      }
    }
  }
}
```

Or with `ts-node` (no compile step):

```json
{
  "mcpServers": {
    "my-app": {
      "command": "npx",
      "args": ["ts-node", "--esm", "/path/to/project/examples/mcp/server.ts"],
      "env": { "DB_NAME": "myapp", "DB_USER": "myuser", "DB_PASSWORD": "secret" }
    }
  }
}
```

Restart Claude Desktop after editing the config. The tools appear as `my-app:get_user`, `my-app:create_user`, `my-app:list_users`.

---

## Step 6: Run Standalone (Without Claude Desktop)

For local testing with the MCP Inspector:

```bash
# Compile first
npx tsc

# Run with MCP Inspector
npx @modelcontextprotocol/inspector node dist/examples/mcp/server.js
```

Or pipe directly (advanced):

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/examples/mcp/server.js
```

---

## Testing

Use `ToolCapture` to test tool handlers directly without a transport:

```typescript
// examples/test/mcp.integration.spec.ts (already provided)
import { ToolCapture } from './helpers.js';
import { registerUserTools } from '../mcp/user.tools.js';

describe('MCP user tools', () => {
  let capture: ToolCapture;
  let repo: MockUserRepository;

  beforeEach(() => {
    repo    = new MockUserRepository();
    capture = new ToolCapture();
    const service = new UserService(createTestConfig(), mockLogger, repo);
    registerUserTools(capture as unknown as McpServer, service);
  });

  it('get_user returns JSON UserDTO', async () => {
    repo.seed(fixture);
    const result = await capture.call('get_user', { id: fixture.id });
    const dto = JSON.parse(result.content[0].text);
    expect(dto.email).toBe(fixture.email);
  });

  it('get_user throws McpError for unknown user', async () => {
    await expect(capture.call('get_user', { id: 'usr_unknown' }))
      .rejects.toMatchObject({ code: ErrorCode.InvalidParams });
  });
});
```

The `ToolCapture` shim intercepts `server.tool()` registrations and stores the handlers. Call them directly with `capture.call(name, args)`. See [API Reference: Testing](../api/testing.md#mcp-integration-testing-toolcapture) for the full `ToolCapture` API.

---

## Logging Rule

**Absolute rule for MCP servers: stdout belongs to the protocol.**

```typescript
// ✗ NEVER in an MCP server
console.log('User created');         // corrupts JSON-RPC stream
console.info(JSON.stringify(data));  // same — console.* → stdout

// ✓ Always use stderr
process.stderr.write(JSON.stringify({ level: 'info', msg: 'User created' }) + '\n');
```

If you use `winston` or `pino`, configure them to write to `process.stderr`:

```typescript
import winston from 'winston';
const logger = winston.createLogger({
  transports: [new winston.transports.Stream({ stream: process.stderr })],
});
```

---

## Customization

### Add a new tool

```typescript
// In your own tools file — extend the pattern
export function registerOrderTools(server: McpServer, service: OrderService): void {
  server.tool(
    'create_order',
    'Create a new order for a user',
    {
      userId: z.string(),
      items:  z.array(z.object({ productId: z.string(), quantity: z.number() })),
    },
    async ({ userId, items }) => {
      const parsed = service.parseUserId(userId);
      if (!isOk(parsed)) {
        throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
      }
      const result = await service.createOrder(parsed.value, items);
      if (!isOk(result)) {
        const code = MCP_CODE_MAP[result.error.kind];
        throw new McpError(code, result.error.message);
      }
      return { content: [{ type: 'text', text: JSON.stringify(result.value) }] };
    }
  );
}
```

### Register multiple tool sets

```typescript
// In server.ts — register tools from multiple modules
registerUserTools(server, userService);
registerOrderTools(server, orderService);
registerProductTools(server, productService);
```

Each `register*Tools` call adds its tools to the same server. Tool names must be unique.
