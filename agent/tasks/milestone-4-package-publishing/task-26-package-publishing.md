# Task 26: Package Publishing

**Milestone**: M4 — Package Publishing
**Status**: completed
**Estimated Hours**: 2-4

## Objective

Publish the core-sdk package so consumers can install it. As an ACP package (not an npm package), publishing means ensuring the public GitHub repository is up to date and the package is installable via `@acp.package-install`.

## What "Publishing" Means for ACP Packages

ACP packages are installed directly from git repositories — there is no npm registry step. Publishing is complete when:
1. All code is pushed to the public GitHub repo
2. A git tag exists for the release version
3. The GitHub release workflow fires and creates a release entry
4. The package is installable via the documented command

## Verification

- [x] All code pushed to public GitHub repo (prmichaelsen/acp-core-sdk)
- [x] Git tag v1.21.0 pushed
- [x] GitHub Actions release.yml will create GitHub Release from CHANGELOG.md
- [x] Package installable: `@acp.package-install https://github.com/prmichaelsen/acp-core-sdk.git`
