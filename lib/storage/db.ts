/**
 * Between Us — Unified IndexedDB Storage Manager
 * Solves IndexedDB version mismatch deadlocks across Brave, Safari, Chrome, and Firefox.
 */

const DB_NAME = "between-us-app-db";
const DB_VERSION = 3;

export const STORES = {
  KEYS: "keys",
  PARTNER_TRUST: "partner_trust",
  PARTNER_VERIFICATION: "partner_verification",
  APP_STATE: "app_state",
} as const;

let dbInstance: IDBDatabase | null = null;
let dbOpeningPromise: Promise<IDBDatabase> | null = null;

const inMemoryFallbackStore = new Map<string, string>();

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

export function isIndexedDBSupported(): boolean {
  try {
    return typeof window !== "undefined" && "indexedDB" in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

export function getUnifiedDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbOpeningPromise) {
    return dbOpeningPromise;
  }

  dbOpeningPromise = new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      return reject(new Error("IndexedDB is not supported in this runtime."));
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.KEYS)) {
          db.createObjectStore(STORES.KEYS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.PARTNER_TRUST)) {
          db.createObjectStore(STORES.PARTNER_TRUST, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.PARTNER_VERIFICATION)) {
          db.createObjectStore(STORES.PARTNER_VERIFICATION, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
          db.createObjectStore(STORES.APP_STATE, { keyPath: "key" });
        }
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        dbInstance = db;
        db.onversionchange = () => {
          db.close();
          dbInstance = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbOpeningPromise = null;
        reject(new Error("Failed to open unified database."));
      };

      request.onblocked = () => {
        dbOpeningPromise = null;
        reject(new Error("IndexedDB upgrade blocked by open connection."));
      };
    } catch (err) {
      dbOpeningPromise = null;
      reject(err instanceof Error ? err : new Error("Failed to initialize IndexedDB."));
    }
  });

  return dbOpeningPromise;
}

export const openDatabase = getUnifiedDatabase;

/**
 * Timeout-safeguarded Promise wrapper preventing hangs on blocked storage engines.
 */
export async function withStorageTimeout<T>(
  storagePromise: Promise<T>,
  fallbackValue: T,
  timeoutMs = 1200
): Promise<T> {
  let timerId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timerId = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });

  try {
    const result = await Promise.race([storagePromise, timeoutPromise]);
    clearTimeout(timerId!);
    return result;
  } catch {
    clearTimeout(timerId!);
    return fallbackValue;
  }
}
