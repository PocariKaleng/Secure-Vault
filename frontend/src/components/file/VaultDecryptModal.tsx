import { useState } from "react";
import { logAuditEvent } from "../../audit/auditService";
import { decryptSecureFileToBlob } from "../../crypto/file/decryptFile";
import { downloadBlob } from "../../crypto/file/secureFileFormat";
import type { VaultRecord } from "../../crypto/types";
import { formatBytes } from "../../utils/formatBytes";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

type VaultDecryptModalProps = {
    file: VaultRecord | null;
    isOpen: boolean;
    onClose: () => void;
};

export default function VaultDecryptModal({
    file,
    isOpen,
    onClose,
}: VaultDecryptModalProps) {
    const [password, setPassword] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    async function handleDecrypt(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccessMessage("");

        if (!file) {
            setError("The Vault file could not be found.");
            return;
        }

        if (!password.trim()) {
            setError("Enter the decryption password.");
            return;
        }

        let downloaded = false;
        try {
            setIsProcessing(true);
            const secureFile = new File([file.blob], file.encryptedFilename, {
                type: "application/octet-stream",
            });

            const decrypted = await decryptSecureFileToBlob(secureFile, password);
            downloadBlob(decrypted.blob, decrypted.outputFilename);
            downloaded = true;
            setPassword("");

            await logAuditEvent({
                action: "DECRYPT_FROM_VAULT",
                message: `File ${decrypted.outputFilename} was decrypted directly from the Vault.`,
                filename: decrypted.outputFilename,
                algorithm: decrypted.metadata.algorithm,
                details: {
                    vaultFileId: file.id,
                    encryptedFilename: file.encryptedFilename,
                    originalFilename: file.originalFilename,
                    originalSize: decrypted.metadata.originalSize,
                    encryptedSize: file.encryptedSize,
                },
            });

            setSuccessMessage(`File decrypted successfully: ${decrypted.outputFilename}`);
            setPassword("");
        } catch (err) {
            setError(
                downloaded ? "The file was downloaded, but the activity event could not be saved." : err instanceof Error
                    ? err.message
                    : "Decryption failed. The password is incorrect or the file is damaged."
            );
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <Modal isOpen={isOpen} title="Decrypt from Vault" onClose={() => { if (!isProcessing) onClose(); }}>
            {!file ? (
                <div className="alert alert-error">File not found.</div>
            ) : (
                <form className="form" onSubmit={handleDecrypt}>
                    {file.metadata.version === 1 && <p className="form-hint">v1 archive: its metadata is not authenticated. Check the filename and type before opening it, then re-encrypt the result to create v2.</p>}
                    <div className="metadata-grid">
                        <div>
                            <span>Encrypted File</span>
                            <strong>{file.encryptedFilename}</strong>
                        </div>

                        <div>
                            <span>Original File</span>
                            <strong>{file.originalFilename}</strong>
                        </div>

                        <div>
                            <span>Algorithm</span>
                            <strong>{file.algorithm}</strong>
                        </div>

                        <div>
                            <span>Encrypted Size</span>
                            <strong>{formatBytes(file.encryptedSize)}</strong>
                        </div>
                    </div>

                    <label className="form-group">
                        <span>Password</span>
                        <input
                            type="password"
                            placeholder="Enter this file's password"
                            value={password}
                            disabled={isProcessing}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </label>

                    {error && <div className="alert alert-error">{error}</div>}

                    {successMessage && (
                        <div className="alert alert-success">{successMessage}</div>
                    )}

                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isProcessing}>
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing ? "Decrypting..." : "Decrypt File"}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
