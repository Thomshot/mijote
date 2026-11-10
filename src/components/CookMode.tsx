import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Timer, X } from "lucide-react";
import type { Recipe } from "../types";
import { beep, formatQty } from "../utils";

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        /* non supporté */
      }
    };
    request();
    const onVis = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);
}

function findMinutes(step: string) {
  const m = step.match(/(\d+)(?:\s*(?:à|-)\s*(\d+))?\s*min/i);
  if (!m) return null;
  return Number(m[2] ?? m[1]);
}

export function CookMode({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  useWakeLock();
  const [step, setStep] = useState(-1); // -1 = mise en place
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);

  useEffect(() => {
    if (!timerEnd) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timerEnd]);

  const remaining = timerEnd ? Math.max(0, Math.round((timerEnd - now) / 1000)) : 0;
  useEffect(() => {
    if (timerEnd && remaining === 0 && !fired.current) {
      fired.current = true;
      beep();
    }
  }, [remaining, timerEnd]);

  const total = recipe.steps.length;
  const minutes = step >= 0 ? findMinutes(recipe.steps[step]) : null;

  return (
    <div className="cook">
      <header className="cook__head">
        <button className="icon-btn" onClick={onClose} aria-label="Quitter">
          <X size={22} />
        </button>
        <div className="cook__progress">
          {[-1, ...recipe.steps.map((_, i) => i)].map((i) => (
            <span key={i} className={i <= step ? "on" : ""} />
          ))}
        </div>
        <span className="cook__count">{step < 0 ? "Prêt ?" : `${step + 1}/${total}`}</span>
      </header>

      <main className="cook__body">
        {step < 0 ? (
          <>
            <h2>Mise en place {recipe.emoji}</h2>
            <p className="muted">Sors tout ça avant de commencer :</p>
            <ul className="cook__mise">
              {recipe.ingredients.map((i, n) => (
                <li key={n}>
                  <strong>
                    {formatQty(i.quantity)} {i.unit}
                  </strong>{" "}
                  {i.name}
                </li>
              ))}
            </ul>
            <p className="cook__hint">💡 Plan de travail et ustensiles propres : zéro miette de pain classique !</p>
          </>
        ) : (
          <>
            <div className="cook__stepnum">Étape {step + 1}</div>
            <p className="cook__step">{recipe.steps[step]}</p>
            {minutes && (
              <button
                className="btn btn--soft"
                onClick={() => {
                  fired.current = false;
                  setNow(Date.now());
                  setTimerEnd(Date.now() + minutes * 60_000);
                }}
              >
                <Timer size={18} /> Minuteur {minutes} min
              </button>
            )}
          </>
        )}
      </main>

      {timerEnd && (
        <div className={`timer ${remaining === 0 ? "timer--done" : ""}`} onClick={() => setTimerEnd(null)}>
          <Timer size={18} />
          {remaining === 0
            ? "Temps écoulé ! (toucher pour fermer)"
            : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        </div>
      )}

      <footer className="cook__foot">
        <button className="btn btn--ghost" disabled={step < 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft size={20} /> Précédent
        </button>
        {step < total - 1 ? (
          <button className="btn btn--primary" onClick={() => setStep(step + 1)}>
            {step < 0 ? "C'est parti" : "Suivant"} <ChevronRight size={20} />
          </button>
        ) : (
          <button className="btn btn--primary" onClick={onClose}>
            Bon appétit ! 🎉
          </button>
        )}
      </footer>
    </div>
  );
}
