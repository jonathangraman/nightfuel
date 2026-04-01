import { useState, useEffect, useCallback } from "react";
import WeekPlanner from "./components/WeekPlanner";
import AIChat from "./components/AIChat";
import Favorites from "./components/Favorites";
import MealBuilder from "./components/MealBuilder";
import { syncSave, syncLoad, isSupabaseConfigured, resetSupabaseClient, getHouseholdId } from "./lib/supabase";
import "./App.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const defaultWeek = () => DAYS.reduce((acc, d) => ({ ...acc, [d]: null }), {});
const MAX_HISTORY = 30;

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
  const [mealHistory, setMealHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dinnerHistory")) || []; }
    catch { return []; }
  });
  const [ratings, setRatings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dinnerRatings")) || {}; }
    catch { return {}; }
  });

  // Settings
  const [apiKey, setApiKey]     = useState(() => localStorage.getItem("nf_apikey") || "");
  const [unsplashKey, setUnsplashKey] = useState(() => localStorage.getItem("nf_unsplash_key") || "");
  const [sbUrl, setSbUrl]       = useState(() => localStorage.getItem("nf_sb_url") || "");
  const [sbKey, setSbKey]       = useState(() => localStorage.getItem("nf_sb_key") || "");
  const [showSettings, setShowSettings] = useState(false);

  // Settings form state
  const [form, setForm] = useState({ apiKey: "", sbUrl: "", sbKey: "", unsplashKey: "", keyVisible: false, sbKeyVisible: false, unsplashVisible: false });

  // Sync status
  const [syncStatus, setSyncStatus] = useState("idle");
  const [pendingMeals, setPendingMeals] = useState(null); // survives tab switches // idle | syncing | synced | error
  const [lastSync, setLastSync]     = useState(null);

  const sbConfigured = !!(sbUrl && sbKey);

  // ── PERSIST TO LOCALSTORAGE ─────────────────────────
  useEffect(() => { localStorage.setItem("dinnerWeek",    JSON.stringify(week));        }, [week]);
  useEffect(() => { localStorage.setItem("dinnerFavs",    JSON.stringify(favorites));   }, [favorites]);
  useEffect(() => { localStorage.setItem("dinnerHistory", JSON.stringify(mealHistory)); }, [mealHistory]);

  // ── SYNC TO SUPABASE ─────────────────────────────────
  const pushToCloud = useCallback(async (weekData, favsData, histData) => {
    if (!isSupabaseConfigured()) return;
    setSyncStatus("syncing");
    const [r1, r2, r3] = await Promise.all([
      syncSave("nf_week",      weekData),
      syncSave("nf_favorites", favsData),
      syncSave("nf_history",   histData),
    ]);
    const anyError = r1.error || r2.error || r3.error;
    setSyncStatus(anyError ? "error" : "synced");
    if (!anyError) setLastSync(new Date());
  }, []);

  const pullFromCloud = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setSyncStatus("syncing");
    const [r1, r2, r3] = await Promise.all([
      syncLoad("nf_week"),
      syncLoad("nf_favorites"),
      syncLoad("nf_history"),
    ]);
    if (r1.data) { setWeek(r1.data);        localStorage.setItem("dinnerWeek",    JSON.stringify(r1.data)); }
    if (r2.data) { setFavorites(r2.data);   localStorage.setItem("dinnerFavs",    JSON.stringify(r2.data)); }
    if (r3.data) { setMealHistory(r3.data); localStorage.setItem("dinnerHistory", JSON.stringify(r3.data)); }
    setSyncStatus("synced");
    setLastSync(new Date());
  }, []);

  // Pull from cloud on first load if Supabase is configured
  useEffect(() => {
    if (sbConfigured) pullFromCloud();
  }, []); // eslint-disable-line

  // Auto-push whenever data changes (debounced via useEffect)
  useEffect(() => {
    if (!sbConfigured) return;
    const t = setTimeout(() => pushToCloud(week, favorites, mealHistory), 1500);
    return () => clearTimeout(t);
  }, [week, favorites, mealHistory, sbConfigured]); // eslint-disable-line

  // ── MEAL ACTIONS ────────────────────────────────────
  const addToWeek = (meal, day) => {
    setWeek(w => ({ ...w, [day]: meal }));
    setMealHistory(h => {
      if (h.slice(0, 10).find(m => m.name === meal.name)) return h;
      return [{ name: meal.name, date: new Date().toISOString() }, ...h].slice(0, MAX_HISTORY);
    });
  };

  const clearWeek = () => {
    const currentMeals = DAYS.map(d => week[d]).filter(Boolean);
    setMealHistory(h => {
      const newEntries = currentMeals
        .filter(m => !h.slice(0, 10).find(hm => hm.name === m.name))
        .map(m => ({ name: m.name, date: new Date().toISOString() }));
      return [...newEntries, ...h].slice(0, MAX_HISTORY);
    });
    setWeek(defaultWeek());
  };

  const addFavorite    = (meal) => setFavorites(f => f.find(m => m.name === meal.name) ? f : [meal, ...f]);
  const rateMeal       = (name, stars) => setRatings(r => ({ ...r, [name]: stars }));
  const removeFavorite = (name) => setFavorites(f => f.filter(m => m.name !== name));

  // ── SETTINGS SAVE ───────────────────────────────────
  const saveSettings = () => {
    if (form.apiKey.trim()) {
      if (!form.apiKey.trim().startsWith("sk-ant-")) {
        alert("API key should start with sk-ant-");
        return;
      }
      localStorage.setItem("nf_apikey", form.apiKey.trim());
      setApiKey(form.apiKey.trim());
    }
    if (form.sbUrl.trim() && form.sbKey.trim()) {
      localStorage.setItem("nf_sb_url", form.sbUrl.trim());
      localStorage.setItem("nf_sb_key", form.sbKey.trim());
      setSbUrl(form.sbUrl.trim());
      setSbKey(form.sbKey.trim());
      resetSupabaseClient();
    }
    if (form.unsplashKey.trim()) {
      localStorage.setItem("nf_unsplash_key", form.unsplashKey.trim());
      setUnsplashKey(form.unsplashKey.trim());
    }
    setForm({ apiKey: "", sbUrl: "", sbKey: "", unsplashKey: "", keyVisible: false, sbKeyVisible: false, unsplashVisible: false });
    setShowSettings(false);
    // Pull from cloud immediately after connecting
    if (form.sbUrl.trim() && form.sbKey.trim()) {
      setTimeout(() => pullFromCloud(), 300);
    }
  };

  const openSettings = () => {
    setForm({ apiKey: "", sbUrl: sbUrl, sbKey: "", unsplashKey: "", keyVisible: false, sbKeyVisible: false, unsplashVisible: false });
    setShowSettings(true);
  };

  const NAV = [
    { id: "planner",   label: "Week" },
    { id: "builder",   label: "Meal Builder" },
    { id: "ai",        label: "AI Chef" },
    { id: "favorites", label: `Saved${favorites.length ? ` · ${favorites.length}` : ""}` },
  ];

  const syncIndicator = sbConfigured
    ? syncStatus === "syncing" ? "☁ syncing…"
    : syncStatus === "synced"  ? "☁ synced"
    : syncStatus === "error"   ? "☁ sync error"
    : "☁ cloud on"
    : null;

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
            {syncIndicator && (
              <span className={`sync-indicator ${syncStatus}`}>{syncIndicator}</span>
            )}
            <button className={`nav-btn key-btn ${apiKey ? "key-set" : "key-missing"}`} onClick={openSettings}>
              ⚙ Settings
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {tab === "planner" && (
          <WeekPlanner
            week={week} days={DAYS} favorites={favorites}
            onAddMeal={addToWeek} onFavorite={addFavorite}
            onClear={(day) => setWeek(w => ({ ...w, [day]: null }))}
            onClearWeek={clearWeek}
            apiKey={apiKey} onNeedKey={openSettings}
            mealHistory={mealHistory}
            pendingMeals={pendingMeals}
            onSetPendingMeals={setPendingMeals}
            ratings={ratings}
            onRate={rateMeal}
            unsplashKey={unsplashKey}
          />
        )}
        {tab === "builder"   && <MealBuilder days={DAYS} week={week} onAddToWeek={addToWeek} />}
        {tab === "ai"        && <AIChat days={DAYS} week={week} onAddToWeek={addToWeek} onFavorite={addFavorite} favorites={favorites} apiKey={apiKey} onNeedKey={openSettings} unsplashKey={unsplashKey} />}
        {tab === "favorites" && <Favorites favorites={favorites} days={DAYS} onRemove={removeFavorite} onAddToWeek={addToWeek} />}
      </main>

      {/* ── SETTINGS MODAL ── */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>

            <div className="settings-header">
              <h2 className="modal-title">Settings</h2>
              <p className="modal-desc">Configure your API key and cloud sync. All credentials are stored in your browser only.</p>
            </div>

            {/* ── AI API KEY ── */}
            <div className="settings-section">
              <div className="settings-section-title">
                <span>⚿</span> Anthropic API Key
                {apiKey && <span className="settings-badge green">Active</span>}
              </div>
              {apiKey && <div className="key-masked">{apiKey.slice(0, 12)}••••••••••••{apiKey.slice(-4)}</div>}
              <div className="key-input-row">
                <input
                  type={form.keyVisible ? "text" : "password"}
                  className="key-input"
                  value={form.apiKey}
                  onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                  placeholder={apiKey ? "Enter new key to replace…" : "sk-ant-api03-…"}
                />
                <button className="key-toggle" onClick={() => setForm(f => ({ ...f, keyVisible: !f.keyVisible }))}>
                  {form.keyVisible ? "Hide" : "Show"}
                </button>
              </div>
              <p className="settings-hint">Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a> → API Keys</p>
            </div>

            {/* ── SUPABASE ── */}
            <div className="settings-section">
              <div className="settings-section-title">
                <span>☁</span> Cloud Sync (Supabase)
                {sbConfigured && <span className="settings-badge green">Connected</span>}
              </div>
              <p className="settings-hint" style={{ marginBottom: 10 }}>
                Syncs your week plan, favorites, and meal history across all your devices. Free at supabase.com.
              </p>

              <label className="key-label">Project URL</label>
              <input
                type="text"
                className="key-input"
                style={{ marginBottom: 8, width: "100%" }}
                value={form.sbUrl}
                onChange={e => setForm(f => ({ ...f, sbUrl: e.target.value }))}
                placeholder="https://xxxx.supabase.co"
              />

              <label className="key-label">Anon Public Key</label>
              <div className="key-input-row">
                <input
                  type={form.sbKeyVisible ? "text" : "password"}
                  className="key-input"
                  value={form.sbKey}
                  onChange={e => setForm(f => ({ ...f, sbKey: e.target.value }))}
                  placeholder={sbConfigured ? "Enter new key to replace…" : "eyJ…"}
                />
                <button className="key-toggle" onClick={() => setForm(f => ({ ...f, sbKeyVisible: !f.sbKeyVisible }))}>
                  {form.sbKeyVisible ? "Hide" : "Show"}
                </button>
              </div>
              <p className="settings-hint">Find both at supabase.com → your project → Settings → API</p>

              {sbConfigured && (
                <div className="household-id">
                  <span className="key-label">Household ID</span>
                  <code className="hid-code">{getHouseholdId()}</code>
                  <p className="settings-hint">To sync a second device, copy this ID and paste it into that device's browser console: <code>localStorage.setItem('nf_household_id', 'YOUR_ID')</code> then refresh.</p>
                </div>
              )}
            </div>

            {/* ── UNSPLASH ── */}
            <div className="settings-section">
              <div className="settings-section-title">
                <span>📷</span> Unsplash (Meal Photos)
                {unsplashKey && <span className="settings-badge green">Active</span>}
              </div>
              <p className="settings-hint" style={{ marginBottom: 8 }}>Free food photos for each meal. Get a free key at <a href="https://unsplash.com/developers" target="_blank" rel="noreferrer">unsplash.com/developers</a> → New Application.</p>
              <div className="key-input-row">
                <input
                  type={form.unsplashVisible ? "text" : "password"}
                  className="key-input"
                  value={form.unsplashKey}
                  onChange={e => setForm(f => ({ ...f, unsplashKey: e.target.value }))}
                  placeholder={unsplashKey ? "Enter new key to replace…" : "Your Unsplash Access Key…"}
                />
                <button className="key-toggle" onClick={() => setForm(f => ({ ...f, unsplashVisible: !f.unsplashVisible }))}>
                  {form.unsplashVisible ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* ── SUPABASE SCHEMA ── */}
            {!sbConfigured && (
              <div className="settings-section schema-section">
                <div className="settings-section-title">📋 Supabase Setup</div>
                <p className="settings-hint" style={{ marginBottom: 8 }}>
                  1. Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a><br/>
                  2. Go to <strong>SQL Editor</strong> and run this schema:
                </p>
                <pre className="schema-pre">{`create table nf_week (
  household_id text primary key,
  data text not null,
  updated_at timestamptz default now()
);
create table nf_favorites (
  household_id text primary key,
  data text not null,
  updated_at timestamptz default now()
);
create table nf_history (
  household_id text primary key,
  data text not null,
  updated_at timestamptz default now()
);
alter table nf_week      enable row level security;
alter table nf_favorites enable row level security;
alter table nf_history   enable row level security;
create policy "allow all" on nf_week      for all using (true) with check (true);
create policy "allow all" on nf_favorites for all using (true) with check (true);
create policy "allow all" on nf_history   for all using (true) with check (true);`}
                </pre>
                <p className="settings-hint">3. Then paste your Project URL and anon key above.</p>
              </div>
            )}

            <div style={{ padding: "0 28px 24px", display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveSettings}>
                Save Settings
              </button>
              {sbConfigured && (
                <button className="btn btn-ghost" onClick={pullFromCloud}>
                  ↓ Pull from cloud
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
