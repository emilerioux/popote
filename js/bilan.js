/* ============================================================
   bilan.js — historique et statistiques.

   Tout se calcule à partir du planning déjà gardé (chaque soir
   planifié reste dans state.plan) : rien de plus à enregistrer.
   Le budget d'une semaine = le même calcul que l'onglet Épicerie
   (sans les articles ajoutés à la main, qui ne sont pas datés),
   avec les prix d'aujourd'hui.
   ============================================================ */

import { mondayOf, addDays, iso, shortDate, groceryFor, money, DAYS } from "./data.js";
import { esc } from "./ui.js";

const WEEKS = 8;
const fmtMonth = new Intl.DateTimeFormat("fr-CA", { month: "long" });
const dollars = (x) => `${Math.round(x)} $`;

function weekStats(state, mon) {
  const g = groceryFor({ ...state, extras: {}, checked: {} }, mon);
  const meals = [];
  for (let i = 0; i < 7; i++) {
    const key = iso(addDays(mon, i)), p = state.plan[key], r = p && state.recipes[p.r];
    if (r) meals.push({ key, i, r });
  }
  return { mon, meals, budget: g.budget };
}

export function computeBilan(state, now = new Date()) {
  const thisMon = mondayOf(now);
  const today = iso(now);
  const weeks = [];
  for (let k = WEEKS - 1; k >= 0; k--) weeks.push(weekStats(state, addDays(thisMon, -7 * k)));

  /* Mois courant : une semaine compte dans le mois de son jeudi. */
  const month = now.getMonth(), year = now.getFullYear();
  let monthBudget = 0, monthMeals = 0;
  for (let k = 0; k < 6; k++) {
    const mon = addDays(thisMon, -7 * k), thu = addDays(mon, 3);
    if (thu.getMonth() !== month || thu.getFullYear() !== year) { if (k > 0) break; else continue; }
    monthBudget += (k < WEEKS ? weeks[WEEKS - 1 - k] : weekStats(state, mon)).budget;
  }
  const monthKey = iso(now).slice(0, 7);
  for (const [day, p] of Object.entries(state.plan)) {
    if (day.startsWith(monthKey) && state.recipes[p.r]) monthMeals++;
  }

  const priced = weeks.filter((w) => w.meals.length && w.budget > 0);
  const perMeal = priced.length
    ? priced.reduce((s, w) => s + w.budget, 0) / priced.reduce((s, w) => s + w.meals.length, 0) : 0;

  /* Les plus faites (jusqu'à aujourd'hui) et quand on les a faites. */
  const count = {}, last = {};
  for (const [day, p] of Object.entries(state.plan)) {
    if (day > today || !state.recipes[p.r]) continue;
    count[p.r] = (count[p.r] || 0) + 1;
    if (!last[p.r] || day > last[p.r]) last[p.r] = day;
  }
  const top = Object.entries(count).sort((a, b) => b[1] - a[1] || (last[b[0]] > last[a[0]] ? 1 : -1))
    .slice(0, 5).map(([id, n]) => ({ r: state.recipes[id], n }));

  /* Favoris pas faits depuis un mois (ou jamais) : de bonnes idées pour la semaine. */
  const planned = new Set(Object.entries(state.plan).filter(([d]) => d >= iso(thisMon)).map(([, p]) => p.r));
  const limit = iso(addDays(now, -28));
  const forgotten = Object.values(state.recipes)
    .filter((r) => (r.rating || 0) >= 4 && !planned.has(r.id) && (!last[r.id] || last[r.id] < limit))
    .sort((a, b) => (last[a.id] || "") < (last[b.id] || "") ? -1 : 1)
    .slice(0, 4).map((r) => ({ r, last: last[r.id] }));

  /* Semaines passées avec au moins un souper, la plus récente d'abord. */
  const days = Object.keys(state.plan).filter((d) => d < iso(thisMon)).sort();
  const history = [];
  if (days.length) {
    const [y, m, d] = days[0].split("-").map(Number);
    for (let mon = addDays(thisMon, -7); mon >= mondayOf(new Date(y, m - 1, d)); mon = addDays(mon, -7)) {
      const k = WEEKS - 1 - Math.round((thisMon - mon) / 604800000);
      const w = k >= 0 ? weeks[k] : weekStats(state, mon);
      if (w.meals.length) history.push(w);
      if (history.length >= 26) break;
    }
  }

  return { weeks, monthName: fmtMonth.format(now), monthBudget, monthMeals, perMeal, top, forgotten, history, thisMon };
}

function chart(weeks, thisMon) {
  const W = 340, H = 150, top = 22, bottom = 22, gap = 10;
  const max = Math.max(...weeks.map((w) => w.budget), 1);
  const bw = (W - gap * (weeks.length - 1)) / weeks.length;
  const y = (v) => H - bottom - (v / max) * (H - top - bottom);
  const bars = weeks.map((w, i) => {
    const x = i * (bw + gap), cur = w.mon.getTime() === thisMon.getTime();
    const h = Math.max(0, H - bottom - y(w.budget));
    const r = Math.min(4, h / 2, bw / 2);
    /* Barre ancrée en bas, seulement le haut arrondi (4 px). */
    const path = h > 0.5
      ? `M${x},${H - bottom} V${y(w.budget) + r} Q${x},${y(w.budget)} ${x + r},${y(w.budget)} H${x + bw - r} Q${x + bw},${y(w.budget)} ${x + bw},${y(w.budget) + r} V${H - bottom} Z`
      : "";
    return `<g class="bar${cur ? " cur" : ""}" data-w="${i}" tabindex="0" role="img"
        aria-label="Semaine du ${shortDate(w.mon)} : ${w.meals.length} souper${w.meals.length > 1 ? "s" : ""}, ${w.budget ? money(w.budget) : "aucun budget"}">
      <rect class="hit" x="${x - gap / 2}" y="0" width="${bw + gap}" height="${H}"/>
      ${path ? `<path d="${path}"/>` : ""}
      <text class="val" x="${x + bw / 2}" y="${(h > 0.5 ? y(w.budget) : H - bottom) - 6}">${w.budget ? dollars(w.budget) : "—"}</text>
      <text class="lab" x="${x + bw / 2}" y="${H - 5}">${w.mon.getDate()}/${w.mon.getMonth() + 1}</text>
    </g>`;
  }).join("");
  return `<svg class="bchart" viewBox="0 0 ${W} ${H}" aria-label="Budget estimé par semaine, ${weeks.length} dernières semaines">
    <line class="base" x1="0" x2="${W}" y1="${H - bottom}" y2="${H - bottom}"/>${bars}</svg>`;
}

const weekLine = (w) => `Semaine du ${shortDate(w.mon)} · ${w.meals.length} souper${w.meals.length > 1 ? "s" : ""}${w.budget ? ` · ≈ ${money(w.budget)}` : ""}`;

export function renderBilan(host, state, { thumb, showAll = false } = {}) {
  const b = computeBilan(state);
  const cur = b.weeks[b.weeks.length - 1];
  const any = b.weeks.some((w) => w.meals.length) || b.history.length;

  if (!any) {
    host.innerHTML = `<div class="empty-state"><span class="empty-emoji">📊</span><b>Pas encore de bilan</b>
      <p>Planifie quelques soupers : tu verras ici ce que vous mangez, vos classiques et le budget par semaine.</p></div>`;
    return b;
  }

  const topMax = b.top[0]?.n || 1;
  const hist = showAll ? b.history : b.history.slice(0, 4);

  host.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><small>Épicerie en ${esc(b.monthName)}</small><b>${b.monthBudget ? `≈ ${dollars(b.monthBudget)}` : "—"}</b></div>
      <div class="stat"><small>Par souper</small><b>${b.perMeal ? `≈ ${money(b.perMeal)}` : "—"}</b></div>
      <div class="stat"><small>Soupers en ${esc(b.monthName)}</small><b>${b.monthMeals}</b></div>
      <div class="stat"><small>Recettes différentes</small><b>${new Set(Object.values(state.plan).map((p) => p.r).filter((id) => state.recipes[id])).size}</b></div>
    </div>

    <section class="bl-sec">
      <header class="bl-head"><h3>Budget par semaine</h3><small>estimé</small></header>
      <div class="bl-card">
        ${chart(b.weeks, b.thisMon)}
        <p class="bl-detail" id="bl-detail">${esc(weekLine(cur))}</p>
      </div>
    </section>

    ${b.top.length ? `
    <section class="bl-sec">
      <header class="bl-head"><h3>Vos classiques</h3><small>fois faites</small></header>
      <div class="bl-card list">${b.top.map(({ r, n }) => `
        <button class="bl-row" data-recipe="${r.id}">
          ${thumb(r, "meal-emoji")}
          <span class="bl-main"><b>${esc(r.name)}</b>
            <span class="bl-track"><i style="transform:scaleX(${n / topMax})"></i></span></span>
          <span class="bl-n">${n}</span>
        </button>`).join("")}</div>
    </section>` : ""}

    ${b.forgotten.length ? `
    <section class="bl-sec">
      <header class="bl-head"><h3>À refaire bientôt</h3><small>tes favoris oubliés</small></header>
      <div class="bl-card list">${b.forgotten.map(({ r, last }) => `
        <button class="bl-row" data-plan="${r.id}">
          ${thumb(r, "meal-emoji")}
          <span class="bl-main"><b>${esc(r.name)}</b><small>${last ? `Dernière fois le ${esc(shortDate(new Date(last + "T12:00")))}` : "Jamais planifiée"}</small></span>
          <span class="bl-add">Planifier</span>
        </button>`).join("")}</div>
    </section>` : ""}

    ${b.history.length ? `
    <section class="bl-sec">
      <header class="bl-head"><h3>Historique</h3><small>${b.history.length} semaine${b.history.length > 1 ? "s" : ""}</small></header>
      ${hist.map((w) => `
        <div class="bl-card hist">
          <header><b>Semaine du ${esc(shortDate(w.mon))}</b><small>${w.budget ? `≈ ${money(w.budget)}` : ""}</small></header>
          ${w.meals.map(({ key, i, r }) => `
            <button class="hist-row" data-recipe="${r.id}">
              <span class="hist-day">${DAYS[i].slice(0, 3)}</span>
              <span class="hist-name">${esc(r.emoji || "🍽️")} ${esc(r.name)}</span>
            </button>`).join("")}
        </div>`).join("")}
      ${b.history.length > hist.length ? `<button class="ghost-btn wide" id="bl-more">Voir les ${b.history.length - hist.length} autres semaines</button>` : ""}
    </section>` : ""}`;

  /* Toucher (ou survoler) une barre : son détail sous le graphique. */
  const detail = host.querySelector("#bl-detail");
  const select = (i) => {
    host.querySelectorAll(".bar").forEach((g) => g.classList.toggle("sel", +g.dataset.w === i));
    detail.textContent = weekLine(b.weeks[i]);
  };
  host.querySelectorAll(".bar").forEach((g) => {
    const i = +g.dataset.w;
    g.addEventListener("pointerenter", () => select(i));
    g.addEventListener("click", () => select(i));
    g.addEventListener("focus", () => select(i));
  });
  host.querySelector(".bchart").addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") select(b.weeks.length - 1); });
  select(b.weeks.length - 1);
  return b;
}
