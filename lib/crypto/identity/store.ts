import { IdentityRecord, IdentityStoreConfig } from "./types";

export const IDENTITY_STORE_CONFIG: IdentityStoreConfig = {
  dbName: "between-us-identity",
  version: 1,
  storeName: "keys",
};

const RECORD_ID = "device_identity";

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "indexedDB" in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function openIdentityDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error("IndexedDB unavailable for identity storage."));
    }

    try {
      const request = indexedDB.open(IDENTITY_STORE_CONFIG.dbName, IDENTITY_STORE_CONFIG.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDENTITY_STORE_CONFIG.storeName)) {
          db.createObjectStore(IDENTITY_STORE_CONFIG.storeName, { keyPath: "id" });
        }
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = () => {
        reject(new Error("Failed to open identity database."));
      };
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Failed to initialize identity database."));
    }
  });
}

let memoryIdentityRecord: IdentityRecord | null = null;

/**
 * Saves a device identity record (including non-extractable CryptoKeys) into dedicated IndexedDB.
 */
export async function saveIdentityRecord(record: IdentityRecord): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    memoryIdentityRecord = record;
    return true;
  }

  try {
    const db = await openIdentityDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([IDENTITY_STORE_CONFIG.storeName], "readwrite");
      const store = transaction.objectStore(IDENTITY_STORE_CONFIG.storeName);
      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        memoryIdentityRecord = record;
        resolve(true);
      };
    });
  } catch {
    memoryIdentityRecord = record;
    return true;
  }
}

/**
 * Loads the device identity record from dedicated IndexedDB.
 */
export async function loadIdentityRecord(): Promise<IdentityRecord | null> {
  if (!isIndexedDBAvailable()) {
    return memoryIdentityRecord;
  }

  try {
    const db = await openIdentityDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([IDENTITY_STORE_CONFIG.storeName], "readonly");
      const store = transaction.objectStore(IDENTITY_STORE_CONFIG.storeName);
      const request = store.get(RECORD_ID);

      request.onsuccess = () => {
        const record = request.result as IdentityRecord | undefined;
        resolve(record || memoryIdentityRecord);
      };

      request.onerror = () => resolve(memoryIdentityRecord);
    });
  } catch {
    return memoryIdentityRecord;
  }
}

/**
 * Deletes the device identity record from dedicated IndexedDB.
 */
export async function deleteIdentityRecord(): Promise<boolean> {
  memoryIdentityRecord = null;
  if (!isIndexedDBAvailable()) {
    return true;
  }

  try {
    const db = await openIdentityDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([IDENTITY_STORE_CONFIG.storeName], "readwrite");
      const store = transaction.objectStore(IDENTITY_STORE_CONFIG.storeName);
      const request = store.delete(RECORD_ID);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
