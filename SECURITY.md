# Security Policy

## Supported Versions

The latest release of core-sdk is supported. Older versions do not receive security updates.

| Version | Supported |
|---------|-----------|
| Latest  | ✅ |
| Older   | ❌ |

## Reporting a Vulnerability

core-sdk is a documentation and template package — it contains no executable server code, no authentication, and no network services. The attack surface is limited to:

- **Pattern documentation** — Markdown files describing coding patterns
- **TypeScript template files** — example source code consumers copy into their own projects

If you discover a security issue in the **template source files** (e.g., a code example that introduces a vulnerability like SQL injection, XSS, command injection, or insecure credential handling), please report it so the example can be corrected.

### How to report

Open a GitHub issue labeled `security`. For sensitive disclosures, email the author directly (see `package.yaml` author field).

Please include:
- Which file contains the issue (`agent/files/src/...` or `agent/patterns/...`)
- A description of the vulnerability class
- A suggested fix or safer alternative

We aim to respond within 7 days and publish a fix within 14 days of a confirmed report.
