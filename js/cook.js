/* ============================================================
   cook.js — le mode cuisine.

   Plein écran, une étape à la fois, en gros. L'écran reste allumé
   (Wake Lock) : pas besoin de toucher le téléphone avec les mains
   pleines de farine. On passe d'une étape à l'autre en glissant —
   la page suit le doigt, et la vitesse du geste décide si on
   tourne la page. Chaque durée écrite dans une étape (« 20 min »)
   devient un bouton minuteur.
   ============================================================ */

import { Spring, project, rubberband, tracker, capture, buzz, pop, REDUCED } from "./motion.js";
import { scaleLine } from "./data.js";
import { toast, esc } from "./ui.js";

let root = null, wake = null, timers = [], tick = 0, audio = null;
let spring = null, index = 0, count = 0, width = 1;

/* « 12 à 15 min », « 1 h », « 2-3 minutes » → une durée en secondes (la plus courte). */
const DURATION = /(\d{1,3})(?:\s*(?:à|-|–|to)\s*(\d{1,3}))?\s*(min(?:utes?)?|h(?:eures?)?|hours?)\b/gi;
const secondsOf = (n, unit) => (/^h/i.test(unit) ? n * 3600 : n * 60);

function stepHtml(text) {
  return esc(text).replace(DURATION, (m, a, b, unit) =>
    `<button class="timer-chip" data-secs="${secondsOf(+a, unit)}" data-label="${esc(m)}">⏱ ${m}</button>`);
}

async function keepAwake() {
  try { if ("wakeLock" in navigator && !document.hidden) wake = await navigator.wakeLock.request("screen"); } catch (_) {}
}
const onVisible = () => { if (root && !document.hidden) keepAwake(); };

export function openCook(recipe, { portions, onRate }) {
  closeCook();
  const f = portions / (recipe.servings || 4);
  const steps = recipe.steps?.length ? recipe.steps : ["Aucune étape écrite pour cette recette — à l'instinct !"];
  count = steps.length + 2;
  index = 0;

  root = document.createElement("div");
  root.className = "cook";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", `Mode cuisine : ${recipe.name}`);
  root.innerHTML = `
    <header class="cook-top">
      <button class="cook-x" aria-label="Quitter le mode cuisine"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg></button>
      <div class="cook-title"><b>${esc(recipe.name)}</b><span id="cook-count"></span></div>
      <span class="cook-x" aria-hidden="true"></span>
    </header>
    <div class="cook-dots">${Array.from({ length: count }, () => "<i></i>").join("")}</div>
    <div class="cook-timers" id="cook-timers"></div>
    <div class="cook-viewport">
      <div class="cook-track">
        <section class="cook-slide">
          <p class="cook-kicker">Mise en place · ${portions} portion${portions > 1 ? "s" : ""}</p>
          <ul class="cook-ing">${(recipe.ingredients || []).map((l) => `
            <li><button><span class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>${esc(scaleLine(l, f))}</button></li>`).join("")}
          </ul>
        </section>
        ${steps.map((s, i) => `
        <section class="cook-slide">
          <p class="cook-kicker">Étape ${i + 1} sur ${steps.length}</p>
          <p class="cook-step">${stepHtml(s)}</p>
        </section>`).join("")}
        <section class="cook-slide cook-end">
          <span class="cook-emoji">${esc(recipe.emoji || "🍽️")}</span>
          <h2>Bon appétit !</h2>
          <p>C'était comment ?</p>
          <div class="stars big" role="radiogroup" aria-label="Note">
            ${[1, 2, 3, 4, 5].map((n) => `<button role="radio" data-star="${n}" aria-label="${n} étoile${n > 1 ? "s" : ""}">★</button>`).join("")}
          </div>
          <button class="primary-btn" id="cook-done">Terminer</button>
        </section>
      </div>
    </div>
    <footer class="cook-nav">
      <button class="ghost-btn" id="cook-prev">Précédent</button>
      <button class="primary-btn" id="cook-next">Suivant</button>
    </footer>`;
  document.body.appendChild(root);
  document.body.classList.add("cooking");

  const track = root.querySelector(".cook-track");
  width = root.querySelector(".cook-viewport").offsetWidth || 1;
  spring = new Spring(0, { response: 0.42, damping: 1, restDelta: 0.5,
    onUpdate: (x) => { track.style.transform = `translate3d(${x}px,0,0)`; } });

  let rating = recipe.rating || 0;
  const drawStars = () => root.querySelectorAll("[data-star]").forEach((b) => {
    b.classList.toggle("on", +b.dataset.star <= rating);
    b.setAttribute("aria-checked", String(+b.dataset.star === rating));
  });
  drawStars();

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest(".cook-x[aria-label]")) return closeCook();
    const chip = t.closest(".timer-chip");
    if (chip) return startTimer(+chip.dataset.secs, chip.dataset.label);
    const stop = t.closest("[data-stop]");
    if (stop) { timers = timers.filter((x) => x.id !== +stop.dataset.stop); return drawTimers(); }
    const ingBtn = t.closest(".cook-ing button");
    if (ingBtn) { ingBtn.classList.toggle("done"); pop(ingBtn.querySelector(".check"), 1.25, 0.5); return; }
    const star = t.closest("[data-star]");
    if (star) {
      rating = +star.dataset.star === rating ? 0 : +star.dataset.star;
      drawStars(); buzz(8); pop(star, 1.35, 0.45);
      return;
    }
    if (t.closest("#cook-done")) { if (rating !== (recipe.rating || 0)) onRate(rating); closeCook(); }
    if (t.closest("#cook-prev")) go(index - 1);
    if (t.closest("#cook-next")) go(index + 1);
  });

  bindSwipe(root.querySelector(".cook-viewport"));
  addEventListener("resize", onResize);
  addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVisible);
  keepAwake();
  go(0, true);
  if (!REDUCED.matches) root.animate([{ opacity: 0, transform: "scale(.98)" }, { opacity: 1, transform: "none" }],
    { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
}

export function closeCook() {
  if (!root) return;
  try { wake?.release(); } catch (_) {}
  wake = null;
  clearInterval(tick); tick = 0; timers = [];
  removeEventListener("resize", onResize);
  removeEventListener("keydown", onKey);
  document.removeEventListener("visibilitychange", onVisible);
  root.remove(); root = null;
  document.body.classList.remove("cooking");
}

function onResize() { width = root.querySelector(".cook-viewport").offsetWidth || 1; spring.hold(-index * width); }
function onKey(e) {
  if (e.key === "ArrowRight") go(index + 1);
  if (e.key === "ArrowLeft") go(index - 1);
  if (e.key === "Escape") closeCook();
}

function go(i, instant = false, velocity = 0) {
  index = Math.max(0, Math.min(count - 1, i));
  if (instant) spring.hold(-index * width); else spring.to(-index * width, { velocity });
  root.querySelectorAll(".cook-dots i").forEach((d, k) => d.classList.toggle("on", k === index));
  root.querySelectorAll(".cook-slide").forEach((s, k) => s.setAttribute("aria-hidden", String(k !== index)));
  root.querySelector("#cook-count").textContent =
    index === 0 ? "Mise en place" : index === count - 1 ? "Terminé" : `Étape ${index} / ${count - 2}`;
  root.querySelector("#cook-prev").disabled = index === 0;
  root.querySelector(".cook-nav").hidden = index === count - 1;
  root.querySelector("#cook-next").textContent = index === count - 2 ? "J'ai fini" : "Suivant";
}

/* Glisser : 1:1 avec le doigt, élastique aux deux bouts, et au
   relâchement la projection du geste choisit la page (±1 max). */
function bindSwipe(el) {
  let g = null, swallow = false;
  /* Le geste peut partir d'un bouton (ingrédient, minuteur) : s'il
     devient un glissé, le clic qui suit est avalé. */
  el.addEventListener("click", (e) => {
    if (swallow) { e.stopPropagation(); e.preventDefault(); swallow = false; }
  }, true);
  el.addEventListener("pointerdown", (e) => {
    swallow = false;
    g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, from: spring.x, axis: null, tr: tracker() };
    g.tr.add(e.clientX, e.timeStamp);
  });
  el.addEventListener("pointermove", (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) { g = null; return; }
      g.axis = "x"; capture(el, e.pointerId);
    }
    g.tr.add(e.clientX, e.timeStamp);
    let x = g.from + dx;
    const min = -(count - 1) * width;
    if (x > 0) x = rubberband(x, width);
    if (x < min) x = min - rubberband(min - x, width);
    spring.hold(x);
  });
  const end = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const armed = g.axis === "x", v = g.tr.velocity();
    g = null;
    if (!armed) return;
    swallow = true;
    setTimeout(() => { swallow = false; }, 0);
    const target = Math.round(-(spring.x + project(v)) / width);
    go(Math.max(index - 1, Math.min(index + 1, target)), false, v);
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

/* ── Minuteurs ── */

function startTimer(secs, label) {
  /* Le son doit naître d'un geste : on prépare l'audio maintenant. */
  try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (_) {}
  timers.push({ id: Date.now(), label, end: Date.now() + secs * 1000, total: secs });
  buzz(10);
  if (!tick) tick = setInterval(drawTimers, 500);
  drawTimers();
}

function drawTimers() {
  if (!root) return;
  const now = Date.now();
  for (const t of timers.filter((x) => x.end <= now && !x.rang)) { t.rang = true; ring(t); }
  const box = root.querySelector("#cook-timers");
  box.innerHTML = timers.map((t) => {
    const left = Math.max(0, Math.ceil((t.end - now) / 1000));
    const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, "0");
    return `<span class="timer-pill${left ? "" : " rang"}">
      <b>${left ? `${mm}:${ss}` : "Terminé !"}</b><small>${esc(t.label)}</small>
      <button data-stop="${t.id}" aria-label="Arrêter le minuteur"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg></button>
    </span>`;
  }).join("");
  if (!timers.length) { clearInterval(tick); tick = 0; }
}

function ring(t) {
  buzz([220, 120, 220, 120, 220]);
  toast(`⏰ Minuteur terminé — ${t.label}`, { ms: 8000 });
  if (!audio) return;
  const now = audio.currentTime;
  [0, 0.35, 0.7].forEach((d) => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = 880; o.type = "sine";
    g.gain.setValueAtTime(0.0001, now + d);
    g.gain.exponentialRampToValueAtTime(0.35, now + d + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + d + 0.28);
    o.connect(g).connect(audio.destination);
    o.start(now + d); o.stop(now + d + 0.3);
  });
}
