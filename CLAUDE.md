# Mijote : contexte du projet

Application web installable (PWA) de **recettes 100 % sans gluten**, faite pour la copine de Thomas, qui est intolérante au gluten. Elle l'utilise sur iPhone via « Sur l'écran d'accueil ».

- En ligne : https://thomshot.github.io/mijote/ (GitHub Pages, déployé automatiquement à chaque push sur `main` via `.github/workflows/deploy.yml`)
- Repo : `Thomshot/mijote` (public)

## Règles à respecter

- **Interface entièrement en français**, ton chaleureux et tutoiement.
- **Gratuit et hors connexion** : pas de service payant, pas de clé API. Le module IA (`src/ai.ts`, Claude) existe mais n'a **aucun point d'entrée dans l'interface**. Le chargement est paresseux (`await import("../ai")`). Ne pas le réactiver sans qu'on le demande.
- **Ne jamais mettre de ligne `Co-Authored-By` ni d'attribution Claude dans les messages de commit.**
- **Sécurité gluten avant tout** : toute nouvelle recette ou ingrédient doit être réellement sans gluten. Signaler les pièges (bouillon, sauce soja → tamari, avoine non certifiée, épices en mélange…) avec une note de vigilance.
- **Easter egg à conserver** : « Je t'aime mon bebew » (`src/components/LoveEgg.tsx`). Il se déclenche avec 5 tapes sur le mot « mijote » de l'accueil, ou en tapant « bebew » / « je t'aime » dans la recherche de l'onglet Recettes.
- Données utilisateur uniquement dans `localStorage` (préfixe `mijote:`), via `useStored` dans `src/storage.ts`.
- Mobile d'abord : tester en 390×844, avec les zones sûres iOS (`env(safe-area-inset-*)`) et en mode sombre (`prefers-color-scheme`).

## Stack et commandes

Vite + React 19 + TypeScript, CSS maison (`src/index.css`, variables CSS et mode sombre), icônes `lucide-react`.

```bash
npm install
npm run dev                      # http://localhost:5173
npm run build                    # vérifie les types puis construit dans dist/
npx vite preview --port 4173     # sert le build de production
npx tsx scripts/check-db.ts      # contrôle la base : ingrédients à risque gluten, doublons, filtres
npx tsx scripts/check-photos.ts  # vérifie que chaque recette a sa photo
npx tsx scripts/fetch-products.ts [clé…]  # produits repères Open Food Facts (lent : ~10 requêtes/min)
```

Toujours lancer `npm run build` et `scripts/check-db.ts` avant de committer. Le site se sert depuis la racine en local (`http://localhost:4173/`, pas `/mijote/`).

## Architecture

| Fichier / dossier | Rôle |
|---|---|
| `src/App.tsx` | Coque : onglets Découvrir · Recettes · **Scanner** (bouton central) · Courses · Carnet. Les vues « menu » et « profil » s'ouvrent depuis l'accueil, avec un bouton retour |
| `src/state.tsx` | État global (`useApp()`) : profil, favoris, votes 👍👎, courses, menu, notes, recettes cuisinées, produits sûrs, toast, easter egg |
| `src/engine.ts` | Moteur de suggestions **local** : filtres régimes (calculés depuis les ingrédients), dégoûts et goûts avec groupes de synonymes (`matchesTerm`), score (budget, temps, niveau, saison, frigo), menu de la semaine (`buildLocalPlan`), recherche |
| `src/data/db/*.ts` | **196 recettes** au format compact `R(...)` (voir `helpers.ts`). Ingrédient = `"nom\|quantité\|unité\|rayon\|note"`. Rayons : L, V, F, E, G, S, A. Notes : codes de `NOTES` (`bouillon`, `tamari`, `farine`…) ou texte libre |
| `src/data/photos.json` + `public/img/*.webp` | Une photo par recette (Wikimedia Commons, licences libres, crédit affiché sur la fiche) |
| `scripts/fetch-images.mjs` | Récupère les photos. Requêtes dans `scripts/image-queries.json`, corrections dans `scripts/image-picks.json` (`"requête"` ou `"requête#morceau du titre"`) |
| `src/data/productCatalog.ts` + `src/data/products.json` | « Où le trouver ? » sous chaque ingrédient sensible (fiche + courses, `components/ProductHint.tsx`) : conseil de rayon + 0 à 3 produits repères Open Food Facts au label sans gluten. Filtres par clé : `must`, `not`, `start`, `strict` (produits normalement au blé : « sans gluten » dans le nom ou marque 100 % sans gluten). Exclusions à la main dans `scripts/product-picks.json`. `check-db.ts` signale tout ingrédient sensible absent du catalogue. **Relire les produits à l'œil après chaque relance** (la base OFF contient des erreurs, ex. pâtes au blé étiquetées sans gluten) |
| `src/data/season.ts` | Calendrier des fruits et légumes de saison (bandeau d'accueil, envie « De saison ») |
| `src/data/swaps.ts` | Guide des substitutions sans gluten |
| `src/scanner/` | Scanner de code-barres : `CameraScanner.tsx` (ZXing, chargé à la demande) et `gluten.ts` (Open Food Facts → verdict safe / probable / traces / danger / unknown) |
| `src/views/` | Discover, Browse (recettes), Plan (menu), Scanner, Shopping, Favorites (carnet : favoris + cuisinées), Profile (goûts + sauvegarde), Onboarding, Guide |
| `src/components/` | `RecipeDetail` (fiche, notes, avis), `CookMode` (pas à pas, minuteurs, écran allumé), `RestaurantCard` (6 langues), `ui.tsx` (Sheet refermable en glissant vers le bas, RecipeCard, Chip…) |
| `public/sw.js` | Service worker hors ligne. **Incrémenter `CACHE` (`mijote-vN`) à chaque version déployée** |

## Ajouter une recette

1. L'ajouter dans le bon fichier de `src/data/db/` avec `R(...)`.
2. Ajouter une requête photo dans `scripts/image-queries.json` (clé = slug du titre), puis `node scripts/fetch-images.mjs <slug>`.
3. Vérifier la photo à l'œil, puis lancer `scripts/check-db.ts` et `scripts/check-photos.ts`.

## Tests visuels

Il n'y a pas de tests unitaires. On vérifie avec des parcours Puppeteer (`puppeteer-core` + le Chrome local, en headless, à 390×844) contre `npx vite preview`. Le scanner se teste avec une fausse webcam : `--use-file-for-fake-video-capture=cam.mjpeg`, une image de code-barres EAN-13. Codes de test : Nutella `3017620422003` (sans gluten), spaghetti Barilla `8076800195057` (contient du gluten).

## Historique des grandes étapes

1. PWA avec IA (Claude), puis passage en **100 % gratuit** avec la base locale de 196 recettes et le moteur de suggestions.
2. Photos des recettes, scanner de code-barres, fermeture des fiches par glissement, synonymes goûts / dégoûts, easter egg.
3. Carte restaurant, saisonnalité, produits sûrs, notes et compteur « cuisinées », sauvegarde / restauration, IA chargée à la demande.
