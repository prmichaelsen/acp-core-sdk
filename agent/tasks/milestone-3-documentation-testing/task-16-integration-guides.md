# Task 16: Integration Guides

**Milestone**: M3 — Documentation & Testing
**Status**: in_progress
**Estimated Hours**: 10-14

## Objective

Create deployment-target-specific integration guides in `docs/guides/` covering REST, MCP, CLI, and client integration with end-to-end examples.

## Files to Create

- `docs/guides/rest-integration.md` — Full REST API integration walkthrough
- `docs/guides/mcp-integration.md` — MCP server integration walkthrough
- `docs/guides/cli-integration.md` — CLI tool integration walkthrough
- `docs/guides/client-integration.md` — REST client library integration walkthrough
- `docs/guides/multi-target.md` — Serving multiple adapters from one service

## Requirements

Each guide must:
- Show the complete wiring from service → adapter → entry point
- Include working code snippets (not pseudocode)
- Cover error handling at the adapter boundary
- Show how to run the example
- Reference the API docs for deeper detail

## Verification

- [ ] All 5 guide files created in `docs/guides/`
- [ ] Each guide has a working end-to-end example
- [ ] Cross-references to `docs/api/` are accurate
- [ ] `docs/README.md` nav table updated if needed
