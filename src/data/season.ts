/**
 * Calendrier des fruits et légumes de saison en France (mois 1 = janvier).
 * Seuls les produits vraiment saisonniers sont listés (pas l'oignon, la carotte, la pomme de terre…).
 */
const SEASON: Record<string, number[]> = {
  asperge: [4, 5, 6],
  aubergine: [6, 7, 8, 9],
  betterave: [1, 2, 3, 9, 10, 11, 12],
  brocoli: [1, 2, 3, 9, 10, 11, 12],
  butternut: [9, 10, 11, 12, 1, 2],
  potimarron: [9, 10, 11, 12, 1],
  courge: [9, 10, 11, 12, 1, 2],
  potiron: [9, 10, 11, 12, 1],
  chataigne: [10, 11, 12],
  "chou-fleur": [1, 2, 3, 9, 10, 11, 12],
  "chou rouge": [1, 2, 3, 10, 11, 12],
  concombre: [5, 6, 7, 8, 9],
  courgette: [5, 6, 7, 8, 9],
  endive: [1, 2, 3, 10, 11, 12],
  epinard: [3, 4, 5, 9, 10, 11],
  fenouil: [6, 7, 8, 9, 10],
  "haricots verts": [6, 7, 8, 9],
  "petits pois": [5, 6, 7],
  poireau: [1, 2, 3, 9, 10, 11, 12],
  poivron: [6, 7, 8, 9],
  radis: [4, 5, 6, 7],
  tomate: [6, 7, 8, 9],
  "tomates cerises": [6, 7, 8, 9],
  "mache": [1, 2, 3, 10, 11, 12],
  abricot: [6, 7, 8],
  cerise: [5, 6, 7],
  fraise: [5, 6, 7],
  framboise: [6, 7, 8, 9],
  myrtille: [7, 8, 9],
  figue: [8, 9, 10],
  "peche": [6, 7, 8, 9],
  melon: [6, 7, 8, 9],
  pasteque: [7, 8],
  poire: [8, 9, 10, 11, 12, 1],
  pomme: [8, 9, 10, 11, 12, 1, 2, 3],
  raisin: [8, 9, 10],
  clementine: [11, 12, 1, 2],
  orange: [12, 1, 2, 3],
  kiwi: [11, 12, 1, 2, 3],
};

export const MONTH_NAMES = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const DISPLAY: Record<string, string> = {
  chataigne: "châtaigne",
  epinard: "épinards",
  mache: "mâche",
  peche: "pêche",
  pasteque: "pastèque",
  clementine: "clémentine",
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export const currentMonth = () => new Date().getMonth() + 1;

/** Produits de saison ce mois-ci (pour l'affichage). */
export function inSeasonNow(month = currentMonth()) {
  return Object.entries(SEASON)
    .filter(([, months]) => months.includes(month))
    .map(([k]) => DISPLAY[k] ?? k);
}

/** Pour une liste d'ingrédients : combien sont de saison, combien hors saison. */
export function seasonality(ingredientNames: string[], month = currentMonth()) {
  let inSeason = 0;
  let outOfSeason = 0;
  for (const raw of ingredientNames) {
    const n = norm(raw);
    // Les produits surgelés ou en conserve ne comptent pas.
    if (/surgel|boite|\bsecs?\b|seche|confit|concasse|jus |coulis|pommes? de terre|fecule|farine|poudre/.test(n)) continue;
    const key = Object.keys(SEASON)
      .sort((a, b) => b.length - a.length)
      .find((k) => n.includes(k));
    if (!key) continue;
    if (SEASON[key].includes(month)) inSeason++;
    else outOfSeason++;
  }
  return { inSeason, outOfSeason };
}
