import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileSignature, FolderLock, HardDrive, LockKeyhole, UnlockKeyhole } from "lucide-react";
import Card from "../components/ui/Card";
import type { VaultRecord } from "../crypto/types";
import { formatBytes } from "../utils/formatBytes";
import { formatDate } from "../utils/formatDate";
import { loadVaultFiles } from "../vault/vaultService";
import { buildVaultDashboardStats } from "../vault/vaultStats";

export default function DashboardPage() {
    const [files, setFiles] = useState<VaultRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const stats = useMemo(() => buildVaultDashboardStats(files), [files]);

    useEffect(() => {
        let active = true;
        loadVaultFiles().then(records => {
            if (active) setFiles(records);
        }).catch(err => {
            if (active) setError(err instanceof Error ? err.message : "Failed to load the archives.");
        }).finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, []);

    return (
        <div className="page">
            <div className="page-title page-title-row">
                <div>
                    <p className="eyebrow">01 / OVERVIEW</p>
                    <h2>A private space for your files.</h2>
                    <p>Encrypt important files, keep them close, and restore them when needed.</p>
                </div>
                <Link className="btn btn-primary" to="/encrypt">Encrypt a file <ArrowUpRight size={16} /></Link>
            </div>

            {error && <div role="alert" className="alert alert-error">{error} <button className="btn btn-secondary" onClick={() => window.location.reload()}>Try again</button></div>}

            <div className="stats-grid" aria-busy={isLoading}>
                <Card><div className="stat-card"><FolderLock /><div><p>Files in Vault</p><h3>{isLoading ? "..." : stats.totalFiles.toString().padStart(2, "0")}</h3></div></div></Card>
                <Card><div className="stat-card"><HardDrive /><div><p>Archive size</p><h3>{isLoading ? "..." : formatBytes(stats.totalEncryptedSize)}</h3></div></div></Card>
                <Card><div className="stat-card"><LockKeyhole /><div><p>Active encryption</p><h3>AES-256 <span className="stat-unit">GCM</span></h3></div></div></Card>
                <Card><div className="stat-card"><span className="local-marker">ON DEVICE</span><div><p>Storage location</p><h3>This browser</h3></div></div></Card>
            </div>

            <div className="dashboard-grid">
                <Card title="Start here" description="Encrypt a file or demonstrate message authenticity.">
                    <div className="quick-actions">
                        <Link className="quick-action-card" to="/encrypt"><LockKeyhole size={22} /><div><h3>Encrypt a file</h3><p>Turn a document, photo, or archive into a .secure file.</p></div></Link>
                        <Link className="quick-action-card" to="/decrypt"><UnlockKeyhole size={22} /><div><h3>Open an encrypted file</h3><p>Use its password to restore the original file.</p></div></Link>
                        <Link className="quick-action-card" to="/signatures"><FileSignature size={22} /><div><h3>Sign a message</h3><p>Create and verify an ECDSA P-256 signature in your browser.</p></div></Link>
                    </div>
                </Card>

                <section className="archive-note">
                    <span className="eyebrow">STORAGE NOTE</span>
                    <h2>One small copy.<br />More peace of mind.</h2>
                    <p>The Vault lives in this browser. Download .secure backups before clearing browser data or moving to another device.</p>
                    <Link to="/vault">Manage archives <ArrowUpRight size={16} /></Link>
                    <span className="archive-note-index" aria-hidden="true">SV / 001</span>
                </section>
            </div>

            <Card title="Recent archives" description="The five files you encrypted or imported most recently.">
                {isLoading ? <div className="empty-state" role="status">Loading archives...</div> : stats.recentFiles.length === 0 ? (
                    <div className="empty-state"><FolderLock size={32} /><h3>Your first archive starts here.</h3><p>Choose one file to try the complete encryption flow.</p><Link className="btn btn-secondary" to="/encrypt">Encrypt your first file</Link></div>
                ) : (
                    <div className="table-wrapper"><table><thead><tr><th>Filename</th><th>Format</th><th>Size</th><th>Created</th></tr></thead>
                        <tbody>{stats.recentFiles.map(file => <tr key={file.id}>
                            <td><span className="file-cell"><FolderLock size={17} />{file.originalFilename}</span></td>
                            <td><span className={file.metadata.version === 2 ? "badge badge-ready" : "badge badge-planned"}>.secure / v{file.metadata.version}</span></td>
                            <td>{formatBytes(file.encryptedSize)}</td><td>{formatDate(file.createdAt)}</td>
                        </tr>)}</tbody></table></div>
                )}
                <Link className="text-link" to="/vault">View all archives <ArrowUpRight size={14} /></Link>
            </Card>

            <details className="how-it-works">
                <summary>Inside a .secure file <span>See how it works</span></summary>
                <div className="crypto-steps">
                    <div><span>01 / DERIVE</span><h3>A password becomes a key</h3><p>PBKDF2-SHA256 uses 600,000 iterations and a random salt to derive an AES key from each new file password.</p></div>
                    <div><span>02 / ENCRYPT</span><h3>Content and metadata are sealed</h3><p>Format v2 encrypts the content, name, and file type. AES-256-GCM also authenticates the public header.</p></div>
                    <div><span>03 / STORE</span><h3>The archive stays on the device</h3><p>The .secure file is stored in browser IndexedDB. A local filename index and activity history support the dashboard.</p></div>
                </div>
                <p className="form-hint">Legacy v1 files can still be opened, but should be re-encrypted for v2 protection. Local activity history cannot prevent deletion or restoration of all browser data from an older copy.</p>
            </details>
        </div>
    );
}
