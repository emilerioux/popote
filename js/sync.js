/* ============================================================
   sync.js — partage à deux via Firebase Firestore (plan gratuit).

   Un « foyer » = un document foyers/{code}. Le code est un secret
   de 24 caractères : qui a le lien a accès, personne d'autre ne
   peut deviner l'adresse (les règles interdisent de lister).

   L'app marche sans ça : tout vit d'abord en localStorage. La
   synchro ne fait que brancher ce même état sur un document
   partagé. Le SDK n'est téléchargé que si un foyer est actif.
   ============================================================ */

import { firebaseConfig } from "../firebase-config.js";
import * as store from "./store.js";
import * as photos from "./photos.js";

const CDN = "https://www.gstatic.com/firebasejs/10.14.1/";
const CODE_KEY = "pp-foyer";

let fs = null, db = null, ref = null, unsub = null, unsubPhotos = null;
let ready = false, queue = [];
let status = "off";
const statusListeners = new Set();

export const configured = () => !!(firebaseConfig && firebaseConfig.projectId);
export const code = () => { try { return localStorage.getItem(CODE_KEY) || ""; } catch (_) { return ""; } };
export const getStatus = () => status;
export function onStatus(fn) { statusListeners.add(fn); fn(status); }
function setStatus(s) { if (s === status) return; status = s; for (const f of statusListeners) f(s); }

export function newCode() {
  const a = "abcdefghjkmnpqrstuvwxyz23456789";
  return [...crypto.getRandomValues(new Uint8Array(24))].map((x) => a[x % a.length]).join("");
}
export const cleanCode = (s) => String(s || "").trim().split("foyer=").pop().replace(/[^a-z0-9]/gi, "").toLowerCase();
export const shareLink = (c = code()) => `${location.origin}${location.pathname}?foyer=${c}`;

async function init() {
  if (db) return;
  const [appMod, f] = await Promise.all([import(CDN + "firebase-app.js"), import(CDN + "firebase-firestore.js")]);
  fs = f;
  const app = appMod.initializeApp(firebaseConfig);
  try {
    db = fs.initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
  } catch (_) {
    db = fs.getFirestore(app);
  }
}

/* Un changement local → une mise à jour de champ, pas du document entier. */
function toFields(ops) {
  const args = [];
  for (const [col, key, value] of ops) {
    args.push(new fs.FieldPath(col, key), value === undefined ? fs.deleteField() : value);
  }
  return args;
}

function push(ops) {
  if (!ref) return;
  if (!ready) { queue.push(...ops); return; }
  fs.updateDoc(ref, ...toFields(ops)).catch(fail);
}

/* Photos : un document par recette dans foyers/{code}/photos. */
function pushPhoto(id, data) {
  if (!ref) return;
  const d = fs.doc(ref, "photos", id);
  (data ? fs.setDoc(d, { d: data }) : fs.deleteDoc(d)).catch(fail);
}

function watchPhotos() {
  let first = true;
  unsubPhotos = fs.onSnapshot(fs.collection(ref, "photos"), (snap) => {
    for (const ch of snap.docChanges()) {
      if (ch.type === "removed") photos.del(ch.doc.id, { remote: true });
      else photos.put(ch.doc.id, ch.doc.data().d, { remote: true });
    }
    if (first && !snap.metadata.fromCache) {
      first = false;
      /* Nos photos que le foyer n'a pas encore. */
      const remote = new Set(snap.docs.map((d) => d.id));
      for (const [id, data] of photos.entries()) if (!remote.has(id)) pushPhoto(id, data);
    }
  }, fail);
}

function fail(err) { console.warn("[popote] synchro :", err); setStatus("error"); }

export async function connect(c) {
  c = cleanCode(c);
  if (!configured() || c.length < 20) return false;
  try { localStorage.setItem(CODE_KEY, c); } catch (_) {}
  setStatus("connecting");
  try { await init(); } catch (e) { setStatus("offline"); return false; }

  if (unsub) unsub();
  if (unsubPhotos) unsubPhotos();
  ref = fs.doc(db, "foyers", c);
  ready = false; queue = [];
  store.setPushHook(push);
  photos.setPushHook(pushPhoto);
  watchPhotos();

  unsub = fs.onSnapshot(ref, { includeMetadataChanges: true }, (snap) => {
    const fromServer = !snap.metadata.fromCache;

    /* Première réponse du serveur : on réconcilie une seule fois. */
    if (!ready && fromServer) {
      ready = true;
      if (!snap.exists()) {
        /* Nouveau foyer : on y verse tout l'état local. */
        fs.setDoc(ref, store.snapshot()).catch(fail);
        queue = [];
        return;
      }
      /* Foyer existant : on y ajoute nos recettes qu'il n'a pas,
         plus ce qu'on a modifié en attendant la connexion. */
      const remote = snap.data().recipes || {};
      const ops = Object.entries(store.state.recipes)
        .filter(([id]) => !remote[id]).map(([id, r]) => ["recipes", id, r]);
      ops.push(...queue); queue = [];
      if (ops.length) { fs.updateDoc(ref, ...toFields(ops)).catch(fail); return; }
    }

    if (snap.exists()) store.replaceAll(snap.data());
    setStatus(!fromServer ? "offline" : snap.metadata.hasPendingWrites ? "saving" : "synced");
  }, fail);
  return true;
}

export function leave() {
  if (unsub) unsub();
  if (unsubPhotos) unsubPhotos();
  unsub = null; unsubPhotos = null; ref = null; ready = false; queue = [];
  store.setPushHook(null);
  photos.setPushHook(null);
  try { localStorage.removeItem(CODE_KEY); } catch (_) {}
  setStatus("off");
}
