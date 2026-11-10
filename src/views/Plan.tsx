import { useState } from "react";
import { CalendarDays, KeyRound, RefreshCw, ShoppingBasket, Sparkles } from "lucide-react";
import { useApp } from "../state";
import type { MealType } from "../types";
import { AIError, generatePlan } from "../ai";
import { Chip, Cooking, Empty } from "../components/ui";
import { euros, gradientFor, totalMinutes } from "../utils";

export function Plan({ goProfile }: { goProfile: () => void }) {
  const app = useApp();
  const [days, setDays] = useState(5);
  const [meals, setMeals] = useState<MealType[]>(["dîner"]);
  const [batch, setBatch] = useState(false);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(app.plan.length === 0);

  const toggleMeal = (m: MealType) => setMeals(meals.includes(m) ? meals.filter((x) => x !== m) : [...meals, m]);

  const build = async () => {
    setLoading(true);
    setError(null);
    try {
      const entries = await generatePlan(app.aiCtx, {
        days,
        meals: meals.length ? meals : ["dîner"],
        batchCooking: batch,
        extra,
        avoidTitles: app.recentTitles,
      });
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
  const byDay = app.plan.reduce<Record<string, typeof app.plan>>((acc, e) => {
    (acc[e.day] ||= []).push(e);
    return acc;
  }, {});

  if (!app.aiEnabled) {
    return (
      <div className="view">
        <header className="hero">
          <h1>Menu de la semaine</h1>
        </header>
        <Empty emoji="🗓️" title="L'IA prépare tes menus">
          Active l'IA pour générer un menu complet, équilibré, dans ton budget, avec la liste de courses.
        </Empty>
        <button className="btn btn--primary btn--block" onClick={goProfile}>
          <KeyRound size={18} /> Activer l'IA
        </button>
      </div>
    );
  }

  return (
    <div className="view">
      <header className="hero">
        <h1>Menu de la semaine</h1>
        {app.plan.length > 0 && !editing && (
          <p className="muted">
            {app.plan.length} repas · environ <strong>{euros(total)}</strong> pour {app.profile.servings} pers.
          </p>
        )}
      </header>

      {loading ? (
        <Cooking label="On compose ta semaine (ça peut prendre une minute)…" />
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
            {(["petit-déjeuner", "déjeuner", "dîner"] as MealType[]).map((m) => (
              <Chip key={m} active={meals.includes(m)} onClick={() => toggleMeal(m)}>
                {m}
              </Chip>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={batch} onChange={(e) => setBatch(e.target.checked)} />
            <span>Mode batch cooking (cuisiner moins souvent)</span>
          </label>
          <label className="label">Une demande ?</label>
          <input
            className="input"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Ex : poisson 2 fois, des lunchbox pour le bureau…"
          />
          <button className="btn btn--primary btn--block btn--lg" onClick={build}>
            <Sparkles size={20} /> Générer mon menu
          </button>
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
              {entries.map((e) => (
                <button key={e.recipe.id} className="plan-row" onClick={() => app.setOpenRecipe(e.recipe)}>
                  <span className="plan-row__emoji" style={{ background: gradientFor(e.recipe.title) }}>
                    {e.recipe.emoji}
                  </span>
                  <span className="plan-row__text">
                    <small>{e.meal}</small>
                    <strong>{e.recipe.title}</strong>
                    <small className="muted">
                      {totalMinutes(e.recipe)} min · {euros(e.recipe.costPerServing)}/pers.
                    </small>
                  </span>
                </button>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
