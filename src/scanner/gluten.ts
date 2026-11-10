/**
 * Analyse « contient du gluten ? » d'un produit à partir des données Open Food Facts
 * (base collaborative et gratuite, celle qu'utilise aussi Yuka).
 */

export type Verdict = "safe" | "probable" | "traces" | "danger" | "unknown" | "notfound";

export interface ProductInfo {
  code: string;
  name: string;
  brand: string;
  image: string;
  ingredients: string;
  allergens: string[];
  traces: string[];
  labels: string[];
  ingredientTags: string[];
}

export interface Analysis {
  verdict: Verdict;
  title: string;
  reasons: string[];
  /** Mots du texte d'ingrédients à surligner */
  hits: string[];
}

export interface ScanRecord {
  code: string;
  name: string;
  brand: string;
  image: string;
  verdict: Verdict;
  at: number;
}

const FIELDS = [
  "product_name_fr",
  "product_name",
  "brands",
  "image_front_small_url",
  "image_front_url",
  "ingredients_text_fr",
  "ingredients_text",
  "allergens_tags",
  "traces_tags",
  "labels_tags",
  "ingredients_tags",
].join(",");

export async function fetchProduct(code: string): Promise<ProductInfo | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts indisponible (${res.status})`);
  const j = await res.json();
  if (j.status !== 1 || !j.product) return null;
  const p = j.product;
  return {
    code,
    name: p.product_name_fr || p.product_name || "Produit sans nom",
    brand: (p.brands || "").split(",")[0].trim(),
    image: p.image_front_small_url || p.image_front_url || "",
    ingredients: p.ingredients_text_fr || p.ingredients_text || "",
    allergens: p.allergens_tags ?? [],
    traces: p.traces_tags ?? [],
    labels: p.labels_tags ?? [],
    ingredientTags: p.ingredients_tags ?? [],
  };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Céréales à gluten et dérivés, dans le texte d'ingrédients (français + anglais). */
const GLUTEN_WORDS: [RegExp, string][] = [
  [/\b(ble|bles|froment|wheat)\b/g, "blé"],
  [/\b(orge|barley)\b/g, "orge"],
  [/\b(seigle|rye)\b/g, "seigle"],
  [/\b(epeautre|spelt)\b/g, "épeautre"],
  [/\bkamut\b/g, "kamut"],
  [/\btriticale\b/g, "triticale"],
  [/\bmalt\b/g, "malt"],
  [/\bseitan\b/g, "seitan"],
  [/\bgluten\b/g, "gluten"],
  [/\b(chapelure|boulgour|bulgur|couscous)\b/g, "dérivé de blé"],
];
const OAT_WORDS = /\b(avoine|oats?)\b/g;
const GLUTEN_TAGS = ["en:wheat", "en:barley", "en:rye", "en:spelt", "en:gluten", "en:barley-malt", "en:malt", "en:wheat-flour", "en:kamut"];
const GF_LABELS = ["en:no-gluten", "en:gluten-free", "fr:sans-gluten", "en:crossed-grain-symbol", "fr:epi-barre"];

export function analyze(p: ProductInfo | null): Analysis {
  if (!p) {
    return {
      verdict: "notfound",
      title: "Produit inconnu",
      reasons: ["Ce code-barres n'est pas dans la base Open Food Facts.", "Vérifie l'étiquette : cherche le logo épi barré et la liste des allergènes (en gras)."],
      hits: [],
    };
  }

  // On retire les mentions « sans gluten » pour ne pas les compter comme du gluten.
  const text = norm(p.ingredients).replace(/sans gluten|gluten[- ]free|no gluten|exempt de gluten/g, " ");
  const found = new Set<string>();
  const hits: string[] = [];
  for (const [re, label] of GLUTEN_WORDS) {
    const m = text.match(re);
    if (m) {
      found.add(label);
      hits.push(...m);
    }
  }
  const tagHit = p.ingredientTags.some((t) => GLUTEN_TAGS.some((g) => t === g || t.startsWith(g + "-")));
  const oatHits = text.match(OAT_WORDS) ?? [];
  const hasOats = oatHits.length > 0 || p.ingredientTags.some((t) => t.startsWith("en:oat"));
  const allergenGluten = p.allergens.includes("en:gluten");
  const tracesGluten = p.traces.includes("en:gluten");
  const labelGF = p.labels.some((l) => GF_LABELS.includes(l));
  const knownIngredients = p.ingredients.trim().length > 0 || p.ingredientTags.length > 0;

  if (labelGF && !allergenGluten) {
    return {
      verdict: "safe",
      title: "Sans gluten",
      reasons: ["Le produit porte un label « sans gluten » (moins de 20 mg/kg)."],
      hits: [],
    };
  }

  if (allergenGluten || found.size || tagHit) {
    const reasons: string[] = [];
    if (allergenGluten) reasons.push("Le gluten est déclaré dans les allergènes.");
    if (found.size) reasons.push(`Ingrédients en cause : ${[...found].join(", ")}.`);
    else if (tagHit) reasons.push("Un ingrédient à base de céréale contenant du gluten a été détecté.");
    return { verdict: "danger", title: "Contient du gluten", reasons, hits };
  }

  if (tracesGluten) {
    return {
      verdict: "traces",
      title: "Traces possibles",
      reasons: [
        "Mention « peut contenir des traces de gluten ».",
        "À éviter en cas d'intolérance forte ou de maladie cœliaque.",
      ],
      hits: [],
    };
  }

  if (hasOats) {
    return {
      verdict: "traces",
      title: "Avoine non certifiée",
      reasons: ["Contient de l'avoine sans label sans gluten : souvent contaminée par le blé."],
      hits: oatHits,
    };
  }

  if (knownIngredients) {
    return {
      verdict: "probable",
      title: "Probablement sans gluten",
      reasons: [
        "Aucun ingrédient contenant du gluten, ni de traces déclarées.",
        "Pas de label officiel : vérifie quand même l'emballage.",
      ],
      hits: [],
    };
  }

  return {
    verdict: "unknown",
    title: "Pas assez d'informations",
    reasons: ["La liste d'ingrédients n'est pas encore renseignée pour ce produit.", "Lis l'étiquette : allergènes en gras et logo épi barré."],
    hits: [],
  };
}

export const VERDICT_STYLE: Record<Verdict, { emoji: string; cls: string }> = {
  safe: { emoji: "✅", cls: "v-safe" },
  probable: { emoji: "🟢", cls: "v-probable" },
  traces: { emoji: "⚠️", cls: "v-traces" },
  danger: { emoji: "⛔", cls: "v-danger" },
  unknown: { emoji: "❔", cls: "v-unknown" },
  notfound: { emoji: "🔍", cls: "v-unknown" },
};
