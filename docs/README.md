# core-sdk Documentation

> Patterns and templates for creating reusable core libraries that can be shared across MCP servers, REST APIs, and client applications.

## What is core-sdk?

`core-sdk` is an ACP package that gives you a production-ready TypeScript foundation for building domain logic that runs everywhere — as a REST API, an MCP server, a CLI tool, or a client library — without rewriting business logic for each target.

The key idea: **separate domain logic from deployment**. Your `UserService` (or `OrderService`, `ProductService`, etc.) is written once in the core library and then wired to whichever adapter(s) you need.

```
Your domain logic (UserService)
        │
        ├──► REST adapter   (Express routes)
        ├──► MCP adapter    (McpServer tools)
        ├──► CLI adapter    (Commander commands)
        └──► Client adapter (typed fetch wrapper)
```

## Quick Navigation

| I want to... | Go to |
|---|---|
| Get set up from scratch | [Getting Started](getting-started.md) |
| Build something in 15 minutes | [Quick Start](quick-start.md) |
| Wire a REST API | [REST Integration](guides/rest-integration.md) |
| Wire an MCP server | [MCP Integration](guides/mcp-integration.md) |
| Wire a CLI tool | [CLI Integration](guides/cli-integration.md) |
| Use the REST client library | [Client Integration](guides/client-integration.md) |
| Serve multiple targets at once | [Multi-Target](guides/multi-target.md) |
| Choose the right pattern | [Pattern Selection](guides/pattern-selection.md) |
| Use patterns correctly | [Best Practices](guides/best-practices.md) |
| Migrate existing code | [Migration Guide](guides/migration.md) |
| Avoid common mistakes | [Pitfalls](guides/pitfalls.md) |
| Get a quick answer | [FAQ](guides/faq.md) |
| API reference: Types & Result | [Types](api/types.md) |
| API reference: Services | [Services](api/services.md) |
| API reference: Configuration | [Configuration](api/configuration.md) |
| API reference: Adapters | [Adapters](api/adapters.md) |
| API reference: Testing utilities | [Testing](api/testing.md) |

## What You Get

### Installable Source Files (`src/`)

Copy these into your project and adapt them to your domain:

| Module | What it provides |
|--------|-----------------|
| `src/types/` | `Result<T,E>`, branded primitives (`UserId`, `EmailAddress`), `UserDTO`, pagination |
| `src/errors/` | 8 typed error classes, `HTTP_STATUS` map, `isAppError()` guard |
| `src/config/` | Zod schemas, `loadConfig()`, `createTestConfig()` |
| `src/services/` | `BaseService` lifecycle, `UserService` example with `UserRepository` interface |
| `src/client/` | `createClient({ baseUrl })` typed REST client aggregator |

### Reference Examples (`examples/`)

Working implementations to study and adapt:

| Example | Files |
|---------|-------|
| REST server | `examples/rest/` — server, routes, error handler, client demo |
| MCP server | `examples/mcp/` — tools, server |
| CLI tool | `examples/cli/` — commands, program |
| Integration tests | `examples/test/` — mock repo, REST/MCP/CLI specs |

### Pattern Documentation (`agent/patterns/`)

25 patterns across 5 categories, each with rationale, code, and anti-patterns:

- **Service Layer** (5): base, interface, container, error handling, logging
- **Adapter Layer** (5): base, MCP, REST, CLI, client
- **Configuration** (5): schema, environment, loading, secrets, multi-env
- **Testing** (5): unit, integration, mocks, fixtures, coverage
- **Type System** (5): shared, config, generic, error, result

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Core Library                       │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │  Types   │  │  Errors  │  │    Config      │   │
│  │ Result   │  │ AppError │  │  Zod schemas   │   │
│  │ Branded  │  │ 8 kinds  │  │  loadConfig()  │   │
│  │ DTOs     │  │ HTTP map │  │  env merging   │   │
│  └──────────┘  └──────────┘  └────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              Service Layer                    │  │
│  │  BaseService → UserService → UserRepository  │  │
│  │  Result<T,E> · findUser · createUser · list  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           │           │          │          │
    ┌──────┘    ┌──────┘   ┌─────┘    ┌─────┘
    ▼           ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  REST  │ │  MCP   │ │  CLI   │ │ Client │
│Express │ │McpSrv  │ │Cmmndr  │ │ fetch  │
└────────┘ └────────┘ └────────┘ └────────┘
```

## Version

This documentation matches **core-sdk v1.19.0+**. See [CHANGELOG](../CHANGELOG.md) for version history.
