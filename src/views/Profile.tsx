import { useState } from "react";
import { Check, ChevronLeft, KeyRound, Smartphone } from "lucide-react";
import { useApp } from "../state";
import type { Profile as P, Settings } from "../types";
import { AIError, testKey } from "../ai";
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

function AISettings() {
  const { settings, setSettings, notify } = useApp();
  const [key, setKey] = useState(settings.apiKey);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const save = async () => {
    setStatus("testing");
    try {
      await testKey(key.trim());
      setSettings({ ...settings, apiKey: key.trim() });
      setStatus("ok");
      notify("IA activée ✨");
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof AIError ? e.message : "Clé invalide ou pas de connexion.");
    }
  };

  return (
    <section className="panel">
      <h2>
        <KeyRound size={18} /> IA (optionnel)
      </h2>
      <p className="muted small">
        L'appli est 100 % gratuite sans IA. En bonus, une clé API Claude (console.anthropic.com, payant à l'usage) permet
        d'inventer des recettes inédites, d'adapter n'importe quelle recette et de la remixer. La clé reste sur ce téléphone.
      </p>
      <div className="inline-form">
        <input
          className="input"
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setStatus("idle");
          }}
          placeholder="sk-ant-…"
        />
        <button className="btn btn--primary" onClick={save} disabled={!key.trim() || status === "testing"}>
          {status === "testing" ? "…" : status === "ok" ? <Check size={18} /> : "OK"}
        </button>
      </div>
      {status === "error" && <p className="error">{msg}</p>}
      {settings.apiKey && status !== "error" && <p className="ok small">✓ IA active</p>}

      <label className="label">Créativité</label>
      <div className="chips">
        {(["classique", "équilibrée", "audacieuse"] as Settings["creativity"][]).map((c) => (
          <Chip key={c} active={settings.creativity === c} onClick={() => setSettings({ ...settings, creativity: c })}>
            {c === "classique" ? "🏡 " : c === "équilibrée" ? "⚖️ " : "🚀 "}
            {c}
          </Chip>
        ))}
      </div>
      {settings.apiKey && (
        <button
          className="link-btn"
          onClick={() => {
            setSettings({ ...settings, apiKey: "" });
            setKey("");
          }}
        >
          Supprimer la clé
        </button>
      )}
    </section>
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
      <AISettings />
      <section className="panel">
        <h2>
          <Smartphone size={18} /> Installer sur l'iPhone
        </h2>
        <ol className="small install">
          <li>Ouvrir cette page dans <strong>Safari</strong>.</li>
          <li>
            Toucher le bouton <strong>Partager</strong> (carré avec une flèche).
          </li>
          <li>
            Choisir <strong>« Sur l'écran d'accueil »</strong>.
          </li>
          <li>Mijote s'ouvre ensuite en plein écran, comme une vraie appli.</li>
        </ol>
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
