import { decryptAesGcm } from "../algorithms/aesGcm";
import { MAX_METADATA_BYTES } from "../policy";
import type { SecureFileMetadata } from "../types";
import { base64ToBytes, parseSecureFile, validateFileMetadata } from "./secureFileFormat";

export type DecryptFileResult = { blob: Blob; metadata: SecureFileMetadata; outputFilename: string };

export async function decryptSecureFileToBlob(file: File, password: string): Promise<DecryptFileResult> {
    if (!password.trim()) throw new Error("Password cannot be empty.");
    const parsed = await parseSecureFile(file);
    const header = parsed.metadata;
    let plaintext: ArrayBuffer;
    try {
        plaintext = await decryptAesGcm(parsed.ciphertext, password, base64ToBytes(header.salt),
            base64ToBytes(header.nonce), header.iterations, parsed.additionalData);
    } catch (cause) { throw new Error("Decryption failed. Incorrect password or the file has been modified.", { cause }); }
    const bytes = new Uint8Array(plaintext);
    try {
        let metadata: SecureFileMetadata;
        let offset = 0;
        if (header.version === 2) {
            if (bytes.length < 4) throw new Error("The payload is incomplete.");
            const length = new DataView(plaintext).getUint32(0, false);
            if (!length || length > MAX_METADATA_BYTES || length + 4 > bytes.length) throw new Error("Private metadata is invalid.");
            const privateMetadata: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(4, 4 + length)));
            validateFileMetadata(privateMetadata);
            metadata = {
                ...header,
                originalFilename: privateMetadata.originalFilename,
                originalSize: privateMetadata.originalSize,
                originalMimeType: privateMetadata.originalMimeType,
                createdAt: privateMetadata.createdAt,
            };
            offset = 4 + length;
        } else {
            validateFileMetadata(header);
            metadata = header;
        }
        if (bytes.length - offset !== metadata.originalSize) throw new Error("The file size does not match the metadata.");
        return {
            blob: new Blob([bytes.subarray(offset)], { type: metadata.originalMimeType || "application/octet-stream" }),
            metadata, outputFilename: metadata.originalFilename,
        };
    } finally { bytes.fill(0); }
}
