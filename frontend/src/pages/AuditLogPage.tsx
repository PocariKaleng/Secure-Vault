import { useEffect, useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { clearAuditLogs, loadAuditLogs } from "../audit/auditService";
import type { AuditAction, AuditLogRecord } from "../audit/auditTypes";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { formatDate } from "../utils/formatDate";

type ActionFilter = AuditAction | "ALL";

const actionLabels: Record<AuditAction, string> = {
    IMPORT_SECURE_FILE: "Import Secure File",
    ENCRYPT_FILE: "Encrypt File",
    DECRYPT_FILE: "Decrypt File",
    DECRYPT_FROM_VAULT: "Decrypt from Vault",
    DOWNLOAD_SECURE_FILE: "Download Secure File",
    VIEW_METADATA: "View Metadata",
    COPY_METADATA: "Copy Metadata",
    DELETE_FILE: "Delete File",
    CLEAR_AUDIT_LOGS: "Clear Audit Logs",
};

const actionOptions: ActionFilter[] = [
    "ALL",
    "IMPORT_SECURE_FILE",
    "ENCRYPT_FILE",
    "DECRYPT_FILE",
    "DECRYPT_FROM_VAULT",
    "DOWNLOAD_SECURE_FILE",
    "VIEW_METADATA",
    "COPY_METADATA",
    "DELETE_FILE",
    "CLEAR_AUDIT_LOGS",
];

function getActionLabel(action: ActionFilter): string {
    if (action === "ALL") return "All Actions";
    return actionLabels[action];
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");

    const filteredLogs = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return logs.filter((log) => {
            const matchesSearch =
                normalizedSearch === "" ||
                log.message.toLowerCase().includes(normalizedSearch) ||
                log.filename?.toLowerCase().includes(normalizedSearch) ||
                log.algorithm?.toLowerCase().includes(normalizedSearch);

            const matchesAction =
                actionFilter === "ALL" || log.action === actionFilter;

            return matchesSearch && matchesAction;
        });
    }, [logs, searchQuery, actionFilter]);

    async function refreshLogs() {
        try {
            setIsLoading(true);
            setError("");

            const records = await loadAuditLogs();

            setLogs(records);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load the audit log.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleClearLogs() {
        const confirmed = window.confirm("Delete all local audit events?");

        if (!confirmed) return;

        try {
            await clearAuditLogs();
            setLogs([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to clear the audit log.");
        }
    }

    useEffect(() => {
        let active = true;
        loadAuditLogs().then(records => {
            if (active) setLogs(records);
        }).catch(err => {
            if (active) setError(err instanceof Error ? err.message : "Failed to load activity history.");
        }).finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, []);

    return (
        <div className="page">
            <div className="page-title page-title-row">
                <div>
                    <h2>Audit Log</h2>
                    <p>SecureVault activity recorded locally in this browser.</p>
                </div>

                <Button variant="secondary" onClick={refreshLogs}>
                    Refresh
                </Button>
            </div>

            <Card
                title="Local Security Events"
                description="This demo history is stored locally. It can be changed, deleted, or restored with other browser data."
            >
                <div className="audit-header">
                    <div className="audit-icon">
                        <ShieldAlert size={28} />
                    </div>

                    <div>
                        <h3>{logs.length} Events Recorded</h3>
                        <p>
                            Showing {filteredLogs.length} of {logs.length} audit events.
                        </p>
                    </div>
                </div>

                <div className="vault-controls">
                    <div className="filter-grid">
                        <label className="filter-group">
                            <span>Search Log</span>
                            <input
                                type="text"
                                placeholder="Search messages, filenames, or algorithms..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                            />
                        </label>

                        <label className="filter-group">
                            <span>Action</span>
                            <select
                                value={actionFilter}
                                onChange={(event) =>
                                    setActionFilter(event.target.value as ActionFilter)
                                }
                            >
                                {actionOptions.map((action) => (
                                    <option key={action} value={action}>
                                        {getActionLabel(action)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="vault-summary">
                        <span>
                            Showing <strong>{filteredLogs.length}</strong> of{" "}
                            <strong>{logs.length}</strong> events
                        </span>

                        <Button type="button" variant="danger" onClick={handleClearLogs}>
                            Clear Logs
                        </Button>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {isLoading ? (
                    <div className="empty-state">Loading audit events...</div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">
                        No audit events yet. Encrypt or decrypt a file, or open file metadata.
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        No audit events match the current filters.
                    </div>
                ) : (
                    <div className="audit-list">
                        {filteredLogs.map((log) => (
                            <div className="audit-item" key={log.id}>
                                <div className="audit-item-main">
                                    <div>
                                        <span className="badge badge-ready">
                                            {actionLabels[log.action]}
                                        </span>
                                    </div>

                                    <h3>{log.message}</h3>

                                    <p>
                                        {formatDate(log.timestamp)}
                                        {log.filename ? ` · ${log.filename}` : ""}
                                        {log.algorithm ? ` · ${log.algorithm}` : ""}
                                    </p>
                                </div>

                                {log.details && (
                                    <pre className="audit-details">
                                        {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
