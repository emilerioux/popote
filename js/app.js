/* ============================================================
   app.js — les trois onglets et leurs feuilles.
   Tout se redessine depuis store.state à chaque changement : les
   données sont petites, et c'est ce qui garde la synchro simple
   (une mise à jour distante = un rendu, rien d'autre à faire).
   ============================================================ */

import * as store from "./store.js";
import * as sync from "./sync.js";
import * as photos from "./photos.js";
import { DAYS, mondayOf, addDays, iso, shortDate, parseLine, guessAisle, scaleLine,
         groceryFor, AISLES, TAGS, FILTERS, tagsOf, matchesFilter, suggest, money,
         unitPrice, guessEmoji, canon } from "./data.js";
import { parseRecipeText } from "./import.js";
import { openCook } from "./cook.js";
import { pop, buzz } from "./motion.js";
import { openSheet, closeSheet, toast, esc } from "./ui.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S = () => store.state;

const EMOJIS = ["🍝", "🍗", "🌮", "🍛", "🥘", "🍲", "🥗", "🐟", "🍔", "🍕", "🥩", "🥞", "🍜", "🌯", "🥧", "🍳"];
const MAX_PORTIONS = 12;

let week = mondayOf(new Date());
let recQuery = "";
let recFilter = "";
let pantryOpen = false;

/* Vignette : la photo si la recette en a une, sinon l'emoji. */
function thumb(r, cls) {
  const src = photos.get(r.id);
  return src
    ? `<span class="${cls} has-photo"><img src="${src}" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="${cls}">${esc(r.emoji || "🍽️")}</span>`;
}
const starsText = (n) => (n ? "★".repeat(n) : "");

/* Rangée de filtres (Favoris, Rapide, étiquettes). */
function filterChips(active, counts) {
  return `<button class="fchip${active ? "" : " on"}" data-filter="">Toutes</button>` +
    FILTERS.filter((f) => counts[f.id]).map((f) =>
      `<button class="fchip${active === f.id ? " on" : ""}" data-filter="${f.id}">${f.emoji} ${f.label}</button>`).join("");
}
function filterCounts() {
  const c = {};
  for (const r of Object.values(S().recipes)) for (const f of FILTERS) if (matchesFilter(r, f.id)) c[f.id] = (c[f.id] || 0) + 1;
  return c;
}
let tab = "semaine";
try { tab = localStorage.getItem("pp-tab") || "semaine"; } catch (_) {}

const recipeList = () =>
  Object.values(S().recipes).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
const portions = (n) => `${n} portion${n > 1 ? "s" : ""}`;
const todayIso = () => iso(new Date());

/* ══ Onglets ══════════════════════════════════════════════════ */

function showTab(t, { focus = false } = {}) {
  tab = t;
  try { localStorage.setItem("pp-tab", t); } catch (_) {}
  for (const p of $$(".page")) {
    const on = p.dataset.tab === t;
    if (on && p.hidden) {
      p.hidden = false;
      p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
    } else if (!on) p.hidden = true;
  }
  for (const b of $$(".tab")) b.setAttribute("aria-current", b.dataset.tab === t ? "page" : "false");
  if (focus) $(`#page-${t} .page-scroll`).scrollTo({ top: 0, behavior: "smooth" });
}

$("#tabbar").addEventListener("click", (e) => {
  const b = e.target.closest(".tab");
  if (!b) return;
  showTab(b.dataset.tab, { focus: b.dataset.tab === tab });
});

/* Le titre compact apparaît dans la barre quand le grand titre passe dessous. */
for (const p of $$(".page")) {
  const sc = $(".page-scroll", p);
  sc.addEventListener("scroll", () => p.classList.toggle("scrolled", sc.scrollTop > 44), { passive: true });
}

/* ══ Semaine ══════════════════════════════════════════════════ */

function weekRel(mon) {
  const diff = Math.round((mon - mondayOf(new Date())) / 604800000);
  if (diff === 0) return "Cette semaine";
  if (diff === 1) return "Semaine prochaine";
  if (diff === -1) return "Semaine dernière";
  return diff > 0 ? `Dans ${diff} semaines` : `Il y a ${-diff} semaines`;
}

function renderWeek() {
  $("#week-range").textContent = `${shortDate(week)} – ${shortDate(addDays(week, 6))}`;
  $("#week-rel").textContent = weekRel(week);
  const today = todayIso();
  let empty = 0;

  $("#days").innerHTML = DAYS.map((name, i) => {
    const d = addDays(week, i), key = iso(d);
    const p = S().plan[key], r = p && S().recipes[p.r];
    if (!r) empty++;
    const head = `<div class="day-date"><span class="dow">${name.slice(0, 3)}</span><span class="dnum">${d.getDate()}</span></div>`;
    const body = r
      ? `<button class="meal" data-open="${key}">
           ${thumb(r, "meal-emoji")}
           <span class="meal-main"><b>${esc(r.name)}</b><small>${r.time ? `${r.time} min · ` : ""}${portions(p.s || r.servings)}</small></span>
         </button>`
      : `<button class="meal empty" data-pick="${key}">
           <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Choisir un souper
         </button>`;
    return `<div class="day${key === today ? " today" : ""}" data-day="${key}" aria-label="${name}">${head}${body}</div>`;
  }).join("");

  $("#fill-week").hidden = empty === 0 || recipeList().length === 0;
}

function changeWeek(delta) {
  week = delta === 0 ? mondayOf(new Date()) : addDays(week, 7 * delta);
  renderWeek(); renderGrocery();
  pop($("#week-label"), 0.96, 0.7);
}
$("#week-prev").addEventListener("click", () => changeWeek(-1));
$("#week-next").addEventListener("click", () => changeWeek(1));
$("#week-label").addEventListener("click", () => changeWeek(0));

$("#days").addEventListener("click", (e) => {
  const pick = e.target.closest("[data-pick]");
  if (pick) return openPicker(pick.dataset.pick);
  const open = e.target.closest("[data-open]");
  if (open) {
    const p = S().plan[open.dataset.open];
    if (p) openRecipe(p.r, { day: open.dataset.open });
  }
});

function dayName(key) {
  const [y, m, d] = key.split("-").map(Number);
  return DAYS[(new Date(y, m - 1, d).getDay() + 6) % 7].toLowerCase();
}

function planDay(key, recipeId, s) {
  const r = S().recipes[recipeId];
  store.set("plan", key, { r: recipeId, s: s || r.servings || 4 });
  buzz(8);
  requestAnimationFrame(() => pop($(`.day[data-day="${key}"] .meal`), 1.05, 0.6));
}

/* Suggérer : tirage pondéré (favoris plus souvent, récents presque
   jamais), sans doublon dans la semaine. */
$("#fill-week").addEventListener("click", () => {
  const used = new Set();
  const empties = [];
  for (let i = 0; i < 7; i++) {
    const key = iso(addDays(week, i)), p = S().plan[key];
    if (p && S().recipes[p.r]) used.add(p.r); else empties.push(key);
  }
  let pool = suggest(S(), week, empties.length, used);
  if (!pool.length) pool = suggest(S(), week, empties.length);
  const ops = empties.slice(0, pool.length).map((key, i) => ["plan", key, { r: pool[i].id, s: pool[i].servings || 4 }]);
  if (!ops.length) return;
  store.apply(ops);
  buzz(12);
  ops.forEach(([, key], i) => setTimeout(() => pop($(`.day[data-day="${key}"] .meal`), 1.05, 0.6), i * 45));
  toast(`${ops.length} souper${ops.length > 1 ? "s" : ""} suggéré${ops.length > 1 ? "s" : ""}`, {
    action: "Annuler", onAction: () => store.apply(ops.map(([c, k]) => [c, k, undefined])),
  });
});

/* ── Feuille : choisir une recette pour un jour ── */

function openPicker(dayKey) {
  const cur = S().plan[dayKey];
  let q = "", filter = "";
  openSheet(`
    <div class="sheet-head">
      <button class="head-btn" data-close>Annuler</button>
      <span class="sheet-title">Souper de ${dayName(dayKey)}</span>
      <span class="head-btn" aria-hidden="true"></span>
    </div>
    <div class="sheet-body">
      <label class="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
        <input id="pick-q" type="search" placeholder="Rechercher" autocomplete="off" autofocus>
      </label>
      <div class="filters" id="pick-filters"></div>
      <div class="pick-list" id="pick-list"></div>
      <button class="tile-btn" id="pick-new">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Nouvelle recette
      </button>
    </div>`, (el) => {
    const list = $("#pick-list", el);
    const draw = () => {
      $("#pick-filters", el).innerHTML = filterChips(filter, filterCounts());
      const rs = filterRecipes(q, filter);
      list.innerHTML = rs.map((r) => `
        <button class="pick-row${cur && cur.r === r.id ? " current" : ""}" data-id="${r.id}">
          ${thumb(r, "meal-emoji")}
          <span class="meal-main"><b>${esc(r.name)}</b><small>${metaLine(r)}</small></span>
          ${cur && cur.r === r.id ? `<svg class="tick" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>` : ""}
        </button>`).join("") || `<p class="empty-note">Aucune recette trouvée.</p>`;
    };
    draw();
    $("#pick-q", el).addEventListener("input", (e) => { q = e.target.value; draw(); });
    $("#pick-filters", el).addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]");
      if (b) { filter = b.dataset.filter; draw(); }
    });
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-id]");
      if (!b) return;
      closeSheet();
      planDay(dayKey, b.dataset.id);
    });
    $("#pick-new", el).addEventListener("click", () => openEditor(null, { planOn: dayKey }));
  });
}

/* ══ Recettes ═════════════════════════════════════════════════ */

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/* Recherche bilingue : « garlic » trouve les recettes avec de l'ail,
   « crevettes » trouve celles qui disent « shrimp ». On compare le
   texte tel quel ET les noms canoniques des deux côtés. */
function filterRecipes(q, filter = "") {
  const n = norm(q), c = norm(canon(q).name);
  const hit = (s) => s.includes(n) || (c.length > 1 && s.includes(c));
  return recipeList().filter((r) => matchesFilter(r, filter) &&
    (!n || hit(norm(r.name)) || (r.ingredients || []).some((l) =>
      hit(norm(l)) || hit(norm(canon(parseLine(l).name).name)))));
}

/* « 25 min · ★★★★ · Végé » */
function metaLine(r) {
  const bits = [];
  if (r.time) bits.push(`${r.time} min`);
  if (r.rating) bits.push(`<span class="stars-inline">${starsText(r.rating)}</span>`);
  const t = tagsOf(r).map((id) => TAGS.find((x) => x.id === id)?.label).filter(Boolean);
  if (t.length) bits.push(esc(t.slice(0, 2).join(", ")));
  if (!bits.length) bits.push(portions(r.servings || 4));
  return bits.join(" · ");
}

function renderRecipes() {
  const counts = filterCounts();
  if (recFilter && !counts[recFilter]) recFilter = "";
  $("#rec-filters").innerHTML = filterChips(recFilter, counts);
  const rs = filterRecipes(recQuery, recFilter);
  const planned = new Set();
  for (let i = 0; i < 7; i++) { const p = S().plan[iso(addDays(mondayOf(new Date()), i))]; if (p) planned.add(p.r); }
  $("#rec-list").innerHTML = rs.map((r) => `
    <button class="rec-card" data-id="${r.id}">
      ${thumb(r, "rec-emoji")}
      <span class="meal-main">
        <b>${esc(r.name)}</b>
        <small>${metaLine(r)}</small>
      </span>
      ${planned.has(r.id) ? `<span class="chip">Cette semaine</span>` : ""}
    </button>`).join("")
    || `<p class="empty-note">${recQuery || recFilter ? "Aucune recette ne correspond." : "Aucune recette pour l'instant."}</p>`;
}

$("#rec-search").addEventListener("input", (e) => { recQuery = e.target.value; renderRecipes(); });
$("#rec-filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-filter]");
  if (!b) return;
  recFilter = b.dataset.filter;
  renderRecipes();
});
$("#rec-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]");
  if (b) openRecipe(b.dataset.id);
});
$("#new-recipe").addEventListener("click", () => openEditor(null));
$("#import-recipe").addEventListener("click", () => openImport());

/* ── Feuille : détail d'une recette ──
   Ouverte depuis un jour, le compteur de portions modifie ce jour-là ;
   ouverte depuis la banque, il ne fait que recalculer l'affichage. */
function openRecipe(id, { day } = {}) {
  const r = S().recipes[id];
  if (!r) return;
  const base = r.servings || 4;
  let n = day ? (S().plan[day]?.s || base) : base;
  const photo = photos.get(id);
  const tags = tagsOf(r).map((t) => TAGS.find((x) => x.id === t)).filter(Boolean);

  openSheet(`
    <div class="sheet-head">
      <button class="head-btn" data-close>Fermer</button>
      <span class="sheet-title"></span>
      <button class="head-btn" id="rd-edit">Modifier</button>
    </div>
    <div class="sheet-body">
      ${photo ? `<div class="rd-photo"><img src="${photo}" alt=""></div>` : ""}
      <div class="rd-hero">
        ${photo ? "" : `<span class="rd-emoji">${esc(r.emoji || "🍽️")}</span>`}
        <h2>${esc(r.name)}</h2>
        <p>${[r.time ? `${r.time} min` : "", day ? `souper de ${dayName(day)}` : ""].filter(Boolean).join(" · ")}</p>
        ${tags.length ? `<div class="rd-tags">${tags.map((t) => `<span class="chip">${t.emoji} ${t.label}</span>`).join("")}</div>` : ""}
        <div class="stars" role="radiogroup" aria-label="Ma note">
          ${[1, 2, 3, 4, 5].map((k) => `<button role="radio" data-star="${k}" aria-label="${k} étoile${k > 1 ? "s" : ""}">★</button>`).join("")}
        </div>
      </div>
      <button class="primary-btn wide cook-btn" id="rd-cook">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 13.5h12M7 13.5v4.5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4.5M9 10c0-1.5 1-1.5 1-3M13 10c0-1.5 1-1.5 1-3"/></svg>
        Cuisiner
      </button>
      <div class="rd-actions">
        ${day
          ? `<button class="ghost-btn" id="rd-swap">Changer</button>
             <button class="ghost-btn danger" id="rd-remove">Retirer</button>`
          : `<button class="ghost-btn" id="rd-plan">Planifier un soir</button>`}
      </div>
      <section class="rd-sec">
        <header class="rd-sec-head">
          <h3>Ingrédients</h3>
          <div class="stepper">
            <button id="rd-dec" aria-label="Moins de portions"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>
            <span id="rd-n"></span>
            <button id="rd-inc" aria-label="Plus de portions"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></button>
          </div>
        </header>
        <ul class="ing-list" id="rd-ing"></ul>
      </section>
      ${(r.steps || []).length ? `
      <section class="rd-sec">
        <header class="rd-sec-head"><h3>Étapes</h3></header>
        <ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      </section>` : ""}
      <section class="rd-sec">
        <header class="rd-sec-head"><h3>Mes notes</h3></header>
        <textarea class="note-box" id="rd-note" rows="3" placeholder="Ex. moins de sel la prochaine fois, doubler la sauce…">${esc(r.note || "")}</textarea>
      </section>
      ${r.source ? `<a class="ghost-btn wide source-link" href="${esc(r.source)}" target="_blank" rel="noopener">Voir la vidéo d'origine ↗</a>` : ""}
    </div>`, (el) => {
    const draw = () => {
      $("#rd-n", el).textContent = portions(n);
      $("#rd-dec", el).disabled = n <= 1;
      $("#rd-inc", el).disabled = n >= MAX_PORTIONS;
      $("#rd-ing", el).innerHTML = (r.ingredients || []).map((l) => {
        const aisle = AISLES.find((a) => a.id === guessAisle(parseLine(l).name));
        /* Ligne en anglais : on montre sous quel nom elle ira à l'épicerie. */
        const c = canon(parseLine(l).name);
        return `<li><span class="ing-dot" title="${esc(aisle.name)}">${aisle.emoji}</span><span class="ing-text">${esc(scaleLine(l, n / base))}${c.translated ? `<small class="ing-fr">${esc(c.name)}</small>` : ""}</span></li>`;
      }).join("");
    };
    draw();

    /* Étoiles : toucher la note actuelle l'efface. */
    const drawStars = (k) => $$("[data-star]", el).forEach((b) => {
      b.classList.toggle("on", +b.dataset.star <= k);
      b.setAttribute("aria-checked", String(+b.dataset.star === k));
    });
    drawStars(r.rating || 0);
    $(".stars", el).addEventListener("click", (e) => {
      const b = e.target.closest("[data-star]");
      if (!b) return;
      const cur = S().recipes[id]; if (!cur) return;
      const k = +b.dataset.star === (cur.rating || 0) ? 0 : +b.dataset.star;
      store.set("recipes", id, { ...cur, rating: k || undefined });
      drawStars(k); buzz(8); pop(b, 1.35, 0.45);
    });

    /* La note se garde en quittant le champ (pas à chaque lettre : la
       synchro n'enverrait qu'une rafale de versions intermédiaires). */
    $("#rd-note", el).addEventListener("change", (e) => {
      const cur = S().recipes[id]; if (!cur) return;
      store.set("recipes", id, { ...cur, note: e.target.value.trim() || undefined });
      toast("Note enregistrée");
    });

    const step = (d) => {
      n = Math.max(1, Math.min(MAX_PORTIONS, n + d));
      draw(); pop($("#rd-n", el), 1.08, 0.6);
      if (day && S().plan[day]) store.set("plan", day, { ...S().plan[day], s: n });
    };
    $("#rd-dec", el).addEventListener("click", () => step(-1));
    $("#rd-inc", el).addEventListener("click", () => step(1));
    $("#rd-edit", el).addEventListener("click", () => openEditor(id));
    $("#rd-cook", el).addEventListener("click", () => {
      closeSheet();
      openCook(S().recipes[id], {
        portions: n,
        onRate: (k) => {
          const cur = S().recipes[id]; if (!cur) return;
          store.set("recipes", id, { ...cur, rating: k || undefined });
          if (k) toast(`${starsText(k)} — noté !`);
        },
      });
    });
    if (day) {
      $("#rd-swap", el).addEventListener("click", () => openPicker(day));
      $("#rd-remove", el).addEventListener("click", () => {
        const prev = S().plan[day];
        closeSheet();
        store.set("plan", day, undefined);
        toast(`Souper de ${dayName(day)} retiré`, { action: "Annuler", onAction: () => store.set("plan", day, prev) });
      });
    } else {
      $("#rd-plan", el).addEventListener("click", () => openDayChooser(id));
    }
  });
}

/* ── Feuille : sur quel soir planifier ── */
function openDayChooser(id) {
  const r = S().recipes[id];
  openSheet(`
    <div class="sheet-head">
      <button class="head-btn" id="dc-back">Retour</button>
      <span class="sheet-title">Quel soir ?</span>
      <span class="head-btn" aria-hidden="true"></span>
    </div>
    <div class="sheet-body">
      <p class="sheet-sub">${esc(r.emoji || "")} ${esc(r.name)} · semaine du ${shortDate(week)}</p>
      <div class="pick-list">
        ${DAYS.map((name, i) => {
          const key = iso(addDays(week, i)), p = S().plan[key], cur = p && S().recipes[p.r];
          return `<button class="pick-row" data-day="${key}">
            <span class="day-date small"><span class="dow">${name.slice(0, 3)}</span><span class="dnum">${addDays(week, i).getDate()}</span></span>
            <span class="meal-main"><b>${name}</b><small>${cur ? `Remplace : ${esc(cur.name)}` : "Libre"}</small></span>
          </button>`;
        }).join("")}
      </div>
    </div>`, (el) => {
    $("#dc-back", el).addEventListener("click", () => openRecipe(id));
    $(".pick-list", el).addEventListener("click", (e) => {
      const b = e.target.closest("[data-day]");
      if (!b) return;
      closeSheet();
      planDay(b.dataset.day, id);
      toast(`${r.name} → ${dayName(b.dataset.day)}`);
    });
  });
}

/* ── Feuille : importer depuis TikTok / Reels / un site ── */
function openImport() {
  openSheet(`
    <div class="sheet-head">
      <button class="head-btn" data-close>Annuler</button>
      <span class="sheet-title">Importer une recette</span>
      <button class="head-btn strong" id="im-go" disabled>Suivant</button>
    </div>
    <div class="sheet-body">
      <ol class="how">
        <li>Dans TikTok ou Instagram, ouvre la description de la vidéo et <b>copie le texte</b>
            (appui long → Copier). Tu peux aussi copier le lien, il sera gardé dans la recette.</li>
        <li>Colle tout ici : Popote trouve le titre, les ingrédients et les étapes.</li>
        <li>Tu vérifies dans l'éditeur, puis OK.</li>
      </ol>
      <button class="ghost-btn wide" id="im-paste">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="4" width="10" height="4" rx="1.5"/><path d="M8 6H6.5A1.5 1.5 0 0 0 5 7.5v11A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 17.5 6H16"/></svg>
        Coller depuis le presse-papiers
      </button>
      <label class="field"><span>Texte de la recette</span>
        <textarea id="im-text" rows="10" placeholder="Pâtes crémeuses au poulet 🍝&#10;Ingrédients :&#10;400 g de penne&#10;2 poitrines de poulet&#10;…&#10;Préparation :&#10;1. Cuire les pâtes…"></textarea>
      </label>
      <p class="note" id="im-hint"></p>
    </div>`, (el) => {
    const ta = $("#im-text", el), go = $("#im-go", el), hint = $("#im-hint", el);
    const check = () => {
      const v = ta.value.trim();
      const onlyLink = /^https?:\/\/\S+$/.test(v);
      go.disabled = !v || onlyLink;
      if (onlyLink) {
        hint.textContent = "Le lien seul ne suffit pas : TikTok et Instagram ne laissent pas lire la vidéo. Copie aussi le texte de la description.";
      } else if (v) {
        const d = parseRecipeText(v);
        hint.textContent = `Trouvé : ${d.ingredients.length} ingrédient${d.ingredients.length > 1 ? "s" : ""}, ${d.steps.length} étape${d.steps.length > 1 ? "s" : ""}.`
          + (d.ingredients.length ? "" : " Si la recette est seulement dite dans la vidéo, écris les ingrédients un par ligne.");
      } else hint.textContent = "";
    };
    ta.addEventListener("input", check);
    $("#im-paste", el).addEventListener("click", async () => {
      try {
        const t = await navigator.clipboard.readText();
        if (t) { ta.value = ta.value ? `${ta.value}\n${t}` : t; check(); pop(ta, 1.02, 0.7); }
      } catch (_) {
        toast("Colle avec un appui long dans le champ");
        ta.focus();
      }
    });
    go.addEventListener("click", () => {
      const d = parseRecipeText(ta.value);
      openEditor(null, { draft: d });
      toast("Vérifie ce qui a été trouvé, puis OK");
    });
  });
}

/* ── Feuille : créer / modifier une recette ──
   draft = recette pré-remplie (import) pas encore enregistrée. */
function openEditor(id, { planOn, draft } = {}) {
  const r = id ? S().recipes[id] : null;
  const src = r || draft || null;
  let tags = new Set(r ? tagsOf(r) : []);
  let photo = id ? photos.get(id) : "";

  openSheet(`
    <div class="sheet-head">
      <button class="head-btn" data-close>Annuler</button>
      <span class="sheet-title">${r ? "Modifier" : draft ? "Recette importée" : "Nouvelle recette"}</span>
      <button class="head-btn strong" id="ed-save">OK</button>
    </div>
    <div class="sheet-body editor">
      <div class="photo-pick" id="ed-photo"></div>
      <div class="emoji-row">
        <input id="ed-emoji" class="emoji-input" value="${esc(src?.emoji || "🍲")}" aria-label="Emoji" maxlength="8">
        <div class="emoji-quick">${EMOJIS.map((e) => `<button type="button" data-e="${e}">${e}</button>`).join("")}</div>
      </div>
      <label class="field"><span>Nom</span>
        <input id="ed-name" value="${esc(src?.name || "")}" placeholder="Ex. Soupe won-ton" autocomplete="off" ${src ? "" : "autofocus"}>
      </label>
      <div class="field-row">
        <label class="field"><span>Portions</span>
          <input id="ed-serv" type="number" inputmode="numeric" min="1" max="20" value="${src?.servings || 4}">
        </label>
        <label class="field"><span>Temps (min)</span>
          <input id="ed-time" type="number" inputmode="numeric" min="0" max="600" value="${src?.time || ""}" placeholder="30">
        </label>
      </div>
      <div class="field"><span>Étiquettes</span>
        <div class="filters wrap" id="ed-tags">${TAGS.map((t) =>
          `<button type="button" class="fchip${tags.has(t.id) ? " on" : ""}" data-tag="${t.id}" aria-pressed="${tags.has(t.id)}">${t.emoji} ${t.label}</button>`).join("")}
        </div>
      </div>
      <label class="field"><span>Ingrédients <em>un par ligne</em></span>
        <textarea id="ed-ing" rows="7" placeholder="400 g de poulet&#10;1 oignon&#10;2 c. à soupe d'huile d'olive">${esc((src?.ingredients || []).join("\n"))}</textarea>
      </label>
      <div class="ing-preview" id="ed-prev" aria-live="polite"></div>
      <label class="field"><span>Étapes <em>une par ligne</em></span>
        <textarea id="ed-steps" rows="5" placeholder="Couper les légumes…">${esc((src?.steps || []).join("\n"))}</textarea>
      </label>
      <label class="field"><span>Lien de la vidéo <em>facultatif</em></span>
        <input id="ed-src" type="url" inputmode="url" value="${esc(src?.source || "")}" placeholder="https://www.tiktok.com/…" autocomplete="off">
      </label>
      ${r ? `<button class="ghost-btn danger wide" id="ed-del">Supprimer la recette</button>` : ""}
    </div>`, (el) => {
    const name = $("#ed-name", el), save = $("#ed-save", el), ing = $("#ed-ing", el);
    const lines = (t) => t.split("\n").map((s) => s.trim()).filter(Boolean);
    const validate = () => { save.disabled = !name.value.trim(); };

    /* Aperçu en direct : on montre comment chaque ligne est comprise,
       pour qu'une faute de frappe se voie avant d'arriver à l'épicerie. */
    const preview = () => {
      const ls = lines(ing.value);
      $("#ed-prev", el).innerHTML = ls.length ? ls.map((l) => {
        const p = parseLine(l), a = AISLES.find((x) => x.id === guessAisle(p.name));
        return `<span class="prev-chip" title="${esc(a.name)}">${a.emoji} ${esc(p.name ? canon(p.name).name : l)}</span>`;
      }).join("") : "";
    };
    validate(); preview();
    name.addEventListener("input", validate);
    ing.addEventListener("input", preview);

    /* Photo : prise sur le moment, ou une capture d'écran de la vidéo. */
    const drawPhoto = () => {
      $("#ed-photo", el).innerHTML = photo
        ? `<img src="${photo}" alt=""><div class="photo-actions">
             <label class="photo-btn">Changer<input type="file" accept="image/*" hidden></label>
             <button type="button" class="photo-btn" id="ph-del">Retirer</button></div>`
        : `<label class="photo-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.5"/></svg>
             Ajouter une photo<input type="file" accept="image/*" hidden></label>`;
      $("#ed-photo input", el).addEventListener("change", async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try { photo = await photos.compress(f); drawPhoto(); pop($("#ed-photo", el), 1.02, 0.7); }
        catch (_) { toast("Impossible de lire cette image"); }
      });
      $("#ph-del", el)?.addEventListener("click", () => { photo = ""; drawPhoto(); });
    };
    drawPhoto();

    $("#ed-tags", el).addEventListener("click", (e) => {
      const b = e.target.closest("[data-tag]");
      if (!b) return;
      const t = b.dataset.tag;
      tags.has(t) ? tags.delete(t) : tags.add(t);
      b.classList.toggle("on", tags.has(t));
      b.setAttribute("aria-pressed", String(tags.has(t)));
      pop(b, 1.08, 0.55);
    });

    $(".emoji-quick", el).addEventListener("click", (e) => {
      const b = e.target.closest("[data-e]");
      if (!b) return;
      $("#ed-emoji", el).value = b.dataset.e;
      pop($("#ed-emoji", el), 1.15, 0.5);
    });

    save.addEventListener("click", () => {
      if (!name.value.trim()) return;
      const rid = r?.id || "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const recipe = {
        ...(r || {}),
        id: rid,
        name: name.value.trim(),
        emoji: [...$("#ed-emoji", el).value.trim()].slice(0, 2).join("") || guessEmoji(name.value),
        servings: Math.max(1, Math.min(20, parseInt($("#ed-serv", el).value, 10) || 4)),
        time: Math.max(0, parseInt($("#ed-time", el).value, 10) || 0),
        tags: TAGS.map((t) => t.id).filter((t) => tags.has(t)),
        ingredients: lines(ing.value),
        steps: lines($("#ed-steps", el).value),
        source: /^https?:\/\//.test($("#ed-src", el).value.trim()) ? $("#ed-src", el).value.trim() : undefined,
        updated: Date.now(),
      };
      store.set("recipes", rid, recipe);
      if (photo) photos.put(rid, photo); else photos.del(rid);
      if (planOn) { closeSheet(); planDay(planOn, rid); return; }
      openRecipe(rid);
      toast(r ? "Recette mise à jour" : "Recette ajoutée");
    });

    if (r) $("#ed-del", el).addEventListener("click", () => {
      closeSheet();
      store.set("recipes", r.id, undefined);
      toast(`« ${r.name} » supprimée`, { action: "Annuler", onAction: () => store.set("recipes", r.id, r) });
    });
  });
}

/* ══ Épicerie ═════════════════════════════════════════════════ */

const X_ICON = `<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg>`;

function groceryRow(it) {
  return `
    <div class="g-row${it.done ? " done" : ""}">
      <button class="g-main" data-key="${esc(it.key)}" aria-pressed="${it.done}">
        <span class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>
        <span class="g-text">
          <b>${esc(it.name)}</b>
          ${it.from.length ? `<small>${esc(it.from.join(" · "))}</small>` : `<small>Ajouté à la main</small>`}
        </span>
      </button>
      <button class="g-side" data-price="${esc(it.key)}" aria-label="Prix de ${esc(it.name)}">
        <span class="g-qty">${esc(it.qtyText)}</span>
        <span class="g-price${it.price === null ? " none" : ""}">${it.price === null ? "+ prix" : money(it.price)}</span>
      </button>
      ${it.extra ? `<button class="g-del" data-del="${it.extra}" aria-label="Retirer ${esc(it.name)}">${X_ICON}</button>` : ""}
    </div>`;
}

function renderGrocery() {
  const g = groceryFor(S(), week);
  const left = g.total - g.done;
  const rel = weekRel(week).toLowerCase();
  $("#groc-sub").textContent = g.total
    ? `${rel[0].toUpperCase() + rel.slice(1)} · ${g.meals} souper${g.meals > 1 ? "s" : ""} · ${left ? `${left} à prendre` : "tout est pris 🎉"}`
    : "";
  $("#groc-progress").hidden = !g.total;
  $("#groc-progress span").style.transform = `scaleX(${g.total ? g.done / g.total : 0})`;
  $("#groc-foot").hidden = !g.total && !g.pantry.length;

  /* Budget : le total des prix connus ; on dit combien d'articles n'en ont pas. */
  const bud = $("#groc-budget");
  bud.hidden = !g.total;
  bud.innerHTML = `<span>Budget estimé</span><b>≈ ${money(g.budget)}</b>` +
    (g.unpriced ? `<small>${g.unpriced} article${g.unpriced > 1 ? "s" : ""} sans prix</small>` : `<small>tous les prix connus</small>`);

  const badge = $("#groc-badge");
  badge.hidden = !left || week.getTime() !== mondayOf(new Date()).getTime();
  badge.textContent = left > 99 ? "99+" : left;

  const main = g.groups.map((gr) => `
    <section class="aisle">
      <header class="aisle-head">
        <span>${gr.emoji} ${gr.name}</span>
        <small>${gr.items.filter((i) => i.done).length}/${gr.items.length}</small>
      </header>
      <div class="aisle-card">${gr.items.map(groceryRow).join("")}</div>
    </section>`).join("");

  /* Ce qu'on a toujours : replié, mais visible — rien ne disparaît en silence. */
  const pantry = g.pantry.length ? `
    <section class="aisle pantry${pantryOpen ? " open" : ""}">
      <button class="aisle-head pantry-toggle" id="pantry-toggle" aria-expanded="${pantryOpen}">
        <span>🏠 Déjà à la maison</span>
        <small>${g.pantry.length} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></small>
      </button>
      ${pantryOpen ? `<div class="aisle-card">${g.pantry.map((it) => `
        <div class="g-row pantry-row">
          <span class="g-main"><span class="g-text"><b>${esc(it.name)}</b><small>${esc(it.from.join(" · "))}</small></span></span>
          <button class="ghost-mini" data-unpantry="${esc(it.k)}">Il en manque</button>
        </div>`).join("")}</div>` : ""}
    </section>` : "";

  $("#groc-list").innerHTML = (main || (g.pantry.length ? "" : `<div class="empty-state">
          <span class="empty-emoji">🧺</span>
          <b>Ta liste est vide</b>
          <p>Planifie des soupers dans l'onglet Semaine : les ingrédients s'ajoutent ici tout seuls, additionnés et classés par rayon.</p>
        </div>`)) + pantry;
}

const findItem = (key) => {
  const g = groceryFor(S(), week);
  return [...g.groups.flatMap((x) => x.items), ...g.pantry].find((i) => i.key === key);
};

$("#groc-list").addEventListener("click", (e) => {
  const del = e.target.closest("[data-del]");
  if (del) {
    const id = del.dataset.del, prev = S().extras[id];
    store.apply([["extras", id, undefined], ["checked", `x|${id}`, undefined]]);
    toast("Article retiré", { action: "Annuler", onAction: () => store.set("extras", id, prev) });
    return;
  }
  const price = e.target.closest("[data-price]");
  if (price) { const it = findItem(price.dataset.price); if (it) openPrice(it); return; }
  if (e.target.closest("#pantry-toggle")) { pantryOpen = !pantryOpen; renderGrocery(); return; }
  const un = e.target.closest("[data-unpantry]");
  if (un) {
    const k = un.dataset.unpantry, prev = S().pantry[k];
    store.set("pantry", k, undefined);
    toast(`${prev?.name || "Article"} remis dans la liste`, { action: "Annuler", onAction: () => store.set("pantry", k, prev) });
    return;
  }
  const b = e.target.closest("[data-key]");
  if (!b) return;
  const key = b.dataset.key, done = !S().checked[key];
  store.set("checked", key, done || undefined);
  if (done) buzz(8);
  const nb = $$("#groc-list [data-key]").find((x) => x.dataset.key === key);
  if (nb) pop($(".check", nb), done ? 1.25 : 0.85, 0.5);
});

$("#add-extra").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#extra-input"), line = input.value.trim();
  if (!line) return;
  const id = "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  store.set("extras", id, { line, t: Date.now() });
  input.value = "";
});

$("#groc-reset").addEventListener("click", () => {
  const g = groceryFor(S(), week);
  const ops = g.groups.flatMap((gr) => gr.items).filter((i) => i.done).map((i) => ["checked", i.key, undefined]);
  if (!ops.length) return;
  store.apply(ops);
  toast("Tout est décoché", { action: "Annuler", onAction: () => store.apply(ops.map(([c, k]) => [c, k, true])) });
});

$("#groc-share").addEventListener("click", async () => {
  const g = groceryFor(S(), week);
  const text = g.groups.map((gr) =>
    `${gr.emoji} ${gr.name}\n` + gr.items.filter((i) => !i.done)
      .map((i) => `- ${i.name}${i.qtyText ? ` (${i.qtyText})` : ""}`).join("\n")
  ).filter((s) => s.includes("\n- ")).join("\n\n");
  const full = `Épicerie — semaine du ${shortDate(week)}\n\n${text || "Tout est déjà pris !"}`;
  try {
    if (navigator.share) await navigator.share({ title: "Liste d'épicerie", text: full });
    else { await navigator.clipboard.writeText(full); toast("Liste copiée"); }
  } catch (_) {}
});

$("#groc-pantry").addEventListener("click", () => openPantry());

/* ── Feuille : prix d'un article ──
   On demande le prix comme on le lit en magasin (au kilo, au litre,
   à l'unité), et on le garde par unité de base. */
function openPrice(it) {
  const per = it.unit === "g" ? { label: "le kilo", k: 1000 }
            : it.unit === "ml" ? { label: "le litre", k: 1000 }
            : it.unit ? { label: `${/^(boîte|gousse|pincée|tranche|botte|c\. )/.test(it.unit) ? "la" : "le"} ${it.unit}`, k: 1 }
            : { label: "l'unité", k: 1 };
  const up = unitPrice(S(), it.k);
  const cur = up && up.u === it.unit ? up.p * per.k : "";
  const mine = !!S().prices[it.k];
  openSheet(`
    <div class="sheet-head">
      <button class="head-btn" data-close>Annuler</button>
      <span class="sheet-title">Prix</span>
      <button class="head-btn strong" id="pr-save">OK</button>
    </div>
    <div class="sheet-body">
      <p class="sheet-sub"><b>${esc(it.name[0].toUpperCase() + it.name.slice(1))}</b>${it.qtyText ? ` · ${esc(it.qtyText)} cette semaine` : ""}</p>
      ${!it.hasQty && !it.unit ? `<p class="note">Pas de quantité dans la recette pour cet article : le prix sera compté une fois.</p>` : ""}
      <label class="field price-field"><span>Prix pour ${per.label}</span>
        <span class="money-input"><input id="pr-val" type="number" inputmode="decimal" step="0.01" min="0" value="${cur ? (Math.round(cur * 100) / 100) : ""}" placeholder="0,00" autofocus><b>$</b></span>
      </label>
      <p class="note" id="pr-est"></p>
      ${up && !mine ? `<p class="note">Prix de départ approximatif — corrige-le avec ce que tu paies vraiment.</p>` : ""}
      ${mine ? `<button class="ghost-btn danger wide" id="pr-clear">Revenir au prix par défaut</button>` : ""}
    </div>`, (el) => {
    const input = $("#pr-val", el);
    const qty = it.hasQty ? it.qty : 1;
    const est = () => {
      const v = parseFloat(String(input.value).replace(",", "."));
      $("#pr-est", el).textContent = v > 0 ? `Pour cette semaine : ≈ ${money((v / per.k) * qty)}` : "";
    };
    est();
    input.addEventListener("input", est);
    const save = () => {
      const v = parseFloat(String(input.value).replace(",", "."));
      if (!(v >= 0)) { closeSheet(); return; }
      /* Un article sans quantité (« sel ») : prix à l'unité, quantité 1. */
      const u = !it.hasQty && !it.unit ? "" : it.unit;
      store.set("prices", it.k, { u, p: v / per.k });
      closeSheet();
      toast("Prix enregistré");
    };
    $("#pr-save", el).addEventListener("click", save);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });
    $("#pr-clear", el)?.addEventListener("click", () => { store.set("prices", it.k, undefined); closeSheet(); });
  });
}

/* ── Feuille : garde-manger ──
   Tout ce que la semaine demande, avec un interrupteur « J'en ai
   toujours ». Les épices et huiles sont proposées d'un coup. */
function openPantry() {
  const draw = (el) => {
    const g = groceryFor(S(), week);
    const items = [...g.groups.flatMap((x) => x.items).filter((i) => !i.extra), ...g.pantry];
    const seen = new Set();
    const uniq = items.filter((i) => !seen.has(i.k) && seen.add(i.k))
      .sort((a, b) => (b.pantry - a.pantry) || a.name.localeCompare(b.name, "fr"));
    const others = Object.entries(S().pantry).filter(([k]) => !seen.has(k));
    /* Épices et huiles au compte-gouttes seulement : la salsa ou le
       sachet à tacos, on les achète pour la recette. */
    const SMALL = new Set(["c. à soupe", "c. à thé", "pincée"]);
    const staples = uniq.filter((i) => !i.pantry && i.aisle === "epices" && (SMALL.has(i.unit) || !i.hasQty));

    $(".sheet-body", el).innerHTML = `
      <p class="note">Ce que tu as toujours sous la main sort de la liste d'épicerie (tu le retrouves en bas, replié).</p>
      ${staples.length ? `<button class="ghost-btn wide" id="pt-staples">🧂 Ajouter les épices et huiles de la semaine (${staples.length})</button>` : ""}
      <div class="aisle-card pantry-list">
        ${uniq.map((i) => `
          <label class="toggle-row">
            <span class="g-text"><b>${esc(i.name)}</b><small>${AISLES.find((a) => a.id === i.aisle).emoji} ${esc(i.from.join(" · "))}</small></span>
            <input type="checkbox" class="switch" data-k="${esc(i.k)}" data-name="${esc(i.name)}" ${i.pantry ? "checked" : ""}>
          </label>`).join("")}
        ${others.map(([k, v]) => `
          <label class="toggle-row">
            <span class="g-text"><b>${esc(v.name)}</b><small>Pas cette semaine</small></span>
            <input type="checkbox" class="switch" data-k="${esc(k)}" data-name="${esc(v.name)}" checked>
          </label>`).join("")}
      </div>
      ${!uniq.length && !others.length ? `<p class="empty-note">Planifie des soupers pour voir leurs ingrédients ici.</p>` : ""}`;

    $$(".switch", el).forEach((sw) => sw.addEventListener("change", () => {
      store.set("pantry", sw.dataset.k, sw.checked ? { name: sw.dataset.name } : undefined);
      buzz(6);
    }));
    $("#pt-staples", el)?.addEventListener("click", () => {
      store.apply(staples.map((i) => ["pantry", i.k, { name: i.name }]));
      buzz(10); draw(el);
    });
  };
  openSheet(`
    <div class="sheet-head">
      <span class="head-btn" aria-hidden="true"></span>
      <span class="sheet-title">Garde-manger</span>
      <button class="head-btn strong" data-close>OK</button>
    </div>
    <div class="sheet-body"></div>`, draw);
}

/* ══ Partage et réglages ══════════════════════════════════════ */

const STATUS = {
  off:        ["Solo", "idle"],
  connecting: ["Connexion…", "busy"],
  saving:     ["Envoi…", "busy"],
  synced:     ["Partagé", "ok"],
  offline:    ["Hors ligne", "warn"],
  error:      ["Erreur de synchro", "bad"],
};

function renderPills(s) {
  const [label, tone] = STATUS[s] || STATUS.off;
  for (const p of $$(".sync-pill")) {
    p.dataset.tone = tone;
    p.innerHTML = `<i></i><span>${label}</span>`;
  }
  const line = $("#set-status");
  if (line) line.textContent = label;
}

document.addEventListener("click", (e) => { if (e.target.closest("[data-open-settings]")) openSettings(); });

function openSettings() {
  const c = sync.code();
  const configured = sync.configured();
  const shareBlock = !configured ? `
      <p class="note">La synchro n'est pas encore branchée : il faut coller la configuration Firebase
      dans <code>firebase-config.js</code> (voir le README). En attendant, tout est gardé sur ce téléphone.</p>`
    : c ? `
      <div class="set-card">
        <div class="set-line"><span>État</span><b id="set-status"></b></div>
        <div class="set-line"><span>Code du foyer</span><code class="code">${c.match(/.{1,4}/g).join(" ")}</code></div>
      </div>
      <button class="primary-btn wide" id="set-invite">Inviter quelqu'un</button>
      <p class="note">La personne ouvre le lien sur son téléphone : vous voyez ensuite le même planning,
      les mêmes recettes et la même liste d'épicerie, en temps réel.</p>
      <button class="ghost-btn wide" id="set-leave">Quitter le foyer</button>`
    : `
      <p class="note">Crée un foyer pour partager ton planning, tes recettes et ta liste d'épicerie
      avec une autre personne — gratuit, en temps réel.</p>
      <button class="primary-btn wide" id="set-create">Créer un foyer partagé</button>
      <form class="add-row" id="set-join">
        <input id="set-code" placeholder="…ou coller un code ou un lien reçu" autocomplete="off">
        <button class="add-btn" aria-label="Rejoindre"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button>
      </form>`;

  openSheet(`
    <div class="sheet-head">
      <span class="head-btn" aria-hidden="true"></span>
      <span class="sheet-title">Partage et réglages</span>
      <button class="head-btn strong" data-close>OK</button>
    </div>
    <div class="sheet-body">
      <h3 class="set-h">Partage</h3>
      ${shareBlock}
      <h3 class="set-h">Données</h3>
      <button class="ghost-btn wide" id="set-starters">Remettre les recettes de départ</button>
      <button class="ghost-btn danger wide" id="set-erase">Tout effacer</button>
      <p class="note center">Popote · v3</p>
    </div>`, (el) => {
    renderPills(sync.getStatus());
    $("#set-create", el)?.addEventListener("click", async () => {
      await sync.connect(sync.newCode());
      openSettings();
    });
    $("#set-join", el)?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = sync.cleanCode($("#set-code", el).value);
      if (v.length < 20) { toast("Ce code n'a pas l'air complet"); return; }
      await sync.connect(v);
      openSettings();
      toast("Foyer rejoint");
    });
    $("#set-invite", el)?.addEventListener("click", async () => {
      const url = sync.shareLink();
      try {
        if (navigator.share) await navigator.share({ title: "Popote", text: "Rejoins notre planning de soupers :", url });
        else { await navigator.clipboard.writeText(url); toast("Lien copié"); }
      } catch (_) {}
    });
    $("#set-leave", el)?.addEventListener("click", () => {
      if (!confirm("Quitter le foyer ? Tes données restent sur ce téléphone, mais ne se synchronisent plus.")) return;
      sync.leave();
      openSettings();
    });
    $("#set-starters", el).addEventListener("click", () => { store.restoreStarters(); toast("Recettes de départ remises"); });
    $("#set-erase", el).addEventListener("click", () => {
      if (!confirm(c ? "Tout effacer, pour toutes les personnes du foyer ?" : "Tout effacer : recettes, planning et épicerie ?")) return;
      store.eraseAll();
      closeSheet();
    });
  });
}

/* ══ Démarrage ════════════════════════════════════════════════ */

function renderAll() { renderWeek(); renderRecipes(); renderGrocery(); }
store.subscribe(renderAll);
photos.onChange(renderAll);
photos.loadAll();
sync.onStatus(renderPills);

/* Les coches des semaines de plus d'un mois ne servent plus à rien. */
function pruneChecks() {
  const limit = iso(addDays(mondayOf(new Date()), -28));
  const ops = Object.keys(S().checked)
    .filter((k) => !k.startsWith("x|") && k.slice(0, 10) < limit)
    .map((k) => ["checked", k, undefined]);
  if (ops.length) store.apply(ops);
}

renderAll();
showTab(["semaine", "recettes", "epicerie"].includes(tab) ? tab : "semaine");

/* Lien d'invitation : ?foyer=CODE */
const invited = new URLSearchParams(location.search).get("foyer");
if (invited) history.replaceState(null, "", location.pathname);
if (invited && sync.configured()) {
  const c = sync.cleanCode(invited);
  if (!sync.code() || sync.code() === c ||
      confirm("Rejoindre ce foyer ? Tu quitteras celui où tu es présentement.")) {
    sync.connect(c).then((ok) => { if (ok && sync.code() === c) toast("Foyer rejoint : vous êtes synchronisés"); pruneChecks(); });
  } else if (sync.code()) sync.connect(sync.code()).then(pruneChecks);
} else if (sync.code()) {
  sync.connect(sync.code()).then(pruneChecks);
} else pruneChecks();

/* Revenir sur l'app le lendemain : « aujourd'hui » et la semaine avancent. */
let lastDay = todayIso();
document.addEventListener("visibilitychange", () => {
  if (document.hidden || todayIso() === lastDay) return;
  if (week.getTime() === mondayOf(new Date(Date.now() - 86400000)).getTime()) week = mondayOf(new Date());
  lastDay = todayIso();
  renderAll();
});
