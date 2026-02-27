# Task 14: Usage Documentation

**Milestone**: M3 - Documentation & Testing
**Status**: Not Started
**Created**: 2026-02-27

---

## Objective

Create user-facing documentation in `docs/` that enables a developer to go from zero to a working core-sdk project in under 15 minutes. Covers getting started, quick start, pattern selection, migration, best practices, pitfalls, and FAQ.

## File Structure

```
docs/
├── README.md                   # Documentation hub — what is core-sdk and where to start
├── getting-started.md          # Prerequisites, install, first run
├── quick-start.md              # 15-minute walkthrough: REST server from scratch
└── guides/
    ├── pattern-selection.md    # Which pattern for which problem
    ├── best-practices.md       # How to use patterns well
    ├── migration.md            # Moving from existing code to core-sdk patterns
    └── pitfalls.md             # Common mistakes and how to avoid them
    └── faq.md                  # Frequently asked questions
```

## Acceptance Criteria

- [ ] `docs/README.md` is the entry point — links to all other docs
- [ ] `docs/getting-started.md` covers prerequisites, install, config, first `loadConfig()` call
- [ ] `docs/quick-start.md` delivers a working REST server in 15 minutes
- [ ] `docs/guides/pattern-selection.md` answers "which pattern do I use?"
- [ ] `docs/guides/best-practices.md` covers Result<T,E>, error kinds, service boundaries
- [ ] `docs/guides/migration.md` shows before/after for common patterns
- [ ] `docs/guides/pitfalls.md` warns about top 5 common mistakes
- [ ] `docs/guides/faq.md` answers at least 10 common questions

---

**Related Patterns**: All 25 patterns in `agent/patterns/`
**Related Examples**: All files in `agent/files/examples/`
