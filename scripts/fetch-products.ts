// Produits repères pour les ingrédients sensibles, depuis Open Food Facts (gratuit, sans clé).
// Usage : npx tsx scripts/fetch-products.ts [clé...]
// - Catalogue (requêtes, mots obligatoires) : src/data/productCatalog.ts
// - Exclusions après vérification à l'œil   : scripts/product-picks.json  { "clé": ["code EAN", ...] }
// - Sortie                                   : src/data/products.json
// On ne garde que des produits vendus en France, avec un label « sans gluten » et sans gluten
// dans les allergènes (même verdict « safe » que le scanner).
import fs from "node:fs";
import { CATALOG } from "../src/data/productCatalog";
import { analyze, type ProductInfo } from "../src/scanner/gluten";

const OUT = "src/data/products.json";
const CACHE = "scripts/product-candidates.json"; // cache local (non versionné)
const PICKS = "scripts/product-picks.json";
const PER_KEY = 3;

type Ref = { code: string; brand: string; name: string; quantity: string; stores: string[]; image: string };
const out: Record<string, Ref[]> = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const cache: Record<string, any[]> = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const excluded: Record<string, string[]> = fs.existsSync(PICKS) ? JSON.parse(fs.readFileSync(PICKS, "utf8")) : {};

/** Marques 100 % sans gluten (pour les produits « stricts »). */
const GF_BRANDS = ["schar", "ma vie sans gluten", "chaque jour sans gluten", "valpi", "celiane", "le gluten en moins"];
/** Enseignes françaises reconnues → nom affiché. Les autres (étrangères, sites) ne sont pas affichées. */
const STORES: [RegExp, string][] = [
  [/carr?efour/, "Carrefour"], [/leclerc/, "Leclerc"], [/auchan/, "Auchan"], [/intermarche/, "Intermarché"],
  [/(magasins|super|hyper|^) ?u( express)?$|systeme u|^u /, "Magasins U"], [/casino/, "Casino"], [/monoprix/, "Monoprix"],
  [/franprix/, "Franprix"], [/lidl/, "Lidl"], [/aldi/, "Aldi"], [/netto/, "Netto"], [/cora/, "Cora"], [/biocoop|biocop/, "Biocoop"],
  [/naturalia/, "Naturalia"], [/la vie claire/, "La Vie Claire"], [/bio c.? ?bon/, "Bio c' Bon"], [/eau vive/, "L'Eau Vive"],
  [/greenweez/, "Greenweez"], [/picard/, "Picard"], [/grand frais/, "Grand Frais"], [/match/, "Match"],
];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s = "") => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[-']/g, " ");
const FIELDS = "code,product_name_fr,product_name,brands,quantity,stores,image_front_small_url,ingredients_text_fr,ingredients_text,allergens_tags,traces_tags,labels_tags,ingredients_tags,unique_scans_n";

async function search(q: string) {
  const u = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  u.search = new URLSearchParams({
    search_terms: q,
    tagtype_0: "labels", tag_contains_0: "contains", tag_0: "en:no-gluten",
    tagtype_1: "countries", tag_contains_1: "contains", tag_1: "en:france",
    sort_by: "unique_scans_n", page_size: "60", json: "1", fields: FIELDS,
  }).toString();
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(u, { headers: { "User-Agent": "mijote-recipes-app/1.0" } });
    const text = await res.text();
    try {
      return JSON.parse(text).products as any[];
    } catch {
      console.log(`  OFF ${res.status}, pause…`);
      await sleep(20000);
    }
  }
  return null;
}

const keys = process.argv.slice(2);
for (const e of CATALOG.filter((c) => !keys.length || keys.includes(c.key))) {
  if (!cache[e.search]) {
    const found = await search(e.search);
    if (!found) { console.log(`✗ ${e.key} : Open Food Facts indisponible`); continue; }
    cache[e.search] = found;
    fs.writeFileSync(CACHE, JSON.stringify(cache));
    await sleep(7000); // limite de l'API de recherche : ~10 requêtes / minute
  }
  const refs: Ref[] = [];
  const brands = new Set<string>();
  for (const p of cache[e.search]) {
    const name = p.product_name_fr || p.product_name || "";
    const brand = (p.brands || "").split(",")[0].trim();
    if (!name || !brand || !p.code) continue;
    if ((excluded[e.key] ?? []).includes(p.code)) continue;
    const n = norm(name);
    if (!e.must.every((alts) => alts.some((w) => n.includes(norm(w))))) continue;
    if (e.start && !e.must[0].some((w) => n.replace(/^(la|le|les|l) /, "").startsWith(norm(w)))) continue;
    if (e.not?.some((w) => n.includes(norm(w)))) continue;
    if (e.strict && !/sans gluten|gluten free|senza glutine/.test(n) && !GF_BRANDS.some((b) => norm(brand).includes(b))) continue;
    const info: ProductInfo = {
      code: p.code, name, brand, image: p.image_front_small_url || "",
      ingredients: p.ingredients_text_fr || p.ingredients_text || "",
      allergens: p.allergens_tags ?? [], traces: p.traces_tags ?? [], labels: p.labels_tags ?? [], ingredientTags: p.ingredients_tags ?? [],
    };
    if (analyze(info).verdict !== "safe") continue;
    if (brands.has(norm(brand))) continue; // une référence par marque
    brands.add(norm(brand));
    const stores = [
      ...new Set(
        (p.stores || "")
          .split(",")
          .map((x: string) => norm(x).trim())
          .map((x: string) => STORES.find(([re]) => re.test(x))?.[1])
          .filter(Boolean) as string[],
      ),
    ];
    refs.push({ code: p.code, brand, name: name.replace(/\s+/g, " ").trim(), quantity: (p.quantity || "").trim(), stores: stores.slice(0, 4), image: info.image });
    if (refs.length >= PER_KEY) break;
  }
  out[e.key] = refs;
  console.log(`${refs.length ? "✓" : "·"} ${e.key} : ${refs.map((r) => `${r.brand} — ${r.name}`).join(" | ") || "aucun"}`);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
const covered = CATALOG.filter((c) => out[c.key]?.length).length;
console.log(`Terminé : ${covered}/${CATALOG.length} ingrédients avec au moins un produit repère`);
