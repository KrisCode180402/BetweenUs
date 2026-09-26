import { STORAGE_CONFIG } from "./schema";

// In-memory fallback map when IndexedDB is unavailable or restricted
const inMemoryFallbackStore = new Map<string, string>();

/**
 * Returns whether IndexedDB API is supported in the current runtime environment.
 */
export function isIndexedDBSupported(): boolean {
  try {
    return typeof window !== "undefined" && "indexedDB" in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Opens or initializes the native IndexedDB database instance.
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      return reject(new Error("IndexedDB is not supported in this browser environment."));
    }

    try {
      const request = indexedDB.open(STORAGE_CONFIG.dbName, STORAGE_CONFIG.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.storeName)) {
          db.createObjectStore(STORAGE_CONFIG.storeName, { keyPath: "key" });
        }
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event: Event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        reject(new Error(`IndexedDB open request failed: ${error?.message || "Unknown error"}`));
      };
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Failed to initialize IndexedDB connection."));
    }
  });
}

/**
 * Internal access to in-memory fallback storage when IndexedDB is disabled or unavailable.
 */
export const memoryFallback = {
  getItem(key: string): string | null {
    return inMemoryFallbackStore.get(key) || null;
  },
  setItem(key: string, value: string): void {
    inMemoryFallbackStore.set(key, value);
  },
  removeItem(key: string): void {
    inMemoryFallbackStore.delete(key);
  },
  clear(): void {
    inMemoryFallbackStore.clear();
  },
};
