/* ============================================================
   lexicon.js — un seul nom par ingrédient, en français.

   « garlic », « 2 cloves garlic, minced » et « gousses d'ail »
   doivent devenir la même ligne d'épicerie. canon() :
     1. regarde d'abord ce que tu as appris à l'app (alias) ;
     2. repère les ingrédients connus en UNE passe, du plus long au
        plus court (« garlic powder » avant « garlic ») — accents,
        pluriels, tirets et « 35% / 35 % » ne comptent pas ;
     3. retire ce qui ne change pas ce qu'on achète (« chopped »,
        « frais »…), mais seulement AUTOUR des ingrédients reconnus :
        « crème fraîche » reste de la crème fraîche.

   Le texte des recettes n'est jamais modifié : ce nom sert à la
   liste d'épicerie, aux rayons, au garde-manger, aux prix et à la
   recherche.
   ============================================================ */

import { DICT, SYNONYMS } from "./lexicon-data.js";

export const deacc = (s) => String(s || "").toLowerCase()
  .replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/[’`]/g, "'")
  .normalize("NFD").replace(/[̀-ͯ]/g, "");

/* ── Construction du dictionnaire ──────────────────────────── */

const FOLD = { a: "[aàâä]", e: "[eéèêë]", i: "[iîï]", o: "[oôö]", u: "[uùûü]", c: "[cç]", y: "[yÿ]", n: "[nñ]" };

function wordPat(w) {
  /* Pluriel : on retire le s/x final, puis on l'accepte en option. */
  const base = w.length > 3 && /[sx]$/.test(w) && !/(ss|us)$/.test(w) ? w.slice(0, -1) : w;
  let out = "";
  for (const ch of base) {
    out += FOLD[ch] || (ch === "'" ? "['’]\\s*" : ch === "-" ? "[\\s\\-]?" : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  }
  return out + "(?:e?s|x)?";
}
const keyPat = (k) => deacc(k).trim().split(/\s+/).map(wordPat).join("[\\s\\-]*");

const ENTRIES = [];
const byFr = new Map();

for (const [aisle, text] of Object.entries(DICT)) {
  for (const item of text.split(";")) {
    const [ens, fr] = item.split("|").map((s) => s && s.trim().replace(/\s+/g, " "));
    if (!ens || !fr) continue;
    const names = ens.split("/").map((s) => s.trim()).filter(Boolean);
    if (!byFr.has(fr)) byFr.set(fr, { fr, en: names[0], aisle });
    const ref = byFr.get(fr);
    for (const n of names) ENTRIES.push({ key: n, fr, en: ref.en, aisle: ref.aisle, lang: "en" });
  }
}
/* Le nom français lui-même est une clé : « pains naan » reste
   « pains naan » au lieu de devenir « pains pains naan ». */
for (const ref of byFr.values()) ENTRIES.push({ key: ref.fr, fr: ref.fr, en: ref.en, aisle: ref.aisle, lang: "fr" });
for (const item of SYNONYMS.split(";")) {
  const [a, b] = item.split(">").map((s) => s && s.trim());
  const ref = b && byFr.get(b);
  if (a && ref) ENTRIES.push({ key: a, fr: ref.fr, en: ref.en, aisle: ref.aisle, lang: "fr" });
}

/* Un motif = une entrée (la première gagne), du plus long au plus court. */
const seen = new Set();
const LIST = ENTRIES
  .map((e) => ({ ...e, pat: keyPat(e.key) }))
  .filter((e) => !seen.has(e.pat) && seen.add(e.pat))
  .sort((a, b) => deacc(b.key).length - deacc(a.key).length);
for (const e of LIST) e.re = new RegExp(`^(?:${e.pat})$`, "iu");

const BIG = new RegExp(`(^|[^\\p{L}\\d])(${LIST.map((e) => e.pat).join("|")})(?![\\p{L}])`, "giu");
const findEntry = (m) => LIST.find((e) => e.re.test(m));

export const dictionarySize = byFr.size;

/* ── Ce qui ne change pas ce qu'on achète ──────────────────── */

const STRIP = [
  /(^|\s)(fresh|freshly|large|small|medium|big|extra-large|chopped|finely|roughly|coarsely|minced|diced|sliced|thinly|grated|shredded|peeled|boneless|skinless|cubed|crushed|ripe|optional|divided|packed|heaping|canned|raw|cooked|uncooked|ground|whole|organic|trimmed|halved|quartered|rinsed|drained|softened|melted|room temperature|leaves|leaf|sprigs?|stalks?|florets?|bunch|bunches|heads?|pieces?|seeded|stemmed|deveined|tails? on|tail-on)(?=\s|$)/gi,
  /(^|\s)(frais|fraîche|fraîches|fraîchement|gros|grosse|grosses|moyen|moyens|moyenne|moyennes|émincée?s?|tranchée?s?|râpée?s?|pelée?s?|hachée?s?|coupée?s?|en dés|en cubes|en tranches|finement|grossièrement|mûre?s?|facultatif|facultative|environ|bio|biologique|entiers?|entières?|petite?s?|rincée?s?|égouttée?s?|ramollie?s?|fondue?s?|feuilles|brins?|branches?|tiges?|bouquets?|morceaux|épépinée?s?|décortiquée?s?)(?=\s|$)/gi,
  /(^|\s)(to taste|for garnish|for serving|au goût|pour garnir|pour servir|or more|ou plus|at room temperature|à température ambiante)(?=\s|$)/gi,
];
const FROZEN = /(^|\s)(frozen|surgelée?s?|congelée?s?)(?=\s|$)/i;
const CONNECT = { and: "et", or: "ou", with: "avec", "&": "et" };

/* ── Ce que tu as appris à l'app ───────────────────────────── */

let ALIASES = {};
let aliasSig = "{}";
const cache = new Map();

/* Clé d'alias : sans accents, sans pluriel, sans ponctuation. */
export const aliasKey = (s) => deacc(s).replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean)
  .map((w) => (w.length > 3 ? w.replace(/[sx]$/, "") : w)).join(" ");

export function setAliases(map) {
  const sig = JSON.stringify(map || {});
  if (sig === aliasSig) return;
  aliasSig = sig; ALIASES = map || {}; cache.clear();
}

const stripAll = (s) => STRIP.reduce((acc, re) => acc.replace(re, " "), s).replace(/\s{2,}/g, " ").trim();

function fromAlias(a) {
  return { name: a.fr, en: a.en || "", aisle: a.aisle || null, translated: false, known: true, learned: true };
}

/* ── canon() ───────────────────────────────────────────────── */

/* → { name, en, aisle, translated, known, learned } */
export function canon(raw) {
  const k = String(raw || "");
  if (cache.has(k)) return cache.get(k);

  let s = k.toLowerCase().replace(/œ/g, "oe").replace(/[’`]/g, "'")
    .replace(/\([^)]*\)/g, " ")          // « (environ 2 tasses) »
    .split(/,|;| - | – /)[0]             // « oignon, haché » → « oignon »
    .replace(/\s{2,}/g, " ").trim();
  const original = s;

  const a1 = ALIASES[aliasKey(stripAll(s))] || ALIASES[aliasKey(s)];
  if (a1) { const out = fromAlias(a1); cache.set(k, out); return out; }

  /* 1. Ingrédients connus → jetons protégés. */
  const hits = [];
  s = s.replace(BIG, (m, pre, word) => {
    const e = findEntry(word);
    if (!e) return m;
    hits.push(e);
    return `${pre}\u0001${hits.length - 1}\u0002`;
  });

  /* 2. Autour des jetons : surgelé ? descriptifs ? petits mots anglais. */
  const frozen = FROZEN.test(s);
  s = s.replace(FROZEN, " ");
  s = stripAll(s);
  s = s.replace(/(^|\s)(and|or|with|&)(?=\s|$)/gi, (m, pre, w) => `${pre}${CONNECT[w.toLowerCase()]}`);

  /* 3. On remet les noms français. */
  s = s.replace(/\u0001(\d+)\u0002/g, (_, i) => hits[+i].fr)
    .replace(/(^|\s)(\p{L}+)\s+\2(?=\s|$)/giu, "$1$2")
    .replace(/^(of|de|du|des|d')\s+/i, "").replace(/\s+(et|ou|avec)$/i, "")
    .replace(/\s{2,}/g, " ").trim();

  const translated = hits.some((h) => h.lang === "en");
  const main = hits.find((h) => h.fr === s) || null;
  const longest = hits.slice().sort((a, b) => b.key.length - a.key.length)[0];
  let name = s || original;
  let en = main ? main.en : translated ? stripAll(original) : "";
  let aisle = main ? main.aisle : longest ? longest.aisle : null;
  if (frozen && !/surgel/.test(name)) {
    name = `${name} surgelés`; aisle = "surgeles"; en = en ? `frozen ${en}` : "";
  }

  const a2 = ALIASES[aliasKey(name)];
  const out = a2 ? fromAlias(a2) : { name, en, aisle, translated, known: !!main, learned: false };
  cache.set(k, out);
  return out;
}

/* ── Nom anglais affiché ───────────────────────────────────────
   Le dictionnaire garde l'anglais au singulier ; si le français est
   au pluriel (« carottes »), on accorde (« carrots »), sauf pour ce
   qui ne se compte pas (« shrimp », « rice »…). */
const UNCOUNTABLE = /(shrimp|fish|rice|garlic|broccoli|broccolini|spinach|corn|kale|celery|parsley|cilantro|basil|mint|dill|thyme|rosemary|sage|lettuce|cheese|bread|pasta|flour|sugar|salt|pepper|asparagus|hummus|tofu|salmon|beef|pork|chicken|milk|cream|butter|yogurt|oil|sauce|chocolate|coffee|tea|water|ice|bacon|ham|arugula|watercress|couscous|quinoa|oat|granola|popcorn|salsa|pesto|honey|syrup|vinegar|ketchup|mayo|mustard|spaghetti|linguine|penne|macaroni|fusilli|orzo|gnocchi|ramen|udon|soba|kimchi|sauerkraut|seaweed|squid|octopus|lamb|veal|turkey|duck|jam|tahini|miso|cumin|paprika|cinnamon|nutmeg|turmeric|oregano|yeast|cocoa|lox|edamame|tempeh|seitan|barley|bulgur|farro|panko|naan|pita|feta|ricotta|mozzarella|parmesan|cheddar|mesclun|greens|spring mix|stock|broth|flakes|powder|seasoning|spice)$/i;

export function enLabel(fr, en) {
  if (!en) return "";
  const first = deacc(fr).split(" ")[0];
  const last = en.split(" ").pop();
  if (!/[sx]$/.test(first) || /s$/.test(last) || UNCOUNTABLE.test(last)) return en;
  const plural = /[^aeiou]y$/.test(last) ? last.slice(0, -1) + "ies"
    : /(o|ch|sh|x)$/.test(last) ? last + "es" : last + "s";
  return en.replace(/\S+$/, plural);
}
