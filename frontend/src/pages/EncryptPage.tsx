import { useState } from "react";
import FilePicker from "../components/file/FilePicker";
import { logAuditEvent } from "../audit/auditService";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { encryptFileToSecureBlob } from "../crypto/file/encryptFile";
import { downloadBlob } from "../crypto/file/secureFileFormat";
import type { SecureFileMetadata } from "../crypto/types";
import { saveEncryptedFileToVault } from "../vault/vaultService";
import { PASSWORD_HINT } from "../crypto/policy";

export default function EncryptPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<SecureFileMetadata | null>(null);
    const [error, setError] = useState("");
    const [shouldDownload, setShouldDownload] = useState(true);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setResult(null);

        if (!selectedFile) {
            setError("Choose a file first.");
            return;
        }

        if (!password.trim()) {
            setError("Enter an encryption password.");
            return;
        }

        if (password !== confirmation) {
            setError("The passwords do not match. Check them before encrypting.");
            return;
        }

        let saved = false;
        try {
            setIsProcessing(true);
            const encrypted = await encryptFileToSecureBlob(selectedFile, password);

            await saveEncryptedFileToVault(
                encrypted.blob,
                encrypted.metadata,
                encrypted.outputFilename
            );
            saved = true;
            setResult(encrypted.metadata);
            setPassword("");
            setConfirmation("");
            if (shouldDownload) downloadBlob(encrypted.blob, encrypted.outputFilename);

            await logAuditEvent({
                action: "ENCRYPT_FILE",
                message: `File ${encrypted.metadata.originalFilename} was encrypted successfully.`,
                filename: encrypted.outputFilename,
                algorithm: encrypted.metadata.algorithm,
                details: {
                    originalSize: encrypted.metadata.originalSize,
                    encryptedSize: encrypted.blob.size,
                    kdf: encrypted.metadata.kdf,
                    iterations: encrypted.metadata.iterations,
                },
            });

            if (shouldDownload) {
                await logAuditEvent({
                    action: "DOWNLOAD_SECURE_FILE",
                    message: `File ${encrypted.outputFilename} was downloaded automatically after encryption.`,
                    filename: encrypted.outputFilename,
                    algorithm: encrypted.metadata.algorithm,
                    details: {
                        originalFilename: encrypted.metadata.originalFilename,
                        encryptedSize: encrypted.blob.size,
                    },
                });
            }

            setResult(encrypted.metadata);
            setPassword("");
            setConfirmation("");
        } catch (err) {
            setError(saved ? "The archive was saved, but the next step failed. Check the Vault before trying again." : err instanceof Error ? err.message : "Encryption failed.");
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="page">
            <div className="page-title">
                <h2>Encrypt File</h2>
                <p>
                    Choose a file, enter a password, and encrypt it as a .secure archive.
                </p>
            </div>

            <Card
                title="File Encryption"
                description="Encrypted archives are saved automatically in your browser's local Vault."
            >
                <form className="form" onSubmit={handleSubmit} noValidate>
                    <fieldset disabled={isProcessing} className="form-fields">
                        <FilePicker file={selectedFile} disabled={isProcessing} onChange={file => { setSelectedFile(file); setResult(null); setError(""); }} />

                        <div className="algorithm-selection" aria-label="Encryption algorithm">
                            <div>
                                <span>Encryption algorithm</span>
                                <strong>AES-256-GCM</strong>
                            </div>
                            <p>Authenticated encryption with a 256-bit key.</p>
                        </div>

                        <label className="form-group">
                            <span>Password</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="Enter an encryption password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </label>

                        <label className="form-group">
                            <span>Confirm password</span>
                            <input type={showPassword ? "text" : "password"} autoComplete="new-password"
                                placeholder="Enter the same password again" value={confirmation}
                                onChange={(event) => setConfirmation(event.target.value)} required />
                        </label>
                        <label className="checkbox-row">
                            <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
                            <span>Show passwords</span>
                        </label>
                        <p className="form-hint">{PASSWORD_HINT} File passwords are never stored and cannot be recovered. Save yours in a password manager before continuing.</p>

                        <label className="checkbox-row">
                            <input
                                type="checkbox"
                                checked={shouldDownload}
                                onChange={(event) => setShouldDownload(event.target.checked)}
                            />
                            <span>Download the .secure file after encryption</span>
                        </label>

                        {error && <div role="alert" className="alert alert-error">{error}</div>}

                        {result && (
                            <div role="status" className="alert alert-success">
                                File encrypted successfully and saved to the Vault:{" "}
                                <strong>{result.originalFilename}</strong> (v2 format; the downloaded archive name is randomized).
                            </div>
                        )}

                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing ? "Encrypting..." : "Encrypt File"}
                        </Button>
                    </fieldset>
                </form>
            </Card>
        </div>
    );
}
