import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "../state";
import { MEAL_TYPES, type MealType } from "../types";
import { allowedFor, RECIPE_COUNT, searchRecipes } from "../engine";
import { Chip, Empty, RecipeCard } from "../components/ui";

const PAGE = 24;

export function Browse() {
  const app = useApp();
  const [q, setQ] = useState("");
  const [meal, setMeal] = useState<MealType | undefined>();
  const [quick, setQuick] = useState(false);
  const [cheap, setCheap] = useState(false);
  const [veggie, setVeggie] = useState(false);
  const [onlyMine, setOnlyMine] = useState(true);
  const [limit, setLimit] = useState(PAGE);

  const results = useMemo(() => {
    const found = searchRecipes(q, { mealType: meal, quick, cheap, veggie });
    if (!onlyMine) return found;
    const ok = new Set(allowedFor(app.profile, found).map((r) => r.id));
    return found.filter((r) => ok.has(r.id));
  }, [q, meal, quick, cheap, veggie, onlyMine, app.profile]);

  const reset = () => setLimit(PAGE);

  return (
    <div className="view">
      <header className="hero">
        <h1>Recettes</h1>
        <p className="muted">{RECIPE_COUNT} recettes 100 % sans gluten, gratuites et disponibles hors connexion.</p>
      </header>

      <div className="search">
        <Search size={18} />
        <input
          className="input"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            reset();
            if (/bebew|je t.?aime/i.test(e.target.value)) app.setLove(true);
          }}
          placeholder="Plat, ingrédient, cuisine…"
        />
      </div>

      <div className="chips chips--scroll chips--flush">
        <Chip active={!meal} onClick={() => (setMeal(undefined), reset())}>
          Tout
        </Chip>
        {MEAL_TYPES.map((m) => (
          <Chip key={m} active={meal === m} onClick={() => (setMeal(meal === m ? undefined : m), reset())}>
            {m}
          </Chip>
        ))}
      </div>
      <div className="chips chips--small">
        <Chip active={quick} onClick={() => setQuick(!quick)}>
          ⏱️ ≤ 30 min
        </Chip>
        <Chip active={cheap} onClick={() => setCheap(!cheap)}>
          💶 ≤ 2 €/pers.
        </Chip>
        <Chip active={veggie} onClick={() => setVeggie(!veggie)}>
          🥦 Végé
        </Chip>
        <Chip active={onlyMine} onClick={() => setOnlyMine(!onlyMine)}>
          🎯 Mes goûts
        </Chip>
      </div>

      <p className="muted small">
        {results.length} recette{results.length > 1 ? "s" : ""}
        {onlyMine && " compatibles avec ton profil"}
      </p>

      {results.length === 0 ? (
        <Empty emoji="🔍" title="Aucune recette">
          Essaie un autre mot ou retire un filtre.
        </Empty>
      ) : (
        <>
          <div className="grid grid--2">
            {results.slice(0, limit).map((r) => (
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
          {results.length > limit && (
            <button className="btn btn--ghost btn--block" onClick={() => setLimit(limit + PAGE)}>
              Voir plus ({results.length - limit})
            </button>
          )}
        </>
      )}
    </div>
  );
}
