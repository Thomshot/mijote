import type { Profile } from "./types";

export const DEFAULT_PROFILE: Profile = {
  name: "",
  servings: 2,
  budgetPerServing: 4,
  maxMinutes: 45,
  likes: [],
  dislikes: [],
  diets: [],
  level: "intermédiaire",
  equipment: ["four", "plaques"],
  notes: "",
  onboarded: false,
};
