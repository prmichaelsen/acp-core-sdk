# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-02-27

### Added
- Testing Patterns (5 comprehensive patterns)
  - `core-sdk.testing-unit.md` - Jest unit tests with `jest.config.js` and colocated `.spec.ts`
  - `core-sdk.testing-integration.md` - Integration tests with `.integration.spec.ts` naming
  - `core-sdk.testing-mocks.md` - Typed mocks with `jest.Mocked<T>` and `__mocks__/` factories
  - `core-sdk.testing-fixtures.md` - Fixture factories in colocated `.fixtures.ts` files
  - `core-sdk.testing-coverage.md` - Coverage thresholds, `lcov` reporting, and CI enforcement
- Completed Task 4 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with 5 new testing patterns
- Milestone 1 now 67% complete (4/6 tasks done)

## [1.3.1] - 2026-02-27

### Changed
- `core-sdk.config-loading.md` - Switched config file format from JSON to YAML (`js-yaml` parse, `*.yaml` filenames)
- `core-sdk.config-multi-env.md` - Switched config file examples from JSON objects to YAML files; updated loader to use `js-yaml`

## [1.3.0] - 2026-02-27

### Added
- Configuration Patterns (5 comprehensive patterns)
  - `core-sdk.config-schema.md` - Type-safe configuration schema with Zod, composition, and custom validation
  - `core-sdk.config-environment.md` - Environment variable mapping with `EnvMapper`, type coercion, and auto-documentation
  - `core-sdk.config-loading.md` - Layered config loading (defaults → file → env → CLI) with hot reload support
  - `core-sdk.config-secrets.md` - `Secret<T>` wrapper preventing log exposure, file/vault loading, and rotation
  - `core-sdk.config-multi-env.md` - Environment inheritance model for dev/staging/prod with feature flags
- Completed Task 3 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with 5 new configuration patterns
- Milestone 1 now 50% complete (3/6 tasks done)

## [1.2.0] - 2026-02-26

### Added
- Adapter Layer Patterns (5 comprehensive patterns)
  - `core-sdk.adapter-base.md` - Base adapter class with lifecycle management
  - `core-sdk.adapter-mcp.md` - MCP server adapter for AI agent integration
  - `core-sdk.adapter-rest.md` - REST API adapter with Express support
  - `core-sdk.adapter-cli.md` - CLI tool adapter with Commander support
  - `core-sdk.adapter-client.md` - Client library adapter for direct integration
- Completed Task 2 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with 5 new adapter patterns
- Updated README.md with adapter pattern documentation
- Milestone 1 now 33% complete (2/6 tasks done)

## [1.1.0] - 2026-02-26

### Added
- Service Layer Patterns (5 comprehensive patterns)
  - `core-sdk.service-base.md` - Base service class with lifecycle management
  - `core-sdk.service-interface.md` - Service interfaces for dependency injection
  - `core-sdk.service-container.md` - DI container for service management
  - `core-sdk.service-error-handling.md` - Custom error classes and error handling
  - `core-sdk.service-logging.md` - Structured logging pattern
- Completed Task 1 of Milestone 1 (Core Patterns & Templates)
- Updated package.yaml with pattern entries
- Updated README.md with pattern documentation

## [1.0.0] - 2026-02-26

### Added
- Initial release
- Package structure created with full ACP installation
