const DATABASE_NAME = 'prep-os-local-v1';
const VERSION = 1;
let opening;
export function openDB() {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    const req = indexedDB.open(DATABASE_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('pdfs')) db.createObjectStore('pdfs');
      if (!db.objectStoreNames.contains('indexes')) db.createObjectStore('indexes');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return opening;
}
function transaction(store, mode, run) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const req = run(db.transaction(store, mode).objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}
export const getItem = (store, key) => transaction(store, 'readonly', s => s.get(key));
export const putItem = (store, key, val) => transaction(store, 'readwrite', s => s.put(val,key));
export const delItem = (store, key) => transaction(store, 'readwrite', s => s.delete(key));
export const allItems = store => transaction(store,'readonly',s=>s.getAll());
export const allKeys = store => transaction(store,'readonly',s=>s.getAllKeys());
export function clearStore(store){return transaction(store,'readwrite',s=>s.clear());}
