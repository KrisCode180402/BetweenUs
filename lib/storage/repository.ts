import { StorageClassification, StorageRecord } from "./types";
import { STORAGE_CONFIG } from "./schema";
import { openDatabase, isIndexedDBSupported, memoryFallback } from "./db";
import { validateStoragePayload } from "./validation";

/**
 * Between Us — Local Storage Repository
 * Phase 08: Secure Minimal Local State
 */

/**
 * Retrieves a low-sensitivity persistent application state item from IndexedDB.
 */
export async function getItem<T = unknown>(key: string): Promise<T | null> {
  if (!key || typeof key !== "string") {
    return null;
  }

  if (!isIndexedDBSupported()) {
    const raw = memoryFallback.getItem(key);
    if (!raw) return null;
    try {
      const record = JSON.parse(raw) as StorageRecord<T>;
      return record.value;
    } catch {
      return null;
    }
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORAGE_CONFIG.storeName], "readonly");
      const store = transaction.objectStore(STORAGE_CONFIG.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result as StorageRecord<T> | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        resolve(record.value);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    // Fallback to memory on IndexedDB open error
    const raw = memoryFallback.getItem(key);
    if (!raw) return null;
    try {
      const record = JSON.parse(raw) as StorageRecord<T>;
      return record.value;
    } catch {
      return null;
    }
  }
}

/**
 * Stores a low-sensitivity persistent application state item in IndexedDB after strict validation.
 */
export async function setItem<T = unknown>(
  key: string,
  value: T,
  classification: StorageClassification = StorageClassification.PERSISTENT_LOW_SENSITIVITY
): Promise<boolean> {
  // Validate key, classification, size limits, and forbidden payload types
  validateStoragePayload(key, value, classification);

  const record: StorageRecord<T> = {
    key,
    value,
    updatedAt: Date.now(),
    classification,
  };

  if (!isIndexedDBSupported()) {
    memoryFallback.setItem(key, JSON.stringify(record));
    return true;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORAGE_CONFIG.storeName], "readwrite");
      const store = transaction.objectStore(STORAGE_CONFIG.storeName);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        // Fallback to in-memory store if IndexedDB write fails (e.g. quota or permissions)
        memoryFallback.setItem(key, JSON.stringify(record));
        resolve(true);
      };
    });
  } catch {
    memoryFallback.setItem(key, JSON.stringify(record));
    return true;
  }
}

/**
 * Removes a specific application state item from IndexedDB.
 */
export async function removeItem(key: string): Promise<boolean> {
  if (!key || typeof key !== "string") {
    return false;
  }

  if (!isIndexedDBSupported()) {
    memoryFallback.removeItem(key);
    return true;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORAGE_CONFIG.storeName], "readwrite");
      const store = transaction.objectStore(STORAGE_CONFIG.storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        memoryFallback.removeItem(key);
        resolve(true);
      };

      request.onerror = () => {
        memoryFallback.removeItem(key);
        resolve(false);
      };
    });
  } catch {
    memoryFallback.removeItem(key);
    return false;
  }
}

/**
 * Clears ONLY Between Us application-local persistent state.
 * Does NOT touch unrelated browser storage or other origin data.
 */
export async function clearApplicationState(): Promise<boolean> {
  memoryFallback.clear();

  if (!isIndexedDBSupported()) {
    return true;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORAGE_CONFIG.storeName], "readwrite");
      const store = transaction.objectStore(STORAGE_CONFIG.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}
