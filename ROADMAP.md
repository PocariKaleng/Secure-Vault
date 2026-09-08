# Roadmap

SecureVault keeps its file encryption surface intentionally narrow. Proposed work should preserve `.secure` compatibility or include a documented migration.

## Near term

- Move PBKDF2 and AES-GCM work into a Web Worker to keep the interface responsive
- Add measurable performance budgets for 32 MiB files and mobile devices
- Add optional export and import for the local activity history
- Improve keyboard and screen-reader coverage through automated accessibility checks

## Later exploration

- Stream large files without holding the complete plaintext and ciphertext in memory
- Evaluate a memory-hard password KDF when it is practical in supported browsers
- Publish a small independent `.secure` format interoperability fixture set

Feature proposals should start with the user problem, security impact, file-format impact, and a rollback or compatibility plan.
