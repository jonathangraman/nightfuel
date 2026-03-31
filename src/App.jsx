import { useState, useEffect } from "react";
import WeekPlanner from "./components/WeekPlanner";
import AIChat from "./components/AIChat";
import Favorites from "./components/Favorites";
import MealBuilder from "./components/MealBuilder";
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
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("nf_apikey") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);

  useEffect(() => { localStorage.setItem("dinnerWeek", JSON.stringify(week)); }, [week]);
  useEffect(() => { localStorage.setItem("dinnerFavs", JSON.stringify(favorites)); }, [favorites]);

  const saveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      alert("That doesn't look like a valid Anthropic API key — it should start with sk-ant-");
      return;
    }
    localStorage.setItem("nf_apikey", trimmed);
    setApiKey(trimmed);
    setKeyInput("");
    setShowKeyModal(false);
  };

  const clearKey = () => {
    localStorage.removeItem("nf_apikey");
    setApiKey("");
    setKeyInput("");
  };

  const addToWeek = (meal, day) => setWeek(w => ({ ...w, [day]: meal }));
  const addFavorite = (meal) => setFavorites(f => f.find(m => m.name === meal.name) ? f : [meal, ...f]);
  const removeFavorite = (name) => setFavorites(f => f.filter(m => m.name !== name));

  const NAV = [
    { id: "planner",   label: "Week" },
    { id: "builder",   label: "Meal Builder" },
    { id: "ai",        label: "Chef Claude" },
    { id: "favorites", label: `Saved${favorites.length ? ` · ${favorites.length}` : ""}` },
  ];

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
            {NAV.map(t => (
              <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
            <button
              className={`nav-btn key-btn ${apiKey ? "key-set" : "key-missing"}`}
              onClick={() => { setKeyInput(""); setKeyVisible(false); setShowKeyModal(true); }}
              title={apiKey ? "API key is set — click to update" : "API key required for Chef Claude"}
            >
              {apiKey ? "⚿ API Key ✓" : "⚿ Add API Key"}
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {tab === "planner"   && <WeekPlanner week={week} days={DAYS} favorites={favorites} onAddMeal={addToWeek} onFavorite={addFavorite} onClear={(day) => setWeek(w => ({ ...w, [day]: null }))} onGoAI={() => setTab("ai")} />}
        {tab === "builder"   && <MealBuilder days={DAYS} week={week} onAddToWeek={addToWeek} />}
        {tab === "ai"        && <AIChat days={DAYS} week={week} onAddToWeek={addToWeek} onFavorite={addFavorite} favorites={favorites} apiKey={apiKey} onNeedKey={() => setShowKeyModal(true)} />}
        {tab === "favorites" && <Favorites favorites={favorites} days={DAYS} onRemove={removeFavorite} onAddToWeek={addToWeek} />}
      </main>

      {/* ── API KEY MODAL ── */}
      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal key-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowKeyModal(false)}>×</button>

            <div className="key-modal-header">
              <div className="key-modal-icon">⚿</div>
              <h2 className="modal-title">Anthropic API Key</h2>
              <p className="modal-desc">
                Your key is stored only in your browser's localStorage — it never leaves your device or goes to any server.
              </p>
            </div>

            {apiKey ? (
              <div className="key-set-state">
                <div className="key-set-indicator">
                  <span className="key-dot" />
                  API key is active
                </div>
                <div className="key-masked">
                  {apiKey.slice(0, 12)}••••••••••••••••••••{apiKey.slice(-4)}
                </div>
                <div className="key-actions">
                  <button className="btn btn-ghost" onClick={() => { setKeyInput(apiKey); setKeyVisible(false); }}>
                    Replace key
                  </button>
                  <button className="btn btn-ghost" style={{ color: "var(--red)", borderColor: "var(--red)" }} onClick={clearKey}>
                    Remove key
                  </button>
                </div>
              </div>
            ) : null}

            <div className="key-input-section">
              <label className="key-label">
                {apiKey ? "Enter new key" : "Paste your API key"}
              </label>
              <div className="key-input-row">
                <input
                  type={keyVisible ? "text" : "password"}
                  className="key-input"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  onKeyDown={e => e.key === "Enter" && keyInput && saveKey()}
                  autoFocus
                />
                <button className="key-toggle" onClick={() => setKeyVisible(v => !v)}>
                  {keyVisible ? "Hide" : "Show"}
                </button>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 12 }}
                disabled={!keyInput.trim()}
                onClick={saveKey}
              >
                Save Key
              </button>
            </div>

            <div className="key-help">
              <p>Get your API key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a> → API Keys</p>
              <p>Only the Chef Claude tab uses the key. Meal Builder and Sauce Library work without it.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
