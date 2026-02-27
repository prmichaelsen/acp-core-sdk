# Task 21: Package Validation

**Milestone**: M4 — Package Publishing
**Status**: in_progress
**Estimated Hours**: 4-6

## Objective

Validate the complete package: all files listed in package.yaml exist, all documentation internal links resolve, all TypeScript source files are present and structurally complete.

## Scope

1. **File existence check** — verify every template listed in `package.yaml` has a corresponding file under `agent/files/`
2. **Pattern existence check** — verify every pattern listed in `package.yaml` has a corresponding file under `agent/patterns/`
3. **Documentation link check** — verify all internal Markdown links in `docs/` resolve to existing files
4. **TypeScript structure check** — verify all `.ts` files in `agent/files/src/` and `agent/files/examples/` are present
5. **Package.yaml integrity** — verify the YAML is valid and all required fields are present

## Verification

- [ ] All template files exist in agent/files/
- [ ] All pattern files exist in agent/patterns/
- [ ] All docs internal links resolve
- [ ] No missing TypeScript source files
- [ ] package.yaml fields complete (name, version, description, author, license)
