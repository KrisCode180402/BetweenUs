import { PairedPartnerRecord } from "./types";
import { getUnifiedDatabase, STORES, withStorageTimeout, isIndexedDBSupported } from "@/lib/storage/db";

const RECORD_ID = "partner_trust";
let memoryPartnerRecord: PairedPartnerRecord | null = null;

export async function savePairedPartner(record: PairedPartnerRecord): Promise<boolean> {
  memoryPartnerRecord = record;
  if (!isIndexedDBSupported()) {
    return true;
  }

  const saveOp = async (): Promise<boolean> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PARTNER_TRUST], "readwrite");
        const store = transaction.objectStore(STORES.PARTNER_TRUST);
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

export async function loadPairedPartner(): Promise<PairedPartnerRecord | null> {
  if (!isIndexedDBSupported()) {
    return memoryPartnerRecord;
  }

  const loadOp = async (): Promise<PairedPartnerRecord | null> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PARTNER_TRUST], "readonly");
        const store = transaction.objectStore(STORES.PARTNER_TRUST);
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
  };

  return withStorageTimeout(loadOp(), memoryPartnerRecord, 1200);
}

export async function removePairedDevice(): Promise<boolean> {
  memoryPartnerRecord = null;
  if (!isIndexedDBSupported()) {
    return true;
  }

  const removeOp = async (): Promise<boolean> => {
    try {
      const db = await getUnifiedDatabase();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PARTNER_TRUST], "readwrite");
        const store = transaction.objectStore(STORES.PARTNER_TRUST);
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
