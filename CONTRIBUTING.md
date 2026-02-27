# Contributing to core-sdk

Thank you for contributing to core-sdk! This document explains how to contribute patterns, templates, and fixes, and how the release process works.

## Getting Started

1. Clone the repository
2. Make your changes
3. Run `@acp.package-validate` to validate the package
4. Submit a pull request

## What to Contribute

### New Patterns

Use `@acp.pattern-create` to scaffold a new pattern. Follow the existing pattern structure:
- **Context** — when does this pattern apply?
- **Problem** — what problem does it solve?
- **Solution** — the pattern itself, with code
- **Anti-Patterns** — what to avoid
- **Related Patterns** — cross-references

### New Source Files

Add files to `agent/files/src/` (installable into consumer projects) or `agent/files/examples/` (reference implementations). Then add them to `package.yaml` templates section.

### Documentation Fixes

Edit files in `docs/`. All internal Markdown links are validated in CI — run `@acp.package-validate` to catch broken links before pushing.

## Versioning Rules

This package follows [Semantic Versioning](https://semver.org/):

| Change type | Version bump |
|---|---|
| New pattern, template file, or guide | Minor (`1.x.0`) |
| Bug fix, typo, broken link fix | Patch (`1.x.y`) |
| Breaking change to template structure or API | Major (`x.0.0`) |
| Documentation-only fix | Patch or none |

## Release Process

Releases are triggered by pushing a git tag. The CI pipeline creates a GitHub Release automatically with release notes extracted from `CHANGELOG.md`.

### Steps to release

1. Update `CHANGELOG.md` with a new `## [X.Y.Z] - YYYY-MM-DD` section
2. Bump `version` in `package.yaml` to match
3. Update `docs/README.md` version reference if needed
4. Commit with a descriptive message
5. Create and push the tag:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
6. GitHub Actions creates the release automatically

### Validation before release

Run `@acp.package-validate` and confirm:
- All template and pattern files exist
- All docs internal links are valid
- `package.yaml` YAML is valid
- README has all required sections

## Code Style

All TypeScript source files in `agent/files/src/` and `agent/files/examples/` follow these conventions:
- ESM modules (`import`/`export`, no `require`)
- Strict TypeScript (`strict: true` in `tsconfig.json`)
- `Result<T,E>` for fallible operations — no `throw` in service layer
- Named exports only — no default exports
- Colocated tests as `.spec.ts` files

## Questions

Open a GitHub issue for questions, bug reports, or feature requests.
