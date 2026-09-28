/* ============================================================
   ocr.js — lire le texte d'une capture d'écran.

   Tesseract tourne dans le navigateur (rien n'est envoyé nulle
   part) et n'est chargé qu'au premier usage : ~3 Mo de moteur et
   les dictionnaires français + anglais, gardés ensuite en cache
   pour les fois suivantes.

   Avant la lecture, on prépare l'image : agrandie si elle est
   petite, en niveaux de gris, et inversée si c'est du texte blanc
   sur fond sombre (la description TikTok) — Tesseract lit bien
   mieux du noir sur blanc.
   ============================================================ */

const LIB = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
let libP = null;

function loadLib() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!libP) {
    libP = new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = LIB; s.async = true;
      s.onload = () => ok(window.Tesseract);
      s.onerror = () => { libP = null; fail(new Error("offline")); };
      document.head.appendChild(s);
    });
  }
  return libP;
}

async function prepare(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(2.5, Math.max(1, 1600 / bmp.width));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  cx.imageSmoothingQuality = "high";
  cx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();

  const img = cx.getImageData(0, 0, w, h), d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = y; sum += y;
  }
  const dark = sum / (d.length / 4) < 115;
  for (let i = 0; i < d.length; i += 4) {
    let y = dark ? 255 - d[i] : d[i];
    y = Math.max(0, Math.min(255, (y - 128) * 1.35 + 128));   // un peu plus de contraste
    d[i] = d[i + 1] = d[i + 2] = y;
  }
  cx.putImageData(img, 0, 0);
  return cv;
}

/* Le texte des applis se coupe en fin de ligne visuelle : on recolle
   une ligne qui continue visiblement la précédente (« 2 c. à soupe
   de sauce » / « soya »), et on jette le bruit (icônes, compteurs). */
function tidy(text) {
  const lines = text.split("\n")
    .map((l) => l.replace(/[|©®™]/g, " ")
      .replace(/#[\p{L}\d_]+/gu, " ")                          // hashtags
      .replace(/\b\d+(?:[.,]\d+)?\s?[kKM]\b/g, " ")            // « 12,4 k » j'aime
      .replace(/(?:\s+[^\p{L}\d\s()%½¼¾⅓⅔]{1,2})+$/u, "")      // émojis lus comme « & & »
      .replace(/\s{2,}/g, " ").trim())
    .filter((l) => !/^@[\w.]+/.test(l) || l.length > 45);     // « @compte · 2j »
  const wide = Math.max(0, ...lines.map((l) => l.length));
  const out = [];
  for (const line of lines) {
    if (!line) { if (out.length && out[out.length - 1] !== "") out.push(""); continue; }
    if ((line.match(/\p{L}/gu) || []).length < 3) continue;
    const prev = out[out.length - 1];
    /* Suite de phrase : la ligne d'avant se termine sans ponctuation et
       touche presque le bord (ou finit sur « les », « de »…), celle-ci
       commence en minuscule et n'est pas un nouvel élément de liste. */
    const cont = prev && /[\p{Ll},]$/u.test(prev) && /^\p{Ll}/u.test(line) && !/^[-•*·]/.test(line) &&
      (prev.length >= wide * 0.8 ||
       /\s(de|d'|du|des|les|la|le|l'|aux|au|à|en|et|avec|pour|puis|un|une|of|and|the|with|to|into|then|in|a|an)$/i.test(prev));
    if (cont) out[out.length - 1] = `${prev} ${line}`;
    else out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* files → texte ; onProgress(0..1, étiquette) */
export async function readImages(files, onProgress = () => {}) {
  const T = await loadLib();
  let current = 0;
  const n = files.length;
  const worker = await T.createWorker(["fra", "eng"], 1, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress((current + m.progress) / n, n > 1 ? `Lecture ${current + 1}/${n}` : "Lecture");
      else if (/load|init/.test(m.status)) onProgress(0, "Préparation (1re fois : quelques secondes)");
    },
  });
  try {
    const texts = [];
    for (current = 0; current < n; current++) {
      const cv = await prepare(files[current]);
      const { data } = await worker.recognize(cv);
      texts.push(tidy(data.text || ""));
    }
    onProgress(1, "Terminé");
    return texts.filter(Boolean).join("\n\n");
  } finally {
    worker.terminate();
  }
}
