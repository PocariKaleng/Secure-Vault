import type { VaultRecord } from "../crypto/types";

const DB_NAME = "SecureVaultDB";
const DB_VERSION = 1;
const STORE_NAME = "vault_files";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(request.error ?? new Error("The IndexedDB request failed."));
    });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
            reject(transaction.error ?? new Error("The IndexedDB transaction failed."));
        transaction.onabort = () =>
            reject(transaction.error ?? new Error("The IndexedDB transaction was aborted."));
    });
}

export function openVaultDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () =>
            reject(request.error ?? new Error("Failed to open IndexedDB."));

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                });

                store.createIndex("createdAt", "createdAt", { unique: false });
                store.createIndex("originalFilename", "originalFilename", {
                    unique: false,
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
    });
}

export async function putVaultRecord(record: VaultRecord): Promise<void> {
    const db = await openVaultDb();

    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        store.put(record);

        await transactionDone(transaction);
    } finally {
        db.close();
    }
}

export async function getAllVaultRecords(): Promise<VaultRecord[]> {
    const db = await openVaultDb();

    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const records = await requestToPromise<VaultRecord[]>(store.getAll());

        return records.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } finally {
        db.close();
    }
}

export async function getVaultRecord(id: string): Promise<VaultRecord | null> {
    const db = await openVaultDb();

    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const record = await requestToPromise<VaultRecord | undefined>(
            store.get(id)
        );

        return record ?? null;
    } finally {
        db.close();
    }
}

export async function deleteVaultRecordById(id: string): Promise<void> {
    const db = await openVaultDb();

    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        store.delete(id);

        await transactionDone(transaction);
    } finally {
        db.close();
    }
}

export async function clearVaultRecords(): Promise<void> {
    const db = await openVaultDb();

    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        store.clear();

        await transactionDone(transaction);
    } finally {
        db.close();
    }
}
