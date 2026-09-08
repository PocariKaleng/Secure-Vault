import { test, expect } from '@playwright/test';

test('v2 protects private metadata, authenticates the envelope, and reads v1', async ({ page }) => {
    await page.goto('./#/dashboard');
    const result = await page.evaluate(async () => {
        const encryptionPath = '/src/crypto/file/encryptFile.ts';
        const decryptionPath = '/src/crypto/file/decryptFile.ts';
        const formatPath = '/src/crypto/file/secureFileFormat.ts';
        const aesPath = '/src/crypto/algorithms/aesGcm.ts';
        const { encryptFileToSecureBlob } = await import(encryptionPath);
        const { decryptSecureFileToBlob } = await import(decryptionPath);
        const { packSecureFile, bytesToBase64 } = await import(formatPath);
        const { encryptAesGcm } = await import(aesPath);
        const password = 'sunset flowers above the lake';
        const file = new File(['Private note'], 'private-identity.txt', { type: 'text/plain' });
        const encrypted = await encryptFileToSecureBlob(file, password);
        const bytes = new Uint8Array(await encrypted.blob.arrayBuffer());
        const decrypted = await decryptSecureFileToBlob(new File([bytes], 'archive.secure'), password).catch((error: Error) => { throw new Error(`v2: ${String(error.cause)}`); });
        const failures: boolean[] = [];
        // Negative authentication checks on in-memory fixtures; never external targets.
        for (const index of [bytes.length - 1, 9 + new TextDecoder().decode(bytes.subarray(9)).indexOf('salt') + 7]) {
            const changed = bytes.slice(); changed[index] ^= 1;
            try { await decryptSecureFileToBlob(new File([changed], 'changed.secure'), password); failures.push(false); }
            catch { failures.push(true); }
        }
        let weakRejected = false;
        try { await encryptFileToSecureBlob(file, 'password123456789'); } catch { weakRejected = true; }
        const legacy = await encryptAesGcm(await file.arrayBuffer(), 'old');
        const metadata = { version: 1, algorithm: 'AES_256_GCM', kdf: 'PBKDF2_SHA256', originalFilename: file.name,
            originalSize: file.size, originalMimeType: file.type, createdAt: new Date().toISOString(),
            salt: bytesToBase64(legacy.salt), nonce: bytesToBase64(legacy.nonce), iterations: legacy.iterations };
        const restoredLegacy = await decryptSecureFileToBlob(new File([packSecureFile(metadata, legacy.ciphertext)], 'legacy.secure'), 'old').catch((error: Error) => { throw new Error(`v1: ${String(error.cause)}`); });
        return { magic: new TextDecoder().decode(bytes.subarray(0, 5)), hidesName: !new TextDecoder().decode(bytes).includes(file.name),
            text: await decrypted.blob.text(), filename: decrypted.outputFilename, failures, weakRejected,
            legacyText: await restoredLegacy.blob.text(), legacyVersion: restoredLegacy.metadata.version };
    });
    expect(result).toEqual({ magic: 'SVLT2', hidesName: true, text: 'Private note', filename: 'private-identity.txt',
        failures: [true, true], weakRejected: true, legacyText: 'Private note', legacyVersion: 1 });
});

test('oversize input is rejected before reading file contents', async ({ page }) => {
    await page.goto('./#/dashboard');
    const result = await page.evaluate(async () => {
        const encryptPath = '/src/crypto/file/encryptFile.ts';
        const parsePath = '/src/crypto/file/secureFileFormat.ts';
        const { encryptFileToSecureBlob } = await import(encryptPath);
        const { parseSecureFile } = await import(parsePath);
        let reads = 0;
        const oversized = { size: 40 * 1024 * 1024, arrayBuffer: () => { reads++; throw new Error('Read'); }, slice: () => { reads++; throw new Error('Read'); } };
        const rejected: boolean[] = [];
        for (const operation of [() => encryptFileToSecureBlob(oversized, 'sunset flowers above the lake'), () => parseSecureFile(oversized)]) {
            try { await operation(); rejected.push(false); } catch { rejected.push(true); }
        }
        return { reads, rejected };
    });
    expect(result).toEqual({ reads: 0, rejected: [true, true] });
});
