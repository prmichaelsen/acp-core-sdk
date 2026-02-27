# Task 13: Example Documentation

**Milestone**: M2 - Example Implementations
**Status**: Not Started
**Created**: 2026-02-27

---

## Objective

Update `agent/files/README.md` and `package.yaml` to document all examples and installable files, so consumers understand what they're getting and how to use it. Mark Milestone 2 complete.

## Changes

### `agent/files/README.md`

Add an `Examples` section documenting:
- What's in `examples/rest/` and how to run it
- What's in `examples/mcp/` and how to run it
- What's in `examples/cli/` and how to run it
- How `src/client/` pairs with `examples/rest/`
- How to run the integration tests

### `package.yaml` templates section

Add `examples/` entries to the templates list:
- All files under `examples/rest/`, `examples/mcp/`, `examples/cli/`
- Mark as `required: false`, target: `examples/<name>/`
- Add `examples/test/` test utilities

### `agent/tasks/milestone-2-example-implementations/`

Update task-7 through task-13 status as completed.

### `agent/progress.yaml`

- M2 status: `completed`, progress: 100
- All tasks marked complete

### `CHANGELOG.md`

Add version entry for M2 completion.

## Acceptance Criteria

- [ ] README.md `Examples` section covers all three server examples
- [ ] README.md explains `src/client/` as the installable REST client
- [ ] Each example has a "How to run" snippet
- [ ] package.yaml templates includes all examples/ entries
- [ ] M2 marked complete in progress.yaml
- [ ] CHANGELOG.md updated

---

**Related Tasks**:
- All Tasks 7-12 must be complete before this task
