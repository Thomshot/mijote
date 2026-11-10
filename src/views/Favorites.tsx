import { useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "../state";
import { Chip, Empty, RecipeCard } from "../components/ui";

export function Favorites() {
  const app = useApp();
  const [tab, setTab] = useState<"favoris" | "historique">("favoris");
  const [q, setQ] = useState("");
  const list = tab === "favoris" ? app.favorites : app.history;
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? list.filter((r) =>
        [r.title, r.description, ...r.tags, ...r.ingredients.map((i) => i.name)].some((s) => s.toLowerCase().includes(needle)),
      )
    : list;

  return (
    <div className="view">
      <header className="hero">
        <h1>Mon carnet</h1>
      </header>
      <div className="chips">
        <Chip active={tab === "favoris"} onClick={() => setTab("favoris")}>
          ❤️ Favoris ({app.favorites.length})
        </Chip>
        <Chip active={tab === "historique"} onClick={() => setTab("historique")}>
          🕓 Déjà proposées ({app.history.length})
        </Chip>
      </div>
      {list.length > 0 && (
        <div className="search">
          <Search size={18} />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un plat, un ingrédient…" />
        </div>
      )}
      {filtered.length === 0 ? (
        tab === "favoris" ? (
          <Empty emoji="💛" title="Pas encore de favoris">
            Touche le cœur sur une recette pour la garder ici, même hors connexion.
          </Empty>
        ) : (
          <Empty emoji="🕓" title="Rien pour l'instant">
            Les recettes proposées par l'IA apparaîtront ici.
          </Empty>
        )
      ) : (
        <div className="grid">
          {filtered.map((r) => (
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
    </div>
  );
}
