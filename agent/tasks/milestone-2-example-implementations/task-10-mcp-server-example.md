# Task 10: MCP Server Example

**Milestone**: M2 - Example Implementations
**Status**: Not Started
**Created**: 2026-02-27

---

## Objective

Create a working MCP server example in `agent/files/examples/mcp/` that exposes the shared core library's `UserService` as MCP tools. Installed to `./examples/mcp/` in consumer projects — not `src/`. No paired client needed — MCP protocol handles tool invocation.

## File Structure

```
agent/files/examples/mcp/
├── server.ts       # MCP server setup, tool registration, startup
└── user.tools.ts   # MCP tool definitions wrapping UserService methods
```

## Design

### `user.tools.ts`

Exports `registerUserTools(server: McpServer, service: UserService): void` that registers:

| Tool name         | Maps to                  | Input schema                    |
|-------------------|--------------------------|---------------------------------|
| `get_user`        | `service.findUser(id)`   | `{ id: string }`                |
| `create_user`     | `service.createUser(input)` | `{ email, name, role? }`     |
| `list_users`      | `service.listUsers(opts)` | `{ role?, cursor?, limit? }`   |

Each tool handler:
- Parses and validates input using Zod (same schema as service boundary)
- Calls the service method
- On `Ok`: returns JSON-serialized `UserDTO` / `PaginatedResult`
- On `Err`: throws `McpError` using `toMcpError(result.error)` (from error types pattern)

### `server.ts`

- Creates an `McpServer` from `@modelcontextprotocol/sdk`
- Instantiates `UserService` with config + logger
- Calls `registerUserTools(server, service)`
- Connects via `StdioServerTransport`
- Calls `service.initialize()` before connecting
- Calls `service.shutdown()` on process exit

## MCP Error Mapping

```typescript
const MCP_CODE_MAP: Record<AppErrorUnion['kind'], ErrorCode> = {
  validation:   ErrorCode.InvalidParams,
  not_found:    ErrorCode.InvalidParams,
  unauthorized: ErrorCode.InvalidRequest,
  forbidden:    ErrorCode.InvalidRequest,
  conflict:     ErrorCode.InvalidRequest,
  rate_limit:   ErrorCode.InternalError,
  external:     ErrorCode.InternalError,
  internal:     ErrorCode.InternalError,
};
```

## Acceptance Criteria

- [ ] MCP server starts and registers all three user tools
- [ ] `get_user` returns UserDTO JSON or `McpError` with `InvalidParams`
- [ ] `create_user` returns UserDTO or validation/conflict `McpError`
- [ ] `list_users` returns paginated results as JSON
- [ ] Tool descriptions are present (AI models need descriptions to discover tools)
- [ ] No business logic in tool handlers (delegates to UserService)
- [ ] package.yaml templates updated with `examples/mcp/` entries

---

**Related Patterns**:
- [Adapter MCP](../../patterns/core-sdk.adapter-mcp.md)
- [Error Types](../../patterns/core-sdk.types-error.md)
- [Result Types](../../patterns/core-sdk.types-result.md)
