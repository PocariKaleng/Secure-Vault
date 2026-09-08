import { useEffect, useMemo, useState } from "react";
import { logAuditEvent } from "../../audit/auditService";
import type { VaultRecord } from "../../crypto/types";
import { formatBytes } from "../../utils/formatBytes";
import { formatDate } from "../../utils/formatDate";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

type VaultMetadataModalProps = {
    file: VaultRecord | null;
    isOpen: boolean;
    onClose: () => void;
};

export default function VaultMetadataModal({
    file,
    isOpen,
    onClose,
}: VaultMetadataModalProps) {
    const [copyMessage, setCopyMessage] = useState("");

    const metadataJson = useMemo(() => {
        if (!file) return "";
        return JSON.stringify(file.metadata, null, 2);
    }, [file]);

    useEffect(() => {
        if (isOpen && file) {
            logAuditEvent({
                action: "VIEW_METADATA",
                message: `Metadata for ${file.encryptedFilename} was opened.`,
                filename: file.encryptedFilename,
                algorithm: file.algorithm,
                details: {
                    vaultFileId: file.id,
                    originalFilename: file.originalFilename,
                },
            }).catch(() => {
                // Audit logging must not interrupt the metadata interface.
            });
        }
    }, [isOpen, file]);

    async function handleCopyMetadata() {
        if (!metadataJson || !file) return;

        try {
            await navigator.clipboard.writeText(metadataJson);

            await logAuditEvent({
                action: "COPY_METADATA",
                message: `Metadata for ${file.encryptedFilename} was copied to the clipboard.`,
                filename: file.encryptedFilename,
                algorithm: file.algorithm,
                details: {
                    vaultFileId: file.id,
                    originalFilename: file.originalFilename,
                },
            });

            setCopyMessage("Metadata copied successfully.");
        } catch {
            setCopyMessage("Failed to copy metadata.");
        }
    }

    return (
        <Modal isOpen={isOpen} title="Secure File Metadata" onClose={onClose}>
            {!file ? (
                <div className="alert alert-error">File not found.</div>
            ) : (
                <div className="metadata-modal-content">
                    <div className="metadata-grid">
                        <div>
                            <span>Encrypted Filename</span>
                            <strong>{file.encryptedFilename}</strong>
                        </div>

                        <div>
                            <span>Original Filename</span>
                            <strong>{file.originalFilename}</strong>
                        </div>

                        <div>
                            <span>Algorithm</span>
                            <strong>{file.metadata.algorithm}</strong>
                        </div>

                        <div>
                            <span>KDF</span>
                            <strong>{file.metadata.kdf}</strong>
                        </div>

                        <div>
                            <span>PBKDF2 Iterations</span>
                            <strong>{file.metadata.iterations.toLocaleString("en-US")}</strong>
                        </div>

                        <div>
                            <span>Version</span>
                            <strong>{file.metadata.version}</strong>
                        </div>

                        <div>
                            <span>Original Size</span>
                            <strong>{formatBytes(file.metadata.originalSize)}</strong>
                        </div>

                        <div>
                            <span>Encrypted Size</span>
                            <strong>{formatBytes(file.encryptedSize)}</strong>
                        </div>

                        <div>
                            <span>MIME Type</span>
                            <strong>{file.metadata.originalMimeType}</strong>
                        </div>

                        <div>
                            <span>Created At</span>
                            <strong>{formatDate(file.metadata.createdAt)}</strong>
                        </div>
                    </div>

                    <div className="metadata-section">
                        <h3>Salt</h3>
                        <code>{file.metadata.salt}</code>
                    </div>

                    <div className="metadata-section">
                        <h3>Nonce / IV</h3>
                        <code>{file.metadata.nonce}</code>
                    </div>

                    <div className="metadata-section">
                        <div className="metadata-section-header">
                            <h3>Raw Metadata JSON</h3>

                            <Button type="button" variant="secondary" onClick={handleCopyMetadata}>
                                Copy JSON
                            </Button>
                        </div>

                        <pre className="code-block">{metadataJson}</pre>

                        {copyMessage && <div className="alert alert-success">{copyMessage}</div>}
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
