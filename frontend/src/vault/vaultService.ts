import type { SecureFileMetadata, VaultRecord } from "../crypto/types";
import {
    clearVaultRecords,
    deleteVaultRecordById,
    getAllVaultRecords,
    getVaultRecord,
    putVaultRecord,
} from "./vaultDb";

function createId(): string {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function saveEncryptedFileToVault(
    blob: Blob,
    metadata: SecureFileMetadata,
    encryptedFilename: string
): Promise<VaultRecord> {
    const record: VaultRecord = {
        id: createId(),
        encryptedFilename,
        originalFilename: metadata.originalFilename,
        algorithm: metadata.algorithm,
        originalSize: metadata.originalSize,
        encryptedSize: blob.size,
        createdAt: metadata.createdAt,
        metadata,
        blob,
    };

    await putVaultRecord(record);

    return record;
}

export async function loadVaultFiles(): Promise<VaultRecord[]> {
    return getAllVaultRecords();
}

export async function loadVaultFileById(
    id: string
): Promise<VaultRecord | null> {
    return getVaultRecord(id);
}

export async function deleteVaultFile(id: string): Promise<void> {
    await deleteVaultRecordById(id);
}

export async function clearVault(): Promise<void> {
    await clearVaultRecords();
}
