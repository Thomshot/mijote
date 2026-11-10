import { useEffect, useState } from "react";
import { CalendarDays, Heart, ShoppingBasket, Sparkles, User } from "lucide-react";
import { AppProvider, useApp } from "./state";
import { Discover } from "./views/Discover";
import { Plan } from "./views/Plan";
import { Shopping } from "./views/Shopping";
import { Favorites } from "./views/Favorites";
import { Profile } from "./views/Profile";
import { Onboarding } from "./views/Onboarding";
import { RecipeDetail } from "./components/RecipeDetail";
import { CookMode } from "./components/CookMode";
import { AIError, remixRecipe } from "./ai";
import { haptic } from "./utils";

type Tab = "decouvrir" | "menu" | "courses" | "carnet" | "profil";

const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: "decouvrir", label: "Découvrir", icon: Sparkles },
  { id: "menu", label: "Menu", icon: CalendarDays },
  { id: "courses", label: "Courses", icon: ShoppingBasket },
  { id: "carnet", label: "Carnet", icon: Heart },
  { id: "profil", label: "Profil", icon: User },
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
        {tab === "decouvrir" && <Discover goProfile={goProfile} />}
        {tab === "menu" && <Plan goProfile={goProfile} />}
        {tab === "courses" && <Shopping />}
        {tab === "carnet" && <Favorites />}
        {tab === "profil" && <Profile />}
      </main>

      <nav className="tabbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tabbar__btn ${tab === id ? "is-active" : ""}`}
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
