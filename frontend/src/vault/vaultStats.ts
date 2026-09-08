import type { EncryptionAlgorithm, VaultRecord } from "../crypto/types";

export type AlgorithmUsage = {
    algorithm: EncryptionAlgorithm;
    count: number;
    originalSize: number;
    encryptedSize: number;
};

export type VaultDashboardStats = {
    totalFiles: number;
    totalOriginalSize: number;
    totalEncryptedSize: number;
    activeAlgorithms: number;
    latestFile: VaultRecord | null;
    recentFiles: VaultRecord[];
    algorithmUsage: AlgorithmUsage[];
};

export function buildVaultDashboardStats(
    files: VaultRecord[]
): VaultDashboardStats {
    const sortedFiles = [...files].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const algorithmMap = new Map<EncryptionAlgorithm, AlgorithmUsage>();

    let totalOriginalSize = 0;
    let totalEncryptedSize = 0;

    for (const file of files) {
        totalOriginalSize += file.originalSize;
        totalEncryptedSize += file.encryptedSize;

        const current = algorithmMap.get(file.algorithm);

        if (current) {
            current.count += 1;
            current.originalSize += file.originalSize;
            current.encryptedSize += file.encryptedSize;
        } else {
            algorithmMap.set(file.algorithm, {
                algorithm: file.algorithm,
                count: 1,
                originalSize: file.originalSize,
                encryptedSize: file.encryptedSize,
            });
        }
    }

    const algorithmUsage = Array.from(algorithmMap.values()).sort(
        (a, b) => b.count - a.count
    );

    return {
        totalFiles: files.length,
        totalOriginalSize,
        totalEncryptedSize,
        activeAlgorithms: algorithmUsage.length,
        latestFile: sortedFiles[0] ?? null,
        recentFiles: sortedFiles.slice(0, 5),
        algorithmUsage,
    };
}