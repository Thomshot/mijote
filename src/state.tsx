import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { PlanEntry, Profile, Recipe, SafeProduct, Settings, ShoppingItem } from "./types";
import { DEFAULT_PROFILE } from "./defaults";
import { useStored } from "./storage";
import type { AICtx } from "./ai";
import { mergeIntoShopping } from "./utils";

const DEFAULT_SETTINGS: Settings = { apiKey: "", creativity: "équilibrée" };

function useAppState() {
  const [profile, setProfile] = useStored<Profile>("profile", DEFAULT_PROFILE);
  const [settings, setSettings] = useStored<Settings>("settings", DEFAULT_SETTINGS);
  const [favorites, setFavorites] = useStored<Recipe[]>("favorites", []);
  const [history, setHistory] = useStored<Recipe[]>("history", []);
  const [ideas, setIdeas] = useStored<Recipe[]>("ideas", []);
  const [plan, setPlan] = useStored<PlanEntry[]>("plan", []);
  const [shopping, setShopping] = useStored<ShoppingItem[]>("shopping", []);
  const [votes, setVotes] = useStored<Record<string, 1 | -1>>("votes", {});
  /** Nombre de fois où chaque recette a été cuisinée (clé : titre) */
  const [cooked, setCooked] = useStored<Record<string, { count: number; last: number; recipe: Recipe }>>("cooked", {});
  /** Notes perso par recette (clé : titre) */
  const [notes, setNotes] = useStored<Record<string, string>>("notes", {});
  const [safeProducts, setSafeProducts] = useStored<SafeProduct[]>("safeProducts", []);
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [cooking, setCooking] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [love, setLove] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  };

  const isFavorite = (r: Recipe) => favorites.some((f) => f.id === r.id || f.title === r.title);
  const toggleFavorite = (r: Recipe) => {
    if (isFavorite(r)) {
      setFavorites(favorites.filter((f) => f.id !== r.id && f.title !== r.title));
      notify("Retirée des favoris");
    } else {
      setFavorites([r, ...favorites]);
      notify("Ajoutée aux favoris ❤️");
    }
  };

  const markCooked = (r: Recipe) =>
    setCooked((all) => ({ ...all, [r.title]: { count: (all[r.title]?.count ?? 0) + 1, last: Date.now(), recipe: r } }));

  const setNote = (r: Recipe, text: string) =>
    setNotes((all) => {
      const next = { ...all };
      if (text.trim()) next[r.title] = text;
      else delete next[r.title];
      return next;
    });

  const isSafe = (code: string) => safeProducts.some((p) => p.code === code);
  const toggleSafe = (p: SafeProduct) => {
    if (isSafe(p.code)) {
      setSafeProducts(safeProducts.filter((x) => x.code !== p.code));
      notify("Retiré de mes produits sûrs");
    } else {
      setSafeProducts([p, ...safeProducts]);
      notify("Ajouté à mes produits sûrs ⭐");
    }
  };

  const remember = (recipes: Recipe[]) => setHistory((h) => [...recipes, ...h].slice(0, 80));

  const addToShopping = (items: { recipe: Recipe; servings?: number }[]) => {
    setShopping((list) => mergeIntoShopping(list, items));
    notify("Ajouté à la liste de courses 🧺");
  };

  const vote = (r: Recipe, v: 1 | -1) =>
    setVotes((all) => {
      const next = { ...all };
      if (next[r.title] === v) delete next[r.title];
      else next[r.title] = v;
      return next;
    });

  const aiCtx: AICtx = useMemo(
    () => ({
      profile,
      settings,
      loved: [...Object.keys(votes).filter((t) => votes[t] === 1), ...favorites.map((f) => f.title)],
      disliked: Object.keys(votes).filter((t) => votes[t] === -1),
    }),
    [profile, settings, votes, favorites],
  );

  const recentTitles = useMemo(() => history.map((h) => h.title), [history]);

  return {
    profile,
    setProfile,
    settings,
    setSettings,
    favorites,
    setFavorites,
    history,
    setHistory,
    ideas,
    setIdeas,
    plan,
    setPlan,
    shopping,
    setShopping,
    votes,
    vote,
    cooked,
    markCooked,
    notes,
    setNote,
    safeProducts,
    isSafe,
    toggleSafe,
    openRecipe,
    setOpenRecipe,
    cooking,
    setCooking,
    toast,
    notify,
    love,
    setLove,
    isFavorite,
    toggleFavorite,
    remember,
    addToShopping,
    aiCtx,
    recentTitles,
    aiEnabled: settings.apiKey.trim().length > 0,
  };
}

type AppState = ReturnType<typeof useAppState>;
const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp hors AppProvider");
  return v;
}
