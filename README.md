# ACP Package: core-sdk

Patterns and templates for creating reusable core libraries that can be shared across MCP servers, REST APIs, and client applications

> **This package is designed for use with the [Agent Context Protocol](https://github.com/prmichaelsen/agent-context-protocol). Read more about ACP [here](https://github.com/prmichaelsen/agent-context-protocol).**

## Installation

### Quick Start (Bootstrap New Project)

Install ACP and this package in one command:

```bash
curl -fsSL https://github.com/prmichaelsen/acp-core-sdk/raw/main/agent/scripts/bootstrap.sh | bash
```

This will:
1. Install ACP if not already installed
2. Install this package
3. Initialize your project with ACP

### Install Package Only (ACP Already Installed)

If you already have ACP installed in your project:

```bash
@acp.package-install https://github.com/prmichaelsen/acp-core-sdk.git
```

Or using the installation script:

```bash
./agent/scripts/acp.package-install.sh https://github.com/prmichaelsen/acp-core-sdk.git
```

## What's Included

<!-- ACP_AUTO_UPDATE_START:CONTENTS -->
### Commands

(No commands yet - use @acp.command-create to add commands)

### Patterns

#### Service Layer
- **[core-sdk.service-base.md](agent/patterns/core-sdk.service-base.md)** - Base service class pattern with lifecycle management, configuration, and common functionality
- **[core-sdk.service-interface.md](agent/patterns/core-sdk.service-interface.md)** - Service interface pattern for dependency injection and loose coupling
- **[core-sdk.service-container.md](agent/patterns/core-sdk.service-container.md)** - Service container pattern for dependency injection and lifecycle management
- **[core-sdk.service-error-handling.md](agent/patterns/core-sdk.service-error-handling.md)** - Consistent error handling pattern with custom error classes and error codes
- **[core-sdk.service-logging.md](agent/patterns/core-sdk.service-logging.md)** - Structured logging pattern with consistent format across services

#### Adapter Layer
- **[core-sdk.adapter-base.md](agent/patterns/core-sdk.adapter-base.md)** - Base adapter class pattern with lifecycle management for all deployment targets
- **[core-sdk.adapter-mcp.md](agent/patterns/core-sdk.adapter-mcp.md)** - MCP adapter pattern for exposing services through Model Context Protocol
- **[core-sdk.adapter-rest.md](agent/patterns/core-sdk.adapter-rest.md)** - REST adapter pattern for exposing services through HTTP REST APIs
- **[core-sdk.adapter-cli.md](agent/patterns/core-sdk.adapter-cli.md)** - CLI adapter pattern for exposing services through command-line interfaces
- **[core-sdk.adapter-client.md](agent/patterns/core-sdk.adapter-client.md)** - Client adapter pattern for exposing services as a consumable library

#### Configuration
- **[core-sdk.config-schema.md](agent/patterns/core-sdk.config-schema.md)** - Type-safe configuration schema pattern using Zod with validation and composition
- **[core-sdk.config-environment.md](agent/patterns/core-sdk.config-environment.md)** - Environment variable mapping pattern with type coercion and naming conventions
- **[core-sdk.config-loading.md](agent/patterns/core-sdk.config-loading.md)** - Layered configuration loading pattern with priority hierarchy and hot reload
- **[core-sdk.config-secrets.md](agent/patterns/core-sdk.config-secrets.md)** - Secret management pattern with Secret wrapper, vault integration, and rotation
- **[core-sdk.config-multi-env.md](agent/patterns/core-sdk.config-multi-env.md)** - Multi-environment configuration pattern with inheritance for dev/staging/prod

#### Testing
- **[core-sdk.testing-unit.md](agent/patterns/core-sdk.testing-unit.md)** - Unit testing pattern with Jest, jest.config.js, and colocated .spec.ts files
- **[core-sdk.testing-integration.md](agent/patterns/core-sdk.testing-integration.md)** - Integration testing pattern with .integration.spec.ts naming convention
- **[core-sdk.testing-mocks.md](agent/patterns/core-sdk.testing-mocks.md)** - Mocks and stubs pattern with jest.Mocked<T> and colocated mock factories
- **[core-sdk.testing-fixtures.md](agent/patterns/core-sdk.testing-fixtures.md)** - Test fixtures pattern with colocated .fixtures.ts factory functions
- **[core-sdk.testing-coverage.md](agent/patterns/core-sdk.testing-coverage.md)** - Coverage configuration pattern with jest.config.js thresholds and CI enforcement

#### Type System
- **[core-sdk.types-shared.md](agent/patterns/core-sdk.types-shared.md)** - Shared domain types pattern with branded primitives, DTOs, and pagination shapes
- **[core-sdk.types-config.md](agent/patterns/core-sdk.types-config.md)** - Configuration types pattern with Zod-derived types and layer-scoped config slices
- **[core-sdk.types-generic.md](agent/patterns/core-sdk.types-generic.md)** - Generic utility types pattern with DeepPartial, Nullable, Maybe, and type helpers
- **[core-sdk.types-error.md](agent/patterns/core-sdk.types-error.md)** - Error type hierarchy pattern with discriminated unions and HTTP/MCP status mapping
- **[core-sdk.types-result.md](agent/patterns/core-sdk.types-result.md)** - Result type pattern for typed functional error handling without exceptions

#### Client SDK
- **[core-sdk.client-http-transport.md](agent/patterns/core-sdk.client-http-transport.md)** - Shared fetch-based HTTP transport with auth, error normalization, and SdkResponse output
- **[core-sdk.client-response.md](agent/patterns/core-sdk.client-response.md)** - Supabase-style { data, error } response type with throwOnError escape hatch
- **[core-sdk.client-svc.md](agent/patterns/core-sdk.client-svc.md)** - 1:1 REST mirror service client with resource-grouped typed methods
- **[core-sdk.client-app.md](agent/patterns/core-sdk.client-app.md)** - Use-case-oriented app client with compound operations for web applications
- **[core-sdk.client-type-generation.md](agent/patterns/core-sdk.client-type-generation.md)** - OpenAPI to TypeScript type generation with hand-written client code

### Designs

- **[core-sdk.architecture.md](agent/design/core-sdk.architecture.md)** - Patterns and templates for creating reusable core libraries that can be shared across MCP servers, REST APIs, and client applications
<!-- ACP_AUTO_UPDATE_END:CONTENTS -->

## Why Use This Package

- **Write once, deploy everywhere** — your business logic runs as a REST API, MCP server, CLI tool, or client library without rewriting anything
- **Production-ready from day one** — typed errors, `Result<T,E>`, Zod config validation, and structured logging are baked in from the start
- **Testable by design** — `MockUserRepository`, stable fixtures, and `ToolCapture` make unit and integration tests straightforward
- **Copy, don't configure** — install source files directly into your project and adapt them; no framework lock-in
- **Consistent patterns** — 30 patterns across service, adapter, config, testing, type-system, and client SDK categories ensure every project follows the same conventions

## Usage

Install the package and copy source files into your project:

```bash
@acp.package-install https://github.com/prmichaelsen/acp-core-sdk.git
```

Then follow the [Getting Started guide](docs/getting-started.md) or jump straight to the [Quick Start](docs/quick-start.md) to build a REST server in 15 minutes.

**Deploy to multiple targets:**

```
Your UserService
    ├── REST API  → examples/rest/
    ├── MCP server → examples/mcp/
    └── CLI tool  → examples/cli/
```

See [Integration Guides](docs/README.md) for step-by-step wiring instructions.

## Development

### Setup

1. Clone this repository
2. Make changes
3. Run `@acp.package-validate` to validate
4. Run `@acp.package-publish` to publish

### Adding New Content

- Use `@acp.pattern-create` to create patterns
- Use `@acp.command-create` to create commands
- Use `@acp.design-create` to create designs

These commands automatically:
- Add namespace prefix to filenames
- Update package.yaml contents section
- Update this README.md

### Testing

Run `@acp.package-validate` to validate your package locally.

### Publishing

Run `@acp.package-publish` to publish updates. This will:
- Validate the package
- Detect version bump from commits
- Update CHANGELOG.md
- Create git tag
- Push to remote
- Test installation

## Namespace Convention

All files in this package use the `core-sdk` namespace:
- Commands: `core-sdk.command-name.md`
- Patterns: `core-sdk.pattern-name.md`
- Designs: `core-sdk.design-name.md`

## Dependencies

Consumer projects install these npm dependencies (exact versions in `config/package.json.template`):

| Dependency | Purpose |
|---|---|
| `zod` | Runtime config schema validation |
| `express` | REST adapter (optional) |
| `@modelcontextprotocol/sdk` | MCP adapter (optional) |
| `commander` | CLI adapter (optional) |

Runtime peer dependencies depend on which adapters you use. The core types, errors, config, and service layers have no runtime dependencies beyond `zod`.

## Local Development Directories

This package includes local-only directories for development workflow:

### Clarifications (`agent/clarifications/`)

Use this directory to document questions and clarifications during development:
- Create clarification documents using the template: `clarification-{N}-{title}.template.md`
- Document requirements gaps, design questions, and implementation decisions
- **Local by default**: Content files are gitignored, only `.gitkeep` is tracked
- **Optional tracking**: Remove patterns from `.gitignore` to track specific clarifications

### Feedback (`agent/feedback/`)

Use this directory to capture feedback during development:
- Document user feedback, bug reports, and feature requests
- Keep notes about what works and what needs improvement
- **Local by default**: Content files are gitignored, only `.gitkeep` is tracked
- **Optional tracking**: Remove patterns from `.gitignore` to track specific feedback

### Reports (`agent/reports/`)

Session reports and development logs:
- Automatically generated by `@acp.report` command
- **Local by default**: Content files are gitignored, only `.gitkeep` is tracked
- **Optional tracking**: Remove patterns from `.gitignore` to track specific reports

**Note**: These directories follow the same pattern - they exist in the repository structure (via `.gitkeep`), but their content is local-only by default. You can choose to track specific files by removing them from `.gitignore`.

## Contributing

Contributions are welcome! Please:

1. Follow the existing pattern structure
2. Use entity creation commands (@acp.pattern-create, etc.)
3. Run @acp.package-validate before committing
4. Document your changes in CHANGELOG.md
5. Test installation before submitting

## License

MIT

## Author

Patrick Michaelsen
