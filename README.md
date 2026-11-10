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

- ✨ **Inspire-moi** : 6 suggestions instantanées selon la catégorie, l'envie (réconfortant, rapide, petit budget, chocolat…) et les goûts.
- 📚 **Recettes** : recherche dans toute la base, avec filtres catégorie, ≤ 30 min, ≤ 2 €/pers., végé et « mes goûts ».
- 🧊 **Mode frigo** : indique ce que tu as sous la main, les recettes qui l'utilisent passent en premier.
- 🗓️ **Menu de la semaine** : 3, 5 ou 7 jours, varié (poisson, volaille, viande, végé), avec le budget total. 🔀 pour changer un repas.
- 🤖 **IA en option (payant)** : inventer des recettes inédites, adapter n'importe quelle recette en sans gluten, remixer (« plus rapide », « végé »…).
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
3. C'est tout. Pour l'option IA : **Profil** (icône en haut de l'accueil), puis **IA (optionnel)**, et coller une clé API Claude.

### La clé API (optionnelle)

- À créer sur https://console.anthropic.com (rubrique *API Keys*), après avoir ajouté quelques euros de crédit.
- La clé est enregistrée **uniquement sur le téléphone** (localStorage). Elle n'est jamais dans le code ni sur GitHub.
- Modèle utilisé : `claude-opus-5-5` en effort `low`. Une génération de 4 recettes coûte de l'ordre de quelques centimes ; un menu de 7 jours, un peu plus.
- Conseil : fixe une limite de dépense mensuelle dans la console Anthropic.

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
| `src/ai.ts` | Option IA : prompts, schémas JSON et appels à Claude |
| `src/data/swaps.ts` | Guide des substitutions |
| `src/views/*` | Écrans (Découvrir, Menu, Courses, Carnet, Profil) |
| `src/components/*` | Fiche recette, mode cuisine, UI |
