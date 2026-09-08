import type { AuditLogRecord } from "./auditTypes";

const DB_NAME = "SecureVaultAuditDB";
const DB_VERSION = 1;
const STORE_NAME = "audit_logs";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(request.error ?? new Error("The IndexedDB audit request failed."));
    });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
            reject(transaction.error ?? new Error("The IndexedDB audit transaction failed."));
        transaction.onabort = () =>
            reject(
                transaction.error ?? new Error("The IndexedDB audit transaction was aborted.")
            );
    });
}

export function openAuditDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () =>
            reject(request.error ?? new Error("Failed to open the audit IndexedDB database."));

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                });

                store.createIndex("timestamp", "timestamp", { unique: false });
                store.createIndex("action", "action", { unique: false });
                store.createIndex("filename", "filename", { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
    });
}

export async function putAuditLog(record: AuditLogRecord): Promise<void> {
    const db = await openAuditDb();

    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        store.put(record);

        await transactionDone(transaction);
    } finally {
        db.close();
    }
}

export async function getAllAuditLogs(): Promise<AuditLogRecord[]> {
    const db = await openAuditDb();

    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const records = await requestToPromise<AuditLogRecord[]>(store.getAll());

        return records.sort(
            (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    } finally {
        db.close();
    }
}

export async function clearAuditLogRecords(): Promise<void> {
    const db = await openAuditDb();

    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        store.clear();

        await transactionDone(transaction);
    } finally {
        db.close();
    }
}
