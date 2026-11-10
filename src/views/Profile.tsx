import { ChevronLeft } from "lucide-react";
import { useApp } from "../state";
import type { Profile as P } from "../types";
import { Chip, TagInput } from "../components/ui";

export const LIKE_SUGGESTIONS = [
  "fromage", "poulet", "saumon", "pâtes", "riz", "légumes rôtis", "cuisine italienne", "cuisine asiatique",
  "cuisine mexicaine", "cuisine indienne", "soupes", "chocolat", "épicé", "avocat", "patate douce", "champignons",
];
export const DISLIKE_SUGGESTIONS = [
  "coriandre", "champignons", "poivron", "abats", "fruits de mer", "olives", "betterave", "chou-fleur",
  "aubergine", "épinards", "épicé", "poisson", "oignon cru", "céleri",
];
export const DIET_SUGGESTIONS = [
  "sans lactose", "végétarien", "vegan", "sans porc", "pescetarien", "sans œufs", "sans fruits à coque", "pauvre en sucre", "riche en protéines",
];
const EQUIPMENT = ["four", "plaques", "micro-ondes", "airfryer", "robot cuiseur", "mixeur", "cocotte-minute", "barbecue"];

export function PreferencesForm({ profile, onChange }: { profile: P; onChange: (p: P) => void }) {
  const set = <K extends keyof P>(k: K, v: P[K]) => onChange({ ...profile, [k]: v });
  return (
    <div className="stack">
      <label className="label">Prénom</label>
      <input className="input" value={profile.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex : Léa" />

      <label className="label">J'adore…</label>
      <TagInput values={profile.likes} onChange={(v) => set("likes", v)} suggestions={LIKE_SUGGESTIONS} placeholder="Un aliment, une cuisine…" />

      <label className="label">Je n'aime pas…</label>
      <TagInput values={profile.dislikes} onChange={(v) => set("dislikes", v)} suggestions={DISLIKE_SUGGESTIONS} placeholder="À éviter…" />

      <label className="label">Autres régimes ou allergies (en plus du sans gluten)</label>
      <TagInput values={profile.diets} onChange={(v) => set("diets", v)} suggestions={DIET_SUGGESTIONS} placeholder="Ex : sans lactose" />

      <label className="label">
        Budget par portion : <strong>{profile.budgetPerServing.toFixed(0)} €</strong>
      </label>
      <input type="range" min={1} max={15} step={1} value={profile.budgetPerServing} onChange={(e) => set("budgetPerServing", Number(e.target.value))} />

      <label className="label">
        Temps max en cuisine : <strong>{profile.maxMinutes} min</strong>
      </label>
      <input type="range" min={10} max={120} step={5} value={profile.maxMinutes} onChange={(e) => set("maxMinutes", Number(e.target.value))} />

      <label className="label">Nombre de personnes</label>
      <div className="chips">
        {[1, 2, 3, 4, 6].map((n) => (
          <Chip key={n} active={profile.servings === n} onClick={() => set("servings", n)}>
            {n}
          </Chip>
        ))}
      </div>

      <label className="label">Niveau en cuisine</label>
      <div className="chips">
        {(["débutant", "intermédiaire", "confirmé"] as const).map((l) => (
          <Chip key={l} active={profile.level === l} onClick={() => set("level", l)}>
            {l}
          </Chip>
        ))}
      </div>

      <label className="label">Équipement</label>
      <div className="chips">
        {EQUIPMENT.map((e) => (
          <Chip
            key={e}
            active={profile.equipment.includes(e)}
            onClick={() => set("equipment", profile.equipment.includes(e) ? profile.equipment.filter((x) => x !== e) : [...profile.equipment, e])}
          >
            {e}
          </Chip>
        ))}
      </div>

      <label className="label">Autre chose à savoir ?</label>
      <textarea
        className="input"
        rows={2}
        value={profile.notes}
        onChange={(e) => set("notes", e.target.value)}
        placeholder="Ex : on mange léger le soir, lunchbox le midi…"
      />
    </div>
  );
}

export function Profile({ onBack }: { onBack: () => void }) {
  const app = useApp();
  return (
    <div className="view">
      <header className="hero">
        <button className="link-btn" onClick={onBack}>
          <ChevronLeft size={16} /> Retour
        </button>
        <h1>Profil</h1>
        <p className="muted">Tout ce qui aide Mijote à viser juste.</p>
      </header>
      <section className="panel">
        <h2>Goûts & contraintes</h2>
        <PreferencesForm profile={app.profile} onChange={app.setProfile} />
      </section>
      <section className="panel">
        <h2>Données</h2>
        <p className="muted small">
          Favoris, menus et liste de courses sont enregistrés sur ce téléphone uniquement.
        </p>
        <button
          className="btn btn--ghost btn--danger btn--block"
          onClick={() => {
            if (confirm("Effacer l'historique des recettes proposées ?")) app.setHistory([]);
          }}
        >
          Effacer l'historique
        </button>
      </section>
      <p className="muted small center">Mijote · fait avec ❤️ pour une cuisine 100 % sans gluten</p>
    </div>
  );
}
