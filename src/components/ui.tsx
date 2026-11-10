import { useEffect, useRef, type ReactNode } from "react";
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

/**
 * Panneau qui monte du bas. On le ferme en le faisant glisser vers le bas
 * (quand on est en haut du contenu), en touchant le fond, ou avec la croix.
 */
export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!open || !sheet || !backdrop) return;
    let startY = 0;
    let startT = 0;
    let dy = 0;
    let tracking = false;
    let dragging = false;

    const setOffset = (y: number, animate: boolean) => {
      sheet.style.transition = animate ? "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)" : "none";
      sheet.style.transform = y ? `translateY(${y}px)` : "";
      backdrop.style.transition = animate ? "background-color 0.25s" : "none";
      backdrop.style.backgroundColor = `rgba(20, 12, 6, ${0.45 * Math.max(0, 1 - y / 500)})`;
    };

    const onStart = (e: TouchEvent) => {
      // On ne déclenche le glissement que si le contenu est tout en haut.
      tracking = sheet.scrollTop <= 0;
      dragging = false;
      startY = e.touches[0].clientY;
      startT = Date.now();
      dy = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      dy = e.touches[0].clientY - startY;
      if (!dragging) {
        if (dy > 6 && sheet.scrollTop <= 0) dragging = true;
        else if (dy < 0) {
          tracking = false;
          return;
        } else return;
      }
      e.preventDefault(); // empêche le rebond de défilement d'iOS pendant le glissement
      setOffset(Math.max(0, dy), false);
    };
    const onEnd = () => {
      if (!dragging) return;
      dragging = tracking = false;
      const fast = dy > 60 && Date.now() - startT < 250;
      if (dy > 130 || fast) {
        setOffset(window.innerHeight, true);
        window.setTimeout(() => closeRef.current(), 220);
      } else {
        setOffset(0, true);
      }
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);
    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" ref={backdropRef} onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
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
        {recipe.image ? (
          <img className="card__img" src={recipe.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="card__emoji">{recipe.emoji}</span>
        )}
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
