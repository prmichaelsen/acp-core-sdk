# Task 24: Installation Testing

**Milestone**: M4 — Package Publishing
**Status**: in_progress
**Estimated Hours**: 4-6

## Objective

Verify the package installs correctly by testing key installation scenarios: confirming files listed in package.yaml are accessible via the git repo, and that the bootstrap script URL is correct.

## Scope

1. **Git repo accessibility** — confirm `git ls-remote` returns HEAD (already verified in Task 21)
2. **Template file integrity** — spot-check 3-4 key template files for structural completeness (no truncation, valid TypeScript)
3. **Bootstrap script** — verify `agent/scripts/bootstrap.sh` exists and references the correct repo URL
4. **README install instructions** — verify install commands in README use the correct repo URL

## Verification

- [ ] Remote repo accessible at package.yaml repository URL
- [ ] Key template files are structurally complete
- [ ] bootstrap.sh exists and references correct repo
- [ ] README install commands are accurate
