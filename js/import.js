/* ============================================================
   import.js — transformer une description TikTok / Reels (ou
   n'importe quel texte collé) en brouillon de recette.

   Aucune IA : des règles simples, puis l'éditeur s'ouvre pour
   qu'on vérifie. On cherche d'abord des en-têtes (« Ingrédients »,
   « Préparation »…) ; sans en-tête, chaque ligne est classée selon
   sa forme — une quantité au début = un ingrédient, une longue
   phrase = une étape.
   ============================================================ */

import { parseLine, guessAisle, guessEmoji } from "./data.js";

const HEAD_ING  = /^(ingr[ée]dients?|ce qu'il (te|vous) faut|tu as besoin de|you('ll)? need|what you need|shopping list)\b/i;
const HEAD_STEP = /^(pr[ée]paration|[ée]tapes?|instructions?|m[ée]thode|directions?|method|steps?|how to make( it)?)\b/i;
const HEAD_SKIP = /^(notes?|astuces?|tips?|nutrition|macros?|calories|abonne|follow|save this|enregistre)\b/i;

const PICTO = /[\p{Extended_Pictographic}️‍⃣]/gu;

const words = (s) => s.split(/\s+/).filter(Boolean).length;

function clean(line) {
  return line
    .replace(/https?:\/\/\S+/g, "")
    .replace(/#[\p{L}\p{N}_]+/gu, "")
    .replace(/@[\w.]+/g, "")
    .replace(/^[\s•·▪▫◦‣⁃*\-–—>→✔✓☑️|]+/u, "")
    .replace(PICTO, " ")
    .replace(/^[\s•·*\-–—>→|]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const looksLikeIngredient = (l) => {
  if (words(l) > 12) return false;
  if (parseLine(l).qty !== null) return true;
  return words(l) <= 5 && guessAisle(l) !== "autre";
};
const STEP_NUM = /^(?:(?:[ée]tape|step)\s*)?(\d{1,2})\s*[.):\]-]\s+(.+)$/i;
const looksLikeStep = (l) => words(l) >= 8 || (STEP_NUM.test(l) && words(l) > 3);

/* « 2 tasses de riz, 1 oignon, 3 gousses d'ail » sur une ligne → trois. */
function pushIngredients(line, out) {
  const parts = line.split(/\s*[,;]\s*|\s+\+\s+/).filter(Boolean);
  if (parts.length >= 3 && line.length > 40) out.push(...parts.map((p) => p.trim()).filter((p) => p.length < 80));
  else out.push(line);
}

function titleFrom(cands) {
  for (let t of cands) {
    t = t.replace(/^(recette|recipe)\s*[:：-]\s*/i, "").split(/\s[|•]\s|\s[-–—]\s/)[0]
      /* « … prêt en 25 min ! Pour 4 » : le temps et les portions ont leurs champs. */
      .replace(/\s*(pr[êe]te? en|ready in|en seulement|in just|in under|serves|makes|pour \d|\d+\s*(min|minutes|portions?|personnes?|servings?)).*$/i, "")
      .replace(/[\s!.,:;?]+$/, "").trim();
    if (!t || words(t) > 14) continue;
    if (t.length > 60) t = t.slice(0, 60).replace(/\s+\S*$/, "") + "…";
    return t[0].toUpperCase() + t.slice(1);
  }
  return "";
}

export function parseRecipeText(raw) {
  const text = String(raw || "").replace(/\r/g, "").replace(/(\d)️?⃣/g, "$1. ");
  const source = (text.match(/https?:\/\/[^\s)]+/) || [""])[0];

  let section = null;
  const ing = [], steps = [], other = [];

  for (let line of text.split("\n")) {
    let l = clean(line);
    if (!l) continue;

    /* En-tête ? Ce qui suit les deux-points sur la même ligne compte. */
    const bare = l.replace(/[:：\-–]+$/, "").trim();
    let header = null;
    for (const [re, sec] of [[HEAD_ING, "ing"], [HEAD_STEP, "step"], [HEAD_SKIP, "skip"]]) {
      const m = bare.match(re);
      if (m) { header = sec; l = l.slice(m[0].length).replace(/^\s*(\([^)]*\))?\s*[:：\-–]?\s*/, ""); break; }
    }
    if (header) section = header;
    if (!l || section === "skip") continue;

    const num = l.match(STEP_NUM);
    /* Liste d'ingrédients puis « 1. Faire fondre… » sans en-tête : on passe aux étapes. */
    if (section === "ing" && ing.length &&
        ((num && words(num[2]) > 3) || (looksLikeStep(l) && !looksLikeIngredient(l)))) section = "step";

    if (section === "ing") pushIngredients(l, ing);
    else if (section === "step") steps.push(num ? num[2] : l);
    else if (num && words(num[2]) > 3) steps.push(num[2]);
    else if (looksLikeIngredient(l) && (ing.length || other.length)) pushIngredients(l, ing);
    else if (!ing.length && !steps.length) other.push(l);
    else if (words(l) >= 6) steps.push(l);
  }

  /* Portions et temps : cherchés dans tout le texte. */
  const serv = text.match(/(\d{1,2})\s*(portions?|personnes?|pers\b|servings?|people)/i)
            || text.match(/\b(?:pour|serves|makes)\s+(\d{1,2})\b/i);
  let time = 0;
  const t = text.match(/(?:pr[êe]t en|total|temps|ready in|takes?|en seulement|in just)\D{0,20}?(\d{1,3})\s*(min|minutes|h|heures?|hours?)\b/i)
         || other.join(" ").match(/(\d{1,3})\s*(min|minutes)\b/i);
  if (t) time = /^h/i.test(t[2]) ? +t[1] * 60 : +t[1];

  const name = titleFrom(other) || "Recette importée";
  return {
    name,
    emoji: guessEmoji(name, ing.join(" ").replace(/c\. à (soupe|thé)/gi, "")),
    servings: serv ? Math.min(20, +serv[1]) : 4,
    time,
    ingredients: ing,
    steps,
    source: /tiktok|instagram|youtu|facebook|pinterest/i.test(source) ? source : "",
  };
}
