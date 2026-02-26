# Core SDK Templates

This directory contains template files for creating reusable core libraries that can be shared across MCP servers, REST APIs, and client applications.

## Template Structure

```
templates/
├── config/                     # Configuration templates
│   ├── package.json.template   # npm package with subpath exports
│   ├── tsconfig.json          # TypeScript configuration
│   ├── jest.config.js         # Jest for ESM + TypeScript
│   ├── esbuild.build.js       # esbuild for multiple entry points
│   ├── esbuild.watch.js       # esbuild watch mode
│   ├── gitignore.template     # Git ignore rules
│   └── npmignore.template     # npm ignore rules
│
├── src/                        # Source code templates
│   ├── schemas/
│   │   └── example.schema.ts  # Zod schema pattern
│   ├── services/
│   │   └── example.service.ts # Service layer pattern
│   ├── dto/
│   │   ├── example.dto.ts     # DTO types
│   │   ├── transformers.ts    # DTO transformers
│   │   └── index.ts           # DTO exports
│   ├── constant/
│   │   └── collections.ts     # Collection path helpers
│   ├── errors/
│   │   ├── index.ts           # Error exports
│   │   ├── task-errors.ts     # Error classes
│   │   └── task-errors.spec.ts # Error tests
│   └── client.ts              # Client wrapper pattern
│
└── test/                       # Test templates
    └── (test examples)
```

## Usage

### With ACP Package Install

Once the templates feature is available in ACP:

```bash
# Install all templates
@acp.package-install --repo https://github.com/prmichaelsen/acp-core-sdk.git

# Install only configuration templates
@acp.package-install --templates config/* --repo <url>

# Install specific templates
@acp.package-install --templates config/tsconfig.json src/schemas/example.schema.ts --repo <url>
```

### Manual Usage

Copy template files to your project:

```bash
# Copy configuration files
cp templates/config/tsconfig.json ./
cp templates/config/jest.config.js ./
cp templates/config/esbuild.build.js ./
cp templates/config/esbuild.watch.js ./

# Copy source templates
cp -r templates/src/* ./src/

# Rename template files
mv templates/config/gitignore.template ./.gitignore
mv templates/config/npmignore.template ./.npmignore
```

### Customizing package.json.template

The `package.json.template` file contains variables that need to be replaced:

- `{{PACKAGE_NAME}}` - Your package name (e.g., `@myorg/my-core`)
- `{{PACKAGE_DESCRIPTION}}` - Package description
- `{{AUTHOR_NAME}}` - Your name

Replace these manually or use the ACP package install system (which will prompt for values).

## What Each Template Provides

### Configuration Templates

- **package.json.template** - npm package configuration with 6 subpath exports for optimal tree-shaking
- **tsconfig.json** - TypeScript configuration for ESM modules, strict mode, and declaration generation
- **jest.config.js** - Jest configuration for ESM + TypeScript with colocated tests
- **esbuild.build.js** - esbuild configuration for bundling multiple entry points
- **esbuild.watch.js** - esbuild watch mode for development
- **gitignore.template** - Git ignore rules for Node.js projects
- **npmignore.template** - npm ignore rules to exclude dev files from published package

### Source Code Templates

- **schemas/example.schema.ts** - Zod schema pattern with TypeScript type inference
- **services/example.service.ts** - Service layer pattern for Firestore operations
- **dto/example.dto.ts** - DTO type definitions for API responses
- **dto/transformers.ts** - Functions to transform internal types to API responses
- **dto/index.ts** - Centralized DTO exports
- **constant/collections.ts** - Helper functions for Firestore collection paths
- **errors/task-errors.ts** - Custom error classes with HTTP status codes
- **errors/index.ts** - Error exports and utilities
- **client.ts** - Client wrapper pattern for multi-tenant access

## Patterns Demonstrated

These templates demonstrate several key patterns:

1. **Subpath Exports** - 6 exports for optimal tree-shaking
2. **ESM Modules** - Modern JavaScript module system
3. **TypeScript Strict Mode** - Maximum type safety
4. **Colocated Tests** - Tests next to source files (`.spec.ts`)
5. **Service Layer** - Business logic separated from data access
6. **DTO Pattern** - Transform internal types to API-friendly responses
7. **Error Handling** - Custom error classes with status codes
8. **Client Wrapper** - Multi-tenant access pattern

## Next Steps

After installing templates:

1. **Customize package.json** - Update name, description, author
2. **Install dependencies** - `npm install`
3. **Customize source files** - Adapt to your domain
4. **Run tests** - `npm test`
5. **Build** - `npm run build`
6. **Publish** - `npm publish --access public`

## Learn More

See the patterns and designs in the `agent/` directory for detailed documentation on:
- Core library extraction patterns
- NPM package structure
- Testing strategies
- Build configuration
- Migration patterns
