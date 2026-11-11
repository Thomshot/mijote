import { useState } from "react";
import {
  ChefHat,
  Clock,
  Euro,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingBasket,
  Shuffle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TriangleExclamationPoint,
  Users,
  X,
} from "lucide-react";
import type { Recipe } from "../types";
import { euros, formatQty, gradientFor, totalMinutes } from "../utils";
import { dietLabels, isInSeason } from "../engine";
import { useApp } from "../state";
import { Chip, Cooking, Sheet } from "./ui";

const REMIXES = ["Plus rapide", "Moins cher", "Version végétarienne", "Plus légère", "Plus épicée", "Sans lactose"];

export function RecipeDetail({
  recipe,
  onClose,
  favorite,
  onToggleFavorite,
  vote,
  onVote,
  onAddToShopping,
  onCook,
  onRemix,
  aiEnabled,
}: {
  recipe: Recipe | null;
  onClose: () => void;
  favorite: boolean;
  onToggleFavorite: () => void;
  vote: 1 | -1 | undefined;
  onVote: (v: 1 | -1) => void;
  onAddToShopping: (servings: number) => void;
  onCook: () => void;
  onRemix: (wish: string) => Promise<void>;
  aiEnabled: boolean;
}) {
  const [servings, setServings] = useState<number | null>(null);
  const [remixing, setRemixing] = useState(false);
  const [custom, setCustom] = useState("");
  const app = useApp();
  const [note, setNoteDraft] = useState(() => (recipe ? (app.notes[recipe.title] ?? "") : ""));

  if (!recipe) return null;
  const cookedInfo = app.cooked[recipe.title];
  const s = servings ?? recipe.servings;
  const factor = s / recipe.servings;

  const remix = async (wish: string) => {
    if (!wish.trim()) return;
    setRemixing(true);
    try {
      await onRemix(wish);
      setServings(null);
      setCustom("");
    } finally {
      setRemixing(false);
    }
  };

  const share = async () => {
    const text = `${recipe.emoji} ${recipe.title}\n\nIngrédients (${s} pers.) :\n${recipe.ingredients
      .map((i) => `• ${formatQty(i.quantity * factor)} ${i.unit} ${i.name}`)
      .join("\n")}\n\nÉtapes :\n${recipe.steps.map((st, n) => `${n + 1}. ${st}`).join("\n")}`;
    try {
      if (navigator.share) await navigator.share({ title: recipe.title, text });
      else await navigator.clipboard.writeText(text);
    } catch {
      /* partage annulé */
    }
  };

  return (
    <Sheet
      open
      onClose={() => {
        setServings(null);
        onClose();
      }}
    >
      <div className="detail">
        <div className="detail__cover" style={{ background: gradientFor(recipe.title) }}>
          {recipe.image ? <img src={recipe.image} alt={recipe.title} /> : <span>{recipe.emoji}</span>}
          <button className="detail__close" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
          {recipe.photoCredit && <small className="detail__credit">{recipe.photoCredit}</small>}
        </div>
        <div className="detail__head">
          <div className="detail__kicker">
            {recipe.mealType} · {recipe.difficulty}
            {cookedInfo && (
              <span className="badge badge--inline badge--cooked">
                👩‍🍳 cuisinée {cookedInfo.count} fois
              </span>
            )}
            {recipe.source === "ia" && (
              <span className="badge badge--ai badge--inline">
                <Sparkles size={12} /> créée par l'IA
              </span>
            )}
          </div>
          <h1>{recipe.title}</h1>
          <p className="muted">{recipe.description}</p>
          <div className="stats">
            <div>
              <Clock size={18} />
              <strong>{totalMinutes(recipe)} min</strong>
              <small>
                {recipe.prepMinutes} prépa · {recipe.cookMinutes} cuisson
              </small>
            </div>
            <div>
              <Euro size={18} />
              <strong>{euros(recipe.costPerServing)}</strong>
              <small>par portion</small>
            </div>
            <div>
              <Users size={18} />
              <strong>{euros(recipe.costPerServing * s)}</strong>
              <small>pour {s}</small>
            </div>
          </div>
          <div className="tags">
            <span className="tag tag--gf">🌾 Sans gluten</span>
            {isInSeason(recipe) && <span className="tag tag--season">🍂 De saison</span>}
            {dietLabels(recipe).map((d) => (
              <span key={d} className="tag tag--gf">
                {d}
              </span>
            ))}
            {recipe.tags.filter((t) => !["végétarien", "vegan"].includes(t)).map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
          <div className="actions">
            <button className="btn btn--primary" onClick={onCook}>
              <ChefHat size={18} /> Cuisiner
            </button>
            <button className={`btn btn--ghost ${favorite ? "is-fav" : ""}`} onClick={onToggleFavorite} aria-label="Favori">
              <Heart size={18} fill={favorite ? "currentColor" : "none"} />
            </button>
            <button className="btn btn--ghost" onClick={share} aria-label="Partager">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <section className="detail__section">
          <div className="row-between">
            <h2>Ingrédients</h2>
            <div className="stepper">
              <button onClick={() => setServings(Math.max(1, s - 1))} aria-label="Moins">
                <Minus size={16} />
              </button>
              <span>{s} pers.</span>
              <button onClick={() => setServings(s + 1)} aria-label="Plus">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <ul className="ingredients">
            {recipe.ingredients.map((ing, n) => (
              <li key={n}>
                <span className="qty">
                  {formatQty(ing.quantity * factor)} {ing.unit}
                </span>
                <span>
                  {ing.name}
                  {ing.glutenNote && (
                    <small className="gf-note">
                      <TriangleExclamationPoint size={12} /> {ing.glutenNote}
                    </small>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <button className="btn btn--soft btn--block" onClick={() => onAddToShopping(s)}>
            <ShoppingBasket size={18} /> Ajouter à la liste de courses
          </button>
        </section>

        <section className="detail__section">
          <h2>Préparation</h2>
          <ol className="steps">
            {recipe.steps.map((st, n) => (
              <li key={n}>
                <span className="step-num">{n + 1}</span>
                <p>{st}</p>
              </li>
            ))}
          </ol>
        </section>

        {recipe.glutenTips.length > 0 && (
          <section className="detail__section">
            <div className="callout">
              <h3>🛡️ Vigilance gluten</h3>
              <ul>
                {recipe.glutenTips.map((t, n) => (
                  <li key={n}>{t}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="detail__section">
          <h2>Ton avis</h2>
          <p className="muted small">Mijote s'en sert pour mieux cibler tes prochaines suggestions.</p>
          <div className="vote">
            <button className={`btn btn--ghost ${vote === 1 ? "vote--on" : ""}`} onClick={() => onVote(1)}>
              <ThumbsUp size={18} /> On a adoré
            </button>
            <button className={`btn btn--ghost ${vote === -1 ? "vote--off" : ""}`} onClick={() => onVote(-1)}>
              <ThumbsDown size={18} /> Bof
            </button>
          </div>
        </section>

        <section className="detail__section">
          <h2>📝 Mes notes</h2>
          <textarea
            className="input"
            rows={3}
            value={note}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => app.setNote(recipe, note)}
            placeholder="Ex : un peu plus de sel, cuisson 5 min de moins, parfait avec du parmesan…"
          />
        </section>

        {aiEnabled && (
          <section className="detail__section">
            <h2>
              <Shuffle size={18} /> Remixer cette recette
            </h2>
            {remixing ? (
              <Cooking label="On réinvente la recette…" />
            ) : (
              <>
                <div className="chips">
                  {REMIXES.map((w) => (
                    <Chip key={w} onClick={() => remix(w)}>
                      {w}
                    </Chip>
                  ))}
                </div>
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    remix(custom);
                  }}
                >
                  <input
                    className="input"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="Ex : avec du poisson à la place"
                  />
                  <button className="btn btn--primary" type="submit" disabled={!custom.trim()}>
                    <Sparkles size={16} />
                  </button>
                </form>
              </>
            )}
          </section>
        )}
      </div>
    </Sheet>
  );
}
