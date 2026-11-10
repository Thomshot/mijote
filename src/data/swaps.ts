export interface Swap {
  from: string;
  emoji: string;
  to: string[];
  tip: string;
}

/** Guide des équivalences sans gluten. */
export const SWAPS: Swap[] = [
  {
    from: "Farine de blé (gâteaux)",
    emoji: "🎂",
    to: ["Mix farine de riz + fécule (70/30)", "Poudre d'amande", "Farine de châtaigne"],
    tip: "Ajouter 1 œuf ou 1 c. à café de psyllium pour remplacer l'élasticité du gluten.",
  },
  {
    from: "Farine pour sauces / béchamel",
    emoji: "🥄",
    to: ["Fécule de maïs (Maïzena)", "Fécule de pomme de terre", "Farine de riz"],
    tip: "Moitié moins de fécule que de farine : 20 g de Maïzena pour 50 cl de lait.",
  },
  {
    from: "Pâtes",
    emoji: "🍝",
    to: ["Pâtes de riz / maïs", "Pâtes de lentilles ou pois chiches", "Nouilles de riz", "Spaghetti de courgette"],
    tip: "Les pâtes sans gluten se cuisent dans beaucoup d'eau, et on les rince rarement : goûter souvent, elles passent vite de al dente à trop cuites.",
  },
  {
    from: "Sauce soja",
    emoji: "🥢",
    to: ["Tamari certifié sans gluten", "Aminos de coco"],
    tip: "La sauce soja classique est brassée avec du blé : piège très fréquent dans les restos asiatiques.",
  },
  {
    from: "Chapelure",
    emoji: "🍞",
    to: ["Polenta fine", "Flocons de maïs nature écrasés", "Poudre d'amande", "Chapelure sans gluten"],
    tip: "Polenta + parmesan = panure ultra croustillante.",
  },
  {
    from: "Semoule / couscous / boulgour",
    emoji: "🥙",
    to: ["Quinoa", "Millet", "Sarrasin concassé", "Riz complet"],
    tip: "Le millet a une texture très proche de la semoule.",
  },
  {
    from: "Pâte à tarte / pizza",
    emoji: "🍕",
    to: ["Pâte riz + polenta", "Base chou-fleur", "Pâte sans gluten du commerce"],
    tip: "Étaler la pâte entre deux feuilles de papier cuisson : elle est plus fragile.",
  },
  {
    from: "Bière",
    emoji: "🍺",
    to: ["Bière sans gluten (logo épi barré)", "Cidre", "Vin"],
    tip: "La bière classique est à base d'orge : interdite.",
  },
  {
    from: "Flocons d'avoine",
    emoji: "🥣",
    to: ["Avoine certifiée sans gluten", "Flocons de sarrasin", "Flocons de quinoa", "Flocons de riz"],
    tip: "L'avoine est souvent contaminée au champ ou à l'usine.",
  },
  {
    from: "Bouillon cube",
    emoji: "🍲",
    to: ["Bouillon certifié sans gluten", "Bouillon maison"],
    tip: "Beaucoup de cubes contiennent de l'extrait de levure ou de la farine de blé.",
  },
];

export const WATCHOUTS = [
  "Logo « épi barré » = garanti sans gluten (moins de 20 mg/kg).",
  "Mentions à fuir : blé, orge, seigle, épeautre, kamut, malt, avoine non certifiée.",
  "« Peut contenir des traces de gluten » : à éviter en cas d'intolérance forte.",
  "Contamination croisée : grille-pain, planche à pain, passoire et huile de friture partagés.",
  "Pièges cachés : sauce soja, bouillons, charcuterie, épices en mélange, bonbons, chips aromatisées, malt d'orge dans les céréales.",
];
