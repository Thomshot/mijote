import { useEffect, useState } from "react";
import { BookOpen, Heart, ScanBarcode, ShoppingBasket, Sparkles } from "lucide-react";
import { AppProvider, useApp } from "./state";
import { Discover } from "./views/Discover";
import { Plan } from "./views/Plan";
import { Browse } from "./views/Browse";
import { Scanner } from "./views/Scanner";
import { LoveEgg } from "./components/LoveEgg";
import { Shopping } from "./views/Shopping";
import { Favorites } from "./views/Favorites";
import { Profile } from "./views/Profile";
import { Onboarding } from "./views/Onboarding";
import { RecipeDetail } from "./components/RecipeDetail";
import { CookMode } from "./components/CookMode";
import { AIError, remixRecipe } from "./ai";
import { haptic } from "./utils";

type Tab = "decouvrir" | "recettes" | "scanner" | "menu" | "courses" | "carnet" | "profil";

const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: "decouvrir", label: "Découvrir", icon: Sparkles },
  { id: "recettes", label: "Recettes", icon: BookOpen },
  { id: "scanner", label: "Scanner", icon: ScanBarcode },
  { id: "courses", label: "Courses", icon: ShoppingBasket },
  { id: "carnet", label: "Carnet", icon: Heart },
];

function Shell() {
  const app = useApp();
  const [tab, setTab] = useState<Tab>("decouvrir");
  const goProfile = () => setTab("profil");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  if (!app.profile.onboarded) return <Onboarding />;

  const open = app.openRecipe;
  const unchecked = app.shopping.filter((i) => !i.checked).length;

  return (
    <>
      <main className="app">
        {tab === "decouvrir" && <Discover goProfile={goProfile} goMenu={() => setTab("menu")} />}
        {tab === "recettes" && <Browse />}
        {tab === "scanner" && <Scanner />}
        {tab === "menu" && <Plan onBack={() => setTab("decouvrir")} />}
        {tab === "courses" && <Shopping />}
        {tab === "carnet" && <Favorites />}
        {tab === "profil" && <Profile onBack={() => setTab("decouvrir")} />}
      </main>

      <nav className="tabbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tabbar__btn ${tab === id || (id === "decouvrir" && (tab === "menu" || tab === "profil")) ? "is-active" : ""} ${id === "scanner" ? "tabbar__btn--scan" : ""}`}
            onClick={() => {
              haptic();
              setTab(id);
            }}
          >
            <span className="tabbar__icon">
              <Icon size={22} strokeWidth={tab === id ? 2.4 : 1.8} />
              {id === "courses" && unchecked > 0 && <span className="dot">{unchecked}</span>}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {open && (
        <RecipeDetail
          key={open.id}
          recipe={open}
          onClose={() => app.setOpenRecipe(null)}
          favorite={app.isFavorite(open)}
          onToggleFavorite={() => app.toggleFavorite(open)}
          vote={app.votes[open.title]}
          onVote={(v) => app.vote(open, v)}
          onAddToShopping={(servings) => app.addToShopping([{ recipe: open, servings }])}
          onCook={() => {
            app.setCooking(open);
            app.setOpenRecipe(null);
          }}
          aiEnabled={app.aiEnabled}
          onRemix={async (wish) => {
            try {
              const r = await remixRecipe(app.aiCtx, open, wish);
              app.remember([r]);
              app.setIdeas([r, ...app.ideas]);
              app.setOpenRecipe(r);
            } catch (e) {
              app.notify(e instanceof AIError ? e.message : "Le remix a échoué, réessaie.");
            }
          }}
        />
      )}

      {app.cooking && <CookMode recipe={app.cooking} onClose={() => app.setCooking(null)} />}

      {app.toast && <div className="toast">{app.toast}</div>}
      {app.love && <LoveEgg onClose={() => app.setLove(false)} />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
