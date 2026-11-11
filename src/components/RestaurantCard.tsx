import { useState } from "react";
import { X } from "lucide-react";

interface Lang {
  flag: string;
  name: string;
  title: string;
  lines: string[];
  thanks: string;
}

/** Carte à montrer au serveur, dans plusieurs langues. */
const LANGS: Lang[] = [
  {
    flag: "🇫🇷",
    name: "Français",
    title: "Je ne peux pas manger de gluten",
    lines: [
      "Je suis intolérante au gluten : même une petite quantité me rend malade.",
      "Je ne peux pas manger de blé, d'orge, de seigle, d'épeautre, ni d'avoine non certifiée.",
      "Attention aussi à la farine dans les sauces, à la chapelure, à la sauce soja, à la bière et aux bouillons.",
      "Merci d'utiliser des ustensiles, une planche et une huile de friture propres, sans contact avec du pain ou des pâtes.",
      "Pouvez-vous me conseiller un plat sans risque ?",
    ],
    thanks: "Merci beaucoup !",
  },
  {
    flag: "🇬🇧",
    name: "English",
    title: "I cannot eat gluten",
    lines: [
      "I am gluten intolerant: even a small amount makes me ill.",
      "I cannot eat wheat, barley, rye, spelt, or oats that are not certified gluten-free.",
      "Please also watch out for flour in sauces, breadcrumbs, soy sauce, beer and stock cubes.",
      "Please use clean utensils, boards and frying oil that have not touched bread or pasta.",
      "Could you recommend a dish that is safe for me?",
    ],
    thanks: "Thank you very much!",
  },
  {
    flag: "🇪🇸",
    name: "Español",
    title: "No puedo comer gluten",
    lines: [
      "Soy intolerante al gluten: incluso una pequeña cantidad me hace daño.",
      "No puedo comer trigo, cebada, centeno, espelta ni avena que no esté certificada sin gluten.",
      "Cuidado también con la harina en las salsas, el pan rallado, la salsa de soja, la cerveza y los caldos.",
      "Por favor, usen utensilios, tablas y aceite de freír limpios, sin contacto con pan o pasta.",
      "¿Me puede recomendar un plato seguro para mí?",
    ],
    thanks: "¡Muchas gracias!",
  },
  {
    flag: "🇮🇹",
    name: "Italiano",
    title: "Non posso mangiare glutine",
    lines: [
      "Sono intollerante al glutine: anche una piccola quantità mi fa star male.",
      "Non posso mangiare frumento, orzo, segale, farro, né avena non certificata senza glutine.",
      "Attenzione anche alla farina nelle salse, al pangrattato, alla salsa di soia, alla birra e ai brodi.",
      "Per favore usate utensili, taglieri e olio di frittura puliti, che non abbiano toccato pane o pasta.",
      "Mi può consigliare un piatto sicuro per me?",
    ],
    thanks: "Grazie mille!",
  },
  {
    flag: "🇩🇪",
    name: "Deutsch",
    title: "Ich darf kein Gluten essen",
    lines: [
      "Ich habe eine Glutenunverträglichkeit: Schon eine kleine Menge macht mich krank.",
      "Ich darf keinen Weizen, keine Gerste, keinen Roggen, keinen Dinkel und keinen nicht zertifiziert glutenfreien Hafer essen.",
      "Bitte achten Sie auch auf Mehl in Soßen, Paniermehl, Sojasoße, Bier und Brühe.",
      "Bitte verwenden Sie saubere Utensilien, Bretter und Frittieröl ohne Kontakt mit Brot oder Nudeln.",
      "Können Sie mir ein sicheres Gericht empfehlen?",
    ],
    thanks: "Vielen Dank!",
  },
  {
    flag: "🇵🇹",
    name: "Português",
    title: "Não posso comer glúten",
    lines: [
      "Sou intolerante ao glúten: mesmo uma pequena quantidade faz-me mal.",
      "Não posso comer trigo, cevada, centeio, espelta nem aveia que não seja certificada sem glúten.",
      "Cuidado também com a farinha nos molhos, o pão ralado, o molho de soja, a cerveja e os caldos.",
      "Por favor, usem utensílios, tábuas e óleo de fritura limpos, sem contacto com pão ou massa.",
      "Pode recomendar-me um prato seguro?",
    ],
    thanks: "Muito obrigada!",
  },
];

const TIPS = [
  "Appeler avant ou réserver en le précisant : la cuisine peut s'organiser.",
  "Plus sûr : viandes et poissons grillés nature, riz, pommes de terre vapeur, salades sans croûtons.",
  "À éviter : panures, fritures partagées, sauces liées, desserts à base de pâte.",
  "Frites : seulement si l'huile ne sert pas aussi aux produits panés.",
  "En cas de doute, demander à voir l'étiquette ou la liste des allergènes (obligatoire en France).",
];

export function RestaurantCard({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const l = LANGS[i];
  return (
    <div className="resto" role="dialog" aria-label="Carte restaurant">
      <header className="resto__head">
        <div className="chips chips--scroll">
          {LANGS.map((x, n) => (
            <button key={x.name} className={`chip ${n === i ? "chip--on" : ""}`} onClick={() => setI(n)}>
              {x.flag} {x.name}
            </button>
          ))}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
      </header>

      <main className="resto__card" lang={l.name.slice(0, 2).toLowerCase()}>
        <div className="resto__badge">🌾🚫</div>
        <h1>{l.title}</h1>
        <ul>
          {l.lines.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="resto__thanks">{l.thanks} 🙏</p>
      </main>

      <button className="link-btn resto__tips-btn" onClick={() => setShowTips(!showTips)}>
        {showTips ? "Masquer les conseils" : "💡 Conseils pour commander"}
      </button>
      {showTips && (
        <ul className="resto__tips">
          {TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
