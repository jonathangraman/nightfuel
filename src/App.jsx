import { useState, useEffect, lazy, Suspense } from "react";
import WeekPlanner from "./components/WeekPlanner";
const AIChat = lazy(() => import("./components/AIChat"));
const Favorites = lazy(() => import("./components/Favorites"));
const Cookbook = lazy(() => import("./components/Cookbook"));
const MealBuilder = lazy(() => import("./components/MealBuilder"));
const WeekendPlanner = lazy(() => import("./components/WeekendPlanner"));
import Auth from "./components/Auth";
import GroceryList from "./components/GroceryList";
import { getSupabaseClient, isSupabaseConfigured } from "./lib/supabase";
import { DAYS, WEEKEND_DAYS } from "./lib/mealState";
import useMealStore from "./lib/useMealStore";
import { groceryIngredients } from "./lib/cookbook";
import "./App.css";
import "./FreshTheme.css";
import { Leaf, CalendarDays, BookOpen, Utensils, Sparkles, Heart, Sun, Settings, LogOut } from "lucide-react";

const defaultWeek = () => Object.fromEntries(DAYS.map(day => [day, null]));
const MAX_HISTORY = 30;
export default function App() {
  const sb = getSupabaseClient();
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(!sb);
  const [authError, setAuthError] = useState("");
  const [recovery, setRecovery] = useState(() => new URLSearchParams(window.location.search).has("recovery") || window.location.hash.includes("type=recovery"));
  useEffect(() => {
    if (!sb) return;
    let active = true;
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      setUser(session?.user || null);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setChecked(true);
    });
    sb.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      else setUser(data.session?.user || null);
      setChecked(true);
    }).catch(err => { if (active) { setAuthError(err.message); setChecked(true); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, [sb]);
  if (!checked) return <p className="main" role="status">Opening NightFuel…</p>;
  if (sb && (!user || recovery)) return <Auth supabase={sb} recovery={recovery && !!user} initialError={authError} onRecovered={() => {
    setRecovery(false); window.history.replaceState({}, "", window.location.pathname);
  }} />;
  return <MealApp key={user?.id || "guest"} user={user} onSignOut={async () => {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    setUser(null);
  }} />;
}

function MealApp({ user, onSignOut }) {
  const store = useMealStore(user?.id);
  const { week, favorites, mealHistory, ratings, weekend, notes, weekendNotes, unsplashKey, grocery } = store.data;
  const setWeek = v => store.update("week", v);
  const setFavorites = v => store.update("favorites", v);
  const setMealHistory = v => store.update("mealHistory", v);
  const setRatings = v => store.update("ratings", v);
  const setWeekend = v => store.update("weekend", v);
  const setNotes = v => store.update("notes", v);
  const setWeekendNotes = v => store.update("weekendNotes", v);
  const [tab, setTab] = useState("planner");
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState({ unsplashKey: "", unsplashVisible: false });
  const [pendingMeals, setPendingMeals] = useState(null);
  const [showGrocery, setShowGrocery] = useState(false);
  const [actionError, setActionError] = useState("");
  const sbConfigured = isSupabaseConfigured();
  const syncStatus = store.status;
  const pullFromCloud = store.retry;
  const handleSignOut = async () => {
    try { await onSignOut(); } catch (err) { setActionError(err.message || "Sign out failed. Try again."); }
  };
  const updateMeal = (original, replacement) => {
    setWeek(w => Object.fromEntries(Object.entries(w).map(([day, meal]) => [day, meal?.name === original.name ? replacement : meal])));
    setWeekend(w => Object.fromEntries(Object.entries(w).map(([day, meal]) => [day, meal?.name === original.name ? replacement : meal])));
    setFavorites(list => list.map(meal => meal?.name === original.name ? replacement : meal));
  };
  // ── MEAL ACTIONS ────────────────────────────────────
  const addToWeek = (meal, day) => {
    setWeek(w => ({ ...w, [day]: meal }));
    setNotes(n => ({ ...n, [day]: "" }));
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
    setNotes({});
    store.update("grocery", { ...grocery, checked: [], hidden: [] });
  };

  const addFavorite    = (meal) => setFavorites(f => f.find(m => m.name === meal.name) ? f : [meal, ...f]);
  const rateMeal       = (name, stars) => setRatings(r => ({ ...r, [name]: stars }));
  const addToWeekend = (meal, day) => {
    setWeekend(w => ({ ...w, [day]: meal }));
    setWeekendNotes(n => ({ ...n, [day]: "" }));
    setMealHistory(h => [{ name: meal.name, date: new Date().toISOString() }, ...h.filter(m => m.name !== meal.name)].slice(0, MAX_HISTORY));
  };
  const clearWeekend   = (day) => setWeekend(w => ({ ...w, [day]: null }));
  const setNote        = (day, text) => setNotes(n => ({ ...n, [day]: text }));
  const setWeekendNote = (day, text) => setWeekendNotes(n => ({ ...n, [day]: text }));
  const removeFavorite = (name) => setFavorites(f => f.filter(m => m.name !== name));

  const saveSettings = () => {
    store.update("unsplashKey", form.unsplashKey.trim());
    setShowSettings(false);
  };
  const openSettings = () => {
    setForm({ unsplashKey, unsplashVisible: false });
    setShowSettings(true);
  };

  const NAV = [
    { id: "planner",   label: "My week", icon: CalendarDays },
    { id: "cookbook", label: "Cookbook", icon: BookOpen },
    { id: "builder",   label: "Meal Builder", icon: Utensils },
    { id: "ai",        label: "NightFuel AI", icon: Sparkles },
    { id: "favorites", icon: Heart, label: `Saved${favorites.length ? ` · ${favorites.length}` : ""}` },
    { id: "weekend",   label: "Weekend", icon: Sun },
  ];

  const syncIndicator = sbConfigured
    ? syncStatus === "syncing" ? "☁ syncing…"
    : syncStatus === "synced"  ? (store.dirty ? "☁ changes pending" : "☁ synced")
    : syncStatus === "error"   ? "☁ sync error"
    : "☁ cloud on"
    : null;

  if (!store.ready) return <p className="main" role="status">Loading your meal plan…</p>;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark"><Leaf size={25} strokeWidth={1.8} /></span>
            <div>
              <div className="logo-title">NightFuel</div>
              <div className="logo-sub">good food, made yours</div>
            </div>
          </div>
          <nav className="nav" aria-label="Main navigation">
            {NAV.map(t => (
              <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
                <t.icon size={17} aria-hidden="true" /><span>{t.label}</span>
              </button>
            ))}
            {syncIndicator && (
              <span className={`sync-indicator ${syncStatus}`}>{syncIndicator}</span>
            )}
            <button className={`nav-btn key-btn`} aria-label="Settings" onClick={openSettings}><Settings size={18} /></button>
            {user && (
              <button className="nav-btn signout-btn" aria-label="Sign out" onClick={async () => { await handleSignOut(); }}>
                <LogOut size={18} />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ── GROCERY BAR ── */}
      {(() => {
        const allMeals = [
          ...DAYS.map(d => week[d]),
          ...WEEKEND_DAYS.map(d => weekend[d]),
        ].filter(Boolean);
        const itemCount = groceryIngredients(allMeals).length;
        if (itemCount === 0 && !grocery.extras.length) return null;
        return (
          <div className="grocery-bar" onClick={() => setShowGrocery(true)}>
            <span className="grocery-bar-icon">🛒</span>
            <span className="grocery-bar-label">Grocery List</span>
            <span className="grocery-bar-count">{itemCount} items</span>
            <span className="grocery-bar-arrow">→</span>
          </div>
        );
      })()}

      <main className="main">
        {(store.error || store.storageError || actionError) && <div className="planner-error" role="alert">
          <p>{store.error || store.storageError || actionError}</p>
          {store.conflict ? <>
            <p>This device: {Object.values(week).filter(Boolean).map(m => m.name).join(", ") || "No weekday meals"}</p>
            <p>Cloud: {Object.values(store.conflict.data.week).filter(Boolean).map(m => m.name).join(", ") || "No weekday meals"}</p>
            <button className="btn btn-ghost" onClick={() => store.resolve(true)}>Keep this device</button>
            <button className="btn btn-ghost" onClick={() => store.resolve(false)}>Use cloud copy</button>
          </> : user && <button className="btn btn-ghost" onClick={store.retry} disabled={store.saving}>Retry sync</button>}
        </div>}
        <Suspense fallback={<p role="status">Opening…</p>}>
        {tab === "cookbook" && <Cookbook userId={user?.id} days={[...DAYS, ...WEEKEND_DAYS]} plan={{ ...week, ...weekend }} favorites={favorites} onSchedule={(meal, day) => WEEKEND_DAYS.includes(day) ? addToWeekend(meal, day) : addToWeek(meal, day)} />}
        {tab === "planner" && (
          <WeekPlanner
            week={week} days={DAYS} favorites={favorites}
            onAddMeal={addToWeek} onFavorite={addFavorite}
            onClear={(day) => setWeek(w => ({ ...w, [day]: null }))}
            onClearWeek={clearWeek}

            mealHistory={mealHistory}
            pendingMeals={pendingMeals}
            onSetPendingMeals={setPendingMeals}
            ratings={ratings}
            onRate={rateMeal}
            unsplashKey={unsplashKey} onUpdateMeal={updateMeal}
            notes={notes}
            onNote={setNote}
            onOpenGrocery={() => setShowGrocery(true)}
          />
        )}
        {tab === "builder"   && <MealBuilder days={DAYS} week={week} onAddToWeek={addToWeek} />}
        {tab === "ai"        && <AIChat days={DAYS} week={week} onAddToWeek={addToWeek} onFavorite={addFavorite} favorites={favorites}  unsplashKey={unsplashKey} onUpdateMeal={updateMeal} />}
        {tab === "favorites" && <Favorites favorites={favorites} days={DAYS} week={week} ratings={ratings} onRate={rateMeal} unsplashKey={unsplashKey} onUpdateMeal={updateMeal} onRemove={removeFavorite} onAddToWeek={addToWeek} />}
        {tab === "weekend" && (
          <WeekendPlanner
            weekend={weekend}
            onAddMeal={addToWeekend}
            onFavorite={addFavorite}
            onClear={clearWeekend}
            mealHistory={mealHistory}
            ratings={ratings}
            onRate={rateMeal}
            unsplashKey={unsplashKey} onUpdateMeal={updateMeal}
            notes={weekendNotes}
            onNote={setWeekendNote}
          />
        )}
        </Suspense>
      </main>

      {showGrocery && (
        <GroceryList
          week={week}
          days={DAYS}
          weekend={weekend}
          onClose={() => setShowGrocery(false)} data={grocery} onChange={value => store.update("grocery", value)}
        />
      )}

      {/* ── SETTINGS MODAL ── */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>

            {/* Sign out bar - always visible at top on mobile */}
            {user && (
              <div className="settings-signout-bar">
                <span className="settings-signout-email">👤 {user.email}</span>
                <button
                  className="btn btn-sm"
                  style={{ background: "var(--red)", color: "#fff", border: "none" }}
                  onClick={async () => { await handleSignOut(); }}
                >
                  Sign out
                </button>
              </div>
            )}
            <div className="settings-header">
              <h2 className="modal-title">Settings</h2>
              <p className="modal-desc">Configure your keys and preferences.</p>
            </div>

            {/* ── AI API KEY (server-side) ── */}
            <div className="settings-section">
              <div className="settings-section-title">
                <span>⚿</span> OpenAI API Key
                <span className="settings-badge green">Server-side</span>
              </div>
              <p className="settings-hint">
                Your API key is stored securely in Vercel environment variables — never in the browser.
                To update it, go to your <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Vercel dashboard</a> → Project → Settings → Environment Variables → <strong>OPENAI_API_KEY</strong>.
              </p>
            </div>

            {/* ── SUPABASE ── */}
            <div className="settings-section">
              <div className="settings-section-title">
                <span>☁</span> Cloud Sync (Supabase)
                {sbConfigured ? <span className="settings-badge green">Connected</span> : <span className="settings-badge">Not configured</span>}
              </div>
              {sbConfigured ? (
                <p className="settings-hint">
                  Cloud sync is active — your data syncs across all devices automatically.
                  Supabase credentials are configured via Vercel environment variables.
                </p>
              ) : (
                <p className="settings-hint">
                  Cloud sync is not configured. Add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer"> Vercel environment variables</a> to enable sync across devices.
                </p>
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



            <div style={{ padding: "0 28px 24px", display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveSettings}>
                Save Settings
              </button>
              {sbConfigured && (
                <button className="btn btn-ghost" onClick={pullFromCloud} disabled={store.saving}>
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

