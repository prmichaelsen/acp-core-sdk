# Milestone 2: Example Implementations

**Goal**: Create working example implementations demonstrating patterns across all deployment targets
**Duration**: 2-3 weeks
**Dependencies**: Milestone 1 (Core Patterns & Templates)
**Status**: Not Started

---

## Overview

This milestone validates the patterns created in Milestone 1 by building complete, working example implementations for each deployment target. These examples serve as reference implementations that developers can use as starting points for their own projects.

Each example will demonstrate:
- How to structure a project using core-sdk patterns
- How to implement the adapter layer for specific deployment targets
- How to configure and test the implementation
- Best practices for that deployment type

The examples will be fully functional, tested, and documented, providing developers with confidence that the patterns work in real-world scenarios.

---

## Deliverables

### 1. MCP Server Example
- Complete MCP server implementation using core-sdk patterns
- Example business logic (e.g., data processing service)
- MCP adapter with tool handlers
- Configuration management
- Unit and integration tests
- README with setup and usage instructions

### 2. REST API Example
- Complete REST API implementation using core-sdk patterns
- Same business logic as MCP example (demonstrating reusability)
- REST adapter with Express/Fastify
- API endpoints and middleware
- OpenAPI/Swagger documentation
- Unit and integration tests
- README with API documentation

### 3. CLI Tool Example
- Complete CLI application using core-sdk patterns
- Same business logic as previous examples
- CLI adapter with Commander.js
- Command-line interface with arguments and flags
- Help documentation
- Unit and integration tests
- README with CLI usage guide

### 4. Client Library Example
- Complete client library using core-sdk patterns
- Same business logic packaged as npm library
- Client adapter for direct integration
- TypeScript type definitions
- Usage examples
- Unit tests
- README with API documentation

### 5. Shared Core Library
- Actual implementation of core business logic
- Used by all 4 examples above
- Demonstrates code reusability
- Published as example npm package
- Comprehensive tests

---

## Success Criteria

- [ ] All 5 examples build successfully without errors
- [ ] All examples use the same core business logic (demonstrating reusability)
- [ ] Each example has comprehensive README with setup instructions
- [ ] All examples have working tests with >80% coverage
- [ ] MCP server example connects and responds to tool calls
- [ ] REST API example serves HTTP requests correctly
- [ ] CLI tool example runs commands successfully
- [ ] Client library example can be imported and used
- [ ] All examples follow patterns from Milestone 1
- [ ] Examples are documented in package README

---

## Key Files to Create

```
examples/
├── shared-core/                    # Shared business logic
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── services/
│   │   │   ├── DataService.ts
│   │   │   └── DataService.spec.ts
│   │   ├── models/
│   │   │   └── Data.ts
│   │   └── config/
│   │       └── ConfigManager.ts
│   └── README.md
│
├── mcp-server/                     # MCP server example
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── server.ts
│   │   ├── adapters/
│   │   │   └── MCPAdapter.ts
│   │   ├── handlers/
│   │   │   └── toolHandlers.ts
│   │   └── mcp.adapter.integration.spec.ts
│   └── README.md
│
├── rest-api/                       # REST API example
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── server.ts
│   │   ├── adapters/
│   │   │   └── RESTAdapter.ts
│   │   ├── routes/
│   │   │   └── dataRoutes.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   └── api.integration.spec.ts
│   ├── openapi.yaml
│   └── README.md
│
├── cli-tool/                       # CLI tool example
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── cli.ts
│   │   ├── adapters/
│   │   │   └── CLIAdapter.ts
│   │   ├── commands/
│   │   │   └── processCommand.ts
│   │   └── cli.integration.spec.ts
│   └── README.md
│
└── client-library/                 # Client library example
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts
    │   ├── client.ts
    │   ├── client.spec.ts
    │   └── adapters/
    │       └── ClientAdapter.ts
    └── README.md
```

---

## Tasks

1. [Task 7: Shared Core Library](../tasks/milestone-2-example-implementations/task-7-shared-core-library.md) - Implement shared business logic used by all examples
2. [Task 8: MCP Server Example](../tasks/milestone-2-example-implementations/task-8-mcp-server-example.md) - Create complete MCP server implementation
3. [Task 9: REST API Example](../tasks/milestone-2-example-implementations/task-9-rest-api-example.md) - Create complete REST API implementation
4. [Task 10: CLI Tool Example](../tasks/milestone-2-example-implementations/task-10-cli-tool-example.md) - Create complete CLI tool implementation
5. [Task 11: Client Library Example](../tasks/milestone-2-example-implementations/task-11-client-library-example.md) - Create complete client library implementation
6. [Task 12: Example Integration Testing](../tasks/milestone-2-example-implementations/task-12-example-integration-testing.md) - Create comprehensive integration tests for all examples
7. [Task 13: Example Documentation](../tasks/milestone-2-example-implementations/task-13-example-documentation.md) - Document all examples with setup guides and usage instructions

---

## Environment Variables

Each example will have its own .env.example file. Common variables:

```env
# Shared Core Configuration
LOG_LEVEL=info
NODE_ENV=development

# MCP Server Example
MCP_SERVER_NAME=example-mcp-server
MCP_SERVER_VERSION=1.0.0

# REST API Example
API_PORT=3000
API_HOST=localhost
API_BASE_PATH=/api/v1

# CLI Tool Example
CLI_OUTPUT_FORMAT=json
CLI_VERBOSE=false

# Client Library Example
CLIENT_TIMEOUT=5000
CLIENT_RETRY_COUNT=3
```

---

## Testing Requirements

- [ ] Shared core library: Unit tests for all services (>90% coverage)
- [ ] MCP server: Integration tests for tool handlers
- [ ] REST API: Integration tests for all endpoints
- [ ] CLI tool: Integration tests for all commands
- [ ] Client library: Unit tests for client methods
- [ ] Cross-example test: Verify same core logic produces same results
- [ ] Performance tests: Basic benchmarks for each deployment type

---

## Documentation Requirements

- [ ] Each example has comprehensive README.md:
  - Purpose and overview
  - Prerequisites and dependencies
  - Installation instructions
  - Configuration guide
  - Usage examples
  - Testing instructions
  - Troubleshooting section
- [ ] Shared core library has API documentation
- [ ] REST API has OpenAPI/Swagger documentation
- [ ] CLI tool has help text and man page
- [ ] Client library has TypeDoc API documentation
- [ ] Main package README links to all examples

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Examples too complex for beginners | High | Medium | Start with simple business logic, add complexity gradually, provide step-by-step guides |
| Dependency version conflicts | Medium | Medium | Pin all dependency versions, test with fresh installs, document known issues |
| Examples don't demonstrate patterns clearly | High | Low | Review each example against pattern documents, add inline comments explaining pattern usage |
| Performance issues in examples | Low | Low | Include basic performance tests, document expected performance characteristics |
| Examples become outdated | Medium | High | Include version compatibility notes, plan for maintenance updates |

---

**Next Milestone**: [Milestone 3: Documentation & Testing](milestone-3-documentation-testing.md)
**Blockers**: Requires Milestone 1 patterns to be complete
**Notes**: Examples should be simple enough to understand quickly but comprehensive enough to demonstrate real-world usage. Focus on clarity over complexity.
