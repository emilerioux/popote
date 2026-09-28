/* ============================================================
   shop.js — le mode magasin.

   Plein écran, gros caractères, l'écran reste allumé : on tient le
   téléphone d'une main et le panier de l'autre. On coche d'un
   toucher ou en glissant l'article vers la droite (il suit le
   doigt ; la vitesse du geste compte autant que la distance).
   Ce qui est pris descend dans « Dans le panier » — la liste qui
   reste ne montre que ce qu'il faut encore trouver, rayon par
   rayon. Les coches passent par le store : si l'autre personne
   fait l'épicerie en même temps, sa liste bouge avec la tienne.
   ============================================================ */

import * as store from "./store.js";
import { Spring, project, rubberband, tracker, capture, buzz, pop, REDUCED } from "./motion.js";
import { money } from "./data.js";
import { esc } from "./ui.js";

let root = null, wake = null, getList = null, rerender = null, swallowUntil = 0;

const CHECK = `<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;

async function keepAwake() {
  try { if ("wakeLock" in navigator && !document.hidden) wake = await navigator.wakeLock.request("screen"); } catch (_) {}
}
const onVisible = () => { if (root && !document.hidden) keepAwake(); };
const onKey = (e) => { if (e.key === "Escape") closeShop(); };

function row(it) {
  return `
    <div class="shop-row${it.done ? " done" : ""}" data-key="${esc(it.key)}">
      <div class="shop-under" aria-hidden="true">${CHECK}</div>
      <button class="shop-item" aria-pressed="${it.done}">
        <span class="check" aria-hidden="true">${CHECK}</span>
        <span class="shop-name"><b>${esc(it.name)}</b>${it.en ? `<small>${esc(it.en)}</small>` : ""}</span>
        <span class="shop-qty">${esc(it.qtyText)}</span>
      </button>
    </div>`;
}

function draw() {
  const g = getList();
  const all = g.groups.flatMap((gr) => gr.items);
  const left = all.filter((i) => !i.done), inCart = all.filter((i) => i.done);
  const spent = inCart.reduce((s, i) => s + (i.price || 0), 0);

  root.querySelector(".shop-count").textContent =
    all.length ? `${inCart.length} sur ${all.length}${g.budget ? ` · ≈ ${money(spent)} / ${money(g.budget)}` : ""}` : "";
  root.querySelector(".shop-progress span").style.transform = `scaleX(${all.length ? inCart.length / all.length : 0})`;

  const aisles = g.groups.map((gr) => {
    const items = gr.items.filter((i) => !i.done);
    return items.length ? `
      <section class="shop-aisle">
        <h3>${gr.emoji} ${esc(gr.name)}</h3>
        <div class="shop-card">${items.map(row).join("")}</div>
      </section>` : "";
  }).join("");

  const finished = all.length && !left.length ? `
    <div class="shop-done">
      <span>🎉</span><b>Tout est dans le panier</b>
      <p>${all.length} article${all.length > 1 ? "s" : ""}${g.budget ? ` · environ ${money(g.budget)}` : ""}</p>
      <button class="primary-btn" data-close-shop>Terminer</button>
    </div>` : "";

  const empty = !all.length ? `<div class="shop-done"><span>🧺</span><b>Rien à acheter</b>
      <p>Planifie des soupers : leurs ingrédients arrivent ici.</p></div>` : "";

  const cart = inCart.length ? `
    <section class="shop-aisle cart">
      <h3>🛒 Dans le panier <small>${inCart.length}</small></h3>
      <div class="shop-card">${inCart.map(row).join("")}</div>
    </section>` : "";

  root.querySelector(".shop-scroll").innerHTML = finished + empty + aisles + cart;
}

/* Rendu animé : chaque rangée repart de là où elle était (FLIP),
   donc celle qu'on vient de cocher « tombe » dans le panier et les
   autres remontent combler le trou, au lieu de sauter. */
function drawAnimated() {
  if (REDUCED.matches) return draw();
  const before = new Map();
  for (const r of root.querySelectorAll(".shop-row")) before.set(r.dataset.key, r.getBoundingClientRect().top);
  draw();
  for (const r of root.querySelectorAll(".shop-row")) {
    const top = before.get(r.dataset.key);
    if (top === undefined) {
      r.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
      continue;
    }
    const dy = top - r.getBoundingClientRect().top;
    if (Math.abs(dy) < 1) continue;
    r.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }],
      { duration: 420, easing: "cubic-bezier(.2,.9,.25,1)" });
  }
}

function toggle(key) {
  const done = !store.state.checked[key];
  if (done) buzz(10);
  store.set("checked", key, done || undefined);   // le store redessine via rerender
}

/* Glisser vers la droite = cocher (ou décocher dans le panier). */
function bindSwipe(scroll) {
  let g = null;
  scroll.addEventListener("pointerdown", (e) => {
    const r = e.target.closest(".shop-row");
    if (!r || e.button > 0) return;
    const item = r.querySelector(".shop-item");
    g = { id: e.pointerId, r, item, x0: e.clientX, y0: e.clientY, axis: null, tr: tracker(), w: r.offsetWidth,
          spring: item._s || (item._s = new Spring(0, { response: 0.32, damping: 1, restDelta: 0.3,
            onUpdate: (x) => {
              item.style.transform = x ? `translate3d(${x}px,0,0)` : "";
              r.style.setProperty("--p", String(Math.max(0, Math.min(1, x / (r.offsetWidth * 0.35)))));
            } })) };
    g.from = g.spring.x;
  });
  scroll.addEventListener("pointermove", (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      g.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (g.axis === "y") { g = null; return; }
      capture(g.r, e.pointerId);
      g.r.classList.add("dragging");
    }
    let x = g.from + dx;
    if (x < 0) x = rubberband(x, g.w);
    g.tr.add(x, e.timeStamp);
    g.spring.hold(x);
  });
  const end = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const cur = g;
    g = null;
    if (!cur.axis) return;   // un simple toucher : le click s'en occupe
    cur.r.classList.remove("dragging");
    const v = cur.tr.velocity();
    const landing = cur.spring.x + project(v, 0.99);
    const commit = landing > cur.w * 0.35;
    swallowUntil = performance.now() + 350;   // le click qui suit un glissement ne recoche pas
    if (commit) {
      cur.spring.to(cur.w, { velocity: v, damping: 1 });
      pop(cur.r.querySelector(".shop-under svg"), 1.3, 0.5);
      setTimeout(() => toggle(cur.r.dataset.key), 140);
    } else {
      cur.spring.to(0, { velocity: v, damping: 0.85 });
    }
  };
  scroll.addEventListener("pointerup", end);
  scroll.addEventListener("pointercancel", end);
}

export function openShop(list) {
  closeShop();
  getList = list;
  root = document.createElement("div");
  root.className = "shop";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Mode magasin");
  root.innerHTML = `
    <header class="shop-top">
      <button class="cook-x" data-close-shop aria-label="Quitter le mode magasin"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg></button>
      <div class="cook-title"><b>Au magasin</b><span class="shop-count"></span></div>
      <span class="cook-x" aria-hidden="true"></span>
    </header>
    <div class="shop-progress" aria-hidden="true"><span></span></div>
    <div class="shop-scroll"></div>
    <p class="shop-hint">Touche ou glisse vers la droite pour mettre dans le panier</p>`;
  document.body.appendChild(root);
  draw();

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-shop]")) return closeShop();
    const r = e.target.closest(".shop-row");
    if (r && performance.now() < swallowUntil) return;
    if (r) { pop(r.querySelector(".check"), 1.25, 0.5); toggle(r.dataset.key); }
  });
  bindSwipe(root.querySelector(".shop-scroll"));

  rerender = () => { if (root) drawAnimated(); };
  store.subscribe(rerender);
  keepAwake();
  document.addEventListener("visibilitychange", onVisible);
  document.addEventListener("keydown", onKey);

  if (!REDUCED.matches) {
    root.animate([{ opacity: 0, transform: "translateY(24px) scale(.985)" }, { opacity: 1, transform: "none" }],
      { duration: 320, easing: "cubic-bezier(.2,.9,.25,1)" });
  }
}

export function closeShop() {
  if (!root) return;
  const el = root;
  root = null;
  store.unsubscribe?.(rerender);   // tolérant : un vieux store.js en cache ne casse pas la fermeture
  document.removeEventListener("visibilitychange", onVisible);
  document.removeEventListener("keydown", onKey);
  try { wake?.release(); } catch (_) {}
  wake = null;
  if (REDUCED.matches) { el.remove(); return; }
  el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(24px) scale(.985)" }],
    { duration: 220, easing: "ease-in" }).finished.then(() => el.remove(), () => el.remove());
}
