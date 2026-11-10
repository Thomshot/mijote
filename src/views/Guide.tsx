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
