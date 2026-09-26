import { PairedPartnerRecord } from "./types";

const PARTNER_STORE_NAME = "partner_trust";
const RECORD_ID = "partner_trust";
let memoryPartnerRecord: PairedPartnerRecord | null = null;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "indexedDB" in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function openPartnerDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error("IndexedDB unavailable for partner storage."));
    }

    try {
      const request = indexedDB.open("between-us-identity", 2); // Upgrade version to add partner_trust store

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(PARTNER_STORE_NAME)) {
          db.createObjectStore(PARTNER_STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = () => {
        reject(new Error("Failed to open partner database."));
      };
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Failed to initialize partner database."));
    }
  });
}

/**
 * Saves paired partner public identity trust record into IndexedDB.
 */
export async function savePairedPartner(record: PairedPartnerRecord): Promise<boolean> {
  memoryPartnerRecord = record;
  if (!isIndexedDBAvailable()) {
    return true;
  }

  try {
    const db = await openPartnerDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([PARTNER_STORE_NAME], "readwrite");
      const store = transaction.objectStore(PARTNER_STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(true);
    });
  } catch {
    return true;
  }
}

/**
 * Loads paired partner public identity trust record from IndexedDB.
 */
export async function loadPairedPartner(): Promise<PairedPartnerRecord | null> {
  if (!isIndexedDBAvailable()) {
    return memoryPartnerRecord;
  }

  try {
    const db = await openPartnerDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([PARTNER_STORE_NAME], "readonly");
      const store = transaction.objectStore(PARTNER_STORE_NAME);
      const request = store.get(RECORD_ID);

      request.onsuccess = () => {
        const record = request.result as PairedPartnerRecord | undefined;
        resolve(record || memoryPartnerRecord);
      };

      request.onerror = () => resolve(memoryPartnerRecord);
    });
  } catch {
    return memoryPartnerRecord;
  }
}

/**
 * Removes paired partner trust record from storage.
 * Does NOT touch device identity key pair.
 */
export async function removePairedDevice(): Promise<boolean> {
  memoryPartnerRecord = null;
  if (!isIndexedDBAvailable()) {
    return true;
  }

  try {
    const db = await openPartnerDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([PARTNER_STORE_NAME], "readwrite");
      const store = transaction.objectStore(PARTNER_STORE_NAME);
      const request = store.delete(RECORD_ID);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(true);
    });
  } catch {
    return true;
  }
}
