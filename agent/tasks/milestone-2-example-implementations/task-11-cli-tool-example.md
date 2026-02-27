# Task 11: CLI Tool Example

**Milestone**: M2 - Example Implementations
**Status**: Not Started
**Created**: 2026-02-27

---

## Objective

Create a Commander CLI example in `agent/files/examples/cli/` that exposes the shared core library's `UserService` as CLI commands. Installed to `./examples/cli/` in consumer projects — not `src/`.

## File Structure

```
agent/files/examples/cli/
├── program.ts       # Commander program setup, config loading, startup
└── user.commands.ts # Command definitions wrapping UserService methods
```

## Design

### `user.commands.ts`

Exports `registerUserCommands(program: Command, service: UserService): void` that registers:

| Command                        | Maps to                  |
|-------------------------------|--------------------------|
| `user get <id>`               | `service.findUser(id)`   |
| `user create <email> <name>`  | `service.createUser(...)` |
| `user list [--role] [--limit]`| `service.listUsers(...)`  |

Each command handler:
- Calls the service method
- On `Ok`: prints result as formatted JSON or table to stdout
- On `Err`: prints `error.kind` + `error.message` to stderr, exits with code 1
- Uses `--json` flag for machine-readable output (CI/scripting use)

### `program.ts`

- Creates a `Command` from `commander`
- Loads config via `loadConfig()` from `../../src/config`
- Instantiates `UserService` with config + logger
- Calls `registerUserCommands(program, service)`
- Calls `program.parseAsync(process.argv)`

## Error Handling Convention

```
$ user get unknown-id
Error [not_found]: User not found: unknown-id
# exits with code 1

$ user get usr_123
{ "id": "usr_123", "email": "...", "name": "...", "role": "member" }
# exits with code 0
```

## Acceptance Criteria

- [ ] `user get <id>` prints UserDTO JSON or error + exit 1
- [ ] `user create <email> <name>` prints created UserDTO or validation error
- [ ] `user list` prints paginated results (table by default, JSON with `--json`)
- [ ] `--help` works on all commands with descriptions
- [ ] Errors print to stderr, success to stdout (shell-composable)
- [ ] Exit codes: 0 on success, 1 on application error, 2 on usage error
- [ ] No business logic in command handlers (delegates to UserService)
- [ ] package.yaml templates updated with `examples/cli/` entries

---

**Related Patterns**:
- [Adapter CLI](../../patterns/core-sdk.adapter-cli.md)
- [Result Types](../../patterns/core-sdk.types-result.md)
- [Error Types](../../patterns/core-sdk.types-error.md)
