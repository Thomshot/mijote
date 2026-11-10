import type { Aisle, Ingredient, MealType, Recipe } from "../../types";

const AISLE_CODES: Record<string, Aisle> = {
  L: "Fruits & légumes",
  V: "Viande & poisson",
  F: "Frais & crèmerie",
  E: "Épicerie",
  G: "Épicerie sans gluten",
  S: "Surgelés",
  A: "Autre",
};

/** Notes de vigilance gluten récurrentes, référencées par un code court. */
const NOTES: Record<string, string> = {
  bouillon: "Bouillon certifié sans gluten : beaucoup de cubes en contiennent.",
  tamari: "Tamari certifié sans gluten : la sauce soja classique contient du blé.",
  levure: "Levure chimique certifiée sans gluten.",
  epices: "Mélange d'épices : vérifier l'absence de farine (logo épi barré).",
  charcut: "Charcuterie : vérifier la mention sans gluten.",
  choco: "Chocolat : vérifier l'absence de traces de gluten.",
  avoine: "Uniquement de l'avoine certifiée sans gluten.",
  farine: "Farine certifiée sans gluten (risque de contamination au moulin).",
  polenta: "Polenta certifiée sans gluten.",
  pain: "Pain sans gluten.",
  pates: "Pâtes sans gluten (riz, maïs, légumineuses).",
  sauce: "Sauce industrielle : vérifier l'étiquette (logo épi barré).",
  moutarde: "Moutarde : vérifier l'étiquette, certaines contiennent du gluten.",
  cereales: "Céréales certifiées sans gluten (le malt d'orge est fréquent).",
  nouilles: "Nouilles 100 % riz : vérifier qu'il n'y a pas de blé.",
  miso: "Miso certifié sans gluten (sans orge).",
  curry: "Pâte de curry : vérifier l'étiquette, certaines contiennent du blé.",
  chapelure: "Chapelure sans gluten.",
  tortilla: "Tortillas 100 % maïs (celles au blé sont interdites).",
  biscuits: "Biscuits certifiés sans gluten.",
  pate: "Pâte sans gluten (maison ou du commerce).",
  glace: "Glace : vérifier l'étiquette (biscuits, épaississants).",
  vinaigre: "Éviter le vinaigre de malt.",
  sucre: "Sucre vanillé / arômes : vérifier l'étiquette.",
  fecule: "Fécule certifiée sans gluten.",
  lardons: "Lardons : vérifier la mention sans gluten.",
  biere: "Bière certifiée sans gluten uniquement.",
  galette: "Galettes/crackers certifiés sans gluten.",
};

function ing(spec: string): Ingredient {
  const [name, qty, unit, aisle = "E", note = ""] = spec.split("|");
  return {
    name,
    quantity: Number(qty) || 0,
    unit: unit ?? "",
    aisle: AISLE_CODES[aisle] ?? "Autre",
    glutenNote: NOTES[note] ?? note,
  };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const DIFF = { 1: "facile", 2: "moyen", 3: "avancé" } as const;

/**
 * Déclare une recette de façon compacte.
 * Ingrédient : "nom|quantité|unité|rayon|note". Rayon : L légumes, V viande/poisson, F frais,
 * E épicerie, G épicerie sans gluten, S surgelés, A autre. Note : code de NOTES ou texte libre.
 */
export function R(
  title: string,
  emoji: string,
  mealType: MealType,
  prepMinutes: number,
  cookMinutes: number,
  servings: number,
  costPerServing: number,
  difficulty: 1 | 2 | 3,
  tags: string,
  description: string,
  ingredients: string[],
  steps: string[],
  glutenTips: string[] = [],
): Recipe {
  return {
    id: "db-" + slug(title),
    title,
    emoji,
    description,
    mealType,
    prepMinutes,
    cookMinutes,
    servings,
    costPerServing,
    difficulty: DIFF[difficulty],
    tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    ingredients: ingredients.map(ing),
    steps,
    glutenTips,
    source: "bibliothèque",
    createdAt: 0,
  };
}
