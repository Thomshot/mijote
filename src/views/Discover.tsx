import { useState } from "react";
import { BookOpen, CalendarDays, Refrigerator, Shuffle, Sparkles, User, WandSparkles } from "lucide-react";
import { useApp } from "../state";
import { MEAL_TYPES, type MealType, type Recipe } from "../types";
import { adaptRecipe, AIError, generateIdeas } from "../ai";
import { CRAVING_RULES, RECIPE_COUNT, suggest } from "../engine";
import { Chip, Cooking, RecipeCard, Sheet } from "../components/ui";
import { Guide } from "./Guide";

const CRAVINGS = Object.keys(CRAVING_RULES);

function greeting(name: string) {
  const h = new Date().getHours();
  const hello = h < 5 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir";
  return name ? `${hello} ${name}` : hello;
}

function defaultMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return "petit-déjeuner";
  if (h >= 15 && h < 18) return "snack";
  return "plat";
}

export function Discover({ goProfile, goMenu }: { goProfile: () => void; goMenu: () => void }) {
  const app = useApp();
  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [craving, setCraving] = useState("");
  const [fridge, setFridge] = useState("");
  const [showFridge, setShowFridge] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adaptOpen, setAdaptOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [adaptText, setAdaptText] = useState("");
  const [adapting, setAdapting] = useState(false);
  const [shown, setShown] = useState<string[]>([]);
  const [taps, setTaps] = useState(0);

  // Easter egg : 5 tapes sur « mijote »
  const tapTitle = () => {
    const n = taps + 1;
    setTaps(n >= 5 ? 0 : n);
    if (n >= 5) app.setLove(true);
  };

  const criteria = () => ({ mealType: meal, craving, fridge: showFridge ? fridge : "", loved: app.aiCtx.loved });

  const [picks, setPicks] = useState<Recipe[]>(() => suggest(app.profile, { mealType: defaultMeal(), loved: app.aiCtx.loved }, 6));

  const inspire = (keepShown = false) => {
    const exclude = keepShown ? shown : [];
    const next = suggest(app.profile, { ...criteria(), exclude }, 6);
    setPicks(next);
    setShown([...exclude, ...next.map((r) => r.title)]);
    setError(null);
  };

  const pickMeal = (m: MealType) => {
    setMeal(m);
    setShown([]);
    setPicks(suggest(app.profile, { mealType: m, craving, fridge: showFridge ? fridge : "", loved: app.aiCtx.loved }, 6));
  };

  const pickCraving = (c: string) => {
    const v = craving === c ? "" : c;
    setCraving(v);
    setShown([]);
    setPicks(suggest(app.profile, { mealType: meal, craving: v, fridge: showFridge ? fridge : "", loved: app.aiCtx.loved }, 6));
  };

  const inventWithAI = async () => {
    setAiLoading(true);
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
      setAiLoading(false);
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

  return (
    <div className="view">
      <header className="hero hero--row">
        <div>
          <p className="hero__kicker">{greeting(app.profile.name)} 👋</p>
          <h1>
            Qu'est-ce qu'on <em onClick={tapTitle}>mijote</em> ?
          </h1>
        </div>
        <button className="icon-btn icon-btn--lg" onClick={goProfile} aria-label="Profil">
          <User size={20} />
        </button>
      </header>

      <section className="panel">
        <div className="chips chips--scroll">
          {MEAL_TYPES.map((m) => (
            <Chip key={m} active={m === meal} onClick={() => pickMeal(m)}>
              {m}
            </Chip>
          ))}
        </div>

        <label className="label">Une envie ?</label>
        <div className="chips chips--scroll chips--small">
          {CRAVINGS.map((c) => (
            <Chip key={c} active={craving === c} onClick={() => pickCraving(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <input
          className="input"
          value={CRAVINGS.includes(craving) ? "" : craving}
          onChange={(e) => setCraving(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && inspire()}
          placeholder="Ou tape une envie : fromage, coco, poulet…"
        />

        <button className="link-btn" onClick={() => setShowFridge(!showFridge)}>
          <Refrigerator size={16} /> {showFridge ? "Ne pas utiliser le frigo" : "Cuisiner avec ce que j'ai dans le frigo"}
        </button>
        {showFridge && (
          <textarea
            className="input"
            rows={2}
            value={fridge}
            onChange={(e) => setFridge(e.target.value)}
            placeholder="Ex : courgettes, chèvre, œufs, riz"
          />
        )}

        <button className="btn btn--primary btn--block btn--lg" onClick={() => inspire()}>
          <Sparkles size={20} /> Inspire-moi
        </button>
        {app.aiEnabled && (
          <button className="btn btn--soft btn--block" onClick={inventWithAI} disabled={aiLoading}>
            <WandSparkles size={18} /> {aiLoading ? "L'IA cuisine…" : "Inventer une recette inédite avec l'IA"}
          </button>
        )}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="tools">
        <button className="tool" onClick={goMenu}>
          <CalendarDays size={22} />
          <strong>Menu de la semaine</strong>
          <small>Tes repas planifiés et la liste de courses en un geste</small>
        </button>
        {app.aiEnabled && (
          <button className="tool" onClick={() => setAdaptOpen(true)}>
            <WandSparkles size={22} />
            <strong>Adapter une recette</strong>
            <small>Colle n'importe quelle recette, l'IA la rend sans gluten</small>
          </button>
        )}
        <button className="tool" onClick={() => setGuideOpen(true)}>
          <BookOpen size={22} />
          <strong>Guide sans gluten</strong>
          <small>Substitutions et pièges à éviter</small>
        </button>
      </section>

      {aiLoading && <Cooking />}

      {!aiLoading && app.ideas.length > 0 && (
        <section>
          <div className="section-title">
            <h2>
              <WandSparkles size={18} /> Créations de l'IA
            </h2>
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

      <section>
        <div className="section-title">
          <h2>Pour toi</h2>
          <button className="link-btn" onClick={() => inspire(true)}>
            <Shuffle size={16} /> Autres idées
          </button>
        </div>
        {picks.length === 0 ? (
          <p className="muted">Aucune recette ne correspond à tous tes critères. Essaie d'enlever une envie ou un filtre.</p>
        ) : (
          <div className="grid">
            {picks.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                favorite={app.isFavorite(r)}
                onOpen={() => app.setOpenRecipe(r)}
                onToggleFavorite={() => app.toggleFavorite(r)}
              />
            ))}
          </div>
        )}
        <p className="muted small center">Sélectionnées pour toi parmi {RECIPE_COUNT} recettes sans gluten, selon tes goûts, ton budget et ton temps.</p>
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
