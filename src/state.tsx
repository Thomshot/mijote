import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { PlanEntry, Profile, Recipe, Settings, ShoppingItem } from "./types";
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
