export type EncryptionAlgorithm = "AES_256_GCM";

export type KdfAlgorithm = "PBKDF2_SHA256";

export type SecureFileMetadata = {
    version: 1 | 2;
    algorithm: EncryptionAlgorithm;
    kdf: KdfAlgorithm;
    originalFilename: string;
    originalSize: number;
    originalMimeType: string;
    salt: string;
    nonce: string;
    iterations: number;
    createdAt: string;
};

export type ParsedSecureFile = {
    metadata: SecureFileMetadata | SecureFileHeaderV2;
    ciphertext: Uint8Array;
    additionalData?: Uint8Array;
};

export type SecureFileHeaderV2 = Pick<SecureFileMetadata, "algorithm" | "kdf" | "salt" | "nonce" | "iterations"> & { version: 2 };

export type VaultFile = {
    id: string;
    encryptedFilename: string;
    originalFilename: string;
    algorithm: EncryptionAlgorithm;
    originalSize: number;
    encryptedSize: number;
    createdAt: string;
};

export type VaultRecord = VaultFile & {
    metadata: SecureFileMetadata;
    blob: Blob;
};
