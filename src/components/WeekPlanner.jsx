import { useState } from "react";
import RecipeModal from "./RecipeModal";
import NutritionSummary from "./NutritionSummary";
import "./WeekPlanner.css";

const WEEK_SYSTEM_PROMPT = `You are NightFuel, a family dinner assistant. Plan a full week of healthy weeknight dinners for a family with kids.

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

RULES FOR VARIETY:
- Never repeat a protein two nights in a row
- Spread cuisines across the week — no two same cuisines back to back
- Mix up cooking methods across the week (don't grill everything)
- Avoid any meals listed in the "recent meals" history provided

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
}

Always return exactly 5 meals, one for each day: Monday, Tuesday, Wednesday, Thursday, Friday.`;

export default function WeekPlanner({ week, days, favorites, onAddMeal, onFavorite, onClear, apiKey, onNeedKey, mealHistory }) {
  const [dayPicker, setDayPicker] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedMeals, setGeneratedMeals] = useState(null); // preview before accepting
  const [error, setError] = useState(null);

  const filled = days.filter(d => week[d]).length;
  const emptyDays = days.filter(d => !week[d]);

  const generateWeek = async () => {
    if (!apiKey) { onNeedKey?.(); return; }
    setGenerating(true);
    setError(null);
    setGeneratedMeals(null);

    // Build history string to avoid repeats
    const recentNames = (mealHistory || []).map(m => m.name).join(", ");
    const historyNote = recentNames
      ? `\nRecent meals to AVOID repeating: ${recentNames}`
      : "";

    // Only fill empty days
    const daysToFill = emptyDays.length > 0 ? emptyDays : days;
    const dayNote = daysToFill.length < 5
      ? `\nOnly plan meals for these days: ${daysToFill.join(", ")}`
      : "";

    try {
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
          system: WEEK_SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Plan a week of dinners for our family.${historyNote}${dayNote}\n\nMake sure every meal is different from what we've had recently and varies in cuisine and protein across the week.`
          }],
        }),
      });

      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed?.meals?.length > 0) {
        setGeneratedMeals(parsed.meals);
      } else {
        setError("Couldn't parse the suggestions. Try again.");
      }
    } catch (err) {
      setError("Something went wrong. Check your API key and try again.");
    }

    setGenerating(false);
  };

  const acceptAll = () => {
    generatedMeals.forEach(meal => {
      const day = meal.day;
      if (days.includes(day)) onAddMeal(meal, day);
    });
    setGeneratedMeals(null);
  };

  const acceptOne = (meal) => {
    if (days.includes(meal.day)) onAddMeal(meal, meal.day);
    setGeneratedMeals(prev => prev.filter(m => m.day !== meal.day));
  };

  const rejectOne = (meal) => {
    setGeneratedMeals(prev => prev.filter(m => m.day !== meal.day));
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
            <button className="btn btn-primary" onClick={generateWeek} disabled={generating}>
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

      {/* ERROR */}
      {error && (
        <div className="planner-error">⚠ {error}</div>
      )}

      {/* GENERATED PREVIEW */}
      {generatedMeals && generatedMeals.length > 0 && (
        <div className="generated-preview">
          <div className="preview-header">
            <div>
              <div className="preview-title">✦ Your AI-planned week</div>
              <div className="preview-sub">Review each meal — accept the ones you want, swap the others</div>
            </div>
            <div className="preview-actions">
              <button className="btn btn-primary" onClick={acceptAll}>Accept all {generatedMeals.length}</button>
              <button className="btn btn-ghost" onClick={() => setGeneratedMeals(null)}>Discard</button>
            </div>
          </div>
          <div className="preview-meals">
            {generatedMeals.map(meal => (
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
                  {meal.carbs && <span><strong>{meal.carbs}g</strong> carbs</span>}
                </div>
                <div className="preview-meal-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => acceptOne(meal)}>✓ Add to {meal.day}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedMeal(meal); }}>View recipe</button>
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
          const meal = week[day];
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
                    {meal.protein && <span className="macro"><strong>{meal.protein}g</strong> protein</span>}
                    {meal.carbs && <span className="macro"><strong>{meal.carbs}g</strong> carbs</span>}
                  </div>
                  <div className="meal-actions" style={{ marginTop: 12 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(meal)}>View recipe</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onFavorite(meal)}>♡ Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onClear(day)}>× Remove</button>
                  </div>
                </div>
              ) : (
                <div className="day-empty">
                  <div className="day-empty-icon">+</div>
                  <p>No meal planned</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    <button className="btn btn-ghost btn-sm" onClick={generateWeek} disabled={generating}>
                      {generating ? "…" : "AI suggest"}
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
