# Changelog

All notable changes to SecureVault are documented here.

## [1.0.0] - 2026-09-08

### Added

- AES-256-GCM file encryption and decryption with PBKDF2-SHA256 key derivation
- Authenticated `.secure` v2 archives with encrypted private metadata and legacy v1 reading
- Local IndexedDB Vault and activity history
- ECDSA P-256 / SHA-256 signing demonstration
- Responsive cyberpunk dashboard, reduced-motion controls, and custom SecureVault mark
- Playwright coverage for file workflows, cryptographic boundaries, responsive layouts, and production deployment
- GitHub Actions deployment to Pages, dependency auditing, and Dependabot configuration
- Content Security Policy, threat model, security reporting instructions, and MIT license

### Fixed

- Required password validation on encryption and Vault import paths
- Vault deletion state when audit persistence fails after the encrypted record is deleted
- Static-host routing and repository-relative asset paths
