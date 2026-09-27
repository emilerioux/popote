/* ============================================================
   data.js — tout ce qui sait ce qu'est un repas.
   Une recette garde ses ingrédients comme des LIGNES DE TEXTE
   (« 400 g de poulet ») : c'est ce qu'on tape, et c'est ce qu'on
   relit. La quantité, l'unité, le nom et le rayon en sont déduits
   à la lecture, jamais stockés — donc rien à resynchroniser quand
   les règles de lecture s'améliorent.
   ============================================================ */

/* ── Dates ─────────────────────────────────────────────────── */

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtShort = new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short" });
export const shortDate = (d) => fmtShort.format(d);

/* ── Rayons ────────────────────────────────────────────────── */

export const AISLES = [
  { id: "fruits",      name: "Fruits et légumes",         emoji: "🥕" },
  { id: "viande",      name: "Viandes et poissons",       emoji: "🥩" },
  { id: "laitier",     name: "Produits laitiers et œufs", emoji: "🧀" },
  { id: "boulangerie", name: "Boulangerie",               emoji: "🥖" },
  { id: "sec",         name: "Épicerie",                  emoji: "🥫" },
  { id: "epices",      name: "Épices et condiments",      emoji: "🧂" },
  { id: "surgeles",    name: "Surgelés",                  emoji: "🧊" },
  { id: "autre",       name: "Autre",                     emoji: "🛒" },
];

/* Mots-clés sans accents. Le plus LONG mot trouvé gagne :
   « lait de coco » bat « lait », « haricots verts » bat
   « haricots », « bouillon de poulet » bat « poulet ». */
const KEYWORDS = {
  fruits: ["oignon", "ail", "echalote", "poireau", "carotte", "tomate", "tomates cerises", "poivron",
    "brocoli", "chou", "chou-fleur", "laitue", "salade", "epinard", "roquette", "pomme", "pommes de terre",
    "patate", "patate douce", "banane", "citron", "lime", "orange", "avocat", "champignon", "courgette",
    "concombre", "celeri", "asperge", "gingembre", "coriandre", "persil", "basilic frais", "menthe",
    "mange-tout", "pois mange-tout", "haricots verts", "fraise", "bleuet", "framboise", "raisin",
    "mangue", "ananas", "courge", "radis", "betterave", "navet", "tofu", "fines herbes", "germes",
    "oignons verts", "oignon rouge", "aneth frais", "kale", "chou kale", "mais en epi"],
  viande: ["poulet", "poitrine", "cuisse", "boeuf", "hache", "porc", "veau", "agneau", "dinde", "jambon",
    "bacon", "saucisse", "saumon", "truite", "morue", "tilapia", "crevette", "poisson", "thon frais",
    "steak", "cote", "filet de porc", "pepperoni", "chorizo", "prosciutto"],
  laitier: ["lait", "creme", "creme sure", "creme 15", "creme 35", "beurre", "fromage", "cheddar",
    "parmesan", "mozzarella", "monterey", "feta", "ricotta", "cottage", "yogourt", "yaourt", "oeuf"],
  boulangerie: ["pain", "pains naan", "naan", "tortilla", "baguette", "pita", "bagel", "muffin anglais",
    "croissant", "brioche", "pain hamburger", "pain a hot-dog"],
  sec: ["pates", "spaghetti", "penne", "macaroni", "fusilli", "linguine", "lasagne", "nouilles", "udon",
    "vermicelle", "riz", "couscous", "quinoa", "farine", "sucre", "cassonade", "conserve",
    "tomates en des", "sauce tomate", "pate de tomate", "tomates broyees", "lait de coco", "haricots",
    "haricots rouges", "haricots noirs", "pois chiches", "lentilles", "mais en creme", "mais en grains",
    "bouillon", "fecule", "cereales", "avoine", "gruau", "beurre d'arachide", "chapelure", "chocolat",
    "noix", "amandes", "cafe", "the", "craquelins", "croutons", "thon", "levure", "poudre a pate",
    "bicarbonate", "cacao", "raisins secs"],
  epices: ["sel", "poivre", "origan", "cumin", "paprika", "aneth", "thym", "romarin", "cannelle",
    "muscade", "cari", "curry", "pate de cari", "curcuma", "piment", "flocons de piment", "chili",
    "assaisonnement", "epice", "epices", "herbes de provence", "basilic seche", "huile", "vinaigre",
    "sauce soya", "sauce teriyaki", "sauce hoisin", "sauce piquante", "sriracha", "moutarde", "ketchup",
    "mayonnaise", "miel", "sirop d'erable", "graines de sesame", "sesame", "pesto", "salsa", "relish",
    "vanille", "sauce worcestershire", "sauce poisson"],
  surgeles: ["surgele", "surgeles", "congele", "creme glacee", "frozen"],
};

/* Beaucoup de recettes TikTok sont en anglais : les mêmes rayons. */
const EN = {
  fruits: ["onion", "garlic", "shallot", "carrot", "tomato", "bell pepper", "broccoli", "cabbage", "lettuce",
    "spinach", "potato", "sweet potato", "lemon", "lime", "avocado", "mushroom", "zucchini", "cucumber",
    "celery", "ginger", "cilantro", "parsley", "fresh basil", "green onion", "scallion", "kale", "apple",
    "banana", "berries", "jalapeno", "corn on the cob", "green beans"],
  viande: ["chicken", "beef", "ground beef", "pork", "turkey", "ham", "bacon", "sausage", "salmon",
    "shrimp", "fish", "tuna steak", "steak", "lamb", "chorizo", "thighs", "breast"],
  laitier: ["milk", "cream", "heavy cream", "sour cream", "butter", "cheese", "parmesan", "mozzarella",
    "cheddar", "egg", "yogurt", "greek yogurt", "cream cheese"],
  boulangerie: ["bread", "buns", "tortilla", "wrap", "pita", "bagel"],
  sec: ["pasta", "noodles", "rice", "flour", "sugar", "brown sugar", "beans", "black beans", "chickpeas",
    "lentils", "broth", "stock", "coconut milk", "canned", "diced tomatoes", "tomato paste", "tomato sauce",
    "oats", "breadcrumbs", "panko", "peanut butter", "cornstarch", "chocolate", "nuts", "almonds"],
  epices: ["salt", "pepper", "black pepper", "pepper flakes", "chili flakes", "oregano", "cumin", "paprika",
    "smoked paprika", "garlic powder", "onion powder", "chili powder", "cinnamon", "thyme", "rosemary",
    "oil", "olive oil", "vinegar", "soy sauce", "honey", "maple syrup", "mustard", "ketchup", "mayo",
    "mayonnaise", "sriracha", "hot sauce", "sesame", "sesame oil", "seasoning", "spices", "vanilla", "pesto"],
};
for (const [a, ws] of Object.entries(EN)) KEYWORDS[a].push(...ws);

export const deaccent = (s) =>
  s.toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/’/g, "'");

export function guessAisle(name) {
  const n = " " + deaccent(name) + " ";
  let best = "autre", len = 0;
  for (const [aisle, words] of Object.entries(KEYWORDS)) {
    for (const w of words) {
      if (w.length <= len) continue;
      /* Début de mot seulement : « sel » ne doit pas trouver « vaisselle ». */
      const i = n.indexOf(w);
      if (i > 0 && /[\s'(-]/.test(n[i - 1])) { best = aisle; len = w.length; }
    }
  }
  return best;
}

/* ── Lecture d'une ligne d'ingrédient ──────────────────────── */

const FRAC = { "½": 1 / 2, "¼": 1 / 4, "¾": 3 / 4, "⅓": 1 / 3, "⅔": 2 / 3 };

/* [expression, unité canonique, pluriel]. Ordre = priorité. */
const UNITS = [
  [/^(kg|kilos?|kilogrammes?)(?=[\s.]|$)\.?/i, "kg"],
  [/^(g|gr|grammes?)(?=[\s.]|$)\.?/i, "g"],
  [/^(ml|millilitres?)(?=[\s.]|$)\.?/i, "ml"],
  [/^(l|litres?)(?=[\s.]|$)\.?/i, "l"],
  [/^(lb|lbs|livres?|pounds?)(?=[\s.]|$)\.?/i, "lb"],
  [/^(oz|onces?|ounces?)(?=[\s.]|$)\.?/i, "oz"],
  [/^(c\.?\s*à\s*(soupe|s\.?)|cuill[eè]res?\s*à\s*soupe|c\.s\.|cs|tbsp|tbs|tablespoons?)(?=[\s.]|$)\.?/i, "c. à soupe"],
  [/^(c\.?\s*à\s*(thé|the|café|t\.?)|cuill[eè]res?\s*à\s*(thé|café)|c\.t\.|ct|tsp|teaspoons?)(?=[\s.]|$)\.?/i, "c. à thé"],
  [/^(tasses?|cups?)(?=\s|$)/i, "tasse", "tasses"],
  [/^(boîtes?|boites?|conserves?|cans?)(?=\s|$)/i, "boîte", "boîtes"],
  [/^(gousses?|cloves?)(?=\s|$)/i, "gousse", "gousses"],
  [/^(paquets?|packages?|packs?)(?=\s|$)/i, "paquet", "paquets"],
  [/^sachets?(?=\s|$)/i, "sachet", "sachets"],
  [/^(pincées?|pinch(es)?)(?=\s|$)/i, "pincée", "pincées"],
  [/^(tranches?|slices?)(?=\s|$)/i, "tranche", "tranches"],
  [/^bottes?(?=\s|$)/i, "botte", "bottes"],
  [/^casseaux?(?=\s|$)/i, "casseau", "casseaux"],
  [/^filets?(?=\s+(de|d'|d’))/i, "filet", "filets"],
  [/^pots?(?=\s+(de|d'|d’))/i, "pot", "pots"],
];
const PLURAL = Object.fromEntries(UNITS.filter((u) => u[2]).map((u) => [u[1], u[2]]));

function readQty(s) {
  let m;
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)/))) return [+m[1] + m[2] / m[3], m[0]];
  if ((m = s.match(/^(\d+)\/(\d+)/))) return [m[1] / m[2], m[0]];
  if ((m = s.match(/^(\d+(?:[.,]\d+)?)\s*([½¼¾⅓⅔])?/)))
    return [parseFloat(m[1].replace(",", ".")) + (m[2] ? FRAC[m[2]] : 0), m[0]];
  if ((m = s.match(/^[½¼¾⅓⅔]/))) return [FRAC[m[0]], m[0]];
  return [null, ""];
}

/* « 2 c. à soupe d'huile d'olive » → { qty: 2, unit: "c. à soupe", name: "huile d'olive" } */
export function parseLine(line) {
  let s = String(line || "").trim().replace(/^[-•*]\s*/, "");
  const [qty, used] = readQty(s);
  s = s.slice(used.length).trim();
  let unit = "";
  if (qty !== null) {
    for (const [re, canon] of UNITS) {
      const m = s.match(re);
      if (m) { unit = canon; s = s.slice(m[0].length).trim(); break; }
    }
  }
  s = s.replace(/^(de|des|du|of)\s+/i, "").replace(/^d['’]\s*/i, "").trim();
  return { qty, unit, name: s };
}

/* kg → g et l → ml, pour que 1 kg + 500 g se additionnent. */
function toBase(ing) {
  if (ing.unit === "kg") return { ...ing, qty: ing.qty * 1000, unit: "g" };
  if (ing.unit === "l")  return { ...ing, qty: ing.qty * 1000, unit: "ml" };
  if (ing.unit === "oz" && ing.qty !== null) return { ...ing, qty: ing.qty * 28.35, unit: "g" };
  return ing;
}

/* En magasin on achète des objets entiers : 1 ½ oignon → 2. */
const WHOLE = new Set(["", "boîte", "gousse", "paquet", "sachet", "tranche", "botte", "casseau", "filet", "pot"]);

/* Clé d'addition : sans accents, sans « s » final — « oignons » = « oignon ». */
export const keyOf = (name) =>
  deaccent(name).replace(/[^a-z0-9' -]/g, "").split(/\s+/).filter(Boolean)
    .map((w) => w.replace(/(s|x)$/, "")).join(" ");

/* ── Affichage des quantités ───────────────────────────────── */

const NICE = [[0, ""], [1 / 4, "¼"], [1 / 3, "⅓"], [1 / 2, "½"], [2 / 3, "⅔"], [3 / 4, "¾"], [1, ""]];

function fracText(q) {
  let whole = Math.floor(q), rem = q - whole, best = NICE[0];
  for (const n of NICE) if (Math.abs(n[0] - rem) < Math.abs(best[0] - rem)) best = n;
  if (best[0] === 1) { whole += 1; best = NICE[0]; }
  if (!whole && !best[1]) return "¼";          // jamais « 0 » : il en faut un peu
  return whole ? (best[1] ? `${whole} ${best[1]}` : `${whole}`) : best[1];
}

export function formatQty(qty, unit) {
  if (qty === null || !(qty > 0)) return "";
  if (unit === "g" || unit === "ml") {
    if (qty >= 1000) {
      const big = Math.round(qty / 100) / 10;
      return `${String(big).replace(".", ",")} ${unit === "g" ? "kg" : "l"}`;
    }
    const r = qty >= 100 ? Math.round(qty / 5) * 5 : Math.round(qty);
    return `${r} ${unit}`;
  }
  if (unit === "lb") return `${String(Math.round(qty * 10) / 10).replace(".", ",")} lb`;
  const t = fracText(qty);
  if (!unit) return t;
  return `${t} ${qty > 1.01 && PLURAL[unit] ? PLURAL[unit] : unit}`;
}

/* Ligne réécrite pour un nombre de portions différent. */
export function scaleLine(line, factor) {
  const p = parseLine(line);
  if (p.qty === null || factor === 1) return String(line).trim();
  const q = formatQty(p.qty * factor, p.unit);
  if (!p.unit) return `${q} ${p.name}`;
  const de = /^[aeiouyhâéèêîôœ]/i.test(p.name) && !/^h(aricot|ach)/i.test(p.name) ? "d'" : "de ";
  return `${q} ${de}${p.name}`;
}

/* ── Liste d'épicerie ──────────────────────────────────────── */

/* Tout ce qu'il faut acheter pour la semaine qui commence à `mon` :
   ingrédients des soupers planifiés (mis à l'échelle des portions,
   additionnés entre recettes) + articles ajoutés à la main. */
export function groceryFor(state, mon) {
  const wk = iso(mon);
  const items = new Map();
  let meals = 0;

  for (let i = 0; i < 7; i++) {
    const p = state.plan[iso(addDays(mon, i))];
    const r = p && state.recipes[p.r];
    if (!r) continue;
    meals++;
    const f = (p.s || r.servings || 4) / (r.servings || 4);
    for (const line of r.ingredients || []) {
      const ing = parseLine(line);
      if (!ing.name) continue;
      const b = toBase(ing);
      const k = keyOf(ing.name) + "|" + b.unit;
      let it = items.get(k);
      if (!it) {
        it = { key: `${wk}|${k}`, k: keyOf(ing.name), name: ing.name, unit: b.unit, qty: 0, hasQty: false,
               from: new Set(), aisle: guessAisle(ing.name) };
        items.set(k, it);
      }
      if (b.qty !== null) { it.qty += b.qty * f; it.hasQty = true; }
      it.from.add(r.name);
    }
  }

  const list = [...items.values()].map((it) => ({ ...it, from: [...it.from] }));
  for (const [id, x] of Object.entries(state.extras || {})) {
    const ing = toBase(parseLine(x.line));
    list.push({ key: `x|${id}`, k: keyOf(ing.name || x.line), extra: id, name: ing.name || x.line, unit: ing.unit,
                qty: ing.qty ?? 0, hasQty: ing.qty !== null, from: [], aisle: guessAisle(ing.name || x.line) });
  }

  let done = 0, total = 0, budget = 0, unpriced = 0;
  const pantry = [];
  for (const it of list) {
    it.done = !!state.checked[it.key];
    if (it.hasQty && WHOLE.has(it.unit)) it.qty = Math.ceil(it.qty - 0.01);
    it.qtyText = it.hasQty ? formatQty(it.qty, it.unit) : "";
    it.price = priceOf(state, it);
    /* Garde-manger : ce qu'on a toujours sort de la liste — sauf les
       articles ajoutés à la main, qui sont là parce qu'on en manque. */
    it.pantry = !it.extra && !!(state.pantry || {})[it.k];
    if (it.pantry) { pantry.push(it); continue; }
    total++;
    if (it.done) done++;
    if (it.price !== null) budget += it.price; else unpriced++;
  }

  const byName = (a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  const groups = AISLES
    .map((a) => ({ ...a, items: list.filter((it) => it.aisle === a.id && !it.pantry).sort(byName) }))
    .filter((g) => g.items.length);

  return { groups, pantry: pantry.sort(byName), meals, total, done, budget, unpriced };
}

/* ── Prix (budget estimé) ──────────────────────────────────────
   Un prix est gardé PAR UNITÉ DE BASE (par gramme, par ml, par
   boîte, à l'unité) : il reste juste quand les quantités changent
   d'une semaine à l'autre. Les valeurs de départ sont des ordres de
   grandeur d'épicerie à Montréal — faits pour être corrigés. */
const DEFAULT_PRICES = [
  ["spaghetti", "g", 0.005], ["penne", "g", 0.005], ["pâtes", "g", 0.005], ["bœuf haché", "g", 0.012],
  ["poitrines de poulet", "g", 0.018], ["cuisses de poulet", "g", 0.012], ["saumon", "filet", 4.5],
  ["riz au jasmin", "g", 0.004], ["riz basmati", "g", 0.005], ["riz", "g", 0.004], ["nouilles udon", "g", 0.008],
  ["tofu ferme", "g", 0.008], ["pommes de terre", "g", 0.003], ["pommes de terre grelots", "g", 0.005],
  ["cheddar râpé", "g", 0.02], ["fromage monterey jack râpé", "g", 0.02], ["parmesan", "g", 0.04],
  ["épinards", "g", 0.02], ["pois mange-tout", "g", 0.02],
  ["crème sure", "ml", 0.006], ["crème 15 %", "ml", 0.005], ["salsa", "ml", 0.012], ["pesto", "ml", 0.025],
  ["sauce teriyaki", "ml", 0.02], ["sauce soya", "ml", 0.012], ["lait", "ml", 0.0025], ["maïs surgelé", "ml", 0.006],
  ["oignon", "", 0.6], ["oignon rouge", "", 0.8], ["carotte", "", 0.3], ["poivron rouge", "", 1.8],
  ["poivron vert", "", 1.3], ["brocoli", "", 2.8], ["tomates", "", 1.0], ["laitue romaine", "", 2.5],
  ["lime", "", 0.6], ["citron", "", 0.8], ["avocat", "", 1.8], ["tortillas", "", 0.5], ["pains naan", "", 1.25],
  ["oignons verts", "", 0.25], ["œufs", "", 0.4],
  ["tomates en dés", "boîte", 1.6], ["sauce tomate", "boîte", 1.3], ["haricots rouges", "boîte", 1.5],
  ["haricots noirs", "boîte", 1.5], ["pois chiches", "boîte", 1.5], ["lait de coco", "boîte", 2.3],
  ["maïs en crème", "boîte", 1.5], ["maïs en grains", "boîte", 1.5],
  ["assaisonnement à tacos", "sachet", 1.5], ["asperges", "botte", 4], ["tomates cerises", "casseau", 4],
  ["ail", "gousse", 0.15],
];
const DEFAULTS = new Map(DEFAULT_PRICES.map(([n, u, p]) => [keyOf(n), { u, p }]));

/* Prix unitaire connu (le tien d'abord, sinon celui de départ). */
export function unitPrice(state, k) {
  return (state.prices || {})[k] || DEFAULTS.get(k) || null;
}
function priceOf(state, it) {
  const up = unitPrice(state, it.k);
  if (!up || up.u !== it.unit) return null;
  /* Sans quantité (« sel et poivre ») : compté une fois. */
  return (it.hasQty ? it.qty : 1) * up.p;
}

export const money = (x) =>
  x.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";

/* ── Étiquettes et filtres ─────────────────────────────────── */

export const TAGS = [
  { id: "vege",      label: "Végé",       emoji: "🥦" },
  { id: "eco",       label: "Économique", emoji: "💰" },
  { id: "prep",      label: "Meal prep",  emoji: "🍱" },
  { id: "reconfort", label: "Réconfort",  emoji: "🛋️" },
  { id: "sante",     label: "Santé",      emoji: "💪" },
];

/* Filtres = deux filtres calculés + les étiquettes. */
export const FILTERS = [
  { id: "fav",    label: "Favoris", emoji: "★" },
  { id: "rapide", label: "Rapide",  emoji: "⚡" },
  ...TAGS,
];

const STARTER_TAGS = {
  "s-bolognaise": ["eco", "reconfort"], "s-tacos": [], "s-teriyaki": ["sante"],
  "s-chili": ["vege", "eco", "prep"], "s-saumon": ["sante"], "s-pate-chinois": ["eco", "reconfort", "prep"],
  "s-curry": ["vege", "prep"], "s-tofu": ["vege", "sante"], "s-quesadillas": [], "s-pesto": ["reconfort"],
};
/* Les recettes de départ déjà enregistrées n'ont pas de champ tags :
   on retombe sur les étiquettes prévues pour elles. */
export const tagsOf = (r) => r.tags ?? STARTER_TAGS[r.id] ?? [];

export function matchesFilter(r, f) {
  if (!f) return true;
  if (f === "fav") return (r.rating || 0) >= 4;
  if (f === "rapide") return r.time > 0 && r.time <= 30;
  return tagsOf(r).includes(f);
}

/* ── Suggestions ────────────────────────────────────────────────
   Tirage au hasard, mais pondéré : les recettes bien notées
   reviennent plus souvent, celles mangées récemment presque jamais. */
export function suggest(state, mon, count, exclude = new Set()) {
  const monIso = iso(mon);
  const last = {};
  for (const [day, p] of Object.entries(state.plan)) {
    if (day < monIso && (!last[p.r] || day > last[p.r])) last[p.r] = day;
  }
  const RATING = [1.1, 0.35, 0.7, 1, 1.8, 2.6];   // index = étoiles ; 0 = jamais notée
  const pool = Object.values(state.recipes).filter((r) => !exclude.has(r.id)).map((r) => {
    let w = RATING[r.rating || 0];
    if (last[r.id]) {
      const [y, m, d] = last[r.id].split("-").map(Number);
      const days = (mon - new Date(y, m - 1, d)) / 86400000;
      w *= days < 7 ? 0.1 : days < 14 ? 0.3 : days < 28 ? 0.7 : 1;
    }
    return { r, w };
  });
  const out = [];
  while (out.length < count && pool.length) {
    let x = Math.random() * pool.reduce((s, p) => s + p.w, 0);
    let i = 0;
    while (i < pool.length - 1 && (x -= pool[i].w) > 0) i++;
    out.push(pool.splice(i, 1)[0].r);
  }
  return out;
}

/* ── Emoji deviné d'après le nom ── */
const EMOJI_GUESS = [
  [/p[aâ]tes|spaghetti|penne|lasagne|pasta|mac/i, "🍝"], [/taco/i, "🌮"], [/burrito|wrap/i, "🌯"],
  [/curry|cari|dahl|dal\b/i, "🍛"], [/soupe|soup|potage|bouillon/i, "🍲"], [/salade|salad|bowl/i, "🥗"],
  [/saumon|poisson|salmon|fish|morue|thon/i, "🐟"], [/crevette|shrimp/i, "🍤"], [/burger/i, "🍔"],
  [/pizza/i, "🍕"], [/steak|b(oe|œ)uf|beef/i, "🥩"], [/cr[eê]pe|pancake|gaufre/i, "🥞"],
  [/ramen|nouille|noodle|pho|udon/i, "🍜"], [/sushi/i, "🍣"], [/riz|rice/i, "🍚"], [/(oe|œ)uf|egg|omelette/i, "🍳"],
  [/poulet|chicken/i, "🍗"], [/g[aâ]teau|cake|dessert|brownie|cookie|biscuit/i, "🍰"], [/tofu|stir.?fry|saut[ée]/i, "🥢"],
];
export function guessEmoji(name, extra = "") {
  for (const t of [name, extra]) {
    const hit = EMOJI_GUESS.find(([re]) => re.test(t));
    if (hit) return hit[1];
  }
  return "🍲";
}

/* ── Recettes de départ ────────────────────────────────────── */

const r = (id, emoji, name, time, ingredients, steps) =>
  ({ id: `s-${id}`, emoji, name, servings: 4, time, ingredients, steps });

export const STARTERS = [
  r("bolognaise", "🍝", "Spaghetti bolognaise", 40, [
    "450 g de spaghetti", "450 g de bœuf haché", "1 oignon", "2 gousses d'ail", "1 carotte",
    "1 boîte de tomates en dés", "1 boîte de sauce tomate", "1 c. à soupe d'huile d'olive",
    "1 c. à thé d'origan", "50 g de parmesan",
  ], [
    "Hacher l'oignon, l'ail et la carotte finement.",
    "Faire revenir dans l'huile 5 min, puis ajouter le bœuf et le faire dorer en l'émiettant.",
    "Ajouter les tomates, la sauce et l'origan. Laisser mijoter 20 min à feu doux.",
    "Cuire les spaghetti, égoutter et servir avec la sauce et le parmesan.",
  ]),
  r("tacos", "🌮", "Tacos au bœuf", 25, [
    "450 g de bœuf haché", "8 tortillas", "1 sachet d'assaisonnement à tacos", "1 laitue romaine",
    "2 tomates", "150 g de cheddar râpé", "125 ml de crème sure", "250 ml de salsa", "1 lime",
  ], [
    "Dorer le bœuf à la poêle, ajouter l'assaisonnement et un peu d'eau, laisser réduire.",
    "Émincer la laitue, couper les tomates en dés.",
    "Réchauffer les tortillas et garnir au goût. Un filet de lime avant de servir.",
  ]),
  r("teriyaki", "🍗", "Poulet teriyaki et riz", 30, [
    "600 g de poitrines de poulet", "300 g de riz au jasmin", "1 brocoli", "1 poivron rouge",
    "125 ml de sauce teriyaki", "1 c. à soupe d'huile de canola", "1 c. à soupe de graines de sésame",
    "2 oignons verts",
  ], [
    "Cuire le riz.",
    "Couper le poulet en cubes et le saisir dans l'huile jusqu'à ce qu'il soit doré.",
    "Ajouter le brocoli et le poivron en morceaux, cuire 4 min.",
    "Verser la sauce teriyaki, laisser épaissir 2 min. Garnir de sésame et d'oignons verts.",
  ]),
  r("chili", "🌶️", "Chili végé", 45, [
    "1 oignon", "2 gousses d'ail", "1 poivron vert", "2 boîtes de haricots rouges",
    "1 boîte de tomates en dés", "250 ml de maïs surgelé", "2 c. à soupe d'assaisonnement au chili",
    "1 c. à thé de cumin", "125 ml de crème sure", "1 avocat",
  ], [
    "Faire revenir l'oignon, l'ail et le poivron hachés 5 min.",
    "Ajouter les épices, puis les haricots rincés, les tomates et le maïs.",
    "Mijoter 25 min. Servir avec crème sure et avocat.",
  ]),
  r("saumon", "🐟", "Saumon au four et légumes rôtis", 35, [
    "4 filets de saumon", "1 kg de pommes de terre grelots", "1 botte d'asperges", "1 citron",
    "2 c. à soupe d'huile d'olive", "2 gousses d'ail", "1 c. à thé d'aneth",
  ], [
    "Préchauffer le four à 425 °F. Couper les grelots en deux, les enrober d'huile et d'ail.",
    "Rôtir les grelots 15 min.",
    "Ajouter les asperges et le saumon sur la plaque, arroser de citron, parsemer d'aneth.",
    "Cuire encore 12 à 15 min, jusqu'à ce que le saumon se défasse à la fourchette.",
  ]),
  r("pate-chinois", "🥧", "Pâté chinois", 60, [
    "450 g de bœuf haché", "1 oignon", "1 kg de pommes de terre", "1 boîte de maïs en crème",
    "1 boîte de maïs en grains", "125 ml de lait", "2 c. à soupe de beurre", "1 c. à thé de paprika",
  ], [
    "Cuire les pommes de terre à l'eau et les réduire en purée avec le lait et le beurre.",
    "Dorer le bœuf avec l'oignon haché, saler et poivrer.",
    "Dans un plat : bœuf, puis les deux maïs, puis la purée. Saupoudrer de paprika.",
    "Cuire 30 min à 375 °F.",
  ]),
  r("curry", "🍛", "Curry de pois chiches", 30, [
    "2 boîtes de pois chiches", "1 boîte de lait de coco", "1 boîte de tomates en dés", "1 oignon",
    "2 gousses d'ail", "1 c. à soupe de gingembre frais râpé", "2 c. à soupe de pâte de cari",
    "150 g d'épinards", "300 g de riz basmati", "4 pains naan",
  ], [
    "Cuire le riz.",
    "Faire revenir l'oignon, l'ail et le gingembre, puis la pâte de cari 1 min.",
    "Ajouter les pois chiches rincés, les tomates et le lait de coco. Mijoter 15 min.",
    "Incorporer les épinards à la fin. Servir avec le riz et les naans réchauffés.",
  ]),
  r("tofu", "🥢", "Sauté de tofu et légumes", 25, [
    "450 g de tofu ferme", "1 brocoli", "1 poivron rouge", "2 carottes", "200 g de pois mange-tout",
    "60 ml de sauce soya", "1 c. à soupe de miel", "1 c. à soupe de fécule de maïs", "2 gousses d'ail",
    "400 g de nouilles udon",
  ], [
    "Couper le tofu en cubes, l'enrober de fécule et le dorer à la poêle. Réserver.",
    "Sauter les légumes et l'ail 5 min à feu vif.",
    "Ajouter les nouilles, la sauce soya, le miel et le tofu. Mélanger 2 min.",
  ]),
  r("quesadillas", "🫓", "Quesadillas au poulet", 25, [
    "400 g de poitrines de poulet", "8 tortillas", "200 g de fromage monterey jack râpé",
    "1 poivron rouge", "1 oignon rouge", "1 boîte de haricots noirs", "250 ml de salsa",
    "125 ml de crème sure",
  ], [
    "Cuire le poulet en lanières avec le poivron et l'oignon émincés.",
    "Garnir une moitié de chaque tortilla : poulet, haricots, fromage. Replier.",
    "Dorer 2-3 min par côté à la poêle. Servir avec salsa et crème sure.",
  ]),
  r("pesto", "🌿", "Pâtes crémeuses au pesto et poulet", 25, [
    "400 g de penne", "400 g de poitrines de poulet", "125 ml de pesto", "250 ml de crème 15 %",
    "1 casseau de tomates cerises", "100 g d'épinards", "50 g de parmesan",
  ], [
    "Cuire les pâtes.",
    "Dorer le poulet en cubes, ajouter les tomates cerises coupées en deux.",
    "Ajouter la crème et le pesto, puis les épinards jusqu'à ce qu'ils tombent.",
    "Mélanger avec les pâtes et le parmesan.",
  ]),
];
