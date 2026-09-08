import { useState } from "react";
import FilePicker from "../components/file/FilePicker";
import { logAuditEvent } from "../audit/auditService";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { decryptSecureFileToBlob } from "../crypto/file/decryptFile";
import { downloadBlob } from "../crypto/file/secureFileFormat";
import type { SecureFileMetadata } from "../crypto/types";

export default function DecryptPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<SecureFileMetadata | null>(null);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setResult(null);

        if (!selectedFile) {
            setError("Choose a .secure file first.");
            return;
        }

        if (!password.trim()) {
            setError("Enter the decryption password.");
            return;
        }

        let downloaded = false;
        try {
            setIsProcessing(true);
            const decrypted = await decryptSecureFileToBlob(selectedFile, password);
            downloadBlob(decrypted.blob, decrypted.outputFilename);
            downloaded = true;
            setPassword("");
            setResult(decrypted.metadata);

            await logAuditEvent({
                action: "DECRYPT_FILE",
                message: `File ${decrypted.outputFilename} was decrypted from a manual upload.`,
                filename: decrypted.outputFilename,
                algorithm: decrypted.metadata.algorithm,
                details: {
                    originalSize: decrypted.metadata.originalSize,
                    kdf: decrypted.metadata.kdf,
                    source: "manual_upload",
                },
            });

            setResult(decrypted.metadata);
            setPassword("");
        } catch (err) {
            setError(downloaded ? "The file was downloaded, but the activity event could not be saved." : err instanceof Error ? err.message : "Decryption failed.");
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="page">
            <div className="page-title">
                <h2>Decrypt File</h2>
                <p>Choose a .secure file and enter its password to restore the original.</p>
            </div>

            <Card
                title="File Decryption"
                description=".secure metadata is read automatically during decryption."
            >
                <form className="form" onSubmit={handleSubmit}>
                    <fieldset disabled={isProcessing} className="form-fields">
                        <FilePicker file={selectedFile} accept=".secure" disabled={isProcessing} onChange={file => { setSelectedFile(file); setResult(null); setError(""); }} />

                        <label className="form-group">
                            <span>Password</span>
                            <input
                                type="password"
                                placeholder="Enter the decryption password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </label>

                        {error && <div role="alert" className="alert alert-error">{error}</div>}

                        {result && (
                            <div role="status" className="alert alert-success">
                                File decrypted successfully: <strong>{result.originalFilename}</strong>
                            </div>
                        )}
                        {result?.version === 1 && <p className="form-hint">v1 file: its metadata is not authenticated. Check the filename and type before opening it, then re-encrypt it to create a v2 archive.</p>}

                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing ? "Decrypting..." : "Decrypt File"}
                        </Button>
                    </fieldset>
                </form>
            </Card>
        </div>
    );
}
