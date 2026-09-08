import { useEffect, useMemo, useState } from "react";
import { logAuditEvent } from "../audit/auditService";
import VaultDecryptModal from "../components/file/VaultDecryptModal";
import VaultFilterBar, { type VaultSortOption } from "../components/file/VaultFilterBar";
import VaultMetadataModal from "../components/file/VaultMetadataModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import { decryptSecureFileToBlob } from "../crypto/file/decryptFile";
import { downloadBlob, parseSecureFile } from "../crypto/file/secureFileFormat";
import type { VaultRecord } from "../crypto/types";
import { formatBytes } from "../utils/formatBytes";
import { formatDate } from "../utils/formatDate";
import { deleteVaultFile, loadVaultFiles, saveEncryptedFileToVault } from "../vault/vaultService";

export default function VaultPage() {
    const [files, setFiles] = useState<VaultRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState("");
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPassword, setImportPassword] = useState("");

    async function handleImport(file: File) {
        setIsImporting(true);
        setError("");
        setImportMessage("");
        try {
            await parseSecureFile(file);
            setImportPassword("");
            setImportFile(file);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed.");
        } finally { setIsImporting(false); }
    }

    async function confirmImport(event: React.FormEvent) {
        event.preventDefault();
        if (!importFile || isImporting) return;
        if (!importPassword.trim()) {
            setError("Enter the archive password.");
            return;
        }
        const file = importFile;
        setIsImporting(true);
        setError("");
        try {
            const { metadata } = await decryptSecureFileToBlob(file, importPassword);
            const record = await saveEncryptedFileToVault(file, metadata, file.name);
            setFiles(current => [record, ...current]);
            setImportPassword("");
            setImportFile(null);
            setImportMessage(metadata.version === 2 ? "File imported successfully. Its content and metadata were verified." : "v1 file imported successfully. Its content was verified, but legacy metadata is not authenticated. Re-encrypt it to create v2.");
            try {
                await logAuditEvent({ action: "IMPORT_SECURE_FILE", message: `File ${file.name} was imported into the Vault.`, filename: file.name, algorithm: metadata.algorithm });
            } catch {
                setError("The file was imported, but the activity event could not be saved.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed.");
        } finally {
            setIsImporting(false);
        }
    }

    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<VaultSortOption>("NEWEST");

    const [selectedDecryptFile, setSelectedDecryptFile] =
        useState<VaultRecord | null>(null);
    const [selectedMetadataFile, setSelectedMetadataFile] =
        useState<VaultRecord | null>(null);

    const filteredFiles = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        const result = files.filter((file) => {
            const matchesSearch =
                normalizedSearch === "" ||
                file.encryptedFilename.toLowerCase().includes(normalizedSearch) ||
                file.originalFilename.toLowerCase().includes(normalizedSearch);

            return matchesSearch;
        });

        result.sort((a, b) => {
            switch (sortOption) {
                case "NEWEST":
                    return (
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );

                case "OLDEST":
                    return (
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );

                case "NAME_ASC":
                    return a.originalFilename.localeCompare(b.originalFilename);

                case "NAME_DESC":
                    return b.originalFilename.localeCompare(a.originalFilename);

                case "SIZE_ASC":
                    return a.encryptedSize - b.encryptedSize;

                case "SIZE_DESC":
                    return b.encryptedSize - a.encryptedSize;

                default:
                    return 0;
            }
        });

        return result;
    }, [files, searchQuery, sortOption]);

    async function refreshVault() {
        try {
            setIsLoading(true);
            setError("");

            const vaultFiles = await loadVaultFiles();

            setFiles(vaultFiles);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load the Vault.");
        } finally {
            setIsLoading(false);
        }
    }

    function clearFilters() {
        setSearchQuery("");
        setSortOption("NEWEST");
    }

    async function handleDownload(file: VaultRecord) {
        try {
            downloadBlob(file.blob, file.encryptedFilename);

            await logAuditEvent({
                action: "DOWNLOAD_SECURE_FILE",
                message: `File ${file.encryptedFilename} was downloaded from the Vault.`,
                filename: file.encryptedFilename,
                algorithm: file.algorithm,
                details: {
                    vaultFileId: file.id,
                    originalFilename: file.originalFilename,
                    encryptedSize: file.encryptedSize,
                },
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to download the file.");
        }
    }

    function handleOpenDecrypt(file: VaultRecord) {
        setSelectedDecryptFile(file);
    }

    function handleCloseDecrypt() {
        setSelectedDecryptFile(null);
    }

    function handleOpenMetadata(file: VaultRecord) {
        setSelectedMetadataFile(file);
    }

    function handleCloseMetadata() {
        setSelectedMetadataFile(null);
    }

    async function handleDelete(file: VaultRecord) {
        const confirmed = window.confirm(
            `Delete ${file.encryptedFilename} from the Vault?`
        );

        if (!confirmed) return;

        setError("");

        try {
            await deleteVaultFile(file.id);
            setFiles((current) => current.filter((item) => item.id !== file.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete the file.");
            return;
        }

        try {
            await logAuditEvent({
                action: "DELETE_FILE",
                message: `File ${file.encryptedFilename} was deleted from the Vault.`,
                filename: file.encryptedFilename,
                algorithm: file.algorithm,
                details: {
                    vaultFileId: file.id,
                    originalFilename: file.originalFilename,
                    encryptedSize: file.encryptedSize,
                },
            });

        } catch {
            setError("The file was deleted, but the activity event could not be saved.");
        }
    }

    useEffect(() => {
        let active = true;
        loadVaultFiles().then(records => {
            if (active) setFiles(records);
        }).catch(err => {
            if (active) setError(err instanceof Error ? err.message : "Failed to load the Vault.");
        }).finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, []);

    return (
        <div className="page">
            <div className="page-title">
                <h2>Vault</h2>
                <p>Encrypted files stored in this browser.</p>
            </div>

            <Card
                title="Encrypted Files"
                description="Import a .secure backup or manage archives stored in this browser."
            >
                <div className="vault-toolbar">
                    <label className="import-control">
                        <span>{isImporting ? "Importing…" : "Import a .secure file"}</span>
                        <input type="file" accept=".secure" disabled={isImporting || isLoading} onChange={event => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) void handleImport(file);
                        }} />
                    </label>
                    <Button variant="secondary" disabled={isImporting || isLoading} onClick={refreshVault}>
                        Refresh
                    </Button>
                </div>

                <VaultFilterBar
                    searchQuery={searchQuery}
                    sortOption={sortOption}
                    totalFiles={files.length}
                    filteredFiles={filteredFiles.length}
                    onSearchChange={setSearchQuery}
                    onSortOptionChange={setSortOption}
                    onClearFilters={clearFilters}
                />

                {error && importFile === null && <div role="alert" className="alert alert-error">{error}</div>}
                {importMessage && <div role="status" className="alert alert-success">{importMessage}</div>}

                {isLoading ? (
                    <div className="empty-state">Loading Vault files...</div>
                ) : files.length === 0 ? (
                    <div className="empty-state">
                        The Vault is empty. Encrypt a file from the Encrypt page to get started.
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="empty-state">
                        No files match the current filters.
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>File</th>
                                    <th>Algorithm</th>
                                    <th>Archive Size</th>
                                    <th>Created At</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredFiles.map((file) => (
                                    <tr key={file.id}>
                                        <td><strong>{file.originalFilename}</strong><small className="filename-secondary">{file.encryptedFilename}</small></td>
                                        <td><span className={file.metadata.version === 2 ? "badge badge-ready" : "badge badge-planned"}>AES-256-GCM / v{file.metadata.version}</span></td>
                                        <td>{formatBytes(file.encryptedSize)}</td>
                                        <td>{formatDate(file.createdAt)}</td>
                                        <td>
                                            <div className="table-actions">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleOpenDecrypt(file)}
                                                >
                                                    Decrypt
                                                </Button>

                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleOpenMetadata(file)}
                                                >
                                                    Metadata
                                                </Button>

                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleDownload(file)}
                                                >
                                                    Download
                                                </Button>

                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleDelete(file)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={importFile !== null} title="Import archive" onClose={() => { if (!isImporting) { setImportFile(null); setImportPassword(""); setError(""); } }}>
                <form className="form" onSubmit={confirmImport} noValidate>
                    <p>Enter the file password to verify the archive and read its metadata before saving it.</p>
                    <label className="form-group"><span>Import file password</span><input type="password" autoComplete="off" value={importPassword} disabled={isImporting} onChange={event => { setImportPassword(event.target.value); if (error) setError(""); }} required /></label>
                    {error && <div role="alert" className="alert alert-error">{error}</div>}
                    <Button type="submit" disabled={isImporting}>{isImporting ? "Verifying…" : "Verify and import"}</Button>
                </form>
            </Modal>

            {selectedDecryptFile && <VaultDecryptModal
                key={selectedDecryptFile.id}
                file={selectedDecryptFile}
                isOpen={selectedDecryptFile !== null}
                onClose={handleCloseDecrypt}
            />}

            {selectedMetadataFile && <VaultMetadataModal
                key={selectedMetadataFile.id}
                file={selectedMetadataFile}
                isOpen={selectedMetadataFile !== null}
                onClose={handleCloseMetadata}
            />}
        </div>
    );
}
