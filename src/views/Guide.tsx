import { SWAPS, WATCHOUTS } from "../data/swaps";

export function Guide() {
  return (
    <div className="stack">
      <div className="callout">
        <h3>🛡️ Les réflexes</h3>
        <ul>
          {WATCHOUTS.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
      <div className="callout">
        <h3>🛒 Où acheter sans gluten</h3>
        <ul>
          <li>Le <strong>rayon sans gluten</strong> des grandes surfaces : farines, pâtes, pains, biscuits, pâtes à tarte.</li>
          <li>Les <strong>magasins bio</strong> (Biocoop, Naturalia, La Vie Claire…) : farines variées, psyllium, millet, sarrasin.</li>
          <li>Les <strong>épiceries asiatiques</strong> pour le tamari, les nouilles et les feuilles de riz, en lisant chaque étiquette.</li>
          <li>Dans chaque fiche recette, touche « Où le trouver ? » sous un ingrédient sensible pour voir des produits repères.</li>
        </ul>
      </div>
      <h3>Par quoi remplacer…</h3>
      <div className="swaps">
        {SWAPS.map((s) => (
          <div className="swap" key={s.from}>
            <div className="swap__head">
              <span className="swap__emoji">{s.emoji}</span>
              <strong>{s.from}</strong>
            </div>
            <div className="chips">
              {s.to.map((t) => (
                <span className="tag tag--gf" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <p className="muted small">{s.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
