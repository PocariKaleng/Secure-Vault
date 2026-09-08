export type AuditAction =
    | "IMPORT_SECURE_FILE"
    | "ENCRYPT_FILE"
    | "DECRYPT_FILE"
    | "DECRYPT_FROM_VAULT"
    | "DOWNLOAD_SECURE_FILE"
    | "VIEW_METADATA"
    | "COPY_METADATA"
    | "DELETE_FILE"
    | "CLEAR_AUDIT_LOGS";

export type AuditLogRecord = {
    id: string;
    action: AuditAction;
    message: string;
    filename?: string;
    algorithm?: string;
    timestamp: string;
    details?: Record<string, string | number | boolean | null>;
};
