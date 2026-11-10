// Récupère une photo libre de droits (Openverse : Flickr, Wikimedia…) pour chaque recette.
// Usage : node scripts/fetch-images.mjs [id...]
// - scripts/image-queries.json : id -> requête (anglais)
// - scripts/image-picks.json   : id -> index du candidat choisi, ou requête de remplacement
// Sortie : public/img/<id>.webp + src/data/photos.json (crédits, obligatoires pour CC BY).
import fs from "node:fs";
import sharp from "sharp";

const queries = JSON.parse(fs.readFileSync("scripts/image-queries.json", "utf8"));
const picks = fs.existsSync("scripts/image-picks.json") ? JSON.parse(fs.readFileSync("scripts/image-picks.json", "utf8")) : {};
const candFile = "scripts/image-candidates.json";
const cands = fs.existsSync(candFile) ? JSON.parse(fs.readFileSync(candFile, "utf8")) : {};
const creditsFile = "src/data/photos.json";
const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, "utf8")) : {};
fs.mkdirSync("public/img", { recursive: true });

const only = process.argv.slice(2);
const ids = only.length ? only : Object.keys(queries);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { "User-Agent": "mijote-recipes-app/1.0 (photo credits displayed in app)" };

const OK_LICENSE = /^(cc0|cc[- ]by|public domain|pd)/i;
const stripHtml = (h = "") => h.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Recherche sur Wikimedia Commons (rapide, fiable, licences libres). */
async function search(q) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  u.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: `${q} filetype:bitmap`,
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "900",
    iiextmetadatafilter: "Artist|LicenseShortName",
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(u, { headers: UA });
    if (!res.ok) {
      console.log(`  commons ${res.status}, pause`);
      await sleep(res.status === 429 ? 30000 : 5000);
      continue;
    }
    const j = await res.json();
    const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index);
    const list = pages
      .map((p) => {
        const ii = p.imageinfo?.[0];
        if (!ii) return null;
        const m = ii.extmetadata ?? {};
        const lic = stripHtml(m.LicenseShortName?.value);
        if (!OK_LICENSE.test(lic)) return null;
        return {
          id: p.title,
          title: p.title,
          url: ii.thumburl || ii.url,
          thumb: ii.url,
          creator: stripHtml(m.Artist?.value).slice(0, 60) || "Wikimedia Commons",
          license: lic,
          license_version: "",
          landing: ii.descriptionurl,
          w: ii.width,
          h: ii.height,
        };
      })
      .filter(Boolean);
    // Les photos en paysage d'abord (meilleur cadrage), en gardant l'ordre de pertinence.
    return [...list.filter((c) => c.w >= c.h), ...list.filter((c) => c.w < c.h)];
  }
  return null;
}

async function download(c) {
  for (const src of [c.url, c.thumb]) {
    try {
      const res = await fetch(src, { headers: UA, redirect: "follow" });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      return await sharp(buf).rotate().resize(720, 450, { fit: "cover", position: "attention" }).webp({ quality: 68 }).toBuffer();
    } catch {
      /* on tente la source suivante */
    }
  }
  return null;
}

let n = 0;
const save = () => {
  fs.writeFileSync(candFile, JSON.stringify(cands, null, 1));
  fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 1));
};

async function processOne(id) {
  const pick = picks[id];
  // Une sélection peut être "requête#morceau du titre" pour choisir une photo précise.
  const [pq, wanted] = typeof pick === "string" ? pick.split("#") : [undefined, undefined];
  const q = pq ?? queries[id];
  const key = `${id}::${q}`;
  if (!cands[key]) {
    const found = await search(q);
    if (!found) {
      console.log(`${++n}/${ids.length} ✗ ${id} (source indisponible)`);
      return;
    }
    cands[key] = found;
  }
  let list = cands[key];
  if (wanted) list = list.filter((c) => c.title.toLowerCase().includes(wanted.toLowerCase()));
  const start = typeof pick === "number" ? pick : 0;
  let ok = false;
  for (let i = start; i < list.length && !ok; i++) {
    const c = list[i];
    if (c.w && c.h && (c.w < 500 || c.h < 300)) continue;
    const img = await download(c);
    if (!img) continue;
    fs.writeFileSync(`public/img/${id}.webp`, img);
    credits[id] = { creator: c.creator || "inconnu", license: `${c.license.toUpperCase()} ${c.license_version ?? ""}`.trim(), url: c.landing, idx: i };
    ok = true;
  }
  if (!ok) delete credits[id];
  console.log(`${++n}/${ids.length} ${ok ? "✓" : "✗"} ${id} (${q})`);
  save();
}

// Sans argument : on saute les recettes qui ont déjà leur photo.
const todo = only.length ? ids : ids.filter((id) => !(credits[id] && fs.existsSync(`public/img/${id}.webp`)));
n = ids.length - todo.length;
const queue = [...todo];
await Promise.all(
  Array.from({ length: 1 }, async () => {
    while (queue.length) {
      const id = queue.shift();
      try {
        await processOne(id);
      } catch (e) {
        console.log(`✗ ${id} : ${e.message}`);
      }
      await sleep(1200);
    }
  }),
);
save();
console.log("Terminé :", Object.keys(credits).length, "photos");
