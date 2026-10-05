import { createStore, type UseStore } from "idb-keyval";

let codes: UseStore | undefined;
let images: UseStore | undefined;

/**
 * idb-keyval gives each store its own tiny database. The stores are created on
 * first use rather than at import time, because indexedDB does not exist
 * during server rendering and creating one early would crash the page.
 */
export function codesStore(): UseStore {
  return (codes ??= createStore("openqr-codes", "records"));
}

export function imagesStore(): UseStore {
  return (images ??= createStore("openqr-images", "blobs"));
}

/** True when IndexedDB opens. It does not in some private browsing modes. */
export async function storageAvailable(): Promise<boolean> {
  try {
    if (typeof indexedDB === "undefined") return false;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("openqr-probe");
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
    return true;
  } catch {
    return false;
  }
}

/** True for the error browsers throw when the storage quota is used up. */
export function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
}

/**
 * Asks the browser not to evict our data under storage pressure. Best effort:
 * browsers may refuse, and that is fine.
 */
export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Not supported or refused. Saved codes still work.
  }
}
