# Getting Started

Get the core-sdk files into your project and running in a few minutes.

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | 18.0+ | Native `fetch` required for the client adapter |
| TypeScript | 5.0+ | `exactOptionalPropertyTypes` used in config |
| npm / pnpm / bun | any | Package manager of your choice |

## Step 1: Install the Template Files

### With ACP (coming soon)

```bash
@acp.package-install --repo https://github.com/prmichaelsen/acp-core-sdk.git
```

### Manual

Clone or download the repository, then copy the files you need:

```bash
# Clone the repo
git clone https://github.com/prmichaelsen/acp-core-sdk.git /tmp/core-sdk

# Copy configuration files to your project root
cp /tmp/core-sdk/agent/files/config/tsconfig.json ./
cp /tmp/core-sdk/agent/files/config/jest.config.js ./
cp /tmp/core-sdk/agent/files/config/esbuild.build.js ./
cp /tmp/core-sdk/agent/files/config/gitignore.template ./.gitignore
cp /tmp/core-sdk/agent/files/config/npmignore.template ./.npmignore

# Copy installable source files
cp -r /tmp/core-sdk/agent/files/src ./src

# Optional: copy example reference implementations
cp -r /tmp/core-sdk/agent/files/examples ./examples
```

## Step 2: Install Dependencies

```bash
# Core (required)
npm install zod

# Build + test tools (required for dev)
npm install --save-dev typescript jest ts-jest @types/jest esbuild

# REST server example
npm install express
npm install --save-dev @types/express supertest @types/supertest

# MCP server example
npm install @modelcontextprotocol/sdk

# CLI example
npm install commander
```

## Step 3: Set Up Your package.json

Copy and customize the template:

```bash
cp /tmp/core-sdk/agent/files/config/package.json.template ./package.json
```

Replace the placeholders:
- `{{PACKAGE_NAME}}` → your npm package name (e.g., `@myorg/core`)
- `{{PACKAGE_DESCRIPTION}}` → a short description
- `{{AUTHOR_NAME}}` → your name

## Step 4: Verify the Config System

Create a minimal test to confirm `loadConfig()` works:

```typescript
// src/config/test-run.ts  (delete after verifying)
import { loadConfig } from './config';

const config = loadConfig();
console.log('Config loaded:', config.env, config.server.port);
```

Set the required environment variables and run:

```bash
export DB_NAME=mydb DB_USER=user DB_PASSWORD=secret
npx ts-node src/config/test-run.ts
# Config loaded: development 3000
```

If you see an error like `ZodError: Required`, a required config field is missing. See the [Configuration](#configuration) section below.

## Configuration Reference

`loadConfig()` reads from environment variables (highest priority) merged over defaults:

| Env var | Config path | Default | Required |
|---------|-------------|---------|----------|
| `DB_HOST` | `database.host` | `localhost` | No |
| `DB_PORT` | `database.port` | `5432` | No |
| `DB_NAME` | `database.name` | — | **Yes** |
| `DB_USER` | `database.user` | — | **Yes** |
| `DB_PASSWORD` | `database.password` | — | **Yes** |
| `DB_SSL` | `database.ssl` | `false` | No |
| `SERVER_PORT` | `server.port` | `3000` | No |
| `SERVER_HOST` | `server.host` | `0.0.0.0` | No |
| `LOG_LEVEL` | `logging.level` | `info` | No |

For local development, create a `.env` file (never commit it):

```bash
# .env
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=secret
LOG_LEVEL=debug
```

## Project Structure

After installation your project should look like this:

```
my-core-library/
├── tsconfig.json            # TypeScript config (ESM, strict, declarations)
├── jest.config.js           # Jest config with ts-jest
├── esbuild.build.js         # Build script
├── package.json             # With subpath exports
│
├── src/
│   ├── types/               # Result<T,E>, branded types, DTOs
│   ├── errors/              # AppError hierarchy, HTTP_STATUS
│   ├── config/              # Zod schemas, loadConfig()
│   ├── services/            # BaseService, UserService (adapt this)
│   └── client/              # createClient() REST client
│
└── examples/                # Reference implementations
    ├── rest/                # Express REST server
    ├── mcp/                 # MCP server
    ├── cli/                 # Commander CLI
    └── test/                # Integration tests
```

## Next Steps

- **Build something now** → [Quick Start](quick-start.md) — REST server in 15 minutes
- **Understand the patterns** → [Pattern Selection](guides/pattern-selection.md)
- **Use patterns well** → [Best Practices](guides/best-practices.md)
- **Migrate existing code** → [Migration Guide](guides/migration.md)
