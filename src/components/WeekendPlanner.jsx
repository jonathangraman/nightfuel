import { useState } from "react";
import RecipeModal from "./RecipeModal";
import StarRating from "./StarRating";
import { getCurrentSeason } from "../data/seasons";
import "./WeekendPlanner.css";

const WEEKEND_DAYS = ["Saturday", "Sunday"];

const WEEKEND_SYSTEM_PROMPT = `You are NightFuel, a family dinner assistant. Suggest weekend dinners — these are NOT quick weeknight meals. Weekend cooking is an experience.

FAMILY PREFERENCES:
- Proteins they regularly buy: lean ground beef (90/10), ground turkey, ground chicken, chicken breast, skinless chicken thighs, chicken sausage, salmon fillets, tuna steaks, pork loin, pork chops, flank steak, shrimp
- They enjoy American, Greek, Italian, Mexican, Asian cuisines
- Weekend meals can be more ambitious, take longer, and use better/pricier ingredients

WEEKEND MEAL SPIRIT:
- BBQ and grilled proteins are perfect — low-and-slow ribs, whole chicken, thick-cut steaks
- More elaborate preparations are welcome: marinades, brines, slow roasts, homemade sauces
- Higher quality proteins are appropriate: scallops, ribeye, lamb chops, whole fish, duck breast
- Dishes that impress: paella, beef bourguignon (simplified), rack of lamb, whole roasted chicken
- Cook time can be 1-3 hours — that's the point
- Still healthy but portions can be more generous, sides more indulgent
- Kid-friendly but can be a little more sophisticated

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "meals": [
    {
      "day": "Saturday",
      "name": "Meal Name",
      "description": "1-2 sentence description that sounds special",
      "tags": ["BBQ", "Weekend Special", "Grill"],
      "calories": 520,
      "protein": 42,
      "carbs": 15,
      "cookTime": "1.5 hrs",
      "ingredients": ["ribeye steak", "rosemary", "garlic", "butter", "thyme"],
      "sides": [
        { "name": "Grilled Corn on the Cob", "description": "Brush with herb butter and grill 10 min.", "calories": 110 },
        { "name": "Wedge Salad", "description": "Iceberg, bacon, blue cheese dressing.", "calories": 120 }
      ],
      "steps": [
        { "step": 1, "title": "Season", "instruction": "Season generously and rest at room temp 30 min.", "time": "30 min" },
        { "step": 2, "title": "Grill", "instruction": "Grill over high heat 4-5 min per side for medium-rare.", "time": "10 min" },
        { "step": 3, "title": "Rest", "instruction": "Rest 5-10 minutes before slicing.", "time": "10 min" }
      ],
      "variations": [
        { "label": "Upgrade the protein", "suggestion": "Use a tomahawk ribeye for a showstopper presentation." },
        { "label": "Change the sauce", "suggestion": "Serve with chimichurri instead of herb butter — bright and herby." },
        { "label": "Low and slow option", "suggestion": "Reverse sear: cook at 250°F for 45 min then sear 2 min per side for perfect edge-to-edge doneness." }
      ]
    }
  ]
}`;

async function callAI(apiKey, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: WEEKEND_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || `HTTP ${res.status}`);
  const raw = data.content?.[0]?.text || "";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export default function WeekendPlanner({ weekend, onAddMeal, onFavorite, onClear, apiKey, onNeedKey, mealHistory, ratings, onRate, unsplashKey, notes, onNote }) {
  const [selectedMeal, setSelectedMeal]   = useState(null);
  const [generating, setGenerating]       = useState(false);
  const [generatingDay, setGeneratingDay] = useState(null);
  const [daySuggestion, setDaySuggestion] = useState({});
  const [error, setError]                 = useState(null);
  const [toast, setToast]                 = useState(null);
  const [editingNote, setEditingNote]     = useState(null);
  const [noteText, setNoteText]           = useState("");
  const [pendingMeals, setPendingMeals]   = useState(null);
  const season = getCurrentSeason();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const buildMsg = (days) => {
    const recent = (mealHistory || []).map(m => m.name).join(", ");
    const existing = WEEKEND_DAYS.filter(d => weekend[d]).map(d => `${d}: ${weekend[d].name}`).join(", ");
    return [
      `Plan weekend dinners for: ${days.join(", ")}.`,
      recent   ? `Recent meals to AVOID: ${recent}.` : "",
      existing ? `Already planned: ${existing}.` : "",
      season.note,
      `These are weekend meals — be ambitious, use premium proteins, longer cook times are welcome.`,
    ].filter(Boolean).join("\n");
  };

  const generateWeekend = async () => {
    if (!apiKey) { onNeedKey?.(); return; }
    setGenerating(true);
    setError(null);
    setPendingMeals(null);
    try {
      const daysToFill = WEEKEND_DAYS.filter(d => !weekend[d]);
      const parsed = await callAI(apiKey, buildMsg(daysToFill.length ? daysToFill : WEEKEND_DAYS));
      if (parsed?.meals?.length > 0) setPendingMeals(parsed.meals);
      else setError("Couldn't parse suggestions. Try again.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
    setGenerating(false);
  };

  const generateForDay = async (day) => {
    if (!apiKey) { onNeedKey?.(); return; }
    setGeneratingDay(day);
    setDaySuggestion(s => ({ ...s, [day]: null }));
    try {
      const parsed = await callAI(apiKey, buildMsg([day]) + `\nReturn a single meal object with "day": "${day}".`);
      const meal = parsed?.meals?.[0] || parsed;
      if (meal?.name) setDaySuggestion(s => ({ ...s, [day]: { ...meal, day } }));
      else showToast("Couldn't get a suggestion. Try again.");
    } catch (err) {
      showToast(err.message || "Something went wrong.");
    }
    setGeneratingDay(null);
  };

  return (
    <div className="weekend-planner">
      <div className="weekend-header">
        <div>
          <h1 className="section-title">Weekend Dinners</h1>
          <p className="section-sub">More time, better ingredients, no rules — Saturday & Sunday cooking</p>
        </div>
        <div className="planner-actions">
          <button className="btn btn-primary" onClick={generateWeekend} disabled={generating || !!generatingDay}>
            {generating ? <><span className="spinner" /> Planning…</> : "✦ AI Weekend Ideas"}
          </button>
        </div>
      </div>

      {error && <div className="planner-error">⚠ {error}</div>}

      {/* PENDING PREVIEW */}
      {pendingMeals?.length > 0 && (
        <div className="generated-preview">
          <div className="preview-header">
            <div>
              <div className="preview-title">✦ Weekend meal ideas</div>
              <div className="preview-sub">More ambitious, more fun — perfect for Saturday & Sunday</div>
            </div>
            <div className="preview-actions">
              <button className="btn btn-primary" onClick={() => {
                pendingMeals.forEach(m => { if (WEEKEND_DAYS.includes(m.day)) onAddMeal(m, m.day); });
                setPendingMeals(null);
              }}>Accept both</button>
              <button className="btn btn-ghost" onClick={() => setPendingMeals(null)}>Discard</button>
            </div>
          </div>
          <div className="preview-meals">
            {pendingMeals.map(meal => (
              <div key={meal.day} className="preview-meal-card">
                <div className="preview-day">{meal.day}</div>
                <div className="preview-meal-name">{meal.name}</div>
                <div className="preview-meal-meta">
                  {meal.tags?.map(t => <span key={t} className={`tag tag-${tagColor(t)}`}>{t}</span>)}
                  {meal.cookTime && <span className="preview-time">⏱ {meal.cookTime}</span>}
                </div>
                <p className="preview-meal-desc">{meal.description}</p>
                <div className="preview-macros">
                  {meal.calories && <span><strong>{meal.calories}</strong> cal</span>}
                  {meal.protein && <span><strong>{meal.protein}g</strong> protein</span>}
                </div>
                {meal.sides?.length > 0 && (
                  <div className="preview-sides">
                    <span className="preview-sides-label">Sides:</span>
                    {meal.sides.map(s => <span key={s.name} className="preview-side-chip">{s.name}</span>)}
                  </div>
                )}
                <div className="preview-meal-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    onAddMeal(meal, meal.day);
                    setPendingMeals(prev => prev.filter(m => m.day !== meal.day));
                  }}>✓ Add to {meal.day}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { onFavorite(meal); showToast(`"${meal.name}" saved`); }}>♡ Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(meal)}>Recipe</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPendingMeals(prev => prev.filter(m => m.day !== meal.day))}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WEEKEND GRID */}
      <div className="weekend-grid">
        {WEEKEND_DAYS.map(day => {
          const meal      = weekend[day];
          const suggestion = daySuggestion[day];
          const isLoading  = generatingDay === day;
          const mealRating = meal ? (ratings?.[meal.name] || 0) : 0;
          const note       = notes?.[day] || "";

          return (
            <div key={day} className={`weekend-slot ${meal ? "filled" : "empty-slot"}`}>
              <div className="day-label">{day}</div>

              {meal ? (
                <div className="day-meal">
                  <div className="meal-name" onClick={() => setSelectedMeal(meal)} style={{ cursor: "pointer" }}>{meal.name}</div>
                  <div className="meal-meta">
                    {meal.tags?.map(tag => <span key={tag} className={`tag tag-${tagColor(tag)}`}>{tag}</span>)}
                    {meal.cookTime && <span className="cook-time-badge">⏱ {meal.cookTime}</span>}
                  </div>
                  <p className="meal-desc">{meal.description}</p>
                  <div className="macros">
                    {meal.calories && <span className="macro"><strong>{meal.calories}</strong> cal</span>}
                    {meal.protein  && <span className="macro"><strong>{meal.protein}g</strong> protein</span>}
                  </div>

                  {/* NOTE */}
                  {note ? (
                    <div className="meal-note" onClick={() => { setEditingNote(day); setNoteText(note); }}>
                      📝 {note}
                    </div>
                  ) : (
                    <button className="add-note-btn" onClick={() => { setEditingNote(day); setNoteText(""); }}>+ Add note</button>
                  )}

                  <div className="day-rating"><StarRating value={mealRating} onChange={(r) => onRate?.(meal.name, r)} size="sm" /></div>

                  <div className="meal-actions" style={{ marginTop: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(meal)}>View recipe</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onFavorite(meal)}>♡ Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onClear(day)}>× Remove</button>
                  </div>
                </div>
              ) : suggestion ? (
                <div className="day-suggestion">
                  <div className="ds-label">✦ Weekend idea</div>
                  <div className="ds-name">{suggestion.name}</div>
                  <div className="ds-meta">
                    {suggestion.tags?.map(t => <span key={t} className={`tag tag-${tagColor(t)}`}>{t}</span>)}
                    {suggestion.cookTime && <span className="ds-time">⏱ {suggestion.cookTime}</span>}
                  </div>
                  <p className="ds-desc">{suggestion.description}</p>
                  <div className="ds-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => { onAddMeal(suggestion, day); setDaySuggestion(s => ({ ...s, [day]: null })); }}>✓ Add</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { onFavorite(suggestion); showToast(`"${suggestion.name}" saved`); }}>♡</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(suggestion)}>Recipe</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => generateForDay(day)} disabled={isLoading}>↺ New</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDaySuggestion(s => ({ ...s, [day]: null }))}>✕</button>
                  </div>
                </div>
              ) : (
                <div className="day-empty">
                  {isLoading ? (
                    <div className="day-loading"><span className="spinner-dark" /><span>Finding ideas…</span></div>
                  ) : (
                    <>
                      <div className="day-empty-icon">+</div>
                      <p>No meal planned</p>
                      <button className="btn btn-ghost btn-sm" onClick={() => generateForDay(day)} disabled={!!generatingDay || generating}>
                        ✦ AI suggest
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NOTE EDITOR */}
      {editingNote && (
        <div className="modal-overlay" onClick={() => setEditingNote(null)}>
          <div className="modal note-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingNote(null)}>×</button>
            <div style={{ padding: "24px 28px" }}>
              <h3 className="modal-title" style={{ fontSize: 20, marginBottom: 16 }}>📝 Note for {editingNote}</h3>
              <textarea
                className="note-textarea"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="e.g. kids loved this, add more garlic next time, too spicy…"
                rows={4}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => { onNote?.(editingNote, noteText); setEditingNote(null); }}>Save note</button>
                {notes?.[editingNote] && (
                  <button className="btn btn-ghost" style={{ color: "var(--red)" }} onClick={() => { onNote?.(editingNote, ""); setEditingNote(null); }}>Delete note</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="planner-toast"><span>✓</span> {toast}</div>}

      {selectedMeal && (
        <RecipeModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onFavorite={onFavorite}
          onAddToWeek={(meal, day) => onAddMeal(meal, day)}
          days={WEEKEND_DAYS}
          week={weekend}
          favorites={[]}
          rating={ratings?.[selectedMeal?.name] || 0}
          onRate={(r) => onRate?.(selectedMeal?.name, r)}
          unsplashKey={unsplashKey}
        />
      )}
    </div>
  );
}

function tagColor(tag) {
  if (["Low Carb", "High Protein"].includes(tag)) return "green";
  if (["BBQ", "Grill", "Weekend Special"].includes(tag)) return "orange";
  return "yellow";
}
