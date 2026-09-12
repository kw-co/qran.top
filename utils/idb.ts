// utils/idb.ts
// Lightweight, promise-based IndexedDB wrapper with zero dependencies

const DB_NAME = 'qran_top_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'quran_store';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !('indexedDB' in window)) {
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    return dbPromise;
}

export async function idbGet<T = any>(key: string): Promise<T | null> {
    try {
        const db = await getDb();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => {
                resolve(req.result !== undefined ? req.result : null);
            };
            req.onerror = () => {
                resolve(null);
            };
        });
    } catch {
        return null;
    }
}

export async function idbSet<T = any>(key: string, value: T): Promise<boolean> {
    try {
        const db = await getDb();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(value, key);
            req.onsuccess = () => {
                resolve(true);
            };
            req.onerror = () => {
                resolve(false);
            };
        });
    } catch {
        return false;
    }
}

export async function idbDelete(key: string): Promise<boolean> {
    try {
        const db = await getDb();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(key);
            req.onsuccess = () => {
                resolve(true);
            };
            req.onerror = () => {
                resolve(false);
            };
        });
    } catch {
        return false;
    }
}
