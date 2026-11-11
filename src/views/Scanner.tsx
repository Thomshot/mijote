import { lazy, Suspense, useCallback, useState } from "react";
import { ExternalLink, Keyboard, ScanBarcode, ShoppingBasket, Star, Trash } from "lucide-react";
import { useStored, uid } from "../storage";
import { useApp } from "../state";
import { analyze, fetchProduct, VERDICT_STYLE, type Analysis, type ProductInfo, type ScanRecord } from "../scanner/gluten";
import { Cooking, Empty } from "../components/ui";

// La librairie de décodage n'est chargée qu'à l'ouverture de la caméra.
const CameraScanner = lazy(() => import("../scanner/CameraScanner"));

const norm1 = (c: string) => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")[0] ?? c;

/** Surligne les mots à gluten dans la liste d'ingrédients d'origine (insensible aux accents). */
function Highlighted({ text, hits }: { text: string; hits: string[] }) {
  if (!hits.length) return <>{text}</>;
  const normText = [...text].map(norm1).join("");
  const words = [...new Set(hits)].sort((a, b) => b.length - a.length);
  const re = new RegExp(`\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "g");
  const parts: { s: string; hit: boolean }[] = [];
  const chars = [...text];
  let last = 0;
  for (const m of normText.matchAll(re)) {
    const i = m.index ?? 0;
    parts.push({ s: chars.slice(last, i).join(""), hit: false });
    parts.push({ s: chars.slice(i, i + m[0].length).join(""), hit: true });
    last = i + m[0].length;
  }
  parts.push({ s: chars.slice(last).join(""), hit: false });
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="gluten-hit">
            {p.s}
          </mark>
        ) : (
          <span key={i}>{p.s}</span>
        ),
      )}
    </>
  );
}

function ResultCard({ code, product, analysis }: { code: string; product: ProductInfo | null; analysis: Analysis }) {
  const app = useApp();
  const style = VERDICT_STYLE[analysis.verdict];
  return (
    <section className={`result ${style.cls}`}>
      <div className="result__verdict">
        <span className="result__emoji">{style.emoji}</span>
        <div>
          <strong>{analysis.title}</strong>
          <small>{product ? [product.brand, product.name].filter(Boolean).join(" · ") : `Code ${code}`}</small>
        </div>
      </div>
      {product?.image && <img className="result__img" src={product.image} alt={product.name} loading="lazy" />}
      <ul className="result__reasons">
        {analysis.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {product?.ingredients && (
        <details className="result__ingredients" open={analysis.verdict === "danger"}>
          <summary>Ingrédients</summary>
          <p>
            <Highlighted text={product.ingredients} hits={analysis.hits} />
          </p>
        </details>
      )}
      <div className="actions">
        {product && (analysis.verdict === "safe" || analysis.verdict === "probable") && (
          <button
            className={`btn btn--ghost ${app.isSafe(code) ? "is-star" : ""}`}
            onClick={() =>
              app.toggleSafe({
                code,
                name: product.name,
                brand: product.brand,
                image: product.image,
                verdict: analysis.verdict as "safe" | "probable",
                addedAt: Date.now(),
              })
            }
          >
            <Star size={18} fill={app.isSafe(code) ? "currentColor" : "none"} /> {app.isSafe(code) ? "Produit sûr" : "Marquer sûr"}
          </button>
        )}
        {product && (analysis.verdict === "safe" || analysis.verdict === "probable") && (
          <button
            className="btn btn--soft"
            onClick={() => {
              app.setShopping([
                ...app.shopping,
                { id: uid(), name: [product.brand, product.name].filter(Boolean).join(" "), quantity: "", aisle: "Épicerie sans gluten", checked: false, glutenNote: "" },
              ]);
              app.notify("Ajouté à la liste de courses 🧺");
            }}
          >
            <ShoppingBasket size={18} /> En courses
          </button>
        )}
        <a className="btn btn--ghost" href={`https://fr.openfoodfacts.org/produit/${code}`} target="_blank" rel="noreferrer">
          <ExternalLink size={16} /> {product ? "Fiche complète" : "Ajouter le produit"}
        </a>
      </div>
      <p className="muted small">
        Données collaboratives Open Food Facts : elles peuvent être incomplètes. L'étiquette du produit fait toujours foi.
      </p>
    </section>
  );
}

export function Scanner() {
  const app = useApp();
  const [safeQuery, setSafeQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<{ code: string; product: ProductInfo | null; analysis: Analysis } | null>(null);
  const [history, setHistory] = useStored<ScanRecord[]>("scans", []);

  const lookup = useCallback(
    async (raw: string) => {
      const code = raw.replace(/\D/g, "");
      setScanning(false);
      if (code.length < 8) {
        setError("Code-barres invalide : il faut au moins 8 chiffres.");
        return;
      }
      setLoading(true);
      setError(null);
      setCurrent(null);
      try {
        const product = await fetchProduct(code);
        const analysis = analyze(product);
        setCurrent({ code, product, analysis });
        if (product) {
          setHistory((h) =>
            [
              { code, name: product.name, brand: product.brand, image: product.image, verdict: analysis.verdict, at: Date.now() },
              ...h.filter((x) => x.code !== code),
            ].slice(0, 50),
          );
        }
      } catch {
        setError("Pas de connexion, ou Open Food Facts ne répond pas. Réessaie dans un instant.");
      } finally {
        setLoading(false);
      }
    },
    [setHistory],
  );

  const onDetected = useCallback((code: string) => lookup(code), [lookup]);

  return (
    <div className="view">
      <header className="hero">
        <h1>Scanner</h1>
        <p className="muted">Scanne un produit pour savoir s'il contient du gluten.</p>
      </header>

      <button className="scan-cta" onClick={() => setScanning(true)}>
        <ScanBarcode size={36} />
        <strong>Scanner un code-barres</strong>
        <small>Données Open Food Facts · gratuit</small>
      </button>

      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          lookup(manual);
        }}
      >
        <input
          className="input"
          inputMode="numeric"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Ou tape le code-barres"
        />
        <button className="btn btn--primary" type="submit" aria-label="Chercher" disabled={!manual.trim()}>
          <Keyboard size={18} />
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <Cooking label="On lit l'étiquette…" />}
      {current && !loading && <ResultCard {...current} />}

      {app.safeProducts.length > 0 && (
        <section>
          <div className="section-title">
            <h2>⭐ Mes produits sûrs</h2>
          </div>
          {app.safeProducts.length > 5 && (
            <input
              className="input input--small"
              value={safeQuery}
              onChange={(e) => setSafeQuery(e.target.value)}
              placeholder="Chercher dans mes produits…"
            />
          )}
          <div className="scan-list">
            {app.safeProducts
              .filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(safeQuery.trim().toLowerCase()))
              .map((p) => (
                <button key={p.code} className="scan-row" onClick={() => lookup(p.code)}>
                  {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="scan-row__ph">📦</span>}
                  <span className="scan-row__text">
                    <strong>{p.name}</strong>
                    <small className="muted">{p.brand}</small>
                  </span>
                  <span className={`scan-badge ${VERDICT_STYLE[p.verdict].cls}`}>{VERDICT_STYLE[p.verdict].emoji}</span>
                </button>
              ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-title">
          <h2>Derniers scans</h2>
          {history.length > 0 && (
            <button className="link-btn" onClick={() => setHistory([])}>
              <Trash size={14} /> Effacer
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <Empty emoji="🛒" title="Aucun produit scanné">
            Au supermarché, scanne un produit : vert, c'est bon ; rouge, il contient du gluten.
          </Empty>
        ) : (
          <div className="scan-list">
            {history.map((h) => (
              <button key={h.code} className="scan-row" onClick={() => lookup(h.code)}>
                {h.image ? <img src={h.image} alt="" loading="lazy" /> : <span className="scan-row__ph">📦</span>}
                <span className="scan-row__text">
                  <strong>{h.name}</strong>
                  <small className="muted">{h.brand}</small>
                </span>
                <span className={`scan-badge ${VERDICT_STYLE[h.verdict].cls}`}>{VERDICT_STYLE[h.verdict].emoji}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {scanning && (
        <Suspense fallback={<div className="camera" />}>
          <CameraScanner onDetected={onDetected} onClose={() => setScanning(false)} />
        </Suspense>
      )}
    </div>
  );
}
