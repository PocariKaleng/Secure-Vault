# SecureVault

SecureVault is an open-source frontend portfolio project that demonstrates private file encryption and digital signatures entirely in the browser. It opens directly to the dashboard with no account or Vault password, so reviewers can try the core workflow immediately.

## Run locally

Requires Node.js 22.12 or later and npm.

```bash
npm ci
npm run dev
```

Web Crypto requires a secure context. Use HTTPS or the `localhost` URL printed by Vite.

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
npm test
npm audit --audit-level=high
```

The browser tests use Playwright with a local Chrome channel during development and bundled Chromium in CI. Every test receives an isolated browser context and works only with generated fixture data.

## Highlights

- Dashboard access without an account, login, or Vault password.
- AES-256-GCM authenticated file encryption with a random 16-byte salt and 12-byte nonce.
- PBKDF2-SHA256 with 600,000 iterations to derive each file key from its password.
- The `.secure` v2 format encrypts file content, filename, MIME type, and creation time. Its public header is authenticated as additional data.
- Encryption, decryption, signing, verification, and downloads run in the browser with no server upload.
- A local IndexedDB Vault with search, sorting, import, metadata inspection, download, decryption, and deletion.
- ECDSA P-256 digital signatures with SHA-256. The private key is non-extractable and exists only in the current tab's memory.
- A responsive cyan and magenta cyberpunk interface with cursor-reactive glow, scanlines, ambient grid motion, route transitions, layered hover feedback, keyboard navigation, visible focus states, and reduced-motion support.
- A local activity log that makes the demo workflow easy to inspect.

## Architecture

```text
Original file
      |
      v
PBKDF2-SHA256 (600,000 iterations)
      |
      v
AES-256-GCM + authenticated v2 header
      |
      v
.secure archive ----> IndexedDB (local Vault)
      |
      +-------------> Local download

Message ----> ECDSA P-256 / SHA-256 ----> Signature verification
```

| Area | Responsibility |
| --- | --- |
| `src/crypto` | Key derivation, AES-256-GCM encryption, decryption, binary format parsing, and ECDSA |
| `src/vault` | Local encrypted-file storage and dashboard statistics |
| `src/audit` | Local activity history |
| `src/pages` | User workflows and cryptography demos |
| `src/components` | Navigation, file picker, dialogs, and shared controls |
| `tests` | Browser tests for cryptography, file workflows, accessibility behavior, responsive layout, and the production Pages artifact |

There is no backend, built-in secret, user account, or cloud synchronization. File passwords and plaintext are not stored by the application.

## The .secure format

New archives use format v2:

```text
SVLT2
+ 4-byte big-endian header length
+ public JSON header
+ AES-GCM ciphertext
+ 128-bit authentication tag
```

The public header contains only the format version, algorithm, KDF, salt, nonce, and iteration count. Private metadata is placed inside the encrypted payload before the original file bytes.

The complete header is supplied to AES-GCM as additional authenticated data. Any change to the header, private metadata, ciphertext, or authentication tag makes decryption fail. The parser limits original files to 32 MiB, metadata to 64 KiB, and accepted iteration counts to 2,000,000.

The v1 reader remains available for compatibility. v1 encrypts file content, but exposes unauthenticated metadata. Re-encrypt a restored v1 file to create a v2 archive.

## Digital signatures

The Digital Signature page creates a key pair with:

```ts
crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  false,
  ["sign", "verify"],
)
```

Setting `extractable` to `false` keeps the private key non-extractable. The page displays the public key as JWK and a short fingerprint so the verification flow is easy to demonstrate.

ECDSA proves message authenticity and integrity through possession of a private key. It does not hide message content and does not replace AES-256-GCM file encryption. The demo key pair is not persisted and disappears when the page reloads.

## Suggested demo

1. Open the app and show that the dashboard appears immediately.
2. Encrypt a sample document with a unique passphrase; first try a mismatched confirmation.
3. Reload the Vault page to demonstrate IndexedDB persistence.
4. Inspect the metadata, decrypt with the correct password, and compare the restored file.
5. Import the downloaded `.secure` archive and inspect the local activity log.
6. Generate an ECDSA P-256 key pair, sign a message, and verify it.
7. Change one character in the message and verify again to demonstrate tamper detection.

## Security scope

- This is a portfolio demonstration and has not received an independent cryptographic audit.
- Each `.secure` file is protected by its own password. The application has no account password or user authentication.
- IndexedDB stores each encrypted `.secure` blob and a separate plaintext index copy of its filenames, sizes, timestamps, algorithm, and archive metadata. The activity log is also ordinary local data. Anyone with access to the browser profile can read or change this index and log.
- The activity log is not tamper-resistant. Browser data can be changed, deleted, or restored from an older copy.
- Clearing browser data removes the Vault and activity history. Download `.secure` files as backups.
- Password recovery is not available. Successfully decrypted files are downloaded as plaintext.
- Files are read fully into memory and limited to 32 MiB. This implementation does not yet use streaming or a Web Worker.

## GitHub Pages deployment

The root workflow runs linting, type checking, browser tests, a high-severity dependency audit, a repository-aware Pages build, and a smoke test against the built artifact. Hash routing prevents deep-link reload failures on static hosting.

To deploy, push `main`, select **GitHub Actions** as the Pages source in the repository settings, and wait for the `Quality and deploy` workflow. A failed deployment can be rolled back by reverting the responsible commit and rerunning the workflow.

## References

- [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/)
- [NIST SP 800-38D: GCM and GMAC](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- [NIST SP 800-132: Password-Based Key Derivation](https://csrc.nist.gov/pubs/sp/800/132/final)
- [NIST FIPS 186-5: Digital Signature Standard](https://csrc.nist.gov/pubs/fips/186-5/final)
