import { useState } from "react";
import { CalendarDays, ChevronLeft, RefreshCw, ShoppingBasket, Shuffle, Sparkles, WandSparkles } from "lucide-react";
import { useApp } from "../state";
import type { Moment } from "../types";
import { AIError, generatePlan } from "../ai";
import { buildLocalPlan, swapPlanEntry } from "../engine";
import { Chip, Cooking } from "../components/ui";
import { euros, gradientFor, totalMinutes } from "../utils";

export function Plan({ onBack }: { onBack: () => void }) {
  const app = useApp();
  const [days, setDays] = useState(5);
  const [meals, setMeals] = useState<Moment[]>(["dîner"]);
  const [useAI, setUseAI] = useState(false);
  const [batch, setBatch] = useState(false);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(app.plan.length === 0);

  const toggleMeal = (m: Moment) => setMeals(meals.includes(m) ? meals.filter((x) => x !== m) : [...meals, m]);
  const moments: Moment[] = meals.length ? meals : ["dîner"];

  const build = async () => {
    setError(null);
    if (!useAI || !app.aiEnabled) {
      app.setPlan(buildLocalPlan(app.profile, { days, moments, loved: app.aiCtx.loved, recent: app.plan.map((e) => e.recipe.title) }));
      setEditing(false);
      return;
    }
    setLoading(true);
    try {
      const entries = await generatePlan(app.aiCtx, { days, meals: moments, batchCooking: batch, extra, avoidTitles: app.recentTitles });
      app.setPlan(entries);
      app.remember(entries.map((e) => e.recipe));
      setEditing(false);
    } catch (e) {
      setError(e instanceof AIError ? e.message : "Oups, quelque chose s'est mal passé.");
    } finally {
      setLoading(false);
    }
  };

  const total = app.plan.reduce((s, e) => s + e.recipe.costPerServing * app.profile.servings, 0);
  const byDay = app.plan.reduce<Record<string, { e: (typeof app.plan)[number]; i: number }[]>>((acc, e, i) => {
    (acc[e.day] ||= []).push({ e, i });
    return acc;
  }, {});

  return (
    <div className="view">
      <header className="hero">
        <button className="link-btn" onClick={onBack}>
          <ChevronLeft size={16} /> Retour
        </button>
        <h1>Menu de la semaine</h1>
        {app.plan.length > 0 && !editing && (
          <p className="muted">
            {app.plan.length} repas · environ <strong>{euros(total)}</strong> pour {app.profile.servings} pers.
          </p>
        )}
      </header>

      {loading ? (
        <Cooking label="L'IA compose ta semaine (ça peut prendre une minute)…" />
      ) : editing ? (
        <section className="panel">
          <label className="label">Combien de jours ?</label>
          <div className="chips">
            {[3, 5, 7].map((d) => (
              <Chip key={d} active={days === d} onClick={() => setDays(d)}>
                {d} jours
              </Chip>
            ))}
          </div>
          <label className="label">Quels repas ?</label>
          <div className="chips">
            {(["petit-déjeuner", "déjeuner", "dîner"] as Moment[]).map((m) => (
              <Chip key={m} active={meals.includes(m)} onClick={() => toggleMeal(m)}>
                {m}
              </Chip>
            ))}
          </div>

          {app.aiEnabled && (
            <label className="toggle">
              <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
              <span>Faire inventer les recettes par l'IA (payant)</span>
            </label>
          )}
          {useAI && app.aiEnabled && (
            <>
              <label className="toggle">
                <input type="checkbox" checked={batch} onChange={(e) => setBatch(e.target.checked)} />
                <span>Mode batch cooking</span>
              </label>
              <input
                className="input"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Une demande ? Ex : poisson 2 fois, lunchbox…"
              />
            </>
          )}

          <button className="btn btn--primary btn--block btn--lg" onClick={build}>
            {useAI && app.aiEnabled ? <WandSparkles size={20} /> : <Sparkles size={20} />} Générer mon menu
          </button>
          <p className="muted small">Varié (poisson, volaille, viande, végé), adapté à tes goûts, ton budget et ton temps.</p>
          {app.plan.length > 0 && (
            <button className="link-btn" onClick={() => setEditing(false)}>
              Revenir au menu actuel
            </button>
          )}
          {error && <p className="error">{error}</p>}
        </section>
      ) : (
        <>
          <div className="actions">
            <button
              className="btn btn--primary"
              onClick={() => app.addToShopping(app.plan.map((e) => ({ recipe: e.recipe, servings: app.profile.servings })))}
            >
              <ShoppingBasket size={18} /> Tout mettre en courses
            </button>
            <button className="btn btn--ghost" onClick={() => setEditing(true)}>
              <RefreshCw size={18} /> Nouveau
            </button>
          </div>
          {Object.entries(byDay).map(([day, entries]) => (
            <section key={day} className="day">
              <h2>
                <CalendarDays size={18} /> {day}
              </h2>
              {entries.map(({ e, i }) => (
                <div key={e.recipe.id + i} className="plan-row">
                  <button className="plan-row__main" onClick={() => app.setOpenRecipe(e.recipe)}>
                    <span className="plan-row__emoji" style={{ background: gradientFor(e.recipe.title) }}>
                      {e.recipe.image ? <img src={e.recipe.image} alt="" loading="lazy" /> : e.recipe.emoji}
                    </span>
                    <span className="plan-row__text">
                      <small>{e.meal}</small>
                      <strong>{e.recipe.title}</strong>
                      <small className="muted">
                        {totalMinutes(e.recipe)} min · {euros(e.recipe.costPerServing)}/pers.
                      </small>
                    </span>
                  </button>
                  <button
                    className="icon-btn"
                    aria-label="Changer ce repas"
                    onClick={() => app.setPlan(swapPlanEntry(app.profile, app.plan, i, app.aiCtx.loved))}
                  >
                    <Shuffle size={16} />
                  </button>
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
