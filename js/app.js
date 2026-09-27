/* ============================================================
   app.js — les trois onglets et leurs feuilles.
   Tout se redessine depuis store.state à chaque changement : les
   données sont petites, et c'est ce qui garde la synchro simple
   (une mise à jour distante = un rendu, rien d'autre à faire).
   ============================================================ */

import * as store from "./store.js";
import * as sync from "./sync.js";
import { DAYS, mondayOf, addDays, iso, shortDate, parseLine, guessAisle, scaleLine,
         groceryFor, AISLES } from "./data.js";
import { pop, buzz } from "./motion.js";
import { openSheet, closeSheet, toast, esc } from "./ui.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S = () => store.state;

const EMOJIS = ["🍝", "🍗", "🌮", "🍛", "🥘", "🍲", "🥗", "🐟", "🍔", "🍕", "🥩", "🥞", "🍜", "🌯", "🥧", "🍳"];
const MAX_PORTIONS = 12;

let week = mondayOf(new Date());
let recQuery = "";
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
           <span class="meal-emoji">${esc(r.emoji || "🍽️")}</span>
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

/* Suggérer : des recettes au hasard, sans doublon dans la semaine. */
$("#fill-week").addEventListener("click", () => {
  const used = new Set();
  const empties = [];
  for (let i = 0; i < 7; i++) {
    const key = iso(addDays(week, i)), p = S().plan[key];
    if (p && S().recipes[p.r]) used.add(p.r); else empties.push(key);
  }
  let pool = recipeList().filter((r) => !used.has(r.id));
  if (!pool.length) pool = recipeList();
  pool.sort(() => Math.random() - 0.5);
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
      <div class="pick-list" id="pick-list"></div>
      <button class="tile-btn" id="pick-new">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Nouvelle recette
      </button>
    </div>`, (el) => {
    const list = $("#pick-list", el);
    const draw = (q) => {
      const rs = filterRecipes(q);
      list.innerHTML = rs.map((r) => `
        <button class="pick-row${cur && cur.r === r.id ? " current" : ""}" data-id="${r.id}">
          <span class="meal-emoji">${esc(r.emoji || "🍽️")}</span>
          <span class="meal-main"><b>${esc(r.name)}</b><small>${r.time ? `${r.time} min · ` : ""}${portions(r.servings || 4)}</small></span>
          ${cur && cur.r === r.id ? `<svg class="tick" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>` : ""}
        </button>`).join("") || `<p class="empty-note">Aucune recette trouvée.</p>`;
    };
    draw("");
    $("#pick-q", el).addEventListener("input", (e) => draw(e.target.value));
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

function filterRecipes(q) {
  const n = norm(q);
  const all = recipeList();
  if (!n) return all;
  return all.filter((r) => norm(r.name).includes(n) || (r.ingredients || []).some((l) => norm(l).includes(n)));
}
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function renderRecipes() {
  const rs = filterRecipes(recQuery);
  const planned = new Set();
  for (let i = 0; i < 7; i++) { const p = S().plan[iso(addDays(mondayOf(new Date()), i))]; if (p) planned.add(p.r); }
  $("#rec-list").innerHTML = rs.map((r) => `
    <button class="rec-card" data-id="${r.id}">
      <span class="rec-emoji">${esc(r.emoji || "🍽️")}</span>
      <span class="meal-main">
        <b>${esc(r.name)}</b>
        <small>${r.time ? `${r.time} min · ` : ""}${(r.ingredients || []).length} ingrédients</small>
      </span>
      ${planned.has(r.id) ? `<span class="chip">Cette semaine</span>` : ""}
    </button>`).join("")
    || `<p class="empty-note">${recQuery ? "Aucune recette ne correspond." : "Aucune recette pour l'instant."}</p>`;
}

$("#rec-search").addEventListener("input", (e) => { recQuery = e.target.value; renderRecipes(); });
$("#rec-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]");
  if (b) openRecipe(b.dataset.id);
});
$("#new-recipe").addEventListener("click", () => openEditor(null));

/* ── Feuille : détail d'une recette ──
   Ouverte depuis un jour, le compteur de portions modifie ce jour-là ;
   ouverte depuis la banque, il ne fait que recalculer l'affichage. */
function openRecipe(id, { day } = {}) {
  const r = S().recipes[id];
  if (!r) return;
  const base = r.servings || 4;
  let n = day ? (S().plan[day]?.s || base) : base;

  openSheet(`
    <div class="sheet-head">
      <button class="head-btn" data-close>Fermer</button>
      <span class="sheet-title"></span>
      <button class="head-btn" id="rd-edit">Modifier</button>
    </div>
    <div class="sheet-body">
      <div class="rd-hero">
        <span class="rd-emoji">${esc(r.emoji || "🍽️")}</span>
        <h2>${esc(r.name)}</h2>
        <p>${r.time ? `${r.time} min` : ""}${day ? `${r.time ? " · " : ""}souper de ${dayName(day)}` : ""}</p>
      </div>
      <div class="rd-actions">
        ${day
          ? `<button class="ghost-btn" id="rd-swap">Changer</button>
             <button class="ghost-btn danger" id="rd-remove">Retirer</button>`
          : `<button class="primary-btn" id="rd-plan">Planifier un soir</button>`}
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
    </div>`, (el) => {
    const draw = () => {
      $("#rd-n", el).textContent = portions(n);
      $("#rd-dec", el).disabled = n <= 1;
      $("#rd-inc", el).disabled = n >= MAX_PORTIONS;
      $("#rd-ing", el).innerHTML = (r.ingredients || []).map((l) => {
        const aisle = AISLES.find((a) => a.id === guessAisle(parseLine(l).name));
        return `<li><span class="ing-dot" title="${esc(aisle.name)}">${aisle.emoji}</span>${esc(scaleLine(l, n / base))}</li>`;
      }).join("");
    };
    draw();
    const step = (d) => {
      n = Math.max(1, Math.min(MAX_PORTIONS, n + d));
      draw(); pop($("#rd-n", el), 1.08, 0.6);
      if (day && S().plan[day]) store.set("plan", day, { ...S().plan[day], s: n });
    };
    $("#rd-dec", el).addEventListener("click", () => step(-1));
    $("#rd-inc", el).addEventListener("click", () => step(1));
    $("#rd-edit", el).addEventListener("click", () => openEditor(id));
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

/* ── Feuille : créer / modifier une recette ── */
function openEditor(id, { planOn } = {}) {
  const r = id ? S().recipes[id] : null;
  openSheet(`
    <div class="sheet-head">
      <button class="head-btn" data-close>Annuler</button>
      <span class="sheet-title">${r ? "Modifier" : "Nouvelle recette"}</span>
      <button class="head-btn strong" id="ed-save">OK</button>
    </div>
    <div class="sheet-body editor">
      <div class="emoji-row">
        <input id="ed-emoji" class="emoji-input" value="${esc(r?.emoji || "🍲")}" aria-label="Emoji" maxlength="8">
        <div class="emoji-quick">${EMOJIS.map((e) => `<button type="button" data-e="${e}">${e}</button>`).join("")}</div>
      </div>
      <label class="field"><span>Nom</span>
        <input id="ed-name" value="${esc(r?.name || "")}" placeholder="Ex. Soupe won-ton" autocomplete="off" ${r ? "" : "autofocus"}>
      </label>
      <div class="field-row">
        <label class="field"><span>Portions</span>
          <input id="ed-serv" type="number" inputmode="numeric" min="1" max="20" value="${r?.servings || 4}">
        </label>
        <label class="field"><span>Temps (min)</span>
          <input id="ed-time" type="number" inputmode="numeric" min="0" max="600" value="${r?.time || ""}" placeholder="30">
        </label>
      </div>
      <label class="field"><span>Ingrédients <em>un par ligne</em></span>
        <textarea id="ed-ing" rows="7" placeholder="400 g de poulet&#10;1 oignon&#10;2 c. à soupe d'huile d'olive">${esc((r?.ingredients || []).join("\n"))}</textarea>
      </label>
      <div class="ing-preview" id="ed-prev" aria-live="polite"></div>
      <label class="field"><span>Étapes <em>une par ligne</em></span>
        <textarea id="ed-steps" rows="5" placeholder="Couper les légumes…">${esc((r?.steps || []).join("\n"))}</textarea>
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
        return `<span class="prev-chip" title="${esc(a.name)}">${a.emoji} ${esc(p.name || l)}</span>`;
      }).join("") : "";
    };
    validate(); preview();
    name.addEventListener("input", validate);
    ing.addEventListener("input", preview);

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
        id: rid,
        name: name.value.trim(),
        emoji: [...$("#ed-emoji", el).value.trim()].slice(0, 2).join("") || "🍽️",
        servings: Math.max(1, Math.min(20, parseInt($("#ed-serv", el).value, 10) || 4)),
        time: Math.max(0, parseInt($("#ed-time", el).value, 10) || 0),
        ingredients: lines(ing.value),
        steps: lines($("#ed-steps", el).value),
        updated: Date.now(),
      };
      store.set("recipes", rid, recipe);
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

function renderGrocery() {
  const g = groceryFor(S(), week);
  const left = g.total - g.done;
  const rel = weekRel(week).toLowerCase();
  $("#groc-sub").textContent = g.total
    ? `${rel[0].toUpperCase() + rel.slice(1)} · ${g.meals} souper${g.meals > 1 ? "s" : ""} · ${left ? `${left} à prendre` : "tout est pris 🎉"}`
    : "";
  $("#groc-progress").hidden = !g.total;
  $("#groc-progress span").style.transform = `scaleX(${g.total ? g.done / g.total : 0})`;
  $("#groc-foot").hidden = !g.total;

  const badge = $("#groc-badge");
  badge.hidden = !left || week.getTime() !== mondayOf(new Date()).getTime();
  badge.textContent = left > 99 ? "99+" : left;

  $("#groc-list").innerHTML = g.groups.map((gr) => `
    <section class="aisle">
      <header class="aisle-head">
        <span>${gr.emoji} ${gr.name}</span>
        <small>${gr.items.filter((i) => i.done).length}/${gr.items.length}</small>
      </header>
      <div class="aisle-card">
        ${gr.items.map((it) => `
          <div class="g-row${it.done ? " done" : ""}">
            <button class="g-main" data-key="${esc(it.key)}" aria-pressed="${it.done}">
              <span class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>
              <span class="g-text">
                <b>${esc(it.name)}</b>
                ${it.from.length ? `<small>${esc(it.from.join(" · "))}</small>` : `<small>Ajouté à la main</small>`}
              </span>
              <span class="g-qty">${esc(it.qtyText)}</span>
            </button>
            ${it.extra ? `<button class="g-del" data-del="${it.extra}" aria-label="Retirer ${esc(it.name)}"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg></button>` : ""}
          </div>`).join("")}
      </div>
    </section>`).join("")
    || `<div class="empty-state">
          <span class="empty-emoji">🧺</span>
          <b>Ta liste est vide</b>
          <p>Planifie des soupers dans l'onglet Semaine : les ingrédients s'ajoutent ici tout seuls, additionnés et classés par rayon.</p>
        </div>`;
}

$("#groc-list").addEventListener("click", (e) => {
  const del = e.target.closest("[data-del]");
  if (del) {
    const id = del.dataset.del, prev = S().extras[id];
    store.apply([["extras", id, undefined], ["checked", `x|${id}`, undefined]]);
    toast("Article retiré", { action: "Annuler", onAction: () => store.set("extras", id, prev) });
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
      <p class="note center">Popote · v1</p>
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
