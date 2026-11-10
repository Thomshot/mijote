import { useState } from "react";
import { BookOpen, KeyRound, Refrigerator, Sparkles, WandSparkles } from "lucide-react";
import { useApp } from "../state";
import { MEAL_TYPES, type MealType } from "../types";
import { adaptRecipe, AIError, generateIdeas } from "../ai";
import { LIBRARY } from "../data/library";
import { Chip, Cooking, RecipeCard, Sheet } from "../components/ui";
import { Guide } from "./Guide";

const CRAVINGS = ["Réconfortant", "Rapide", "Healthy", "Petit budget", "Cuisine du monde", "Végétarien", "Pour recevoir", "Street food"];

function greeting(name: string) {
  const h = new Date().getHours();
  const hello = h < 5 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir";
  return name ? `${hello} ${name}` : hello;
}

function defaultMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return "petit-déjeuner";
  if (h < 14) return "déjeuner";
  if (h < 17) return "goûter";
  return "dîner";
}

export function Discover({ goProfile }: { goProfile: () => void }) {
  const app = useApp();
  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [craving, setCraving] = useState("");
  const [fridge, setFridge] = useState("");
  const [showFridge, setShowFridge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adaptOpen, setAdaptOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [adaptText, setAdaptText] = useState("");
  const [adapting, setAdapting] = useState(false);

  const inspire = async () => {
    setLoading(true);
    setError(null);
    try {
      const recipes = await generateIdeas(app.aiCtx, {
        mealType: meal,
        craving,
        fridge: showFridge ? fridge : "",
        count: 4,
        servings: app.profile.servings,
        avoidTitles: app.recentTitles,
      });
      app.setIdeas(recipes);
      app.remember(recipes);
    } catch (e) {
      setError(e instanceof AIError ? e.message : "Oups, quelque chose s'est mal passé.");
    } finally {
      setLoading(false);
    }
  };

  const adapt = async () => {
    setAdapting(true);
    setError(null);
    try {
      const r = await adaptRecipe(app.aiCtx, adaptText);
      app.remember([r]);
      app.setIdeas([r, ...app.ideas]);
      setAdaptOpen(false);
      setAdaptText("");
      app.setOpenRecipe(r);
    } catch (e) {
      setError(e instanceof AIError ? e.message : "Oups, quelque chose s'est mal passé.");
      setAdaptOpen(false);
    } finally {
      setAdapting(false);
    }
  };

  const libraryPicks = LIBRARY.filter((r) => r.mealType === meal || (meal === "goûter" && r.mealType === "dessert"));
  const shownLibrary = libraryPicks.length ? libraryPicks : LIBRARY.slice(0, 4);

  return (
    <div className="view">
      <header className="hero">
        <p className="hero__kicker">{greeting(app.profile.name)} 👋</p>
        <h1>
          Qu'est-ce qu'on <em>mijote</em> aujourd'hui ?
        </h1>
      </header>

      <section className="panel">
        <div className="chips chips--scroll">
          {MEAL_TYPES.map((m) => (
            <Chip key={m} active={m === meal} onClick={() => setMeal(m)}>
              {m}
            </Chip>
          ))}
        </div>

        <label className="label">Une envie particulière ?</label>
        <input
          className="input"
          value={craving}
          onChange={(e) => setCraving(e.target.value)}
          placeholder="Ex : un truc fromager, une soupe thaï…"
        />
        <div className="chips chips--scroll chips--small">
          {CRAVINGS.map((c) => (
            <Chip key={c} active={craving === c} onClick={() => setCraving(craving === c ? "" : c)}>
              {c}
            </Chip>
          ))}
        </div>

        <button className="link-btn" onClick={() => setShowFridge(!showFridge)}>
          <Refrigerator size={16} /> {showFridge ? "Ne pas utiliser le frigo" : "Cuisiner avec ce que j'ai dans le frigo"}
        </button>
        {showFridge && (
          <textarea
            className="input"
            rows={2}
            value={fridge}
            onChange={(e) => setFridge(e.target.value)}
            placeholder="Ex : 2 courgettes, du chèvre, des œufs, un reste de riz"
          />
        )}

        {app.aiEnabled ? (
          <button className="btn btn--primary btn--block btn--lg" onClick={inspire} disabled={loading}>
            <Sparkles size={20} /> {loading ? "En cuisine…" : "Inspire-moi"}
          </button>
        ) : (
          <button className="btn btn--soft btn--block" onClick={goProfile}>
            <KeyRound size={18} /> Activer l'IA (clé API) pour des idées infinies
          </button>
        )}
        {error && <p className="error">{error}</p>}
      </section>

      {loading && <Cooking />}

      {!loading && app.ideas.length > 0 && (
        <section>
          <div className="section-title">
            <h2>Idées pour toi</h2>
            <button className="link-btn" onClick={() => app.setIdeas([])}>
              Effacer
            </button>
          </div>
          <div className="grid">
            {app.ideas.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                favorite={app.isFavorite(r)}
                onOpen={() => app.setOpenRecipe(r)}
                onToggleFavorite={() => app.toggleFavorite(r)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="tools">
        <button className="tool" onClick={() => (app.aiEnabled ? setAdaptOpen(true) : goProfile())}>
          <WandSparkles size={22} />
          <strong>Adapter une recette</strong>
          <small>Colle n'importe quelle recette, l'IA la rend sans gluten</small>
        </button>
        <button className="tool" onClick={() => setGuideOpen(true)}>
          <BookOpen size={22} />
          <strong>Guide sans gluten</strong>
          <small>Substitutions et pièges à éviter</small>
        </button>
      </section>

      <section>
        <div className="section-title">
          <h2>Les classiques sans gluten</h2>
        </div>
        <div className="hscroll">
          {shownLibrary.map((r) => (
            <RecipeCard
              key={r.id}
              compact
              recipe={r}
              favorite={app.isFavorite(r)}
              onOpen={() => app.setOpenRecipe(r)}
              onToggleFavorite={() => app.toggleFavorite(r)}
            />
          ))}
        </div>
      </section>

      <Sheet open={adaptOpen} onClose={() => !adapting && setAdaptOpen(false)} title="Adapter une recette">
        {adapting ? (
          <Cooking label="On remplace le gluten sans perdre le goût…" />
        ) : (
          <div className="stack">
            <p className="muted">
              Colle une recette trouvée sur internet, celle de ta grand-mère, ou juste un nom de plat (« lasagnes »,
              « croque-monsieur »…).
            </p>
            <textarea
              className="input"
              rows={8}
              value={adaptText}
              onChange={(e) => setAdaptText(e.target.value)}
              placeholder="Ex : Quiche lorraine — 1 pâte brisée, 200 g de lardons, 3 œufs, 20 cl de crème…"
            />
            <button className="btn btn--primary btn--block" disabled={!adaptText.trim()} onClick={adapt}>
              <WandSparkles size={18} /> Rendre sans gluten
            </button>
          </div>
        )}
      </Sheet>

      <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} title="Guide sans gluten">
        <Guide />
      </Sheet>
    </div>
  );
}
