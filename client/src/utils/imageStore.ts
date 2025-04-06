import { openDB } from 'idb';

const DB_NAME = 'comic-images';
const STORE_NAME = 'images';

const getDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const saveImage = async (pageNumber: number, panelNumber: number, imageData: string) => {
  const db = await getDB();
  const key = `${pageNumber}-${panelNumber}`;
  await db.put(STORE_NAME, imageData, key);
};

export const getImage = async (pageNumber: number, panelNumber: number): Promise<string | undefined> => {
  const db = await getDB();
  const key = `${pageNumber}-${panelNumber}`;
  return db.get(STORE_NAME, key);
};

export const deleteImage = async (pageNumber: number, panelNumber: number) => {
  const db = await getDB();
  const key = `${pageNumber}-${panelNumber}`;
  await db.delete(STORE_NAME, key);
};

export const clearAllImages = async () => {
  const db = await getDB();
  await db.clear(STORE_NAME);
};
