import { IdentityRecord, IdentityStoreConfig } from "./types";
import { getUnifiedDatabase, STORES, withStorageTimeout, isIndexedDBSupported } from "@/lib/storage/db";

export const IDENTITY_STORE_CONFIG: IdentityStoreConfig = {
  dbName: "between-us-app-db",
  version: 3,
  storeName: STORES.KEYS,
};

const RECORD_ID = "device_identity";
let memoryIdentityRecord: IdentityRecord | null = null;

export async function saveIdentityRecord(record: IdentityRecord): Promise<boolean> {
  memoryIdentityRecord = record;
  if (!isIndexedDBSupported()) {
    return true;
  }

  const saveOperation = async (): Promise<boolean> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.KEYS], "readwrite");
        const store = transaction.objectStore(STORES.KEYS);
        const request = store.put(record);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(true);
      });
    } catch {
      return true;
    }
  };

  return withStorageTimeout(saveOperation(), true, 1200);
}

export async function loadIdentityRecord(): Promise<IdentityRecord | null> {
  if (!isIndexedDBSupported()) {
    return memoryIdentityRecord;
  }

  const loadOperation = async (): Promise<IdentityRecord | null> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.KEYS], "readonly");
        const store = transaction.objectStore(STORES.KEYS);
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
  };

  return withStorageTimeout(loadOperation(), memoryIdentityRecord, 1200);
}

export async function deleteIdentityRecord(): Promise<boolean> {
  memoryIdentityRecord = null;
  if (!isIndexedDBSupported()) {
    return true;
  }

  const deleteOperation = async (): Promise<boolean> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.KEYS], "readwrite");
        const store = transaction.objectStore(STORES.KEYS);
        const request = store.delete(RECORD_ID);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  };

  return withStorageTimeout(deleteOperation(), true, 1200);
}
