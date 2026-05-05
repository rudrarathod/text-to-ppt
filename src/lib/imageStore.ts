import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'image-storage';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveImage(id: string, blob: Blob): Promise<string> {
  const db = await getDB();
  await db.put(STORE_NAME, blob, id);
  return `idb-image://${id}`;
}

export async function getImage(path: string): Promise<Blob | null> {
  if (!path.startsWith('idb-image://')) return null;
  const id = path.replace('idb-image://', '');
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function deleteImage(path: string): Promise<void> {
  if (!path.startsWith('idb-image://')) return;
  const id = path.replace('idb-image://', '');
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export function isIdbImage(path: any): boolean {
  return typeof path === 'string' && path.startsWith('idb-image://');
}
