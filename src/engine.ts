/**
 * Moteur de suggestions 100 % local et gratuit :
 * filtre la base de recettes selon le profil puis les classe par pertinence.
 */
import type { MealType, Moment, PlanEntry, Profile, Recipe } from "./types";
import { RECIPES } from "./data/db";
import { totalMinutes } from "./utils";

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .trim();

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

const MEAT = ["poulet", "boeuf", "veau", "porc", "agneau", "canard", "dinde", "lardons", "jambon", "chorizo", "saucisse", "bacon", "viande", "merguez", "lapin", "magret", "steak", "hache", "pancetta", "guanciale", "chair a saucisse", "echine", "paleron", "rumsteck"];
const SEAFOOD = ["crevette", "moule", "saint-jacques", "calamar", "gambas", "crabe", "homard"];
const FISH = ["saumon", "thon", "cabillaud", "poisson", "sardine", "maquereau", "truite", "colin", "merlu", "dorade", "bar ", "anchois", "haddock", "nuoc-mam", ...SEAFOOD];
const PORK = ["porc", "lardons", "jambon", "chorizo", "bacon", "saucisse", "pancetta", "guanciale", "chair a saucisse", "echine"];
const DAIRY_EXCEPT = ["lait de coco", "boisson", "beurre de cacahuete", "creme de coco", "lait d'amande"];
const DAIRY = ["lait", "beurre", "creme", "fromage", "parmesan", "mozzarella", "feta", "chevre", "emmental", "comte", "yaourt", "mascarpone", "ricotta", "cheddar", "reblochon", "burrata", "skyr", "pecorino", "philadelphia", "crottin"];
const EGG = ["oeuf", "mayonnaise", "jaune", "blancs d'oeufs", "biscuits a la cuillere"];
const NUTS = ["amande", "noisette", "noix", "pistache", "cajou", "pecan", "pignon", "cacahuete", "praline"];

export interface Flags {
  meat: boolean;
  fish: boolean;
  pork: boolean;
  dairy: boolean;
  egg: boolean;
  nuts: boolean;
  honey: boolean;
}

const flagCache = new Map<string, Flags>();

export function flagsOf(r: Recipe): Flags {
  const cached = flagCache.get(r.id);
  if (cached) return cached;
  const names = r.ingredients.map((i) => norm(i.name));
  const any = (words: string[]) => names.some((n) => has(n, words));
  const f: Flags = {
    meat: any(MEAT),
    fish: any(FISH),
    pork: any(PORK),
    dairy: names.some((n) => has(n, DAIRY) && !has(n, DAIRY_EXCEPT)),
    egg: any(EGG),
    nuts: names.some((n) => has(n, NUTS) && !has(n, ["coco", "muscade"])),
    honey: any(["miel"]),
  };
  flagCache.set(r.id, f);
  return f;
}

/** Labels calculés, affichés sur les fiches. */
export function dietLabels(r: Recipe): string[] {
  const f = flagsOf(r);
  const out: string[] = [];
  if (!f.meat && !f.fish) out.push(!f.dairy && !f.egg && !f.honey ? "vegan" : "végétarien");
  if (!f.dairy) out.push("sans lactose");
  return out;
}

function respectsDiets(r: Recipe, diets: string[]) {
  const f = flagsOf(r);
  for (const d of diets.map(norm)) {
    if (d.includes("vegan") || d.includes("vegetalien")) {
      if (f.meat || f.fish || f.dairy || f.egg || f.honey) return false;
    } else if (d.includes("vegetarien")) {
      if (f.meat || f.fish) return false;
    } else if (d.includes("pescetarien")) {
      if (f.meat) return false;
    } else if (d.includes("lactose") || d.includes("laitier")) {
      if (f.dairy) return false;
    } else if (d.includes("porc")) {
      if (f.pork) return false;
    } else if (d.includes("oeuf")) {
      if (f.egg) return false;
    } else if (d.includes("coque") || d.includes("noix")) {
      if (f.nuts) return false;
    }
  }
  return true;
}

const searchText = (r: Recipe) => norm([r.title, r.description, ...r.tags, ...r.ingredients.map((i) => i.name)].join(" | "));

const stem = (w: string) => {
  const n = norm(w).replace(/^cuisine /, "");
  return n.length > 5 ? n.slice(0, Math.max(5, n.length - 2)) : n.replace(/s$/, "");
};

function hitsDislike(r: Recipe, dislike: string) {
  const d = norm(dislike);
  const f = flagsOf(r);
  if (d === "poisson") return f.fish;
  if (d.includes("fruits de mer")) return r.ingredients.some((i) => has(norm(i.name), SEAFOOD));
  if (d === "viande") return f.meat;
  if (d.includes("epice") || d.includes("piment")) return r.tags.includes("épicé");
  const s = stem(d);
  return r.ingredients.some((i) => norm(i.name).includes(s)) || norm(r.title).includes(s);
}

export function allowedFor(profile: Profile, recipes: Recipe[] = RECIPES) {
  return recipes.filter((r) => respectsDiets(r, profile.diets) && !profile.dislikes.some((d) => hitsDislike(r, d)));
}

export interface Criteria {
  mealType?: MealType;
  craving?: string;
  fridge?: string;
  exclude?: string[];
  loved?: string[];
}

/** Envies prédéfinies → règles de correspondance. */
export const CRAVING_RULES: Record<string, (r: Recipe) => boolean> = {
  Réconfortant: (r) => r.tags.includes("réconfortant") || r.tags.includes("hiver"),
  Rapide: (r) => totalMinutes(r) <= 25,
  Healthy: (r) => r.tags.includes("healthy"),
  "Petit budget": (r) => r.costPerServing <= 1.8,
  "Cuisine du monde": (r) =>
    r.tags.some((t) => ["indien", "thaï", "asiatique", "mexicain", "marocain", "libanais", "japonais", "coréen", "vietnamien", "grec", "espagnol", "américain"].includes(t)),
  Végétarien: (r) => !flagsOf(r).meat && !flagsOf(r).fish,
  "Pour recevoir": (r) => r.tags.includes("recevoir"),
  "Street food": (r) => r.tags.includes("street food") || r.tags.includes("apéro"),
  Chocolat: (r) => r.tags.includes("chocolat"),
  Enfants: (r) => r.tags.includes("enfants"),
};

function score(r: Recipe, profile: Profile, c: Criteria, fridgeWords: string[]) {
  const text = searchText(r);
  let s = Math.random() * 3; // un peu de hasard pour varier
  for (const like of profile.likes) if (text.includes(stem(like))) s += 3;
  if (c.loved?.includes(r.title)) s += 2;
  const over = r.costPerServing - profile.budgetPerServing;
  if (over > 0) s -= over * 2;
  const tooLong = totalMinutes(r) - profile.maxMinutes;
  if (tooLong > 0) s -= 2 + tooLong / 15;
  if (profile.level === "débutant" && r.difficulty === "avancé") s -= 3;
  if (profile.level === "confirmé" && r.difficulty !== "facile") s += 0.5;
  if (fridgeWords.length) {
    const hits = fridgeWords.filter((w) => r.ingredients.some((i) => norm(i.name).includes(w))).length;
    s += hits * 5;
  }
  if (c.exclude?.includes(r.title)) s -= 6;
  return s;
}

/** Suggestions classées. La recherche libre (envie) filtre si elle trouve quelque chose. */
export function suggest(profile: Profile, c: Criteria, count = 6): Recipe[] {
  let pool = allowedFor(profile);
  if (c.mealType) pool = pool.filter((r) => r.mealType === c.mealType);

  const craving = c.craving?.trim();
  if (craving) {
    const rule = CRAVING_RULES[craving];
    const filtered = rule
      ? pool.filter(rule)
      : pool.filter((r) => {
          const t = searchText(r);
          return norm(craving)
            .split(/[\s,]+/)
            .filter((w) => w.length > 2)
            .some((w) => t.includes(stem(w)));
        });
    if (filtered.length) pool = filtered;
  }

  const fridgeWords = (c.fridge ?? "")
    .split(/[,;\n]+| et /)
    .map((w) =>
      norm(w)
        .replace(/^(un|une|des|du|de la|de l'|d'|\d+\s*\w*)\s+/, "")
        .trim(),
    )
    .filter((w) => w.length > 2)
    .map(stem);

  return pool
    .map((r) => ({ r, s: score(r, profile, c, fridgeWords) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.r);
}

/** Recherche dans toute la base, avec filtres. */
export function searchRecipes(q: string, opts: { mealType?: MealType; quick?: boolean; cheap?: boolean; veggie?: boolean }) {
  const words = norm(q)
    .split(/\s+/)
    .filter((w) => w.length > 1);
  return RECIPES.filter((r) => {
    if (opts.mealType && r.mealType !== opts.mealType) return false;
    if (opts.quick && totalMinutes(r) > 30) return false;
    if (opts.cheap && r.costPerServing > 2) return false;
    if (opts.veggie && (flagsOf(r).meat || flagsOf(r).fish)) return false;
    if (!words.length) return true;
    const t = searchText(r);
    return words.every((w) => t.includes(w));
  });
}

const MAIN_PROTEIN = (r: Recipe) => {
  const f = flagsOf(r);
  if (f.fish) return "poisson";
  const n = r.ingredients.map((i) => norm(i.name)).join(" ");
  if (n.includes("poulet") || n.includes("dinde")) return "volaille";
  if (n.includes("boeuf") || n.includes("veau") || n.includes("agneau")) return "viande rouge";
  if (f.pork) return "porc";
  return "végétarien";
};

/** Menu de la semaine sans IA : variété des protéines, pas de doublon, profil respecté. */
export function buildLocalPlan(
  profile: Profile,
  opts: { days: number; moments: Moment[]; loved: string[]; recent: string[] },
): PlanEntry[] {
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].slice(0, opts.days);
  const used = new Set<string>();
  const proteinCount: Record<string, number> = {};
  const entries: PlanEntry[] = [];

  for (const day of days) {
    for (const moment of opts.moments) {
      const mealType: MealType = moment === "petit-déjeuner" ? "petit-déjeuner" : "plat";
      const candidates = suggest(profile, { mealType, loved: opts.loved, exclude: opts.recent }, 40).filter((r) => !used.has(r.id));
      const pick =
        mealType === "plat"
          ? // On privilégie la protéine la moins servie jusqu'ici.
            candidates.sort((a, b) => (proteinCount[MAIN_PROTEIN(a)] ?? 0) - (proteinCount[MAIN_PROTEIN(b)] ?? 0))[0]
          : candidates[0];
      if (!pick) continue;
      used.add(pick.id);
      if (mealType === "plat") proteinCount[MAIN_PROTEIN(pick)] = (proteinCount[MAIN_PROTEIN(pick)] ?? 0) + 1;
      entries.push({ day, meal: moment, recipe: pick });
    }
  }
  return entries;
}

/** Remplace une entrée du menu par une autre recette compatible. */
export function swapPlanEntry(profile: Profile, plan: PlanEntry[], index: number, loved: string[]): PlanEntry[] {
  const target = plan[index];
  const mealType: MealType = target.meal === "petit-déjeuner" ? "petit-déjeuner" : "plat";
  const usedIds = new Set(plan.map((e) => e.recipe.id));
  const next = suggest(profile, { mealType, loved }, 30).find((r) => !usedIds.has(r.id));
  if (!next) return plan;
  return plan.map((e, i) => (i === index ? { ...e, recipe: next } : e));
}

export const RECIPE_COUNT = RECIPES.length;
export { RECIPES };
