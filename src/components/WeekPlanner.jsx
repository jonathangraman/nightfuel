import { useState } from "react";
import RecipeModal from "./RecipeModal";
import NutritionSummary from "./NutritionSummary";
import GroceryList from "./GroceryList";
import StarRating from "./StarRating";
import { getCurrentSeason } from "../data/seasons";
import "./WeekPlanner.css";

const COOK_TIME_OPTIONS = [
  { label: "Any time",  value: null,  mins: null },
  { label: "≤ 20 min",  value: 20,    mins: 20 },
  { label: "≤ 30 min",  value: 30,    mins: 30 },
  { label: "≤ 45 min",  value: 45,    mins: 45 },
];

const FAMILY_CONTEXT = `
FAMILY PREFERENCES:
- Proteins they regularly buy: lean ground beef (90/10), ground turkey (93/7), ground chicken, chicken breast, skinless chicken thighs, chicken sausage, salmon fillets, tuna steaks, pork loin, pork chops, flank steak, shrimp
- They like most vegetables
- Cuisine styles they enjoy: American, Greek, Italian, Mexican, Asian
- They do NOT like casseroles
- They prefer simple meals: protein + simple sauce + sides
- Easy weeknight cooking — nothing fussy or overly complex

HEALTH GOALS:
- Low carb or moderate carb
- High protein (30g+ per serving ideal)
- Low calorie (under 600 cal/serving)
- Kid-friendly but NOT boring`;

function buildMealSchema(day = "Monday") {
  return `{
      "day": "${day}",
      "name": "Meal Name",
      "description": "1-2 sentence description",
      "tags": ["Low Carb", "High Protein", "Quick"],
      "calories": 420,
      "protein": 38,
      "carbs": 12,
      "cookTime": "30 min",
      "ingredients": ["chicken thighs", "broccoli", "garlic", "soy sauce", "sesame oil"],
      "sides": [
        { "name": "Roasted Broccoli", "description": "Toss with olive oil and roast at 425°F for 18 minutes.", "calories": 55 },
        { "name": "Side Salad", "description": "Mixed greens, cucumber, lemon vinaigrette.", "calories": 30 }
      ],
      "steps": [
        { "step": 1, "title": "Prep", "instruction": "Pat chicken dry and season.", "time": null },
        { "step": 2, "title": "Sear", "instruction": "Cook 5-6 min per side until golden.", "time": "12 min" },
        { "step": 3, "title": "Serve", "instruction": "Rest 3 minutes and serve.", "time": "3 min" }
      ],
      "variations": [
        { "label": "Swap the protein", "suggestion": "Use salmon fillets instead — reduce cook time to 4 min per side." },
        { "label": "Change the sauce", "suggestion": "Try a lemon herb sauce instead for a Mediterranean twist." },
        { "label": "Swap the vegetable", "suggestion": "Use asparagus instead of broccoli — roast at same temp for 10 minutes." }
      ]
    }`;
}

const WEEK_SYSTEM_PROMPT = `You are NightFuel, a family dinner assistant. Plan healthy weeknight dinners for a family with kids.
${FAMILY_CONTEXT}

RULES FOR VARIETY:
- Never repeat a protein two nights in a row
- Spread cuisines — no two same cuisines back to back
- Mix up cooking methods
- Avoid any meals listed in the recent history
- When seasonal produce is mentioned, incorporate it into vegetable sides and ingredients
- Consider fruit salads as sides: strawberry spinach, peach arugula, apple walnut spinach, mango avocado, citrus arugula — match to the season
- Fruit-forward dressings like strawberry balsamic, apple cider vinaigrette, honey poppy seed, mango lime pair well with grilled proteins

Always include 2 suggested sides per meal. Sides should be specific with brief prep instructions and calories.

Respond ONLY with valid JSON (no markdown, no backticks):
{ "meals": [${buildMealSchema()}] }`;

const DAY_SYSTEM_PROMPT = `You are NightFuel, a family dinner assistant. Suggest ONE healthy weeknight dinner for a specific day.
${FAMILY_CONTEXT}

Always include 2 suggested sides. When seasonal produce is mentioned, use it.

Respond ONLY with valid JSON (no markdown, no backticks) — a single meal object:
${buildMealSchema("Wednesday")}`;

async function callAI(systemPrompt, userMessage) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || `HTTP ${res.status}`);
  const raw = data.content?.[0]?.text || "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export default function WeekPlanner({ week, days, favorites, onAddMeal, onFavorite, onClear, onClearWeek, apiKey, onNeedKey, mealHistory, pendingMeals, onSetPendingMeals, ratings, onRate, unsplashKey, notes, onNote, weekend }) {
  const [dayPicker, setDayPicker]         = useState(null);
  const [selectedMeal, setSelectedMeal]   = useState(null);
  const [generating, setGenerating]       = useState(false);
  const [generatingDay, setGeneratingDay] = useState(null);
  const [daySuggestion, setDaySuggestion] = useState({});
  const [error, setError]                 = useState(null);
  const [toast, setToast]                 = useState(null);
  const [showGrocery, setShowGrocery]     = useState(false);
  const [cookTimeFilter, setCookTimeFilter] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");

  const filled    = days.filter(d => week[d]).length;
  const emptyDays = days.filter(d => !week[d]);
  const season    = getCurrentSeason();

  // Cuisine balance from meal tags
  const cuisineBalance = days.reduce((acc, d) => {
    const meal = week[d];
    if (!meal) return acc;
    const cuisineTag = meal.tags?.find(t => ["Asian", "Greek", "Italian", "Mexican", "American", "French"].includes(t));
    if (cuisineTag) acc[cuisineTag] = (acc[cuisineTag] || 0) + 1;
    return acc;
  }, {});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const saveMealForLater = (meal) => {
    onFavorite(meal);
    showToast(`"${meal.name}" saved — use "From saved" on any empty day next week`);
  };

  // Build shared context for AI calls
  const buildContext = (forDays, existingPlan = "") => {
    const recentNames = (mealHistory || []).map(m => m.name).join(", ");
    const ratingContext = Object.entries(ratings || {})
      .filter(([, r]) => r > 0)
      .map(([name, r]) => `${name}: ${r}/5`)
      .join(", ");

    return [
      `Plan meals for: ${forDays.join(", ")}.`,
      recentNames    ? `Recent meals to AVOID: ${recentNames}.`                             : "",
      existingPlan   ? `Already planned this week (avoid repeating proteins/cuisines): ${existingPlan}.` : "",
      cookTimeFilter ? `IMPORTANT: All meals must be ready in ${cookTimeFilter} minutes or less.`        : "",
      season.note,
      ratingContext  ? `Meal ratings for reference (suggest similar to high-rated, avoid similar to low-rated): ${ratingContext}.` : "",
    ].filter(Boolean).join("\n");
  };

  // ── GENERATE FULL WEEK ──────────────────────────────
  const generateWeek = async () => {
    if (!apiKey) { onNeedKey?.(); return; }
    setGenerating(true);
    setError(null);
    onSetPendingMeals(null);

    const daysToFill  = emptyDays.length > 0 ? emptyDays : days;
    const alreadyPlanned = days.filter(d => week[d]).map(d => `${d}: ${week[d].name}`).join(", ");
    const msg = buildContext(daysToFill, alreadyPlanned) + `\nReturn exactly ${daysToFill.length} meal(s).`;

    try {
      const parsed = await callAI(WEEK_SYSTEM_PROMPT, msg);
      if (parsed?.meals?.length > 0) onSetPendingMeals(parsed.meals);
      else setError("Couldn't parse suggestions. Try again.");
    } catch (err) {
      setError(err.message || "Something went wrong. Check your API key and try again.");
    }
    setGenerating(false);
  };

  // ── GENERATE FOR ONE DAY ────────────────────────────
  const generateForDay = async (day) => {
    if (!apiKey) { onNeedKey?.(); return; }
    setGeneratingDay(day);
    setDaySuggestion(s => ({ ...s, [day]: null }));

    const alreadyPlanned = days.filter(d => week[d] && d !== day).map(d => `${d}: ${week[d].name}`).join(", ");
    const msg = buildContext([day], alreadyPlanned) + `\nReturn a single meal object with "day": "${day}".`;

    try {
      const parsed = await callAI(DAY_SYSTEM_PROMPT, msg);
      const meal = parsed?.meals?.[0] || parsed;
      if (meal?.name) setDaySuggestion(s => ({ ...s, [day]: { ...meal, day } }));
      else showToast("Couldn't get a suggestion. Try again.");
    } catch (err) {
      showToast(err.message || "Something went wrong. Check your API key.");
    }
    setGeneratingDay(null);
  };

  const acceptDaySuggestion = (day) => {
    const meal = daySuggestion[day];
    if (meal) { onAddMeal(meal, day); setDaySuggestion(s => ({ ...s, [day]: null })); }
  };

  const dismissDaySuggestion = (day) => setDaySuggestion(s => ({ ...s, [day]: null }));

  // ── WEEK PENDING ────────────────────────────────────
  const acceptAll = () => {
    pendingMeals.forEach(meal => { if (days.includes(meal.day)) onAddMeal(meal, meal.day); });
    onSetPendingMeals(null);
  };

  const acceptOne = (meal) => {
    if (days.includes(meal.day)) onAddMeal(meal, meal.day);
    onSetPendingMeals(prev => prev.filter(m => m.day !== meal.day));
  };

  const rejectOne = (meal) => onSetPendingMeals(prev => prev.filter(m => m.day !== meal.day));

  return (
    <div className="planner">
      <div className="planner-header">
        <div>
          <h1 className="section-title">This Week's Dinners</h1>
          <p className="section-sub">{filled} of {days.length} nights planned · {season.month}</p>
          {Object.keys(cuisineBalance).length > 0 && (
            <div className="cuisine-balance">
              {Object.entries(cuisineBalance).map(([cuisine, count]) => (
                <span key={cuisine} className="cuisine-pill">{cuisine} {count > 1 ? `×${count}` : ""}</span>
              ))}
            </div>
          )}
        </div>
        <div className="planner-actions">
          {/* Cook time filter */}
          <div className="cook-filter">
            {COOK_TIME_OPTIONS.map(opt => (
              <button
                key={opt.label}
                className={`cook-chip ${cookTimeFilter === opt.value ? "active" : ""}`}
                onClick={() => setCookTimeFilter(opt.value)}
              >{opt.label}</button>
            ))}
          </div>
          {filled > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowGrocery(true)}>🛒 Grocery List</button>
          )}
          {filled < days.length && (
            <button className="btn btn-primary" onClick={generateWeek} disabled={generating || !!generatingDay}>
              {generating ? <><span className="spinner" /> Planning…</> : "✦ AI Plan My Week"}
            </button>
          )}
          {filled > 0 && (
            <button className="btn btn-ghost" onClick={() => {
              if (confirm("Clear this week's plan? Meals will be saved to history.")) onClearWeek?.();
            }}>Clear week</button>
          )}
        </div>
      </div>

      {error && <div className="planner-error">⚠ {error}</div>}

      {/* FULL WEEK PREVIEW */}
      {pendingMeals && pendingMeals.length > 0 && (
        <div className="generated-preview">
          <div className="preview-header">
            <div>
              <div className="preview-title">✦ Your AI-planned week</div>
              <div className="preview-sub">Review each meal — accept, save for later, or skip</div>
            </div>
            <div className="preview-actions">
              <button className="btn btn-primary" onClick={acceptAll}>Accept all {pendingMeals.length}</button>
              <button className="btn btn-ghost" onClick={() => onSetPendingMeals(null)}>Discard</button>
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
                  {meal.protein  && <span><strong>{meal.protein}g</strong> protein</span>}
                </div>
                {meal.sides?.length > 0 && (
                  <div className="preview-sides">
                    <span className="preview-sides-label">Sides:</span>
                    {meal.sides.map(s => <span key={s.name} className="preview-side-chip">{s.name}</span>)}
                  </div>
                )}
                <div className="preview-meal-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => acceptOne(meal)}>✓ Add to {meal.day}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => saveMealForLater(meal)}>♡ Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(meal)}>Recipe</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => rejectOne(meal)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WEEK GRID */}
      <div className="week-grid">
        {days.map(day => {
          const meal       = week[day];
          const suggestion = daySuggestion[day];
          const isLoading  = generatingDay === day;
          const mealRating = meal ? (ratings?.[meal.name] || 0) : 0;

          return (
            <div key={day} className={`day-slot ${meal ? "filled" : "empty-slot"}`}>
              <div className="day-label">{day}</div>

              {meal ? (
                <div className="day-meal">
                  <div className="meal-name" onClick={() => setSelectedMeal(meal)} style={{ cursor: "pointer" }}>
                    {meal.name}
                  </div>
                  <div className="meal-meta">
                    {meal.tags?.map(tag => <span key={tag} className={`tag tag-${tagColor(tag)}`}>{tag}</span>)}
                  </div>
                  <p className="meal-desc">{meal.description}</p>
                  <div className="macros">
                    {meal.calories && <span className="macro"><strong>{meal.calories}</strong> cal</span>}
                    {meal.protein  && <span className="macro"><strong>{meal.protein}g</strong> protein</span>}
                  </div>
                  {/* STAR RATING */}
                  <div className="day-rating">
                    <StarRating value={mealRating} onChange={(r) => onRate?.(meal.name, r)} size="sm" />
                  </div>
                  {notes?.[day] ? (
                    <div className="meal-note" onClick={() => { setEditingNote(day); setNoteText(notes[day]); }}>
                      📝 {notes[day]}
                    </div>
                  ) : (
                    <button className="add-note-btn" onClick={() => { setEditingNote(day); setNoteText(""); }}>+ Add note</button>
                  )}
                  <div className="meal-actions" style={{ marginTop: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(meal)}>View recipe</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onFavorite(meal)}>♡ Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onClear(day)}>× Remove</button>
                  </div>
                </div>
              ) : suggestion ? (
                <div className="day-suggestion">
                  <div className="ds-label">✦ Suggestion</div>
                  <div className="ds-name">{suggestion.name}</div>
                  <div className="ds-meta">
                    {suggestion.tags?.map(t => <span key={t} className={`tag tag-${tagColor(t)}`}>{t}</span>)}
                    {suggestion.cookTime && <span className="ds-time">⏱ {suggestion.cookTime}</span>}
                  </div>
                  <p className="ds-desc">{suggestion.description}</p>
                  <div className="ds-macros">
                    {suggestion.calories && <span><strong>{suggestion.calories}</strong> cal</span>}
                    {suggestion.protein  && <span><strong>{suggestion.protein}g</strong> protein</span>}
                  </div>
                  {suggestion.sides?.length > 0 && (
                    <div className="ds-sides">
                      {suggestion.sides.map(s => <span key={s.name} className="ds-side-chip">{s.name}</span>)}
                    </div>
                  )}
                  <div className="ds-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => acceptDaySuggestion(day)}>✓ Add</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => saveMealForLater(suggestion)}>♡ Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(suggestion)}>Recipe</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => generateForDay(day)} disabled={isLoading}>↺ New</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => dismissDaySuggestion(day)}>✕</button>
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
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => generateForDay(day)} disabled={!!generatingDay || generating}>
                          ✦ AI suggest
                        </button>
                        {favorites.length > 0 && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setDayPicker(dayPicker === day ? null : day)}>
                            From saved
                          </button>
                        )}
                      </div>
                      {dayPicker === day && (
                        <div className="fav-picker">
                          {favorites.map(f => (
                            <button key={f.name} className="fav-pick-item" onClick={() => { onAddMeal(f, day); setDayPicker(null); }}>
                              {f.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <NutritionSummary week={week} days={days} />

      {filled === days.length && (
        <div className="week-complete">
          <span>🎉</span>
          <div>
            <strong>Full week planned!</strong>
            <p>Your family dinners are all set.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowGrocery(true)}>🛒 Grocery List</button>
        </div>
      )}

      {toast && <div className="planner-toast"><span>✓</span> {toast}</div>}

      {showGrocery && <GroceryList week={week} days={days} weekend={weekend} onClose={() => setShowGrocery(false)} />}

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
                  <button className="btn btn-ghost" style={{ color: "var(--red)" }} onClick={() => { onNote?.(editingNote, ""); setEditingNote(null); }}>Delete</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMeal && (
        <RecipeModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onFavorite={onFavorite}
          onAddToWeek={onAddMeal}
          days={days}
          week={week}
          favorites={favorites}
          rating={ratings?.[selectedMeal?.name] || 0}
          onRate={(r) => onRate?.(selectedMeal?.name, r)}
          apiKey={apiKey}
          unsplashKey={unsplashKey}
        />
      )}
    </div>
  );
}

function tagColor(tag) {
  if (["Low Carb", "Low-Carb", "Keto"].includes(tag)) return "green";
  if (["High Protein", "Protein-Packed"].includes(tag)) return "yellow";
  if (["Quick", "30 min", "Easy"].includes(tag)) return "orange";
  return "green";
}
