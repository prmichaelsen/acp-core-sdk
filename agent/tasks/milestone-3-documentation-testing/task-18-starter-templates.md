# Task 18: Starter Templates

**Milestone**: M3 — Documentation & Testing
**Status**: in_progress
**Estimated Hours**: 8-12

## Objective

Create ready-to-use starter templates that consumers can copy to bootstrap new projects for each deployment target. Templates should be minimal, runnable, and follow all core-sdk patterns.

## Files to Create

- `agent/files/templates/rest-starter/` — minimal Express REST server
  - `src/main.ts` — wires UserService + userRoutes + errorHandler
  - `src/repository.ts` — InMemoryUserRepository ready for replacement
  - `package.json` — dependencies, scripts, bin
  - `tsconfig.json` — TypeScript config for ESM

- `agent/files/templates/mcp-starter/` — minimal MCP server
  - `src/main.ts` — wires UserService + registerUserTools + StdioTransport
  - `src/repository.ts` — InMemoryUserRepository
  - `package.json` — dependencies, scripts
  - `tsconfig.json`

- `agent/files/templates/cli-starter/` — minimal CLI tool
  - `src/main.ts` — wires UserService + registerUserCommands
  - `src/repository.ts` — InMemoryUserRepository
  - `package.json` — dependencies, scripts, bin
  - `tsconfig.json`

## Requirements

- Each template must be self-contained and runnable with `npm install && npm start`
- Use InMemoryUserRepository (no DB required to run the starter)
- Follow all patterns from the integration guides
- Include comments pointing to the integration guides for next steps
- `package.json` must include relevant dependencies and scripts

## Verification

- [ ] 3 template directories created under `agent/files/templates/`
- [ ] Each has `src/main.ts`, `src/repository.ts`, `package.json`, `tsconfig.json`
- [ ] Comments reference the relevant integration guide
- [ ] `package.yaml` updated with all new template files
