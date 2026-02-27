# Multi-Target Integration Guide

How to serve one service simultaneously as a REST API, MCP server, and CLI tool.

---

## Overview

The core value of core-sdk patterns is that a single service can power multiple deployment targets without any changes to business logic. Each adapter is wired independently, sharing only the service instance.

```
UserService (business logic, validation, error types)
  ├── REST adapter  → Express HTTP server (port 3000)
  ├── MCP adapter   → McpServer + StdioTransport (stdout/stdin)
  └── CLI adapter   → Commander program (argv)
```

The same `UserRepository` and `UserService` power all three.

---

## The Key Pattern

**One service, many adapters**. Adapters are thin translation layers. All logic is in the service.

```typescript
// Service is created once
const service = new UserService(serviceConfig, logger, repo);
await service.initialize();

// Adapters each consume the same service
app.use('/api/users', userRoutes(service));     // REST
registerUserTools(mcpServer, service);          // MCP
registerUserCommands(cliProgram, service);      // CLI
```

---

## Common Startup: Shared Dependencies

Create a shared factory that builds the service once:

```typescript
// src/startup.ts
import { loadConfig } from './config/index.js';
import { UserService } from './services/user.service.js';
import type { Logger } from './services/base.service.js';

export async function buildService() {
  const config = loadConfig();

  const logger: Logger = {
    debug: (msg, ctx) => process.stderr.write(JSON.stringify({ level: 'debug', msg, ...ctx }) + '\n'),
    info:  (msg, ctx) => process.stderr.write(JSON.stringify({ level: 'info',  msg, ...ctx }) + '\n'),
    warn:  (msg, ctx) => process.stderr.write(JSON.stringify({ level: 'warn',  msg, ...ctx }) + '\n'),
    error: (msg, ctx) => process.stderr.write(JSON.stringify({ level: 'error', msg, ...ctx }) + '\n'),
  };

  const repo = /* your UserRepository implementation */;

  const service = new UserService(
    { database: config.database, logging: config.logging },
    logger,
    repo
  );

  await service.initialize();
  return { config, logger, service };
}
```

---

## Option A: Separate Entry Points

Each deployment target gets its own entry point that calls `buildService()`:

```typescript
// src/rest-server.ts
import express from 'express';
import { buildService } from './startup.js';
import { userRoutes }   from '../examples/rest/user.routes.js';
import { errorHandler } from '../examples/rest/error-handler.js';

async function main() {
  const { config, service } = await buildService();

  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes(service));
  app.use(errorHandler);

  const server = app.listen(config.server.port, () => {
    process.stderr.write(`REST server on :${config.server.port}\n`);
  });

  const shutdown = async () => { server.close(); await service.shutdown(); process.exit(0); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
}

main().catch(err => { process.stderr.write(`${err}\n`); process.exit(1); });
```

```typescript
// src/mcp-server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildService } from './startup.js';
import { registerUserTools } from '../examples/mcp/user.tools.js';

async function main() {
  const { service } = await buildService();

  const server = new McpServer({ name: 'my-app', version: '1.0.0' });
  registerUserTools(server, service);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async () => { await server.close(); await service.shutdown(); process.exit(0); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
}

main().catch(err => { process.stderr.write(`${err}\n`); process.exit(1); });
```

```typescript
// src/cli.ts
import { Command } from 'commander';
import { buildService } from './startup.js';
import { registerUserCommands } from '../examples/cli/user.commands.js';

async function main() {
  const { service } = await buildService();

  const program = new Command().name('my-app').version('1.0.0');
  registerUserCommands(program, service);

  await program.parseAsync(process.argv);
  await service.shutdown();
}

main().catch(err => { process.stderr.write(`${err}\n`); process.exit(2); });
```

**`package.json` scripts**:

```json
{
  "scripts": {
    "start:rest": "node dist/src/rest-server.js",
    "start:mcp":  "node dist/src/mcp-server.js",
    "start:cli":  "node dist/src/cli.js"
  },
  "bin": {
    "my-app": "./dist/src/cli.js"
  }
}
```

Deploy each entry point independently. The REST server runs as a daemon; the MCP server connects per-session; the CLI runs on demand.

---

## Option B: Single Binary with Mode Flag

One entry point that dispatches based on a flag or env var:

```typescript
// src/main.ts
import { buildService } from './startup.js';

async function main() {
  const mode = process.env.MODE ?? process.argv[2];

  const { config, service } = await buildService();

  switch (mode) {
    case 'rest':
      await runRest(config, service);
      break;

    case 'mcp':
      await runMcp(service);
      break;

    case 'cli':
    default:
      await runCli(service);
      break;
  }
}

async function runRest(config: AppConfig, service: UserService) {
  const { default: express }     = await import('express');
  const { userRoutes }           = await import('../examples/rest/user.routes.js');
  const { errorHandler }         = await import('../examples/rest/error-handler.js');

  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes(service));
  app.use(errorHandler);
  app.listen(config.server.port);
}

async function runMcp(service: UserService) {
  const { McpServer }            = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
  const { registerUserTools }    = await import('../examples/mcp/user.tools.js');

  const server = new McpServer({ name: 'my-app', version: '1.0.0' });
  registerUserTools(server, service);
  await server.connect(new StdioServerTransport());
}

async function runCli(service: UserService) {
  const { Command }              = await import('commander');
  const { registerUserCommands } = await import('../examples/cli/user.commands.js');

  const program = new Command().name('my-app');
  registerUserCommands(program, service);
  await program.parseAsync(process.argv);
}

main().catch(err => { process.stderr.write(`${err}\n`); process.exit(1); });
```

**Usage**:

```bash
MODE=rest  node dist/src/main.js          # Run REST server
MODE=mcp   node dist/src/main.js          # Run MCP server
            node dist/src/main.js cli ...  # Run CLI command
```

---

## Option C: REST Server + CLI in Same Process

A common pattern: the CLI sub-process connects to the already-running REST server via the client library.

```typescript
// cli calls the running REST server — no direct service access
import { createClient } from './src/client/index.js';

const { users } = createClient({ baseUrl: process.env.API_URL ?? 'http://localhost:3000' });

program
  .command('user:get <id>')
  .action(async (id) => {
    const result = await users.getUser(id);
    if (isOk(result)) process.stdout.write(JSON.stringify(result.value, null, 2) + '\n');
    else { process.stderr.write(`Error [${result.error.kind}]: ${result.error.message}\n`); process.exit(1); }
  });
```

This is appropriate when:
- The CLI is a thin wrapper around an existing REST API (no shared binary)
- You want the CLI to work remotely against a deployed server
- Multiple CLI users hitting the same server

For local development where CLI and REST run in the same binary, use Option A or B.

---

## Deployment Targets Summary

| Target | Entry point | Transport | Logging |
|--------|-------------|-----------|---------|
| REST server | `src/rest-server.ts` | HTTP on port 3000 | `console.*` or `stderr` |
| MCP server | `src/mcp-server.ts` | stdin/stdout (JSON-RPC) | **`stderr` only** |
| CLI tool | `src/cli.ts` | `process.argv` | stderr (errors), stdout (output) |
| REST client | consumer code | HTTP fetch | consumer's logger |

---

## Graceful Shutdown Across All Targets

Each entry point must call `service.shutdown()` on SIGTERM/SIGINT:

```typescript
// Shared shutdown helper
function onShutdown(cleanup: () => Promise<void>) {
  const handle = async (signal: string) => {
    process.stderr.write(`[${signal}] Shutting down...\n`);
    await cleanup();
    process.exit(0);
  };
  process.on('SIGTERM', () => handle('SIGTERM'));
  process.on('SIGINT',  () => handle('SIGINT'));
}

// REST
onShutdown(async () => {
  await new Promise(resolve => server.close(resolve));
  await service.shutdown();
});

// MCP
onShutdown(async () => {
  await mcpServer.close();
  await service.shutdown();
});

// CLI — no long-running process, call after parseAsync
await program.parseAsync(process.argv);
await service.shutdown();
```

---

## Testing Multi-Target

Each adapter can be tested independently with the same `MockUserRepository` and `UserService`:

```typescript
// All three test suites share the same fixture setup
function makeTestService() {
  const repo    = new MockUserRepository();
  const service = new UserService(createTestConfig(), mockLogger, repo);
  return { repo, service };
}

// REST tests use supertest
// MCP tests use ToolCapture
// CLI tests use jest.spyOn(process.*)
```

See the integration test guides:
- [REST Integration](./rest-integration.md#testing)
- [MCP Integration](./mcp-integration.md#testing)
- [CLI Integration](./cli-integration.md#testing)

---

## Anti-Patterns

### Don't share adapters across entry points

```typescript
// ✗ Wrong — MCP server and REST server in the same process sharing stdout
const mcpServer = new McpServer(...);
const app = express();
// McpServer owns stdout — Express responses corrupt the MCP stream
```

Run MCP and REST in separate processes. They cannot share stdout.

### Don't access the service from multiple adapters in the same process (except CLI)

CLI is fine because it is short-lived and single-threaded. For REST + MCP, use separate processes with separate service instances backed by the same database.

### Don't duplicate validation across adapters

```typescript
// ✗ Wrong — REST route validates email, MCP tool also validates email
router.post('/', (req, res) => {
  if (!req.body.email.includes('@')) return res.status(400)...;
  // ...
});

server.tool('create_user', ..., async ({ email }) => {
  if (!email.includes('@')) throw new McpError(...); // duplicated!
  // ...
});

// ✓ Both adapters call service.createUser — validation happens once, in the service
```
