import type { Recipe } from "../../types";
import { PETIT_DEJ } from "./petitdej";
import { ENTREES } from "./entrees";
import { PLATS_1 } from "./plats1";
import { PLATS_2 } from "./plats2";
import { DESSERTS } from "./desserts";
import { SNACKS } from "./snacks";
import { BASES } from "./bases";

export const RECIPES: Recipe[] = [...PETIT_DEJ, ...ENTREES, ...PLATS_1, ...PLATS_2, ...DESSERTS, ...SNACKS, ...BASES];
