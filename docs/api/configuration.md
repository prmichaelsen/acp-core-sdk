# API Reference: Configuration

Complete reference for `src/config/`.

---

## Schemas (`src/config/schema.ts`)

### `DatabaseConfigSchema`

```typescript
const DatabaseConfigSchema = z.object({
  host:    z.string().default('localhost'),
  port:    z.number().int().min(1).max(65535).default(5432),
  name:    z.string(),                          // required
  user:    z.string(),                          // required
  password: z.string(),                         // required
  ssl:     z.boolean().default(false),
  poolMin: z.number().int().default(2),
  poolMax: z.number().int().default(10),
});
```

```typescript
type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
```

---

### `ServerConfigSchema`

```typescript
const ServerConfigSchema = z.object({
  port:             z.number().int().default(3000),
  host:             z.string().default('0.0.0.0'),
  corsOrigins:      z.array(z.string()).default([]),
  requestTimeoutMs: z.number().int().default(30_000),
});
```

```typescript
type ServerConfig = z.infer<typeof ServerConfigSchema>;
```

---

### `LoggingConfigSchema`

```typescript
const LoggingConfigSchema = z.object({
  level:  z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'pretty']).default('json'),
});
```

```typescript
type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
```

---

### `AppConfigSchema`

The root config schema. Composed from the sub-schemas above.

```typescript
const AppConfigSchema = z.object({
  env:      z.enum(['development', 'staging', 'production']).default('development'),
  database: DatabaseConfigSchema,
  server:   ServerConfigSchema,
  logging:  LoggingConfigSchema,
});
```

```typescript
type AppConfig = z.infer<typeof AppConfigSchema>;
```

---

### Layer-Scoped Config Slices

Each layer receives only the config sections it needs. Never pass the full `AppConfig` to services or adapters.

```typescript
/** Config for the service layer — business logic only */
type ServiceConfig = Pick<AppConfig, 'database' | 'logging'>;

/** Config for adapter layer — HTTP/server settings */
type AdapterConfig = Pick<AppConfig, 'server' | 'logging'>;
```

**Usage**:
```typescript
const config = loadConfig();

// Narrow to service config before injecting
const serviceConfig: ServiceConfig = {
  database: config.database,
  logging:  config.logging,
};
const service = new UserService(serviceConfig, logger, repo);
```

---

## `loadConfig()` (`src/config/loader.ts`)

Load, merge, and validate configuration from environment variables and defaults.

```typescript
function loadConfig(): AppConfig
```

**Returns**: `AppConfig` — fully validated configuration object.

**Throws**: `ZodError` — if any required field is missing or any field fails validation.

**Behavior**:
1. Reads environment variables (see [Environment Variable Map](#environment-variable-map) below)
2. Merges env vars over raw defaults (env vars take highest priority)
3. Validates the merged object through `AppConfigSchema`
4. Returns the validated config, or throws `ZodError` with per-field errors

**Call once at startup**:
```typescript
async function main() {
  const config = loadConfig(); // throws ZodError immediately if invalid
  await service.initialize();
  app.listen(config.server.port);
}
```

---

## `createTestConfig(overrides?)` (`src/config/schema.ts`)

Create a deterministic `AppConfig` for use in tests. Never reads `process.env`.

```typescript
function createTestConfig(overrides?: DeepPartial<AppConfig>): AppConfig
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `overrides` | `DeepPartial<AppConfig>?` | Optional deep partial overrides |

**Returns**: `AppConfig` with test-safe defaults:
- `env: 'development'`
- `database.host: 'localhost'`, `database.port: 5432`, `database.name: 'test_db'`, `database.user: 'test'`, `database.password: 'test'`
- `server.port: 3000`
- `logging.level: 'error'` (suppress output in tests)

**Example**:
```typescript
// Default test config
const config = createTestConfig();

// Override specific fields
const config = createTestConfig({
  database: { port: 5433 },
  logging:  { level: 'debug' },
});

// Extract service config slice
const serviceConfig: ServiceConfig = {
  database: config.database,
  logging:  config.logging,
};
```

---

## Environment Variable Map

`loadConfig()` reads these environment variables:

| Env var | Config field | Type | Default | Required |
|---------|-------------|------|---------|---------|
| `NODE_ENV` | `env` | `'development' \| 'staging' \| 'production'` | `'development'` | No |
| `DB_HOST` | `database.host` | string | `'localhost'` | No |
| `DB_PORT` | `database.port` | number | `5432` | No |
| `DB_NAME` | `database.name` | string | — | **Yes** |
| `DB_USER` | `database.user` | string | — | **Yes** |
| `DB_PASSWORD` | `database.password` | string | — | **Yes** |
| `DB_SSL` | `database.ssl` | boolean | `false` | No |
| `DB_POOL_MIN` | `database.poolMin` | number | `2` | No |
| `DB_POOL_MAX` | `database.poolMax` | number | `10` | No |
| `SERVER_PORT` | `server.port` | number | `3000` | No |
| `SERVER_HOST` | `server.host` | string | `'0.0.0.0'` | No |
| `CORS_ORIGINS` | `server.corsOrigins` | comma-separated string | `[]` | No |
| `REQUEST_TIMEOUT_MS` | `server.requestTimeoutMs` | number | `30000` | No |
| `LOG_LEVEL` | `logging.level` | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'` | No |
| `LOG_FORMAT` | `logging.format` | `'json' \| 'pretty'` | `'json'` | No |

**Type coercion**: string env vars are coerced to the schema type. `DB_PORT=5433` becomes `database.port = 5433` (number). `DB_SSL=true` becomes `database.ssl = true` (boolean).

**Example `.env` for local development**:
```bash
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=secret
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

---

## Validation Errors

When a required field is missing, `loadConfig()` throws a `ZodError` with field-level details:

```
ZodError: [
  { code: 'invalid_type', path: ['database', 'name'], message: 'Required' },
  { code: 'invalid_type', path: ['database', 'user'], message: 'Required' },
]
```

This makes the error immediately actionable — the developer knows exactly which env vars to set.
