import { PartnerVerificationRecord } from "./types";
import { getUnifiedDatabase, STORES, withStorageTimeout, isIndexedDBSupported } from "@/lib/storage/db";

const RECORD_ID = "partner_verification";
let memoryVerificationRecord: PartnerVerificationRecord | null = null;

export async function saveVerificationRecord(record: PartnerVerificationRecord): Promise<boolean> {
  memoryVerificationRecord = record;
  if (!isIndexedDBSupported()) {
    return true;
  }

  const saveOp = async (): Promise<boolean> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PARTNER_VERIFICATION], "readwrite");
        const store = transaction.objectStore(STORES.PARTNER_VERIFICATION);
        const request = store.put(record);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(true);
      });
    } catch {
      return true;
    }
  };

  return withStorageTimeout(saveOp(), true, 1200);
}

export async function loadVerificationRecord(): Promise<PartnerVerificationRecord | null> {
  if (!isIndexedDBSupported()) {
    return memoryVerificationRecord;
  }

  const loadOp = async (): Promise<PartnerVerificationRecord | null> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PARTNER_VERIFICATION], "readonly");
        const store = transaction.objectStore(STORES.PARTNER_VERIFICATION);
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
  };

  return withStorageTimeout(loadOp(), memoryVerificationRecord, 1200);
}

export async function removeVerificationRecord(): Promise<boolean> {
  memoryVerificationRecord = null;
  if (!isIndexedDBSupported()) {
    return true;
  }

  const removeOp = async (): Promise<boolean> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PARTNER_VERIFICATION], "readwrite");
        const store = transaction.objectStore(STORES.PARTNER_VERIFICATION);
        const request = store.delete(RECORD_ID);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(true);
      });
    } catch {
      return true;
    }
  };

  return withStorageTimeout(removeOp(), true, 1200);
}
