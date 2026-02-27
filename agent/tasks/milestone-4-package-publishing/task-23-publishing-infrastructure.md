# Task 23: Publishing Infrastructure

**Milestone**: M4 — Package Publishing
**Status**: in_progress
**Estimated Hours**: 6-8

## Objective

Set up the infrastructure needed for reliable package publishing: GitHub Actions CI workflow for validation on PR/push, a release workflow that creates GitHub releases from tags, and a CONTRIBUTING.md that documents the release process.

## Files to Create

- `.github/workflows/validate.yml` — runs `acp.yaml-validate.sh package.yaml` on push/PR
- `.github/workflows/release.yml` — creates GitHub release when a `v*` tag is pushed
- `CONTRIBUTING.md` — documents how to contribute, release process, versioning rules

## Verification

- [ ] `.github/workflows/validate.yml` created
- [ ] `.github/workflows/release.yml` created
- [ ] `CONTRIBUTING.md` created with release process documented
- [ ] package.yaml updated if any new files need tracking
