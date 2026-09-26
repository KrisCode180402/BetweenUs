import { PartnerVerificationRecord } from "./types";

const VERIFICATION_STORE_NAME = "partner_verification";
const RECORD_ID = "partner_verification";

let memoryVerificationRecord: PartnerVerificationRecord | null = null;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "indexedDB" in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function openVerificationDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error("IndexedDB unavailable for safety verification storage."));
    }

    try {
      const request = indexedDB.open("between-us-identity", 3); // Upgrade to version 3 for partner_verification store

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("partner_trust")) {
          db.createObjectStore("partner_trust", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(VERIFICATION_STORE_NAME)) {
          db.createObjectStore(VERIFICATION_STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = () => {
        reject(new Error("Failed to open safety verification database."));
      };
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Failed to initialize verification database."));
    }
  });
}

/**
 * Saves partner verification record into IndexedDB.
 */
export async function saveVerificationRecord(record: PartnerVerificationRecord): Promise<boolean> {
  memoryVerificationRecord = record;
  if (!isIndexedDBAvailable()) {
    return true;
  }

  try {
    const db = await openVerificationDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([VERIFICATION_STORE_NAME], "readwrite");
      const store = transaction.objectStore(VERIFICATION_STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(true);
    });
  } catch {
    return true;
  }
}

/**
 * Loads partner verification record from IndexedDB.
 */
export async function loadVerificationRecord(): Promise<PartnerVerificationRecord | null> {
  if (!isIndexedDBAvailable()) {
    return memoryVerificationRecord;
  }

  try {
    const db = await openVerificationDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([VERIFICATION_STORE_NAME], "readonly");
      const store = transaction.objectStore(VERIFICATION_STORE_NAME);
      const request = store.get(RECORD_ID);

      request.onsuccess = () => {
        const record = request.result as PartnerVerificationRecord | undefined;
        resolve(record || memoryVerificationRecord);
      };

      request.onerror = () => resolve(memoryVerificationRecord);
    });
  } catch {
    return memoryVerificationRecord;
  }
}

/**
 * Purges partner verification record from IndexedDB and memory.
 */
export async function removeVerificationRecord(): Promise<boolean> {
  memoryVerificationRecord = null;
  if (!isIndexedDBAvailable()) {
    return true;
  }

  try {
    const db = await openVerificationDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([VERIFICATION_STORE_NAME], "readwrite");
      const store = transaction.objectStore(VERIFICATION_STORE_NAME);
      const request = store.delete(RECORD_ID);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(true);
    });
  } catch {
    return true;
  }
}
