/* ============================================================
   store.js — l'état de l'app, une seule source de vérité.

   Six collections, chacune un dictionnaire { clé: valeur } :
     recipes  id → recette (+ tags, rating 1-5, note, source)
     plan     "2026-09-28" → { r: id de recette, s: portions }
     extras   id → { line: "2 l de lait", t: horodatage }
     checked  clé d'article → true   (cases cochées à l'épicerie)
     pantry   clé d'ingrédient → { name }   (toujours à la maison)
     prices   clé d'ingrédient → { u: unité de base, p: prix unitaire }
     aliases  nom normalisé → { fr, en, aisle }   (ce que tu as appris à l'app)

   Toute modification passe par set(col, key, value) : une clé à la
   fois. C'est ce qui permet à la synchro de n'envoyer QUE le champ
   touché — deux téléphones qui modifient des jours différents en
   même temps ne s'écrasent pas.
   ============================================================ */

import { STARTERS } from "./data.js";

const KEY = "pp-state";
const COLS = ["recipes", "plan", "extras", "checked", "pantry", "prices", "aliases"];
const listeners = new Set();
let pushHook = null;

const blank = () => ({ recipes: {}, plan: {}, extras: {}, checked: {}, pantry: {}, prices: {}, aliases: {} });

function clean(s) {
  const out = blank();
  for (const c of COLS) if (s && s[c] && typeof s[c] === "object") out[c] = { ...s[c] };
  return out;
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.recipes) return clean(s);
  } catch (_) {}
  const s = blank();
  for (const r of STARTERS) s.recipes[r.id] = r;
  return s;
}

export let state = load();

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
function emit() { save(); for (const f of listeners) f(state); }

export const subscribe = (fn) => listeners.add(fn);
export const unsubscribe = (fn) => listeners.delete(fn);
export const setPushHook = (fn) => { pushHook = fn; };
export const snapshot = () => JSON.parse(JSON.stringify(state));

/* Plusieurs changements d'un coup : un seul rendu, un seul envoi.
   ops = [[col, key, value], …] ; value undefined = supprimer. */
export function apply(ops) {
  for (const [col, key, value] of ops) {
    if (value === undefined) delete state[col][key];
    else state[col][key] = value;
  }
  emit();
  if (pushHook) pushHook(ops);
}
export const set = (col, key, value) => apply([[col, key, value]]);

/* La synchro reçoit l'état complet du foyer : il remplace le local. */
export function replaceAll(remote) { state = clean(remote); emit(); }

export function restoreStarters() {
  apply(STARTERS.filter((r) => !state.recipes[r.id]).map((r) => ["recipes", r.id, r]));
}

export function eraseAll() {
  const ops = [];
  for (const c of COLS) for (const k of Object.keys(state[c])) ops.push([c, k, undefined]);
  apply(ops);
}
