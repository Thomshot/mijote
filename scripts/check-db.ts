// Contrôle qualité de la base : npx tsx scripts/check-db.ts
import { RECIPES } from "../src/data/db/index";
import { flagsOf, allowedFor, suggest, buildLocalPlan } from "../src/engine";
import { DEFAULT_PROFILE } from "../src/defaults";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const RISKY = ["ble", "orge", "seigle", "epeautre", "kamut", "malt", "semoule", "boulgour", "couscous", "seitan", "sauce soja", "chapelure", "pates", "pate ", "spaghetti", "tagliatelle", "lasagne", "pain", "biscuit", "tortilla", "nouilles", "biere", "avoine", "crozets", "gnocchi"];
const SAFE = ["sans gluten", "riz", "sarrasin", "mais", "certifie", "100 %", "pomme de terre", "pois chiche", "polenta"];
let problems = 0;
const ids = new Set<string>();
for (const r of RECIPES) {
  if (ids.has(r.id)) { console.log("DOUBLON", r.id); problems++; }
  ids.add(r.id);
  if (!r.steps.length || !r.ingredients.length) { console.log("VIDE", r.title); problems++; }
  for (const i of r.ingredients) {
    const n = norm(i.name);
    if (!i.quantity) { console.log("QTE 0", r.title, "→", i.name); problems++; }
    const risky = RISKY.find((w) => new RegExp(`(^|[^a-z])${w.trim()}`).test(n));
    if (risky && !SAFE.some((s) => n.includes(s)) && !i.glutenNote) {
      console.log("RISQUE", r.title, "→", i.name, `(${risky})`); problems++;
    }
  }
}
const byCat: Record<string, number> = {};
RECIPES.forEach((r) => (byCat[r.mealType] = (byCat[r.mealType] ?? 0) + 1));
console.log("Total", RECIPES.length, byCat);
const veg = RECIPES.filter((r) => !flagsOf(r).meat && !flagsOf(r).fish).length;
const vegan = allowedFor({ ...DEFAULT_PROFILE, diets: ["vegan"] }).length;
const noLact = allowedFor({ ...DEFAULT_PROFILE, diets: ["sans lactose"] }).length;
console.log({ vegetariennes: veg, vegan, sansLactose: noLact });
const p = { ...DEFAULT_PROFILE, dislikes: ["champignons", "poisson"], diets: ["sans porc"] };
const s = suggest(p, { mealType: "plat", fridge: "courgettes, chèvre" }, 5);
console.log("Suggestions frigo courgette/chèvre :", s.map((r) => r.title));
const bad = allowedFor(p).filter((r) => r.ingredients.some((i) => norm(i.name).includes("champignon")) || flagsOf(r).fish || flagsOf(r).pork);
console.log("Fuites de filtre :", bad.length);
const plan = buildLocalPlan(DEFAULT_PROFILE, { days: 7, moments: ["déjeuner", "dîner"], loved: [], recent: [] });
console.log("Menu 7j x2 :", plan.length, "repas,", new Set(plan.map((e) => e.recipe.id)).size, "uniques");
console.log(problems ? `❌ ${problems} problème(s)` : "✅ aucun problème");
