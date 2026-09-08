# Contributing

Thanks for helping improve SecureVault. Keep changes focused, explain security assumptions, and never commit real secrets or personal files.

## Development

```bash
cd frontend
npm ci
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

Use generated fixtures for cryptography tests. A pull request that changes archive parsing, encryption, password handling, IndexedDB records, or deployment permissions should describe the affected trust boundary and include a meaningful regression test.

Report suspected vulnerabilities through the process in [SECURITY.md](SECURITY.md), not a public issue.
