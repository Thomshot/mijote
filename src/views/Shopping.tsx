import { useState } from "react";
import { Check, Plus, Share2, Trash } from "lucide-react";
import { useApp } from "../state";
import { AISLES, type Aisle } from "../types";
import { uid } from "../storage";
import { Empty } from "../components/ui";
import { ProductHint } from "../components/ProductHint";

const AISLE_EMOJI: Record<Aisle, string> = {
  "Fruits & légumes": "🥬",
  "Viande & poisson": "🐟",
  "Frais & crèmerie": "🧀",
  Épicerie: "🥫",
  "Épicerie sans gluten": "🌾",
  Surgelés: "🧊",
  Autre: "🛒",
};

export function Shopping() {
  const { shopping, setShopping, notify } = useApp();
  const [text, setText] = useState("");

  const toggle = (id: string) => setShopping(shopping.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  const add = () => {
    if (!text.trim()) return;
    setShopping([...shopping, { id: uid(), name: text.trim(), quantity: "", aisle: "Autre", checked: false, glutenNote: "" }]);
    setText("");
  };
  const remaining = shopping.filter((i) => !i.checked).length;

  const share = async () => {
    const lines = AISLES.flatMap((a) => {
      const items = shopping.filter((i) => i.aisle === a && !i.checked);
      return items.length ? [`\n${AISLE_EMOJI[a]} ${a}`, ...items.map((i) => `☐ ${i.name}${i.quantity ? ` — ${i.quantity}` : ""}`)] : [];
    });
    const out = `Liste de courses sans gluten 🌾\n${lines.join("\n")}`;
    try {
      if (navigator.share) await navigator.share({ text: out });
      else {
        await navigator.clipboard.writeText(out);
        notify("Liste copiée");
      }
    } catch {
      /* annulé */
    }
  };

  return (
    <div className="view">
      <header className="hero">
        <h1>Courses</h1>
        <p className="muted">{shopping.length ? `${remaining} article${remaining > 1 ? "s" : ""} à prendre` : "Ta liste est vide"}</p>
      </header>

      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ajouter un article…" />
        <button className="btn btn--primary" type="submit" aria-label="Ajouter">
          <Plus size={18} />
        </button>
      </form>

      {shopping.length === 0 ? (
        <Empty emoji="🧺" title="Rien à acheter">
          Ajoute les ingrédients depuis une recette ou depuis ton menu de la semaine.
        </Empty>
      ) : (
        <>
          <div className="callout callout--small">
            🌾 Au rayon : cherche le logo <strong>épi barré</strong> sur les produits transformés.
          </div>
          {AISLES.map((aisle) => {
            const items = shopping.filter((i) => i.aisle === aisle).sort((a, b) => Number(a.checked) - Number(b.checked));
            if (!items.length) return null;
            return (
              <section key={aisle} className="aisle">
                <h2>
                  {AISLE_EMOJI[aisle]} {aisle}
                </h2>
                <ul>
                  {items.map((i) => (
                    <li key={i.id} className={i.checked ? "done" : ""} onClick={() => toggle(i.id)}>
                      <span className="check">{i.checked && <Check size={14} />}</span>
                      <span className="aisle__name">
                        {i.name}
                        {i.glutenNote && !i.checked && <small className="gf-note">⚠️ {i.glutenNote}</small>}
                      </span>
                      <span className="aisle__qty">{i.quantity}</span>
                      {!i.checked && <ProductHint name={i.name} />}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          <div className="actions">
            <button className="btn btn--ghost" onClick={share}>
              <Share2 size={18} /> Partager
            </button>
            <button className="btn btn--ghost" onClick={() => setShopping(shopping.filter((i) => !i.checked))}>
              <Check size={18} /> Retirer cochés
            </button>
            <button
              className="btn btn--ghost btn--danger"
              onClick={() => {
                if (confirm("Vider toute la liste ?")) setShopping([]);
              }}
            >
              <Trash size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
