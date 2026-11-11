# 🥘 Mijote: recettes sans gluten, personnalisées par l'IA

Une appli iPhone (PWA installable sur l'écran d'accueil) qui propose des repas **100 % sans gluten** selon les goûts, le budget, le temps disponible et les autres restrictions de la personne.

**➡️ https://thomshot.github.io/mijote/**

## 100 % gratuit

L'appli fonctionne entièrement **sans IA et sans connexion**, grâce à une base de **174 recettes sans gluten** écrites pour l'appli :

| Catégorie | Recettes |
|---|---|
| Petit-déjeuner | 20 |
| Entrées (soupes, salades, apéro) | 30 |
| Plats (viande, poisson, végé, cuisines du monde) | 60 |
| Desserts | 30 |
| Snacks & goûter | 20 |
| Pains & bases (pain de mie, pâte à pizza, pâte brisée, béchamel…) | 14 |

Un moteur de suggestions local choisit les recettes selon le profil :
- il exclut les régimes incompatibles (végétarien, vegan, sans lactose, sans porc, sans œufs, sans fruits à coque), détectés automatiquement à partir des ingrédients, ainsi que les aliments détestés ;
- il favorise ce que la personne aime, ses avis 👍 et ses favoris, et respecte budget, temps et niveau en cuisine ;
- le **mode frigo** fait remonter les recettes qui utilisent ce qu'on a.

`npx tsx scripts/check-db.ts` contrôle la base (ingrédients à risque gluten sans avertissement, doublons, filtres).

## Fonctionnalités

- 📷 **Scanner de code-barres** : on scanne un produit au supermarché et l'appli indique s'il contient du gluten (✅ label sans gluten, 🟢 probablement sans gluten, ⚠️ traces possibles ou avoine non certifiée, ⛔ contient du gluten). Les ingrédients en cause sont surlignés. Les données viennent d'[Open Food Facts](https://fr.openfoodfacts.org) (gratuit, collaboratif), le décodage du code-barres de ZXing, et l'historique des scans est conservé.
- 🍽️ **Carte restaurant** : un écran à montrer au serveur pour expliquer l'intolérance, en 6 langues (français, anglais, espagnol, italien, allemand, portugais), avec des conseils pour commander.
- 🍂 **De saison** : un calendrier des fruits et légumes oriente les suggestions selon le mois et évite par exemple les tomates en hiver. Une envie « De saison » est aussi disponible.
- ⭐ **Mes produits sûrs** : les produits scannés et validés sont marqués pour être retrouvés en un coup d'œil.
- 📝 **Notes perso et « Cuisinées »** : une note par recette, et un compteur de fois cuisinées (le mode cuisine jusqu'au bout l'incrémente).
- 💾 **Sauvegarde / restauration** de toutes les données dans un fichier, pour changer de téléphone.
- 🖼️ **Une photo pour chaque recette** (Wikimedia Commons / Flickr, licences libres, crédit affiché sur chaque fiche).

- ✨ **Inspire-moi** : 6 suggestions instantanées selon la catégorie, l'envie (réconfortant, rapide, petit budget, chocolat…) et les goûts.
- 📚 **Recettes** : recherche dans toute la base, avec filtres catégorie, ≤ 30 min, ≤ 2 €/pers., végé et « mes goûts ».
- 🧊 **Mode frigo** : indique ce que tu as sous la main, les recettes qui l'utilisent passent en premier.
- 🗓️ **Menu de la semaine** : 3, 5 ou 7 jours, varié (poisson, volaille, viande, végé), avec le budget total. 🔀 pour changer un repas.
- 🧺 **Liste de courses** : se remplit depuis une recette ou depuis le menu, triée par rayon, avec fusion des doublons. On peut la partager.
- 🛡️ **Vigilance gluten** : les pièges sont signalés ingrédient par ingrédient (bouillon, sauce soja, épices…), avec des conseils contre la contamination croisée.
- 👨‍🍳 **Mode cuisine** : une étape par écran en grand, minuteurs détectés automatiquement, écran qui reste allumé.
- ❤️ **Carnet** : favoris et historique consultables hors connexion, avec recherche.
- 👍👎 **Avis** : l'IA tient compte des plats adorés ou pas aimés.
- 📖 **Guide des substitutions** et des pièges à éviter.
- 🌙 Mode sombre automatique.

## Installer sur l'iPhone

1. Ouvrir **https://thomshot.github.io/mijote/** dans **Safari**.
2. Toucher **Partager** puis **« Sur l'écran d'accueil »**.
3. C'est tout. Pour scanner, autoriser l'accès à la caméra quand l'appli le demande.

## Développement

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de production dans dist/
```

Stack : Vite, React et TypeScript, avec le SDK `@anthropic-ai/sdk` (appel direct depuis le navigateur et sorties JSON structurées). Toutes les données restent dans le `localStorage`. Un service worker gère le hors-ligne.

Le déploiement est automatique à chaque push sur `main` (GitHub Actions vers GitHub Pages).

| Fichier | Rôle |
|---|---|
| `src/data/db/*` | Base de recettes (format compact décrit dans `helpers.ts`) |
| `src/engine.ts` | Moteur de suggestions et menu de la semaine (local) |
| `src/scanner/*` | Lecture du code-barres et analyse gluten (Open Food Facts) |
| `scripts/fetch-images.mjs` | Récupération des photos (`image-queries.json`, `image-picks.json`) |
| `src/ai.ts` | Module IA (Claude), désactivé dans l'interface |
| `src/data/swaps.ts` | Guide des substitutions |
| `src/views/*` | Écrans (Découvrir, Menu, Courses, Carnet, Profil) |
| `src/components/*` | Fiche recette, mode cuisine, UI |
