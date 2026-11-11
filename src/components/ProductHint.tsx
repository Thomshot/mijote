import { useState } from "react";
import { ChevronDown, ShieldCheck, Store } from "lucide-react";
import { catalogFor } from "../data/productCatalog";
import productsJson from "../data/products.json";
import { useApp } from "../state";

type Ref = { code: string; brand: string; name: string; quantity: string; stores: string[]; image: string };
const PRODUCTS = productsJson as Record<string, Ref[]>;

/** Nom du produit sans la marque répétée ni le poids (« Fécule de maïs bio - 500 g - Marque »). */
function cleanName(r: Ref) {
  const brand = r.brand.toLowerCase();
  return (
    r.name
      .split(/\s+-\s+/)
      .filter((part) => part.toLowerCase() !== brand && !/^\d+\s*(g|kg|ml|cl|l)$/i.test(part.trim()))
      .join(" - ") || r.name
  );
}

/** Repères produits pour un ingrédient sensible : où le trouver et quelques produits étiquetés sans gluten. */
export function ProductHint({ name }: { name: string }) {
  const entry = catalogFor(name);
  const [open, setOpen] = useState(false);
  const app = useApp();
  if (!entry) return null;
  const refs = PRODUCTS[entry.key] ?? [];

  return (
    <div className="phint" onClick={(e) => e.stopPropagation()}>
      <button className="phint__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Store size={13} /> Où le trouver ?{refs.length > 0 && ` · ${refs.length} produit${refs.length > 1 ? "s" : ""} repère${refs.length > 1 ? "s" : ""}`}
        <ChevronDown size={14} className={open ? "phint__chev is-open" : "phint__chev"} />
      </button>
      {open && (
        <div className="phint__box">
          <p>{entry.where}</p>
          {refs.length > 0 && (
            <ul className="phint__list">
              {refs.map((r) => {
                const safe = app.isSafe(r.code);
                return (
                  <li key={r.code}>
                    {r.image ? (
                      <img src={r.image} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                    ) : (
                      <span className="phint__noimg">🌾</span>
                    )}
                    <span className="phint__info">
                      <strong>{r.brand}</strong>
                      <span>
                        {cleanName(r)}
                        {r.quantity && <small> · {r.quantity}</small>}
                      </span>
                      {r.stores.length > 0 && <small className="muted">Vu chez : {r.stores.join(", ")}</small>}
                    </span>
                    <button
                      className={`phint__safe ${safe ? "is-on" : ""}`}
                      aria-label={safe ? "Retirer de mes produits sûrs" : "Ajouter à mes produits sûrs"}
                      onClick={() =>
                        app.toggleSafe({ code: r.code, name: cleanName(r), brand: r.brand, image: r.image, verdict: "safe", addedAt: Date.now() })
                      }
                    >
                      <ShieldCheck size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <small className="muted">
            Repères Open Food Facts (label sans gluten). Les recettes des fabricants changent : vérifie toujours le logo épi barré,
            ou scanne le produit en magasin.
          </small>
        </div>
      )}
    </div>
  );
}
