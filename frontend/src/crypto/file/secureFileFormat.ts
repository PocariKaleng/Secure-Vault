import type { ParsedSecureFile, SecureFileMetadata, SecureFileHeaderV2 } from "../types";
import { assertFileSize, MAX_FILE_BYTES, MAX_METADATA_BYTES } from "../policy";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export function bytesToBase64(bytes: Uint8Array): string {
    return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""));
}
export function base64ToBytes(value: string): Uint8Array {
    return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

export function encodeHeader(metadata: SecureFileMetadata | SecureFileHeaderV2): Uint8Array<ArrayBuffer> {
    const json = encoder.encode(JSON.stringify(metadata));
    if (json.length > MAX_METADATA_BYTES) throw new Error("Metadata is too large.");
    const header = new Uint8Array(9 + json.length);
    header.set(encoder.encode(metadata.version === 2 ? "SVLT2" : "SVLT1"));
    new DataView(header.buffer).setUint32(5, json.length, false);
    header.set(json, 9);
    return header;
}

// Legacy packer retained for compatibility fixtures. New files use the v2 writer.
export function packSecureFile(metadata: SecureFileMetadata, ciphertext: Uint8Array): Blob {
    if (metadata.version !== 1) throw new Error("Use the v2 format writer.");
    return new Blob([encodeHeader(metadata), new Uint8Array(ciphertext)], { type: "application/octet-stream" });
}

export function validateFileMetadata(value: unknown): asserts value is SecureFileMetadata {
    if (!value || typeof value !== "object") throw new Error("File metadata is invalid.");
    const m = value as SecureFileMetadata;
    if (typeof m.originalFilename !== "string" || !m.originalFilename.trim() ||
        m.originalFilename.length > 1024 || /[/\\\\]/.test(m.originalFilename) ||
        Array.from(m.originalFilename).some(c => c.charCodeAt(0) < 32) ||
        typeof m.originalMimeType !== "string" || m.originalMimeType.length > 255 ||
        !Number.isSafeInteger(m.originalSize) || m.originalSize < 0 || m.originalSize > MAX_FILE_BYTES ||
        typeof m.createdAt !== "string" || !Number.isFinite(Date.parse(m.createdAt))) {
        throw new Error("File metadata is invalid or the original file exceeds 32 MiB.");
    }
}

export async function parseSecureFile(file: File | Blob): Promise<ParsedSecureFile> {
    assertFileSize(file, true);
    const prefix = new Uint8Array(await file.slice(0, 9).arrayBuffer());
    if (prefix.length !== 9) throw new Error("The .secure file is incomplete.");
    const magic = decoder.decode(prefix.subarray(0, 5));
    if (magic !== "SVLT1" && magic !== "SVLT2") throw new Error("This is not a SecureVault file.");
    const length = new DataView(prefix.buffer).getUint32(5, false);
    if (!length || length > MAX_METADATA_BYTES || 9 + length + 16 > file.size) {
        throw new Error("The metadata or ciphertext is incomplete.");
    }
    const headerBytes = new Uint8Array(await file.slice(0, 9 + length).arrayBuffer());
    let m: SecureFileMetadata | SecureFileHeaderV2;
    try { m = JSON.parse(decoder.decode(headerBytes.subarray(9))); }
    catch { throw new Error("Metadata JSON is invalid."); }
    if (!m || typeof m !== "object" || m.version !== (magic === "SVLT2" ? 2 : 1) ||
        m.algorithm !== "AES_256_GCM" || m.kdf !== "PBKDF2_SHA256" ||
        !Number.isSafeInteger(m.iterations) || m.iterations < (m.version === 2 ? 600_000 : 1) ||
        m.iterations > 2_000_000 || typeof m.salt !== "string" || typeof m.nonce !== "string") {
        throw new Error("The encryption parameters are invalid or unsupported.");
    }
    try {
        if (m.salt.length !== 24 || m.nonce.length !== 16 ||
            base64ToBytes(m.salt).length !== 16 || base64ToBytes(m.nonce).length !== 12) throw new Error();
    } catch { throw new Error("The salt or nonce is invalid."); }
    if (m.version === 1) {
        validateFileMetadata(m);
        if (file.size - headerBytes.length !== m.originalSize + 16) throw new Error("The ciphertext size does not match the metadata.");
    }
    const ciphertext = new Uint8Array(await file.slice(headerBytes.length).arrayBuffer());
    return { metadata: m, ciphertext, additionalData: m.version === 2 ? headerBytes : undefined };
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
