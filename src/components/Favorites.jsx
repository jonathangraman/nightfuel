import { useState } from "react";
import "./Favorites.css";

export default function Favorites({ favorites, days, onRemove, onAddToWeek }) {
  const [addTarget, setAddTarget] = useState(null);

  if (favorites.length === 0) {
    return (
      <div>
        <h1 className="section-title">Saved Meals</h1>
        <p className="section-sub">Your favorite dinners, ready to re-use</p>
        <div className="empty">
          <div className="empty-icon">♡</div>
          <h3>Nothing saved yet</h3>
          <p>Head to AI Chef and save meals you love — they'll show up here.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title">Saved Meals</h1>
      <p className="section-sub">{favorites.length} saved · tap a meal to add it to your week</p>
      <div className="favs-grid">
        {favorites.map((meal, i) => (
          <div key={i} className="meal-card fav-card">
            <div className="fav-top">
              <div className="meal-name">{meal.name}</div>
              <button className="fav-remove" onClick={() => onRemove(meal.name)} title="Remove">×</button>
            </div>
            <div className="meal-meta">
              {meal.tags?.map(t => <span key={t} className={`tag tag-${tagColor(t)}`}>{t}</span>)}
            </div>
            <p className="meal-desc">{meal.description}</p>
            <div className="meal-macros-row">
              {meal.calories && <span><strong>{meal.calories}</strong> cal</span>}
              {meal.protein && <span><strong>{meal.protein}g</strong> protein</span>}
              {meal.carbs && <span><strong>{meal.carbs}g</strong> carbs</span>}
              {meal.cookTime && <span>⏱ {meal.cookTime}</span>}
            </div>
            {meal.ingredients?.length > 0 && (
              <div className="ingredients">
                <div className="ingredients-label">Ingredients</div>
                <div className="ingredient-tags">
                  {meal.ingredients.map(ing => (
                    <span key={ing} className="ing-tag">{ing}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="meal-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setAddTarget(addTarget === i ? null : i)}>
                + Add to week
              </button>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", borderColor: "var(--red)" }} onClick={() => onRemove(meal.name)}>
                Remove
              </button>
            </div>
            {addTarget === i && (
              <div className="day-picker-fav">
                <span className="day-pick-label">Which day?</span>
                {days.map(d => (
                  <button key={d} className="day-chip-fav" onClick={() => {
                    onAddToWeek(meal, d);
                    setAddTarget(null);
                  }}>{d}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function tagColor(tag) {
  if (["Low Carb", "Low-Carb", "Keto", "High Protein", "Protein-Packed"].includes(tag)) return "green";
  if (["Quick", "30 min", "Easy"].includes(tag)) return "orange";
  return "yellow";
}
