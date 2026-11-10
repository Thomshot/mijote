import { useEffect, type ReactNode } from "react";
import { Clock, Euro, Heart, Sparkles, X } from "lucide-react";
import type { Recipe } from "../types";
import { euros, gradientFor, totalMinutes } from "../utils";

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`chip ${active ? "chip--on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet__grip" />
        {title && (
          <div className="sheet__head">
            <h2>{title}</h2>
            <button className="icon-btn" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function RecipeCard({
  recipe,
  favorite,
  onOpen,
  onToggleFavorite,
  compact,
}: {
  recipe: Recipe;
  favorite: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  compact?: boolean;
}) {
  return (
    <article className={`card ${compact ? "card--compact" : ""}`} onClick={onOpen}>
      <div className="card__cover" style={{ background: gradientFor(recipe.title) }}>
        <span className="card__emoji">{recipe.emoji}</span>
        {recipe.source === "ia" && (
          <span className="badge badge--ai">
            <Sparkles size={12} /> IA
          </span>
        )}
        <button
          className={`fav-btn ${favorite ? "fav-btn--on" : ""}`}
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card__body">
        <h3>{recipe.title}</h3>
        {!compact && <p className="muted clamp-2">{recipe.description}</p>}
        <div className="meta">
          <span>
            <Clock size={14} /> {totalMinutes(recipe)} min
          </span>
          <span>
            <Euro size={14} /> {euros(recipe.costPerServing)}/pers.
          </span>
        </div>
      </div>
    </article>
  );
}

export function Empty({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__emoji">{emoji}</div>
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

const LOADING_LINES = [
  "On épluche les idées…",
  "On vérifie chaque étiquette pour le gluten…",
  "On fait mijoter tout ça…",
  "On goûte et on rectifie l'assaisonnement…",
  "On dresse joliment l'assiette…",
];

export function Cooking({ label }: { label?: string }) {
  return (
    <div className="cooking">
      <div className="pot">
        <span>🥘</span>
        <i />
        <i />
        <i />
      </div>
      <p className="cooking__line">{label ?? LOADING_LINES[Math.floor(Date.now() / 1000) % LOADING_LINES.length]}</p>
    </div>
  );
}

export function TagInput({
  values,
  onChange,
  suggestions,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  placeholder: string;
}) {
  const add = (raw: string) => {
    const v = raw.trim();
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
  };
  return (
    <div className="tag-input">
      <div className="chips">
        {values.map((v) => (
          <Chip key={v} active onClick={() => onChange(values.filter((x) => x !== v))}>
            {v} <X size={12} />
          </Chip>
        ))}
      </div>
      <input
        className="input"
        placeholder={placeholder}
        enterKeyHint="done"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
        onBlur={(e) => {
          add(e.currentTarget.value);
          e.currentTarget.value = "";
        }}
      />
      <div className="chips chips--suggest">
        {suggestions
          .filter((s) => !values.includes(s))
          .slice(0, 12)
          .map((s) => (
            <Chip key={s} onClick={() => add(s)}>
              + {s}
            </Chip>
          ))}
      </div>
    </div>
  );
}
