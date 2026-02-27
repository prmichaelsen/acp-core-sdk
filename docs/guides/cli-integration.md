# CLI Integration Guide

How to expose a service as a command-line tool using Commander.

---

## Overview

The CLI adapter registers service methods as Commander subcommands. Success output goes to stdout (pipeable). Errors go to stderr (doesn't pollute pipes). Exit codes communicate success vs. failure to shell scripts.

```
Shell invocation: my-app user get usr_abc123
  → Commander dispatches to registered action handler
    → service.parseUserId / service.findUser / etc.
      → Result<T,E>
        → process.stdout.write(JSON.stringify(dto)) + exit 0  (success)
        → process.stderr.write(message) + process.exit(1)     (AppError)
```

---

## Prerequisites

Install dependencies:

```bash
npm install commander
npm install --save-dev @types/node typescript
```

Copy source files:

```bash
# Core library
cp -r core-sdk/src/types    ./src/types
cp -r core-sdk/src/errors   ./src/errors
cp -r core-sdk/src/config   ./src/config
cp -r core-sdk/src/services ./src/services

# CLI adapter
cp -r core-sdk/examples/cli ./examples/cli
```

---

## Step 1: Implement UserRepository

Same as other adapters — the service accepts any `UserRepository` implementation. See [REST Integration](./rest-integration.md#step-1-implement-userrepository) for a Postgres example.

---

## Step 2: Wire the CLI Entry Point

```typescript
// examples/cli/program.ts (already provided — shown here for reference)
import { Command } from 'commander';
import { loadConfig } from '../../src/config/index.js';
import { UserService } from '../../src/services/user.service.js';
import { registerUserCommands } from './user.commands.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const repo   = /* your UserRepository implementation */;
  const logger = {
    debug: (msg: string, ctx?: object) => { if (config.logging.level === 'debug') process.stderr.write(JSON.stringify({ level: 'debug', msg, ...ctx }) + '\n'); },
    info:  (msg: string, ctx?: object) => process.stderr.write(JSON.stringify({ level: 'info',  msg, ...ctx }) + '\n'),
    warn:  (msg: string, ctx?: object) => process.stderr.write(JSON.stringify({ level: 'warn',  msg, ...ctx }) + '\n'),
    error: (msg: string, ctx?: object) => process.stderr.write(JSON.stringify({ level: 'error', msg, ...ctx }) + '\n'),
  };

  const service = new UserService(
    { database: config.database, logging: config.logging },
    logger,
    repo
  );

  await service.initialize();

  const program = new Command()
    .name('my-app')
    .description('Application CLI')
    .version('1.0.0');

  registerUserCommands(program, service);

  await program.parseAsync(process.argv);
  await service.shutdown();
}

main().catch((err) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(2); // exit 2 = startup/config error
});
```

---

## Step 3: Registered Commands

`registerUserCommands(program, service)` registers one parent command (`user`) with three subcommands:

### `user get <id>`

```bash
my-app user get usr_abc123
my-app user get usr_abc123 --json   # same output (always JSON for now)
```

| Outcome | stdout | stderr | Exit code |
|---------|--------|--------|-----------|
| Found | `JSON.stringify(UserDTO, null, 2)` | — | 0 |
| Invalid ID | — | `Error [validation]: ...` | 1 |
| Not found | — | `Error [not_found]: ...` | 1 |

### `user create <email> <name>`

```bash
my-app user create alice@example.com "Alice Smith"
my-app user create alice@example.com "Alice Smith" --role admin
```

| Outcome | stdout | stderr | Exit code |
|---------|--------|--------|-----------|
| Created | `JSON.stringify(UserDTO, null, 2)` | — | 0 |
| Validation error | — | `Error [validation]: ...` | 1 |
| Conflict | — | `Error [conflict]: ...` | 1 |

### `user list`

```bash
my-app user list
my-app user list --role admin --limit 5
my-app user list --role admin --cursor usr_abc123 --limit 10
my-app user list --json   # JSON output instead of table
```

Default output: aligned text table. Last line shows `Total: N  hasMore: true/false  next: --cursor <id>`.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--role` | string | — | Filter by role |
| `--cursor` | string | — | Pagination cursor |
| `--limit` | number | 20 | Max results (server-capped at 100) |
| `--json` | boolean | false | Output JSON instead of table |

---

## Step 4: Build the Binary

Add to `package.json`:

```json
{
  "bin": {
    "my-app": "./dist/examples/cli/program.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/examples/cli/program.js"
  }
}
```

Compile and link globally:

```bash
npx tsc
npm link
my-app user list
```

Or run directly without install:

```bash
node dist/examples/cli/program.js user list
```

Or with `ts-node`:

```bash
npx ts-node --esm examples/cli/program.ts user list
```

---

## Step 5: Exit Code Conventions

| Code | Meaning | Trigger |
|------|---------|---------|
| `0` | Success | Command completes without calling `process.exit` |
| `1` | Application error | Any `AppError` from the service |
| `2` | Usage / config error | Commander parse error, `loadConfig()` failure, missing required arg |

Scripts can check exit codes:

```bash
my-app user get usr_abc123
if [ $? -eq 0 ]; then
  echo "User found"
elif [ $? -eq 1 ]; then
  echo "User not found or invalid"
else
  echo "CLI usage error"
fi
```

---

## Step 6: Shell Composability

Because success goes to stdout and errors go to stderr, the CLI is pipe-friendly:

```bash
# Pipe JSON output to jq
my-app user get usr_abc123 | jq '.name'

# Pipe list to another command
my-app user list --json | jq '.items[].email'

# Redirect errors separately
my-app user create bad-email "X" 2>errors.log

# Capture output
USER_JSON=$(my-app user get usr_abc123)
USER_NAME=$(echo "$USER_JSON" | jq -r '.name')
```

---

## Testing

Inject `jest.spyOn` mocks for `process.stdout`, `process.stderr`, and `process.exit`:

```typescript
// examples/test/cli.integration.spec.ts (already provided)
import { Command } from 'commander';
import { registerUserCommands } from '../cli/user.commands.js';

type Out = { stdout: string[]; stderr: string[]; exitCode: number | null };

beforeEach(() => {
  out = { stdout: [], stderr: [], exitCode: null };

  jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    out.stdout.push(String(chunk)); return true;
  });
  jest.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    out.stderr.push(String(chunk)); return true;
  });
  jest.spyOn(process, 'exit').mockImplementation((code) => {
    out.exitCode = (code as number) ?? 0;
    throw Object.assign(new Error(), { isTestExit: true });
  });
});

async function run(...args: string[]): Promise<void> {
  try {
    await program.parseAsync(['', '', ...args]);
  } catch (e) {
    if (!(e as { isTestExit?: boolean }).isTestExit) throw e;
  }
}

it('user get returns JSON on success', async () => {
  repo.seed(fixture);
  await run('user', 'get', fixture.id);
  const dto = JSON.parse(out.stdout.join(''));
  expect(dto.email).toBe(fixture.email);
  expect(out.exitCode).toBeNull(); // natural completion — no explicit exit(0)
});

it('user get exits 1 for unknown user', async () => {
  await run('user', 'get', 'usr_unknown');
  expect(out.stderr.join('')).toContain('[not_found]');
  expect(out.exitCode).toBe(1);
});
```

See [API Reference: Testing](../api/testing.md#cli-integration-testing) for the full spy setup and `run()` helper.

---

## Customization

### Add a new subcommand

```typescript
// In user.commands.ts or a new commands file
export function registerOrderCommands(program: Command, service: OrderService): void {
  const order = program.command('order').description('Order management');

  order
    .command('create <userId> <productId>')
    .description('Create a new order')
    .option('--quantity <n>', 'Quantity', '1')
    .action(async (userId, productId, opts) => {
      const quantity = parseInt(opts.quantity, 10);
      const result = await service.createOrder(userId, productId, quantity);
      if (isOk(result)) {
        process.stdout.write(JSON.stringify(result.value, null, 2) + '\n');
      } else {
        process.stderr.write(`Error [${result.error.kind}]: ${result.error.message}\n`);
        process.exit(1);
      }
    });
}
```

### Add global options

```typescript
const program = new Command()
  .name('my-app')
  .option('--env <env>', 'Environment (dev/staging/prod)', 'dev')
  .option('--no-color', 'Disable color output')
  .hook('preAction', (cmd) => {
    // runs before every action — inspect cmd.opts()
  });
```

### Multiple command groups

```typescript
registerUserCommands(program, userService);
registerOrderCommands(program, orderService);
registerProductCommands(program, productService);

// Results in:
// my-app user get|create|list
// my-app order create|cancel|list
// my-app product search|show
```
