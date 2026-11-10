import Anthropic from "@anthropic-ai/sdk";
import { AISLES, MEAL_TYPES, type MealType, type PlanEntry, type Profile, type Recipe, type Settings } from "./types";
import { uid } from "./storage";

const MODEL = "claude-opus-5-5";

// ---------- Schémas JSON (structured outputs) ----------

const ingredientSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    quantity: { type: "number" },
    unit: { type: "string", description: "g, kg, cl, pièce, c. à soupe, pincée…" },
    aisle: { type: "string", enum: AISLES },
    glutenNote: {
      type: "string",
      description: "Vigilance gluten pour cet ingrédient (ex: 'vérifier logo épi barré'), ou chaîne vide.",
    },
  },
  required: ["name", "quantity", "unit", "aisle", "glutenNote"],
  additionalProperties: false,
};

const recipeSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    emoji: { type: "string", description: "Un seul emoji représentant le plat" },
    description: { type: "string", description: "Une phrase appétissante" },
    mealType: { type: "string", enum: MEAL_TYPES },
    prepMinutes: { type: "integer" },
    cookMinutes: { type: "integer" },
    servings: { type: "integer" },
    costPerServing: { type: "number", description: "Coût estimé par portion en euros (prix supermarché France)" },
    difficulty: { type: "string", enum: ["facile", "moyen", "avancé"] },
    tags: { type: "array", items: { type: "string" } },
    ingredients: { type: "array", items: ingredientSchema },
    steps: { type: "array", items: { type: "string" } },
    glutenTips: {
      type: "array",
      items: { type: "string" },
      description: "1 à 3 conseils anti-contamination ou pièges gluten propres à cette recette",
    },
  },
  required: [
    "title",
    "emoji",
    "description",
    "mealType",
    "prepMinutes",
    "cookMinutes",
    "servings",
    "costPerServing",
    "difficulty",
    "tags",
    "ingredients",
    "steps",
    "glutenTips",
  ],
  additionalProperties: false,
};

const recipesSchema = {
  type: "object",
  properties: { recipes: { type: "array", items: recipeSchema } },
  required: ["recipes"],
  additionalProperties: false,
};

const planSchema = {
  type: "object",
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string", description: "Lundi, Mardi…" },
          meal: { type: "string", enum: MEAL_TYPES },
          recipe: recipeSchema,
        },
        required: ["day", "meal", "recipe"],
        additionalProperties: false,
      },
    },
  },
  required: ["entries"],
  additionalProperties: false,
};

// ---------- Prompts ----------

const SYSTEM = `Tu es Mijote, un·e chef·fe à domicile français·e spécialisé·e dans la cuisine STRICTEMENT sans gluten, pour une personne intolérante au gluten.

Règles absolues :
- Aucun ingrédient contenant du gluten : blé (y compris épeautre, kamut, petit épeautre), orge, seigle, malt, avoine non certifiée, triticale, seitan, chapelure classique, sauce soja classique, bière classique, couscous, boulgour, pâtes classiques.
- Quand un ingrédient industriel peut contenir du gluten caché (bouillon, sauces, épices en mélange, charcuterie, chocolat, levure, fécule, polenta, sarrasin), le signaler dans glutenNote et préciser « certifié sans gluten » si besoin.
- Proposer des alternatives malignes aux produits à base de blé (farines de riz, sarrasin, châtaigne, pois chiche, maïs ; fécules ; amande ; psyllium…).
- Ingrédients trouvables dans un supermarché français, quantités métriques précises.
- Les étapes sont claires, concrètes, avec temps et températures, écrites pour être suivies sur un téléphone en cuisinant.
- Estime le coût par portion de façon réaliste (prix supermarché France ${new Date().getFullYear()}).
- Écris tout en français, avec un ton chaleureux mais sans blabla.`;

export interface AICtx {
  profile: Profile;
  settings: Settings;
  loved: string[];
  disliked: string[];
}

function profileBlock({ profile: p, settings: s, loved, disliked }: AICtx) {
  const creativity = {
    classique: "Reste sur des recettes familières et rassurantes, des classiques revisités sans gluten.",
    équilibrée: "Mélange classiques et découvertes, avec une touche d'originalité.",
    audacieuse: "Ose des associations originales, des cuisines du monde, des techniques surprenantes (tout en restant réalisable).",
  }[s.creativity];
  return `Profil du foyer :
- Prénom : ${p.name || "non précisé"}
- Nombre de portions par défaut : ${p.servings}
- Budget max : ${p.budgetPerServing.toFixed(2)} € par portion
- Temps total max : ${p.maxMinutes} minutes
- Niveau en cuisine : ${p.level}
- Aime : ${p.likes.join(", ") || "pas de préférence"}
- N'aime PAS (à éviter absolument) : ${p.dislikes.join(", ") || "rien de particulier"}
- Régimes / restrictions supplémentaires : ${p.diets.join(", ") || "aucun"}
- Équipement disponible : ${p.equipment.join(", ") || "équipement de base (plaques, four)"}
- Remarques : ${p.notes || "aucune"}
- Plats qu'on a adorés (s'en inspirer) : ${loved.slice(0, 25).join(" ; ") || "pas encore de retour"}
- Plats pas aimés (éviter ce style) : ${disliked.slice(0, 25).join(" ; ") || "aucun"}
Créativité demandée : ${creativity}`;
}

// ---------- Appel API ----------

export class AIError extends Error {}

function client(apiKey: string) {
  if (!apiKey) throw new AIError("Ajoute ta clé API Claude dans l'onglet Profil pour activer l'IA.");
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
}

async function ask<T>(settings: Settings, prompt: string, schema: object, maxTokens: number): Promise<T> {
  const c = client(settings.apiKey);
  const run = (withFallback: boolean) =>
    c.beta.messages
      .stream({
        model: MODEL,
        max_tokens: maxTokens,
        // Si le modèle principal décline, l'API bascule automatiquement sur un autre modèle.
        ...(withFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
        system: SYSTEM,
        output_config: { effort: "low", format: { type: "json_schema", schema: schema as Record<string, unknown> } },
        messages: [{ role: "user", content: prompt }],
      })
      .finalMessage();
  try {
    let message;
    try {
      message = await run(true);
    } catch (e) {
      // Compte sans accès à l'option de repli : on réessaie sans.
      if (e instanceof Anthropic.BadRequestError && /fallback/i.test(e.message)) message = await run(false);
      else throw e;
    }

    if (message.stop_reason === "refusal") {
      throw new AIError("L'IA a refusé cette demande. Essaie de la reformuler.");
    }
    if (message.stop_reason === "max_tokens") {
      throw new AIError("La réponse était trop longue. Essaie avec moins de recettes ou de jours.");
    }
    // Ne garder que le texte produit après un éventuel basculement de modèle (fallback).
    const lastFallback = message.content.map((b) => b.type).lastIndexOf("fallback");
    const text = message.content
      .slice(lastFallback + 1)
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    return JSON.parse(text) as T;
  } catch (e) {
    if (e instanceof AIError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AIError("Clé API invalide. Vérifie-la dans Profil.");
    if (e instanceof Anthropic.PermissionDeniedError) throw new AIError("Cette clé API n'a pas accès au modèle.");
    if (e instanceof Anthropic.RateLimitError) throw new AIError("Trop de demandes d'un coup, réessaie dans une minute.");
    if (e instanceof Anthropic.APIConnectionError) throw new AIError("Pas de connexion internet ?");
    if (e instanceof Anthropic.APIError) throw new AIError(`Erreur du service IA (${e.status ?? "?"}). Réessaie.`);
    if (e instanceof SyntaxError) throw new AIError("Réponse illisible de l'IA, réessaie.");
    throw e;
  }
}

type RawRecipe = Omit<Recipe, "id" | "source" | "createdAt">;

const finalize = (r: RawRecipe): Recipe => ({ ...r, id: uid(), source: "ia", createdAt: Date.now() });

// ---------- Fonctions métier ----------

export interface IdeaRequest {
  mealType: MealType;
  craving: string;
  fridge: string;
  count: number;
  servings: number;
  avoidTitles: string[];
}

export async function generateIdeas(ctx: AICtx, req: IdeaRequest): Promise<Recipe[]> {
  const prompt = `${profileBlock(ctx)}

Propose ${req.count} recettes sans gluten DIFFÉRENTES les unes des autres (cuisines, techniques et ingrédients principaux variés) pour : ${req.mealType}.
Nombre de portions : ${req.servings}.
${req.craving ? `Envie du moment : « ${req.craving} ».` : ""}
${req.fridge ? `Ingrédients à utiliser en priorité (ce qu'on a dans le frigo) : ${req.fridge}.` : ""}
${req.avoidTitles.length ? `Déjà proposé récemment, ne pas répéter : ${req.avoidTitles.slice(0, 40).join(" ; ")}.` : ""}
Respecte le budget et le temps max.`;
  const out = await ask<{ recipes: RawRecipe[] }>(ctx.settings, prompt, recipesSchema, 16000);
  return out.recipes.map(finalize);
}

export async function generatePlan(
  ctx: AICtx,
  opts: { days: number; meals: MealType[]; batchCooking: boolean; extra: string; avoidTitles: string[] },
): Promise<PlanEntry[]> {
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].slice(0, opts.days);
  const prompt = `${profileBlock(ctx)}

Construis un menu de la semaine sans gluten pour : ${days.join(", ")}.
Repas à prévoir chaque jour : ${opts.meals.join(", ")}.
Contraintes :
- Variété sur la semaine (protéines, légumes de saison, cuisines différentes), équilibre nutritionnel.
- Mutualiser les ingrédients pour limiter le gaspillage et le coût total.
${opts.batchCooking ? "- Organisation en batch cooking : certains plats peuvent être préparés en double et resservis (le préciser dans la description)." : ""}
${opts.extra ? `- Demande particulière : ${opts.extra}` : ""}
${opts.avoidTitles.length ? `- Éviter ces plats déjà vus : ${opts.avoidTitles.slice(0, 30).join(" ; ")}` : ""}
Recettes concises : 4 à 7 étapes, ${ctx.profile.servings} portions chacune.
Renvoie une entrée par jour et par repas, dans l'ordre.`;
  const out = await ask<{ entries: { day: string; meal: MealType; recipe: RawRecipe }[] }>(ctx.settings, prompt, planSchema, 48000);
  return out.entries.map((e) => ({ day: e.day, meal: e.meal, recipe: finalize(e.recipe) }));
}

export async function adaptRecipe(ctx: AICtx, source: string): Promise<Recipe> {
  const prompt = `${profileBlock(ctx)}

Voici une recette classique (texte libre, nom de plat ou copier-coller). Transforme-la en version 100 % sans gluten, la plus fidèle possible au goût et à la texture d'origine. Explique dans glutenTips ce que tu as remplacé et pourquoi.

Recette d'origine :
"""
${source.slice(0, 8000)}
"""

Renvoie exactement 1 recette.`;
  const out = await ask<{ recipes: RawRecipe[] }>(ctx.settings, prompt, recipesSchema, 12000);
  if (!out.recipes[0]) throw new AIError("Aucune recette générée, réessaie.");
  return finalize(out.recipes[0]);
}

export async function remixRecipe(ctx: AICtx, recipe: Recipe, wish: string): Promise<Recipe> {
  const { id: _id, source: _s, createdAt: _c, ...base } = recipe;
  const prompt = `${profileBlock(ctx)}

Voici une recette sans gluten :
${JSON.stringify(base)}

Crée une variante de cette recette avec la modification suivante : « ${wish} ».
Garde-la strictement sans gluten. Renvoie exactement 1 recette.`;
  const out = await ask<{ recipes: RawRecipe[] }>(ctx.settings, prompt, recipesSchema, 12000);
  if (!out.recipes[0]) throw new AIError("Aucune recette générée, réessaie.");
  return finalize(out.recipes[0]);
}

export async function testKey(apiKey: string) {
  const c = client(apiKey);
  await c.models.retrieve(MODEL);
}
