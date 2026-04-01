import { useState } from "react";
import RecipeModal from "./RecipeModal";
import NutritionSummary from "./NutritionSummary";
import "./WeekPlanner.css";

const FAMILY_CONTEXT = `
FAMILY PREFERENCES:
- Proteins they regularly buy: lean ground beef (90/10), ground chicken, chicken breast, skinless chicken thighs, salmon fillets, pork loin, pork chops, flank steak, shrimp
- They like most vegetables
- Cuisine styles they enjoy: American, Greek, Italian, Mexican, Asian
- They do NOT like casseroles
- They prefer simple meals: protein + simple sauce + sides
- Easy weeknight cooking — nothing fussy or overly complex

HEALTH GOALS:
- Low carb or moderate carb
- High protein (30g+ per serving ideal)
- Low calorie (under 600 cal/serving)
- Kid-friendly but NOT boring
- Ready in 45 minutes or less`;

const WEEK_SYSTEM_PROMPT = `You are NightFuel, a family dinner assistant. Plan healthy weeknight dinners for a family with kids.
${FAMILY_CONTEXT}

RULES FOR VARIETY:
- Never repeat a protein two nights in a row
- Spread cuisines — no two same cuisines back to back
- Mix up cooking methods
- Avoid any meals listed in the recent history

Respond ONLY with valid JSON (no markdown, no backticks) in this exact format:
{
  "meals": [
    {
      "day": "Monday",
      "name": "Meal Name",
      "description": "1-2 sentence description",
      "tags": ["Low Carb", "High Protein", "Quick"],
      "calories": 420,
      "protein": 38,
      "carbs": 12,
      "cookTime": "30 min",
      "ingredients": ["chicken thighs", "broccoli", "garlic", "soy sauce", "sesame oil"],
      "steps": [
        { "step": 1, "title": "Prep", "instruction": "Pat chicken dry and season.", "time": null },
        { "step": 2, "title": "Sear", "instruction": "Cook 5-6 min per side until golden.", "time": "12 min" },
        { "step": 3, "title": "Serve", "instruction": "Rest 3 minutes and serve with vegetables.", "time": "3 min" }
      ],
      "variations": [
        { "label": "Swap the protein", "suggestion": "Use salmon fillets instead — reduce cook time to 4 min per side." },
        { "label": "Change the sauce", "suggestion": "Try a lemon herb sauce instead for a Mediterranean twist." },
        { "label": "Swap the vegetable", "suggestion": "Use asparagus instead of broccoli — roast at same temp for 10 minutes." }
      ]
    }
  ]
}`;

const DAY_SYSTEM_PROMPT = `You are NightFuel, a family dinner assistant. Suggest ONE healthy weeknight dinner for a specific day.
${FAMILY_CONTEXT}

Respond ONLY with valid JSON (no markdown, no backticks) for a single meal:
{
  "day": "Wednesday",
  "name": "Meal Name",
  "description": "1-2 sentence description",
  "tags": ["Low Carb", "High Protein", "Quick"],
  "calories": 420,
  "protein": 38,
  "carbs": 12,
  "cookTime": "30 min",
  "ingredients": ["chicken thighs", "broccoli", "garlic", "soy sauce", "sesame oil"],
  "steps": [
    { "step": 1, "title": "Prep", "instruction": "Pat chicken dry and season.", "time": null },
    { "step": 2, "title": "Sear", "instruction": "Cook 5-6 min per side until golden.", "time": "12 min" },
    { "step": 3, "title": "Serve", "instruction": "Rest 3 minutes and serve with vegetables.", "time": "3 min" }
  ],
  "variations": [
    { "label": "Swap the protein", "suggestion": "Use salmon fillets instead — reduce cook time to 4 min per side." },
    { "label": "Change the sauce", "suggestion": "Try a lemon herb sauce instead for a Mediterranean twist." },
    { "label": "Swap the vegetable", "suggestion": "Use asparagus instead of broccoli — roast at same temp for 10 minutes." }
  ]
}`;

async function callAI(apiKey, systemPrompt, userMessage) {
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
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  // Surface any API errors clearly
  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const raw = data.content?.[0]?.text || "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export default function WeekPlanner({ week, days, favorites, onAddMeal, onFavorite, onClear, onClearWeek, apiKey, onNeedKey, mealHistory, pendingMeals, onSetPendingMeals }) {
  const [dayPicker, setDayPicker]         = useState(null);
  const [selectedMeal, setSelectedMeal]   = useState(null);
  const [generating, setGenerating]       = useState(false);      // full week
  const [generatingDay, setGeneratingDay] = useState(null);       // single day
  const [daySuggestion, setDaySuggestion] = useState({});         // { Monday: meal, ... }
  const [error, setError]                 = useState(null);
  const [toast, setToast]                 = useState(null);

  const filled    = days.filter(d => week[d]).length;
  const emptyDays = days.filter(d => !week[d]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const saveMealForLater = (meal) => {
    onFavorite(meal);
    showToast(`"${meal.name}" saved — use "From saved" on any empty day next week`);
  };

  // ── GENERATE FULL WEEK ─────────────────────────────────
  const generateWeek = async () => {
    if (!apiKey) { onNeedKey?.(); return; }
    setGenerating(true);
    setError(null);
    onSetPendingMeals(null);

    const recentNames = (mealHistory || []).map(m => m.name).join(", ");
    const daysToFill  = emptyDays.length > 0 ? emptyDays : days;

    const alreadyPlanned = days
      .filter(d => week[d])
      .map(d => `${d}: ${week[d].name}`)
      .join(", ");

    const msg = [
      `Plan meals for: ${daysToFill.join(", ")}.`,
      recentNames   ? `Recent meals to AVOID: ${recentNames}.`      : "",
      alreadyPlanned? `Already planned this week: ${alreadyPlanned}. Don't repeat these proteins or cuisines.` : "",
      `Return one meal per requested day. Always return exactly ${daysToFill.length} meal(s).`,
    ].filter(Boolean).join("\n");

    try {
      const parsed = await callAI(apiKey, WEEK_SYSTEM_PROMPT, msg);
      if (parsed?.meals?.length > 0) {
        onSetPendingMeals(parsed.meals);
      } else {
        setError("Couldn't parse suggestions. Try again.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Check your API key and try again.");
    }
    setGenerating(false);
  };

  // ── GENERATE FOR ONE DAY ───────────────────────────────
  const generateForDay = async (day) => {
    if (!apiKey) { onNeedKey?.(); return; }
    setGeneratingDay(day);
    setDaySuggestion(s => ({ ...s, [day]: null }));

    const recentNames = (mealHistory || []).map(m => m.name).join(", ");
    const alreadyPlanned = days
      .filter(d => week[d] && d !== day)
      .map(d => `${d}: ${week[d].name}`)
      .join(", ");

    const msg = [
      `Suggest ONE dinner for ${day}.`,
      recentNames    ? `Recent meals to AVOID: ${recentNames}.` : "",
      alreadyPlanned ? `Already planned this week — avoid repeating these proteins or cuisines: ${alreadyPlanned}.` : "",
      `Return a single meal object with "day": "${day}".`,
    ].filter(Boolean).join("\n");

    try {
      const parsed = await callAI(apiKey, DAY_SYSTEM_PROMPT, msg);
      // Handle both { day, name, ... } and { meals: [...] }
      const meal = parsed?.meals?.[0] || parsed;
      if (meal?.name) {
        setDaySuggestion(s => ({ ...s, [day]: { ...meal, day } }));
      } else {
        showToast("Couldn't get a suggestion. Try again.");
      }
    } catch (err) {
      showToast(err.message || "Something went wrong. Check your API key.");
    }
    setGeneratingDay(null);
  };

  const acceptDaySuggestion = (day) => {
    const meal = daySuggestion[day];
    if (meal) {
      onAddMeal(meal, day);
      setDaySuggestion(s => ({ ...s, [day]: null }));
    }
  };

  const dismissDaySuggestion = (day) => {
    setDaySuggestion(s => ({ ...s, [day]: null }));
  };

  // ── WEEK PENDING ───────────────────────────────────────
  const acceptAll = () => {
    pendingMeals.forEach(meal => {
      if (days.includes(meal.day)) onAddMeal(meal, meal.day);
    });
    onSetPendingMeals(null);
  };

  const acceptOne = (meal) => {
    if (days.includes(meal.day)) onAddMeal(meal, meal.day);
    onSetPendingMeals(prev => prev.filter(m => m.day !== meal.day));
  };

  const rejectOne = (meal) => {
    onSetPendingMeals(prev => prev.filter(m => m.day !== meal.day));
  };

  return (
    <div className="planner">
      <div className="planner-header">
        <div>
          <h1 className="section-title">This Week's Dinners</h1>
          <p className="section-sub">{filled} of {days.length} nights planned · weeknight meals for the family</p>
        </div>
        <div className="planner-actions">
          {filled < days.length && (
            <button className="btn btn-primary" onClick={generateWeek} disabled={generating || !!generatingDay}>
              {generating ? <><span className="spinner" /> Planning…</> : "✦ AI Plan My Week"}
            </button>
          )}
          {filled > 0 && (
            <button className="btn btn-ghost" onClick={() => {
              if (confirm("Clear this week's plan? Current meals will be saved to history.")) onClearWeek?.();
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
                  {meal.carbs    && <span><strong>{meal.carbs}g</strong> carbs</span>}
                </div>
                <div className="preview-meal-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => acceptOne(meal)}>✓ Add to {meal.day}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => saveMealForLater(meal)}>♡ Save for later</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(meal)}>View recipe</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => rejectOne(meal)}>✕ Skip</button>
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

          return (
            <div key={day} className={`day-slot ${meal ? "filled" : "empty-slot"}`}>
              <div className="day-label">{day}</div>

              {meal ? (
                <div className="day-meal">
                  <div className="meal-name" onClick={() => setSelectedMeal(meal)} style={{ cursor: "pointer" }}>
                    {meal.name}
                  </div>
                  <div className="meal-meta">
                    {meal.tags?.map(tag => (
                      <span key={tag} className={`tag tag-${tagColor(tag)}`}>{tag}</span>
                    ))}
                  </div>
                  <p className="meal-desc">{meal.description}</p>
                  <div className="macros">
                    {meal.calories && <span className="macro"><strong>{meal.calories}</strong> cal</span>}
                    {meal.protein  && <span className="macro"><strong>{meal.protein}g</strong> protein</span>}
                    {meal.carbs    && <span className="macro"><strong>{meal.carbs}g</strong> carbs</span>}
                  </div>
                  <div className="meal-actions" style={{ marginTop: 12 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(meal)}>View recipe</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onFavorite(meal)}>♡ Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onClear(day)}>× Remove</button>
                  </div>
                </div>
              ) : suggestion ? (
                // ── PER-DAY SUGGESTION PREVIEW ─────────────
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
                  <div className="ds-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => acceptDaySuggestion(day)}>✓ Add</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => saveMealForLater(suggestion)}>♡ Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(suggestion)}>Recipe</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => generateForDay(day)} disabled={isLoading}>↺ Try another</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => dismissDaySuggestion(day)}>✕</button>
                  </div>
                </div>
              ) : (
                // ── EMPTY DAY ──────────────────────────────
                <div className="day-empty">
                  {isLoading ? (
                    <div className="day-loading">
                      <span className="spinner-dark" />
                      <span>Finding ideas…</span>
                    </div>
                  ) : (
                    <>
                      <div className="day-empty-icon">+</div>
                      <p>No meal planned</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => generateForDay(day)}
                          disabled={!!generatingDay || generating}
                        >
                          ✦ AI suggest
                        </button>
                        {favorites.length > 0 && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setDayPicker(dayPicker === day ? null : day)}>
                            From saved
                          </button>
                        )}
                      </div>
                      {dayPicker === day && favorites.length > 0 && (
                        <div className="fav-picker">
                          {favorites.map(f => (
                            <button key={f.name} className="fav-pick-item" onClick={() => {
                              onAddMeal(f, day);
                              setDayPicker(null);
                            }}>{f.name}</button>
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
          <button className="btn btn-primary" onClick={() => {
            const items = days.flatMap(d => week[d]?.ingredients || []);
            const unique = [...new Set(items)];
            alert("🛒 Grocery List:\n\n" + unique.map(i => `• ${i}`).join("\n"));
          }}>🛒 Grocery List</button>
        </div>
      )}

      {toast && (
        <div className="planner-toast">
          <span>✓</span> {toast}
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
