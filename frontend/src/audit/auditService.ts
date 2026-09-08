import type { AuditAction, AuditLogRecord } from "./auditTypes";
import { clearAuditLogRecords, getAllAuditLogs, putAuditLog } from "./auditDb";

function createId(): string {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type LogAuditEventInput = {
    action: AuditAction;
    message: string;
    filename?: string;
    algorithm?: string;
    details?: Record<string, string | number | boolean | null>;
};

export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
    const record: AuditLogRecord = {
        id: createId(),
        action: input.action,
        message: input.message,
        filename: input.filename,
        algorithm: input.algorithm,
        details: input.details,
        timestamp: new Date().toISOString(),
    };

    await putAuditLog(record);
}

export async function loadAuditLogs(): Promise<AuditLogRecord[]> {
    return getAllAuditLogs();
}

export async function clearAuditLogs(): Promise<void> {
    await clearAuditLogRecords();
}
