import { DEFAULT_PBKDF2_ITERATIONS, deriveAesGcmKeyFromPassword } from "../kdf/pbkdf2";
import { assertFileSize, assertNewPassword, MAX_METADATA_BYTES } from "../policy";
import type { SecureFileMetadata, SecureFileHeaderV2 } from "../types";
import { bytesToBase64, encodeHeader, validateFileMetadata } from "./secureFileFormat";

export type EncryptFileResult = { blob: Blob; metadata: SecureFileMetadata; outputFilename: string };

export async function encryptFileToSecureBlob(file: File, password: string): Promise<EncryptFileResult> {
    assertFileSize(file);
    assertNewPassword(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const header: SecureFileHeaderV2 = {
        version: 2, algorithm: "AES_256_GCM", kdf: "PBKDF2_SHA256",
        salt: bytesToBase64(salt), nonce: bytesToBase64(nonce), iterations: DEFAULT_PBKDF2_ITERATIONS,
    };
    const privateMetadata = {
        originalFilename: file.name, originalSize: file.size,
        originalMimeType: file.type || "application/octet-stream", createdAt: new Date().toISOString(),
    };
    const metadata: SecureFileMetadata = { ...header, ...privateMetadata };
    validateFileMetadata(metadata);
    const json = new TextEncoder().encode(JSON.stringify(privateMetadata));
    if (json.length > MAX_METADATA_BYTES) throw new Error("Metadata is too large.");
    const payload = new Uint8Array(4 + json.length + file.size);
    new DataView(payload.buffer).setUint32(0, json.length, false);
    payload.set(json, 4);
    payload.set(new Uint8Array(await file.arrayBuffer()), 4 + json.length);
    try {
        const key = await deriveAesGcmKeyFromPassword(password, salt, header.iterations);
        const additionalData = encodeHeader(header);
        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: nonce, additionalData, tagLength: 128 }, key, payload,
        );
        return {
            blob: new Blob([additionalData, ciphertext], { type: "application/octet-stream" }),
            metadata,
            outputFilename: `archive-${crypto.randomUUID()}.secure`,
        };
    } finally { payload.fill(0); }
}
