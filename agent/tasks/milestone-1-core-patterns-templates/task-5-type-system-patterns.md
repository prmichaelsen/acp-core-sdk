# Task 5: Type System Patterns

**Milestone**: M1 - Core Patterns & Templates
**Status**: In Progress
**Created**: 2026-02-27

---

## Objective

Create 5 comprehensive TypeScript type system patterns that establish how to define, share, and use types across the core SDK and its consuming projects.

## Patterns to Create

| Pattern | File | Description |
|---------|------|-------------|
| Shared Types | `core-sdk.types-shared.md` | Shared domain types (DTOs, value objects, primitives) used across all layers |
| Configuration Types | `core-sdk.types-config.md` | Typed configuration interfaces derived from Zod schemas |
| Generic Utility Types | `core-sdk.types-generic.md` | Reusable generic type utilities (DeepPartial, Nullable, Brand, etc.) |
| Error Types | `core-sdk.types-error.md` | Error type hierarchy with discriminated unions and typed error codes |
| Result Types | `core-sdk.types-result.md` | Result/Either pattern for functional, typed error handling |

## Conventions

- All types exported from `src/types/` barrel index
- Use `type` for pure type aliases, `interface` for extensible shapes
- Branded types for domain primitives (UserId, OrderId, etc.)
- Discriminated unions for state machines and error variants
- Result type preferred over throw for expected errors

## Acceptance Criteria

- [ ] 5 pattern files created in `agent/patterns/`
- [ ] Each pattern has: Overview, Problem, Solution, Implementation, Usage Guidelines, Best Practices, Anti-Patterns, Related Patterns
- [ ] All patterns include TypeScript code examples with strict typing
- [ ] Patterns cross-reference each other where appropriate
- [ ] `package.yaml` updated with 5 new pattern entries
- [ ] `progress.yaml` updated with task completion
- [ ] `CHANGELOG.md` updated with v1.5.0 entry

## Notes

- Build on error types established in `core-sdk.service-error-handling.md`
- Result type should integrate with both the service layer and adapter layer
- Generic utilities should be practical — no abstract type gymnastics
