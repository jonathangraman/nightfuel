import { useState, useEffect } from "react";
import WeekPlanner from "./components/WeekPlanner";
import AIChat from "./components/AIChat";
import Favorites from "./components/Favorites";
import "./App.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const defaultWeek = () => DAYS.reduce((acc, d) => ({ ...acc, [d]: null }), {});

export default function App() {
  const [tab, setTab] = useState("planner");
  const [week, setWeek] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dinnerWeek")) || defaultWeek(); }
    catch { return defaultWeek(); }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dinnerFavs")) || []; }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem("dinnerWeek", JSON.stringify(week)); }, [week]);
  useEffect(() => { localStorage.setItem("dinnerFavs", JSON.stringify(favorites)); }, [favorites]);

  const addToWeek = (meal, day) => setWeek(w => ({ ...w, [day]: meal }));
  const addFavorite = (meal) => setFavorites(f => f.find(m => m.name === meal.name) ? f : [meal, ...f]);
  const removeFavorite = (name) => setFavorites(f => f.filter(m => m.name !== name));

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">◈</span>
            <div>
              <div className="logo-title">NightFuel</div>
              <div className="logo-sub">weeknight meals that don't suck</div>
            </div>
          </div>
          <nav className="nav">
            {[
              { id: "planner", label: "Week" },
              { id: "ai", label: "AI Chef" },
              { id: "favorites", label: `Saved${favorites.length ? ` · ${favorites.length}` : ""}` },
            ].map(t => (
              <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {tab === "planner" && <WeekPlanner week={week} days={DAYS} favorites={favorites} onAddMeal={addToWeek} onFavorite={addFavorite} onClear={(day) => setWeek(w => ({ ...w, [day]: null }))} onGoAI={() => setTab("ai")} />}
        {tab === "ai" && <AIChat days={DAYS} week={week} onAddToWeek={addToWeek} onFavorite={addFavorite} favorites={favorites} />}
        {tab === "favorites" && <Favorites favorites={favorites} days={DAYS} onRemove={removeFavorite} onAddToWeek={addToWeek} />}
      </main>
    </div>
  );
}
