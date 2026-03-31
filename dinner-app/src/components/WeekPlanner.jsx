import { useState } from "react";
import "./WeekPlanner.css";

export default function WeekPlanner({ week, days, favorites, onAddMeal, onFavorite, onClear, onGoAI }) {
  const [dayPicker, setDayPicker] = useState(null); // which day is open for fav picker

  const filled = days.filter(d => week[d]).length;

  return (
    <div className="planner">
      <div className="planner-header">
        <div>
          <h1 className="section-title">This Week's Dinners</h1>
          <p className="section-sub">{filled} of {days.length} nights planned · weeknight meals for the family</p>
        </div>
        <div className="planner-actions">
          {filled < days.length && (
            <button className="btn btn-primary" onClick={onGoAI}>
              ✦ Get AI Suggestions
            </button>
          )}
          {filled > 0 && (
            <button className="btn btn-ghost" onClick={() => {
              if (confirm("Clear this week's plan?")) days.forEach(d => onClear(d));
            }}>
              Clear week
            </button>
          )}
        </div>
      </div>

      <div className="week-grid">
        {days.map(day => {
          const meal = week[day];
          return (
            <div key={day} className={`day-slot ${meal ? "filled" : "empty-slot"}`}>
              <div className="day-label">{day}</div>

              {meal ? (
                <div className="day-meal">
                  <div className="meal-name">{meal.name}</div>
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
                    <button className="btn btn-ghost btn-sm" onClick={() => onFavorite(meal)}>♡ Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onClear(day)}>× Remove</button>
                  </div>
                </div>
              ) : (
                <div className="day-empty">
                  <div className="day-empty-icon">+</div>
                  <p>No meal planned</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    <button className="btn btn-ghost btn-sm" onClick={onGoAI}>AI suggest</button>
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
                        }}>
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filled === days.length && (
        <div className="week-complete">
          <span>🎉</span>
          <div>
            <strong>Full week planned!</strong>
            <p>Your family dinners are all set. Check your grocery list below.</p>
          </div>
          <button className="btn btn-primary" onClick={() => {
            const items = days.flatMap(d => week[d]?.ingredients || []);
            const unique = [...new Set(items)];
            alert("🛒 Grocery List:\n\n" + unique.map(i => `• ${i}`).join("\n"));
          }}>
            🛒 Grocery List
          </button>
        </div>
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
