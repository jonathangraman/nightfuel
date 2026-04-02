import { useState } from "react";
import RecipeModal from "./RecipeModal";
import StarRating from "./StarRating";
import { getCurrentSeason } from "../data/seasons";
import "./WeekendPlanner.css";

const WEEKEND_DAYS = ["Saturday", "Sunday"];

const COOK_STYLES = [
  { id: "grill",     label: "🔥 Grilled",         desc: "High heat, char, smokiness" },
  { id: "low-slow",  label: "🍖 Low & Slow BBQ",   desc: "Ribs, brisket, pulled pork — hours of patience" },
  { id: "inside",    label: "🍳 Inside Cooking",    desc: "Oven roasts, braises, stovetop" },
  { id: "any",       label: "✦ Surprise me",        desc: "Any method, most ambitious option" },
];

function buildSystemPrompt(cookStyles) {
  const styleNote = cookStyles.length && !cookStyles.includes("any")
    ? `\nCOOKING METHOD PREFERENCE: Focus on ${cookStyles.map(s => COOK_STYLES.find(c => c.id === s)?.label).join(" and ")} techniques.`
    : "";

  return `You are NightFuel, a family dinner assistant. Suggest weekend dinners — these are NOT quick weeknight meals. Weekend cooking is an experience.

FAMILY PREFERENCES:
- Proteins they regularly buy: lean ground beef (90/10), ground turkey, ground chicken, chicken breast, skinless chicken thighs, chicken sausage, salmon fillets, tuna steaks, pork loin, pork chops, flank steak, shrimp
- They enjoy American, Greek, Italian, Mexican, Asian cuisines
- Weekend meals can be more ambitious, take longer, and use better/pricier ingredients
${styleNote}
WEEKEND MEAL SPIRIT:
- BBQ and grilled proteins are perfect — low-and-slow ribs, whole chicken, thick-cut steaks
- More elaborate preparations are welcome: marinades, brines, slow roasts, homemade sauces
- Higher quality proteins are appropriate: scallops, ribeye, lamb chops, whole fish, duck breast
- Cook time can be 1-3 hours — that's the point
- Still healthy but portions can be more generous, sides more indulgent
- Kid-friendly but can be a little more sophisticated
- SIDES MUST MATCH THE MEAL STYLE — this is critical:
  * Low & slow BBQ (ribs, brisket, pulled pork) → classic BBQ sides: coleslaw, baked beans, cornbread, mac and cheese, corn on the cob, pickles, potato salad
  * Grilled steaks/chops → steakhouse sides: loaded baked potato, creamed spinach, grilled asparagus, wedge salad, roasted mushrooms
  * Grilled fish/seafood → light sides: rice pilaf, grilled lemon asparagus, cucumber salad, mango salsa, coconut rice
  * Italian/Mediterranean → appropriate sides: garlic bread, caprese, roasted vegetables, pasta, antipasto
  * Mexican → rice, beans, street corn (elote), guacamole, pico de gallo
  * Asian → fried rice, steamed bao, cucumber salad, edamame, miso soup
  * Always suggest 2-3 sides that feel natural and traditional with the main dish

Respond ONLY with valid JSON (no markdown, no backticks).
Return EXACTLY 3 meal options per requested day — the user will pick their favorite.
Format:
{
  "days": [
    {
      "day": "Saturday",
      "options": [
        {
          "name": "Meal Name",
          "description": "1-2 sentences — make it sound special",
          "tags": ["BBQ", "Weekend Special", "Grill"],
          "calories": 520,
          "protein": 42,
          "carbs": 15,
          "cookTime": "1.5 hrs",
          "ingredients": ["ribeye steak", "rosemary", "garlic", "butter", "thyme"],
          "sides": [
            { "name": "Grilled Corn", "description": "Brush with herb butter and grill 10 min.", "calories": 110 },
            { "name": "Wedge Salad", "description": "Iceberg, bacon, blue cheese dressing.", "calories": 120 }
          ],
          "riff": {
            "name": "The Riff: Korean BBQ Ribs",
            "twist": "Same low-and-slow ribs but swap the dry rub for a gochujang-soy glaze. Serve with kimchi slaw instead of regular coleslaw — napa cabbage, gochugaru, sesame oil, rice vinegar. Finish with pickled daikon and scallions. All the BBQ patience, completely different flavor world."
          },
          "steps": [
            { "step": 1, "title": "Season", "instruction": "Season generously and rest 30 min.", "time": "30 min" },
            { "step": 2, "title": "Cook", "instruction": "Grill or roast per method.", "time": "varies" },
            { "step": 3, "title": "Rest", "instruction": "Rest before serving.", "time": "10 min" }
          ],
          "variations": [
            { "label": "Upgrade the protein", "suggestion": "Use a tomahawk ribeye for a showstopper presentation." },
            { "label": "Change the sauce", "suggestion": "Serve with chimichurri instead — bright and herby." },
            { "label": "Low and slow option", "suggestion": "Reverse sear: 250°F for 45 min then sear 2 min per side." }
          ]
        }
      ]
    }
  ]
}`;
}

async function callAI(systemPrompt, userMessage) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || `HTTP ${res.status}`);
  const raw = data.content?.[0]?.text || "";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export default function WeekendPlanner({ weekend, onAddMeal, onFavorite, onClear, onNeedKey, mealHistory, ratings, onRate, unsplashKey, notes, onNote }) {
  const [selectedMeal, setSelectedMeal]   = useState(null);
  const [generating, setGenerating]       = useState(false);
  const [generatingDay, setGeneratingDay] = useState(null);
  const [error, setError]                 = useState(null);
  const [toast, setToast]                 = useState(null);
  const [editingNote, setEditingNote]     = useState(null);
  const [noteText, setNoteText]           = useState("");
  const [pendingDays, setPendingDays]     = useState(null); // { day, options: [] }[]
  const [cookStyles, setCookStyles]       = useState(["any"]);
  const season = getCurrentSeason();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const toggleStyle = (id) => {
    if (id === "any") {
      setCookStyles(["any"]);
      return;
    }
    setCookStyles(prev => {
      const without = prev.filter(s => s !== "any");
      return without.includes(id)
        ? without.filter(s => s !== id) || ["any"]
        : [...without, id];
    });
  };

  const buildMsg = (days) => {
    const recent = (mealHistory || []).map(m => m.name).join(", ");
    const existing = WEEKEND_DAYS.filter(d => weekend[d]).map(d => `${d}: ${weekend[d].name}`).join(", ");
    return [
      `Plan weekend dinners for: ${days.join(", ")}.`,
      recent   ? `Recent meals to AVOID: ${recent}.` : "",
      existing ? `Already planned this weekend (avoid repeating): ${existing}.` : "",
      season.note,
      `Give 3 distinct meal options per day — different proteins, different cuisines, different cook methods. Make them genuinely different from each other.`,
    ].filter(Boolean).join("\n");
  };

  const generateWeekend = async () => {
    setGenerating(true);
    setError(null);
    setPendingDays(null);
    try {
      const daysToFill = WEEKEND_DAYS.filter(d => !weekend[d]);
      const days = daysToFill.length ? daysToFill : WEEKEND_DAYS;
      const parsed = await callAI(buildSystemPrompt(cookStyles), buildMsg(days));
      if (parsed?.days?.length > 0) setPendingDays(parsed.days);
      else setError("Couldn't parse suggestions. Try again.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
    setGenerating(false);
  };

  const generateForDay = async (day) => {
    setGeneratingDay(day);
    try {
      const parsed = await callAI(
        buildSystemPrompt(cookStyles),
        buildMsg([day]) + `\nReturn options for "${day}" only.`
      );
      const dayData = parsed?.days?.find(d => d.day === day) || parsed?.days?.[0];
      if (dayData?.options?.length > 0) {
        setPendingDays(prev => {
          const existing = prev?.filter(d => d.day !== day) || [];
          return [...existing, dayData];
        });
      } else {
        showToast("Couldn't get suggestions. Try again.");
      }
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
          <p className="section-sub">More time, better ingredients, no rules — Saturday & Sunday cooking · {season.month}</p>
        </div>
        <div className="planner-actions">
          <button className="btn btn-primary" onClick={generateWeekend} disabled={generating || !!generatingDay}>
            {generating ? <><span className="spinner" /> Planning…</> : "✦ AI Weekend Ideas"}
          </button>
        </div>
      </div>

      {/* COOKING STYLE PICKER */}
      <div className="cook-style-bar">
        <span className="cook-style-label">Cooking style:</span>
        {COOK_STYLES.map(s => (
          <button
            key={s.id}
            className={`cook-style-chip ${cookStyles.includes(s.id) ? "active" : ""}`}
            onClick={() => toggleStyle(s.id)}
            title={s.desc}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <div className="planner-error">⚠ {error}</div>}

      {/* PENDING OPTIONS — 3 per day */}
      {pendingDays?.length > 0 && (
        <div className="weekend-options-section">
          {pendingDays.map(dayData => (
            <div key={dayData.day} className="weekend-options-group">
              <div className="weekend-options-header">
                <span className="weekend-options-day">{dayData.day} — Pick one</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPendingDays(prev => prev.filter(d => d.day !== dayData.day))}>
                  Dismiss
                </button>
              </div>
              <div className="weekend-options-grid">
                {(dayData.options || []).map((meal, i) => (
                  <div key={i} className="weekend-option-card">
                    <div className="woc-header">
                      <div className="woc-name">{meal.name}</div>
                      <span className="woc-time">⏱ {meal.cookTime}</span>
                    </div>
                    <div className="woc-tags">
                      {meal.tags?.map(t => <span key={t} className={`tag tag-${tagColor(t)}`}>{t}</span>)}
                    </div>
                    <p className="woc-desc">{meal.description}</p>
                    <div className="woc-macros">
                      {meal.calories && <span><strong>{meal.calories}</strong> cal</span>}
                      {meal.protein  && <span><strong>{meal.protein}g</strong> protein</span>}
                    </div>
                    {meal.sides?.length > 0 && (
                      <div className="woc-sides">
                        {meal.sides.map(s => <span key={s.name} className="woc-side-chip">{s.name}</span>)}
                      </div>
                    )}
                    {meal.riff && (
                      <div className="woc-riff">
                        <div className="woc-riff-label">🔀 {meal.riff.name}</div>
                        <p className="woc-riff-text">{meal.riff.twist}</p>
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => {
                          const riffMeal = {
                            ...meal,
                            day: dayData.day,
                            name: meal.riff.name.replace("The Riff: ", ""),
                            description: meal.riff.twist,
                            tags: [...(meal.tags || []), "Riff"],
                            _riff: true,
                          };
                          onAddMeal(riffMeal, dayData.day);
                          setPendingDays(prev => prev.filter(d => d.day !== dayData.day));
                        }}>✓ Use the riff instead</button>
                      </div>
                    )}
                    <div className="woc-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        onAddMeal({ ...meal, day: dayData.day }, dayData.day);
                        setPendingDays(prev => prev.filter(d => d.day !== dayData.day));
                      }}>✓ Choose this</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { onFavorite({ ...meal, day: dayData.day }); showToast(`"${meal.name}" saved`); }}>♡</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal({ ...meal, day: dayData.day })}>Recipe</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WEEKEND GRID */}
      <div className="weekend-grid">
        {WEEKEND_DAYS.map(day => {
          const meal      = weekend[day];
          const isLoading = generatingDay === day;
          const mealRating = meal ? (ratings?.[meal.name] || 0) : 0;
          const note = notes?.[day] || "";

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
                  {note ? (
                    <div className="meal-note" onClick={() => { setEditingNote(day); setNoteText(note); }}>📝 {note}</div>
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
              ) : (
                <div className="day-empty">
                  {isLoading ? (
                    <div className="day-loading"><span className="spinner-dark" /><span>Finding ideas…</span></div>
                  ) : (
                    <>
                      <div className="day-empty-icon">+</div>
                      <p>No meal planned</p>
                      <button className="btn btn-ghost btn-sm" onClick={() => generateForDay(day)} disabled={!!generatingDay || generating}>
                        ✦ Get 3 ideas
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
              <textarea className="note-textarea" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="e.g. kids loved this, add more garlic next time…" rows={4} autoFocus />
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
  if (["BBQ", "Grill", "Weekend Special", "Low & Slow"].includes(tag)) return "orange";
  return "yellow";
}
