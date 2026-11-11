import { useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "../state";
import { Chip, Empty, RecipeCard } from "../components/ui";

export function Favorites() {
  const app = useApp();
  const [tab, setTab] = useState<"favoris" | "cuisinees" | "historique">("favoris");
  const [q, setQ] = useState("");
  const cookedList = Object.values(app.cooked)
    .sort((a, b) => b.last - a.last)
    .map((c) => c.recipe);
  const withNotes = new Set(Object.keys(app.notes));
  const list = tab === "favoris" ? app.favorites : tab === "cuisinees" ? cookedList : app.history;
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? list.filter((r) =>
        [r.title, r.description, app.notes[r.title] ?? "", ...r.tags, ...r.ingredients.map((i) => i.name)].some((s) =>
          s.toLowerCase().includes(needle),
        ),
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
        <Chip active={tab === "cuisinees"} onClick={() => setTab("cuisinees")}>
          👩‍🍳 Cuisinées ({cookedList.length})
        </Chip>
        {app.history.length > 0 && (
          <Chip active={tab === "historique"} onClick={() => setTab("historique")}>
            🕓 Créations IA ({app.history.length})
          </Chip>
        )}
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
        ) : tab === "cuisinees" ? (
          <Empty emoji="👩‍🍳" title="Rien de cuisiné pour l'instant">
            Lance le mode « Cuisiner » d'une recette et va jusqu'au bout : elle apparaîtra ici, avec tes notes.
          </Empty>
        ) : (
          <Empty emoji="🕓" title="Rien pour l'instant" />
        )
      ) : (
        <div className="grid">
          {filtered.map((r) => (
            <RecipeCard
              badge={tab === "cuisinees" ? `👩‍🍳 ${app.cooked[r.title]?.count ?? 1}×` : withNotes.has(r.title) ? "📝" : undefined}
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
