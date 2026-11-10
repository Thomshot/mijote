export type MealType = "petit-déjeuner" | "déjeuner" | "dîner" | "dessert" | "goûter";

export const MEAL_TYPES: MealType[] = ["petit-déjeuner", "déjeuner", "dîner", "dessert", "goûter"];

export type Aisle =
  | "Fruits & légumes"
  | "Viande & poisson"
  | "Frais & crèmerie"
  | "Épicerie"
  | "Épicerie sans gluten"
  | "Surgelés"
  | "Autre";

export const AISLES: Aisle[] = [
  "Fruits & légumes",
  "Viande & poisson",
  "Frais & crèmerie",
  "Épicerie",
  "Épicerie sans gluten",
  "Surgelés",
  "Autre",
];

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  aisle: Aisle;
  /** Point de vigilance gluten (ex : "vérifier le logo épi barré") */
  glutenNote: string;
}

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  description: string;
  mealType: MealType;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  /** Coût estimé par portion en euros */
  costPerServing: number;
  difficulty: "facile" | "moyen" | "avancé";
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  /** Conseils sécurité gluten / contamination croisée */
  glutenTips: string[];
  source: "bibliothèque" | "ia";
  createdAt: number;
}

export interface Profile {
  name: string;
  servings: number;
  budgetPerServing: number;
  maxMinutes: number;
  likes: string[];
  dislikes: string[];
  diets: string[];
  level: "débutant" | "intermédiaire" | "confirmé";
  equipment: string[];
  notes: string;
  onboarded: boolean;
}

export interface PlanEntry {
  day: string;
  meal: MealType;
  recipe: Recipe;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  aisle: Aisle;
  checked: boolean;
  glutenNote: string;
}

export interface Settings {
  apiKey: string;
  creativity: "classique" | "équilibrée" | "audacieuse";
}
