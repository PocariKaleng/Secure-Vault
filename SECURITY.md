# Security policy

## Supported versions

Security fixes are applied to the latest release on `main`.

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| Earlier versions | No |

## Reporting a vulnerability

Please use [GitHub private vulnerability reporting](https://github.com/PocariKaleng/Secure-Vault/security/advisories/new). Include the affected workflow, a minimal reproduction, expected impact, and browser/version information. Do not include real passwords or sensitive files in a report.

Please avoid opening a public issue until a fix is available. A first response should arrive within seven days; confirmed issues will be coordinated through a private advisory.

## Threat model

SecureVault protects file content and private archive metadata while a `.secure` v2 archive is at rest or copied. A unique password is converted into an AES-256-GCM key with PBKDF2-SHA256, a random salt, and 600,000 iterations. The public format header is authenticated as AES-GCM additional data.

The application trusts the browser runtime and the code served from its origin. It validates file size, archive framing, algorithm identifiers, iteration bounds, salt and nonce sizes, decoded metadata, and authentication before returning plaintext.

The following risks remain outside the protection boundary:

- Malware, malicious browser extensions, a compromised browser profile, or modified application code
- Weak or reused passwords and offline password guessing against a copied archive
- Plaintext Vault index fields and activity records stored in IndexedDB
- Plaintext files after the browser downloads a successful decryption
- Deleted, changed, or rolled-back local browser data
- Files larger than 32 MiB, which are intentionally rejected

The ECDSA P-256 page is an educational signing demo. Its non-extractable private key lives only in memory and is lost on reload. It is not an identity or certificate system.

This project has not received an independent security or cryptographic audit.
