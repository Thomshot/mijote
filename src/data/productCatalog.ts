/**
 * Catalogue des ingrédients « sensibles » (risque de gluten) pour lesquels l'appli propose
 * des produits repères et des conseils pour les trouver.
 *
 * - names  : noms d'ingrédients exacts, tels qu'écrits dans src/data/db/*.ts
 * - search : requête Open Food Facts (scripts/fetch-products.ts)
 * - must   : mots obligatoires dans le nom du produit (chaque groupe = alternatives)
 * - not    : mots interdits dans le nom du produit
 * - start  : le nom doit commencer par l'ingrédient (épices, chocolats, charcuterie…)
 * - strict : produit normalement au blé, on exige « sans gluten » dans le nom ou une marque 100 % sans gluten
 * - where  : où le trouver, affiché même sans produit repère
 *
 * Les produits eux-mêmes sont dans src/data/products.json (généré puis vérifié à l'œil).
 */

export interface CatalogEntry {
  key: string;
  label: string;
  names: string[];
  search: string;
  must: string[][];
  /** mots interdits dans le nom du produit (plats préparés, chips aromatisées…) */
  not?: string[];
  /** produit normalement au blé : le nom doit dire « sans gluten » ou venir d'une marque 100 % sans gluten */
  strict?: boolean;
  /** le nom du produit doit commencer par un des mots du premier groupe de `must` (écarte biscuits, snacks, plats) */
  start?: boolean;
  where: string;
}

const SG = "Rayon sans gluten des grandes surfaces, magasins bio (Biocoop, Naturalia, La Vie Claire…) ou en ligne.";
const EPI = "Rayon épicerie : prendre un produit avec le logo épi barré ou la mention « sans gluten ».";
const EPICES = "Rayon épices : les épices pures sont sans gluten, mais les mélanges peuvent contenir de la farine. Logo épi barré ou mention « sans gluten ».";
const FRAIS = "Rayon charcuterie / traiteur : beaucoup de marques affichent « sans gluten » sur l'emballage, sinon lire la liste d'ingrédients.";
const ASIE = "Rayon asiatique ou épicerie asiatique : beaucoup de produits contiennent du blé, vérifier chaque étiquette.";
const BIO = "Magasins bio et rayon sans gluten, parfois au rayon riz / céréales des grandes surfaces.";

export const CATALOG: CatalogEntry[] = [
  // ── Farines, fécules, levures ───────────────────────────
  { key: "fecule-mais", label: "Fécule de maïs", names: ["fécule de maïs"], search: "fécule de maïs", must: [["mais", "maizena"], ["fecule", "amidon", "maizena"]], where: EPI },
  { key: "fecule-pdt", label: "Fécule de pomme de terre", names: ["fécule de pomme de terre"], search: "fécule de pomme de terre", must: [["pomme de terre", "pommes de terre"], ["fecule", "amidon"]], where: EPI },
  { key: "farine-riz", label: "Farine de riz", names: ["farine de riz", "farine de riz demi-complète", "farine de riz complet"], search: "farine de riz", must: [["farine"], ["riz"]], not: ["gluant"], where: SG },
  { key: "farine-sarrasin", label: "Farine de sarrasin", names: ["farine de sarrasin"], search: "farine de sarrasin", must: [["farine"], ["sarrasin", "ble noir"]], where: SG + " Attention : beaucoup de farines de sarrasin ne sont pas certifiées (moulins partagés avec le blé)." },
  { key: "farine-pois-chiche", label: "Farine de pois chiche", names: ["farine de pois chiche"], search: "farine de pois chiche", must: [["farine"], ["pois chiche"]], where: SG + " Aussi en épicerie orientale ou indienne (besan), mais rarement certifiée." },
  { key: "levure-chimique", label: "Levure chimique", names: ["levure chimique"], search: "levure chimique", must: [["levure", "poudre a lever"]], where: EPI + " Certaines levures contiennent de l'amidon de blé." },
  { key: "levure-boulanger", label: "Levure de boulanger", names: ["levure de boulanger sèche", "levure boulangère sèche", "levure boulangère"], search: "levure boulangère", must: [["levure"], ["boulang"]], where: EPI },
  { key: "psyllium", label: "Psyllium blond", names: ["psyllium blond"], search: "psyllium", must: [["psyllium"]], where: "Magasins bio, pharmacies et parapharmacies, ou en ligne." },
  { key: "xanthane", label: "Gomme xanthane", names: ["gomme xanthane"], search: "gomme xanthane", must: [["xanthane"]], where: SG },
  { key: "polenta", label: "Polenta", names: ["polenta fine", "polenta"], search: "polenta", must: [["polenta", "semoule de mais"]], where: EPI + " Choisir une polenta certifiée : certaines sont produites dans des usines qui travaillent le blé." },
  { key: "chapelure", label: "Chapelure sans gluten", names: ["chapelure sans gluten"], search: "chapelure", must: [["chapelure", "panure"]], not: ["cereales"], strict: true, where: SG + " Ou maison, avec du pain sans gluten mixé (voir la recette)." },

  // ── Pains, pâtes, pâtes à tarte ─────────────────────────
  { key: "pain", label: "Pain sans gluten", names: ["pain sans gluten", "pain sans gluten rassis"], search: "pain", must: [["pain"]], not: ["fleurs", "grille", "crackers"], strict: true, where: SG + " Aussi au rayon surgelés." },
  { key: "pain-de-mie", label: "Pain de mie sans gluten", names: ["pain de mie sans gluten"], search: "pain de mie", must: [["pain de mie", "mie"]], strict: true, where: SG },
  { key: "pates", label: "Pâtes sans gluten", names: ["spaghetti sans gluten", "petites pâtes sans gluten", "pâtes sans gluten", "pâtes sans gluten (coquillettes)", "tagliatelles sans gluten", "coudes ou macaroni sans gluten"], search: "pâtes sans gluten maïs riz", must: [["pates", "spaghetti", "penne", "fusilli", "coquillettes", "macaroni", "tagliatelle", "torsades", "coudes"]], not: ["sarrasin", "lentille", "pois", "sauce", "plat"], strict: true, where: "Rayon pâtes ou rayon sans gluten : la plupart des grandes marques et des marques de distributeur ont une gamme sans gluten (maïs-riz, légumineuses)." },
  { key: "pates-sarrasin", label: "Pâtes 100 % sarrasin", names: ["pâtes 100 % sarrasin"], search: "pâtes sarrasin", must: [["sarrasin"]], where: BIO + " Vérifier qu'elles sont 100 % sarrasin (beaucoup sont mélangées au blé)." },
  { key: "lasagnes", label: "Feuilles de lasagnes sans gluten", names: ["feuilles de lasagnes sans gluten"], search: "lasagne", must: [["lasagne"]], strict: true, where: SG },
  { key: "pate-brisee", label: "Pâte brisée sans gluten", names: ["pâte brisée sans gluten"], search: "pâte brisée", must: [["brisee", "pate a tarte"]], strict: true, where: "Rayon frais (à côté des pâtes à tarte classiques) ou rayon sans gluten. Ou maison (voir la recette)." },
  { key: "pate-sablee", label: "Pâte sablée sans gluten", names: ["pâte sablée sans gluten"], search: "pâte sablée", must: [["sablee", "pate a tarte"]], strict: true, where: "Rayon frais ou rayon sans gluten. Ou maison (voir la recette)." },
  { key: "pate-feuilletee", label: "Pâte feuilletée sans gluten", names: ["pâte feuilletée sans gluten"], search: "pâte feuilletée", must: [["feuillet"]], strict: true, where: "Rayon frais des grandes surfaces (à côté des pâtes classiques), rayon sans gluten ou surgelés." },
  { key: "tortillas", label: "Tortillas de maïs", names: ["tortillas de maïs"], search: "tortillas", must: [["tortilla", "wrap"]], not: ["chips", "nachips", "patatas", "patata"], strict: true, where: SG + " En épicerie mexicaine, prendre des tortillas 100 % maïs." },

  // ── Céréales et graines ─────────────────────────────────
  { key: "avoine", label: "Flocons d'avoine sans gluten", names: ["flocons d'avoine certifiés sans gluten"], search: "flocons d'avoine", must: [["avoine"]], strict: true, where: SG + " Uniquement les paquets certifiés : l'avoine classique est presque toujours contaminée." },
  { key: "flocons-sarrasin", label: "Flocons de sarrasin", names: ["flocons de sarrasin"], search: "flocons de sarrasin", must: [["sarrasin"]], not: ["avoine"], where: BIO },
  { key: "flocons-riz", label: "Flocons de riz", names: ["flocons de riz"], search: "flocons de riz", must: [["riz"], ["flocon"]], where: BIO },
  { key: "sarrasin", label: "Sarrasin décortiqué", names: ["sarrasin décortiqué"], search: "sarrasin décortiqué", must: [["sarrasin", "kasha"]], where: BIO },
  { key: "millet", label: "Millet", names: ["millet", "millet décortiqué"], search: "millet", must: [["millet"]], not: ["amande", "quinoa", "noisette", "boisson", "drink", "lait"], start: true, where: BIO + " Le millet est souvent contaminé : prendre un paquet certifié sans gluten." },
  { key: "granola", label: "Granola sans gluten", names: ["granola sans gluten"], search: "granola", must: [["granola", "muesli", "croustillant"]], not: ["barre"], strict: true, where: SG },
  { key: "riz-souffle", label: "Galettes de riz soufflé", names: ["galettes de riz soufflé"], search: "galettes de riz", must: [["galette", "tartine"], ["riz"]], not: ["chocolat"], where: "Rayon biscottes / petit-déjeuner : vérifier la mention sans gluten (certaines contiennent de l'orge ou du blé)." },
  { key: "feuilles-riz", label: "Feuilles de riz", names: ["galettes de riz", "feuilles de riz"], search: "galettes de riz rouleaux de printemps", must: [["riz"], ["feuille", "galette"]], where: ASIE + " Prendre des feuilles 100 % riz (ou riz + tapioca)." },
  { key: "nouilles-riz", label: "Nouilles de riz", names: ["nouilles de riz", "nouilles de riz larges", "nouilles de riz plates", "vermicelles de riz"], search: "nouilles de riz", must: [["riz"], ["nouille", "vermicelle", "pad thai"]], not: ["legumes", "ramen", "poulet", "crevette"], where: ASIE + " Prendre des nouilles 100 % riz." },
  { key: "chips-mais", label: "Chips de maïs", names: ["chips de maïs nature"], search: "tortilla chips", must: [["chips", "tortilla"]], where: "Rayon apéritif : la plupart des chips de maïs nature sont sans gluten, mais pas les aromatisées. Vérifier." },

  // ── Sauces et condiments ────────────────────────────────
  { key: "tamari", label: "Tamari (sauce soja sans gluten)", names: ["tamari"], search: "tamari", must: [["tamari", "soja"]], where: ASIE + " La sauce soja classique contient du blé : seul le tamari certifié convient." },
  { key: "miso", label: "Miso sans gluten", names: ["pâte miso", "miso blanc"], search: "miso", must: [["miso"]], not: ["soupe"], where: ASIE + " Choisir un miso de riz ou de soja (pas d'orge)." },
  { key: "nuoc-mam", label: "Nuoc-mâm", names: ["nuoc-mâm"], search: "nuoc mam", must: [["nuoc", "poisson"]], not: ["nems", "veggie"], where: ASIE + " Le nuoc-mâm traditionnel est sans gluten, mais certaines marques ajoutent de l'hydrolysat de blé." },
  { key: "mirin", label: "Mirin", names: ["mirin"], search: "mirin", must: [["mirin"]], where: ASIE + " Certains mirins contiennent du sirop de malt." },
  { key: "gochujang", label: "Gochujang sans gluten", names: ["gochujang sans gluten"], search: "gochujang", must: [["gochujang"]], where: ASIE + " La plupart contiennent du blé : rare en version sans gluten, à chercher en ligne." },
  { key: "pate-curry", label: "Pâte de curry", names: ["pâte de curry rouge", "pâte de curry vert"], search: "pâte de curry", must: [["curry"], ["rouge", "vert", "red", "green"]], not: ["tandoori", "tartiner", "korma", "balti", "tikka", "butter", "set"], where: ASIE },
  { key: "moutarde", label: "Moutarde", names: ["moutarde"], search: "moutarde", must: [["moutarde"]], not: ["chips", "pois chiche"], start: true, where: EPI + " La moutarde de Dijon nature est généralement sans gluten, les moutardes à l'ancienne ou aromatisées sont à vérifier." },
  { key: "ketchup", label: "Ketchup", names: ["ketchup"], search: "ketchup", must: [["ketchup"]], where: EPI },
  { key: "mayonnaise", label: "Mayonnaise", names: ["mayonnaise"], search: "mayonnaise", must: [["mayonnaise"]], where: EPI },
  { key: "harissa", label: "Harissa", names: ["harissa"], search: "harissa", must: [["harissa"]], not: ["poulet", "falafel"], where: EPI },
  { key: "pesto", label: "Pesto", names: ["pesto"], search: "pesto", must: [["pesto"]], not: ["chips", "pomodori", "rustico"], where: EPI + " Ou maison (voir la recette)." },
  { key: "caramel", label: "Caramel beurre salé", names: ["caramel beurre salé"], search: "caramel beurre salé", must: [["caramel"]], not: ["glace", "glacee", "creme", "barre", "dessert", "sable", "preparation", "entremets", "caramels"], start: true, where: EPI },

  // ── Bouillons ───────────────────────────────────────────
  { key: "bouillon-legumes", label: "Bouillon de légumes", names: ["bouillon de légumes"], search: "bouillon légumes", must: [["bouillon"], ["legume"]], where: EPI + " Beaucoup de cubes contiennent du blé ou de l'extrait de malt." },
  { key: "bouillon-volaille", label: "Bouillon de volaille", names: ["bouillon de volaille"], search: "bouillon poule", must: [["bouillon"], ["poule", "volaille", "poulet"]], where: EPI + " Beaucoup de cubes contiennent du blé ou de l'extrait de malt." },
  { key: "bouillon-boeuf", label: "Bouillon de bœuf", names: ["bouillon de bœuf"], search: "bouillon boeuf", must: [["bouillon", "fond"], ["boeuf", "pot-au-feu"]], where: EPI + " Beaucoup de cubes contiennent du blé ou de l'extrait de malt." },

  // ── Épices ──────────────────────────────────────────────
  { key: "curry", label: "Curry en poudre", names: ["curry en poudre"], search: "curry poudre", must: [["curry"]], where: EPICES },
  { key: "garam-masala", label: "Garam masala", names: ["garam masala"], search: "garam masala", must: [["garam", "masala"]], start: true, where: EPICES },
  { key: "ras-el-hanout", label: "Ras el hanout", names: ["ras-el-hanout", "ras el hanout"], search: "ras el hanout", must: [["ras"]], not: ["paste", "pate"], start: true, where: EPICES },
  { key: "paprika", label: "Paprika", names: ["paprika"], search: "paprika", must: [["paprika"]], not: ["cracker", "snack", "chips", "poppe", "protein", "tortilla", "graines", "tuile", "tofu"], start: true, where: EPICES },
  { key: "cumin", label: "Cumin", names: ["cumin"], search: "cumin", must: [["cumin"]], not: ["graines grillees", "quinoa", "jam", "confiture", "apero", "pois chiche", "tartine"], start: true, where: EPICES },

  // ── Charcuterie et viande ───────────────────────────────
  { key: "jambon", label: "Jambon blanc", names: ["jambon blanc"], search: "jambon", must: [["jambon"]], not: ["cru"], where: FRAIS },
  { key: "lardons", label: "Lardons", names: ["lardons"], search: "lardons", must: [["lardon"]], not: ["poelee", "salade"], start: true, where: FRAIS },
  { key: "pancetta", label: "Guanciale ou pancetta", names: ["guanciale ou pancetta"], search: "pancetta", must: [["pancetta", "guanciale"]], not: ["sauce", "chips"], where: FRAIS },
  { key: "chorizo", label: "Chorizo", names: ["chorizo"], search: "chorizo", must: [["chorizo"]], not: ["chipolata"], start: true, where: FRAIS },
  { key: "saucisses", label: "Saucisses", names: ["saucisses de Toulouse", "chair à saucisse"], search: "saucisse", must: [["saucisse"]], not: ["francfort", "geante", "lyon", "frankfort"], start: true, where: FRAIS + " Les saucisses contiennent souvent de la chapelure ou des fibres de blé." },
  { key: "merguez", label: "Merguez", names: ["merguez"], search: "merguez", must: [["merguez"]], start: true, where: FRAIS },
  { key: "steak-hache", label: "Steak haché pur bœuf", names: ["steaks hachés pur bœuf"], search: "steak haché", must: [["hache"]], not: ["jambon"], where: "Rayon boucherie / frais : prendre « 100 % pur bœuf ». Les « préparations de viande hachée » peuvent contenir du blé." },

  // ── Sucré ───────────────────────────────────────────────
  { key: "chocolat-noir", label: "Chocolat noir", names: ["chocolat noir", "chocolat noir pâtissier"], search: "chocolat noir", must: [["chocolat"], ["noir", "patissier", "dessert", "cacao"]], not: ["galette", "protein", "barre", "cacahuete", "tartiner", "muesli"], start: true, where: EPI + " Attention aux mentions « traces de blé »." },
  { key: "chocolat-lait", label: "Chocolat au lait", names: ["chocolat au lait"], search: "chocolat au lait", must: [["chocolat"], ["lait"]], not: ["galette", "tartiner", "fusion", "poudre", "stick", "sable"], start: true, where: EPI + " Attention aux mentions « traces de blé »." },
  { key: "chocolat-blanc", label: "Chocolat blanc", names: ["chocolat blanc"], search: "chocolat blanc", must: [["chocolat"], ["blanc"]], start: true, not: ["magnum", "poudre"], where: EPI },
  { key: "pepites", label: "Pépites de chocolat", names: ["pépites de chocolat"], search: "pépites chocolat", must: [["pepite", "palet", "goutte"]], not: ["cake", "granola", "cafe", "cookie", "p'tit", "dej"], start: true, where: EPI },
  { key: "sucre-perle", label: "Sucre perlé", names: ["sucre perlé"], search: "sucre perlé", must: [["sucre"], ["perle", "grain"]], start: true, where: EPI },
  { key: "vanille", label: "Extrait de vanille", names: ["extrait de vanille"], search: "extrait de vanille", must: [["vanille"]], start: true, where: EPI + " Préférer l'extrait pur aux « arômes »." },
  { key: "biscuits-cuillere", label: "Biscuits à la cuillère sans gluten", names: ["biscuits à la cuillère sans gluten"], search: "biscuits cuillère", must: [["cuiller", "boudoir"]], strict: true, where: SG },
  { key: "biscuits", label: "Biscuits sans gluten", names: ["biscuits sans gluten"], search: "biscuits", must: [["biscuit", "sable", "petit beurre", "speculoos", "galette"]], strict: true, where: SG },
  { key: "crackers", label: "Crackers sans gluten", names: ["crackers sans gluten"], search: "crackers", must: [["cracker", "crispbread", "craquant"]], strict: true, where: SG },
  { key: "guimauves", label: "Guimauves", names: ["guimauves sans gluten"], search: "guimauve", must: [["guimauve", "marshmallow", "chamallow"]], where: "Rayon confiserie : beaucoup de guimauves sont sans gluten, vérifier l'étiquette (amidon de blé possible)." },
  { key: "glace-vanille", label: "Glace vanille", names: ["glace vanille"], search: "glace vanille", must: [["glace", "creme glacee"], ["vanille"]], not: ["pecan", "caramel", "chocolat", "macadamia", "cookie", "mochi"], where: "Rayon surgelés : les glaces nature sont souvent sans gluten, pas celles avec biscuits ou cookies." },
];

const BY_NAME = new Map<string, CatalogEntry>();
for (const e of CATALOG) for (const n of e.names) BY_NAME.set(n.toLowerCase(), e);

/** Entrée du catalogue pour un nom d'ingrédient (insensible à la casse). */
export const catalogFor = (name: string) => BY_NAME.get(name.trim().toLowerCase());
