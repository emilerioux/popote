/* ============================================================
   photos.js — une photo par recette (clé = id de la recette).

   Les photos ne vont PAS dans l'état principal : localStorage est
   limité à ~5 Mo et le document Firestore partagé à 1 Mo. Elles
   vivent dans IndexedDB, compressées (~40 Ko), et la synchro les
   range dans une sous-collection foyers/{code}/photos à part.
   ============================================================ */

const DB = "popote", STORE = "photos";
const cache = new Map();
const listeners = new Set();
let pushHook = null;
let dbp = null;

function db() {
  return dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function write(fn) {
  try {
    const d = await db();
    const t = d.transaction(STORE, "readwrite");
    fn(t.objectStore(STORE));
  } catch (_) {}
}

const emit = () => { for (const f of listeners) f(); };
export const onChange = (fn) => listeners.add(fn);
export const setPushHook = (fn) => { pushHook = fn; };
export const get = (id) => cache.get(id) || "";
export const entries = () => [...cache.entries()];

export async function loadAll() {
  try {
    const d = await db();
    await new Promise((res) => {
      const req = d.transaction(STORE).objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (c) { cache.set(c.key, c.value); c.continue(); } else res();
      };
      req.onerror = () => res();
    });
  } catch (_) {}
  emit();
}

/* remote = vient de la synchro : on n'y renvoie rien. */
export function put(id, data, { remote = false } = {}) {
  if (cache.get(id) === data) return;
  cache.set(id, data);
  write((s) => s.put(data, id));
  emit();
  if (!remote && pushHook) pushHook(id, data);
}
export function del(id, { remote = false } = {}) {
  if (!cache.has(id)) return;
  cache.delete(id);
  write((s) => s.delete(id));
  emit();
  if (!remote && pushHook) pushHook(id, null);
}

/* Photo du téléphone (souvent 3-5 Mo) → JPEG de 720 px de large max. */
export async function compress(file, max = 720, quality = 0.72) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
