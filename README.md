# 🥘 Mijote: recettes sans gluten, personnalisées par l'IA

Une appli iPhone (PWA installable sur l'écran d'accueil) qui propose des repas **100 % sans gluten** selon les goûts, le budget, le temps disponible et les autres restrictions de la personne.

**➡️ https://thomshot.github.io/mijote/**

## Fonctionnalités

- ✨ **Inspire-moi** : l'IA (Claude) invente 4 recettes selon le repas, l'envie du moment et les goûts enregistrés. Elle évite de répéter les plats déjà proposés.
- 🧊 **Mode frigo** : indique ce que tu as sous la main, l'IA s'en sert en priorité.
- 🪄 **Adapter une recette** : colle n'importe quelle recette (ou juste « lasagnes ») et l'IA en fait une version sans gluten.
- 🔀 **Remix** : « plus rapide », « moins cher », « version végé »… en un clic sur une recette.
- 🗓️ **Menu de la semaine** : 3, 5 ou 7 jours, avec un mode batch cooking et le budget total.
- 🧺 **Liste de courses** : se remplit depuis une recette ou depuis le menu, triée par rayon, avec fusion des doublons. On peut la partager.
- 🛡️ **Vigilance gluten** : les pièges sont signalés ingrédient par ingrédient (bouillon, sauce soja, épices…), avec des conseils contre la contamination croisée.
- 👨‍🍳 **Mode cuisine** : une étape par écran en grand, minuteurs détectés automatiquement, écran qui reste allumé.
- ❤️ **Carnet** : favoris et historique consultables hors connexion, avec recherche.
- 👍👎 **Avis** : l'IA tient compte des plats adorés ou pas aimés.
- 📚 14 recettes classiques intégrées et un **guide des substitutions**, utilisables sans IA.
- 🌙 Mode sombre automatique.

## Installer sur l'iPhone

1. Ouvrir **https://thomshot.github.io/mijote/** dans **Safari**.
2. Toucher **Partager** puis **« Sur l'écran d'accueil »**.
3. Ouvrir Mijote depuis l'écran d'accueil, puis **Profil → Intelligence artificielle** et coller une clé API Claude.

### La clé API

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
| `src/ai.ts` | Prompts, schémas JSON et appels à Claude |
| `src/data/library.ts` | Recettes intégrées (sans IA) |
| `src/data/swaps.ts` | Guide des substitutions |
| `src/views/*` | Écrans (Découvrir, Menu, Courses, Carnet, Profil) |
| `src/components/*` | Fiche recette, mode cuisine, UI |
