import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useApp } from "../state";
import { PreferencesForm } from "./Profile";

export function Onboarding() {
  const app = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(app.profile);

  if (step === 0) {
    return (
      <div className="onboarding">
        <div className="onboarding__art">🥘</div>
        <h1>
          Bienvenue dans <em>Mijote</em>
        </h1>
        <p className="muted">
          Des idées de repas 100 % sans gluten, pensées pour tes goûts, ton budget et ton temps. Avec une IA qui ne
          manque jamais d'imagination.
        </p>
        <ul className="onboarding__list">
          <li>✨ Des recettes inventées pour toi</li>
          <li>🗓️ Ton menu de la semaine en un geste</li>
          <li>🧺 La liste de courses qui se remplit toute seule</li>
          <li>🛡️ Les pièges à gluten signalés à chaque ingrédient</li>
        </ul>
        <button className="btn btn--primary btn--block btn--lg" onClick={() => setStep(1)}>
          On commence <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="view">
      <header className="hero">
        <p className="hero__kicker">Étape 1/1</p>
        <h1>Parle-moi de toi</h1>
        <p className="muted">Tu pourras tout modifier plus tard dans Profil.</p>
      </header>
      <section className="panel">
        <PreferencesForm profile={draft} onChange={setDraft} />
      </section>
      <button className="btn btn--primary btn--block btn--lg sticky-cta" onClick={() => app.setProfile({ ...draft, onboarded: true })}>
        C'est tout bon !
      </button>
    </div>
  );
}
