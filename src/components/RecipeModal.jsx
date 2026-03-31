import { useState } from "react";
import "./RecipeModal.css";

const VARIATION_ICONS = {
  "Swap the protein": "🥩",
  "Change the sauce": "🫙",
  "Swap the vegetable": "🥦",
};

export default function RecipeModal({ meal, onClose, onFavorite, onAddToWeek, days, week, favorites }) {
  const [activeVariation, setActiveVariation] = useState(null);

  if (!meal) return null;

  const isFavorited = favorites?.find(f => f.name === meal.name);
  const unplannedDays = days?.filter(d => !week?.[d]) || [];

  // Build a display version of the meal with the active variation applied
  const displayMeal = activeVariation != null && meal.variations?.[activeVariation]
    ? { ...meal, _variationNote: meal.variations[activeVariation] }
    : meal;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <div className="modal-meta">
            {meal.tags?.map(t => (
              <span key={t} className={`tag tag-${tagColor(t)}`}>{t}</span>
            ))}
            {meal.cookTime && <span className="modal-time">⏱ {meal.cookTime}</span>}
          </div>
          <h2 className="modal-title">{meal.name}</h2>
          <p className="modal-desc">{meal.description}</p>

          <div className="modal-macros">
            <div className="macro-box">
              <div className="macro-val">{meal.calories ?? "—"}</div>
              <div className="macro-label">calories</div>
            </div>
            <div className="macro-divider" />
            <div className="macro-box">
              <div className="macro-val">{meal.protein ?? "—"}<span>g</span></div>
              <div className="macro-label">protein</div>
            </div>
            <div className="macro-divider" />
            <div className="macro-box">
              <div className="macro-val">{meal.carbs ?? "—"}<span>g</span></div>
              <div className="macro-label">carbs</div>
            </div>
          </div>
        </div>

        {/* VARIATIONS BAR */}
        {meal.variations?.length > 0 && (
          <div className="variations-bar">
            <div className="variations-label">🔀 Mix it up</div>
            <div className="variations-chips">
              {meal.variations.map((v, i) => (
                <button
                  key={i}
                  className={`variation-chip ${activeVariation === i ? "active" : ""}`}
                  onClick={() => setActiveVariation(activeVariation === i ? null : i)}
                >
                  <span>{VARIATION_ICONS[v.label] || "✦"}</span>
                  {v.label}
                </button>
              ))}
            </div>
            {activeVariation != null && meal.variations[activeVariation] && (
              <div className="variation-detail">
                <div className="variation-detail-label">{meal.variations[activeVariation].label}</div>
                <p className="variation-detail-text">{meal.variations[activeVariation].suggestion}</p>
                {onFavorite && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      const variantMeal = {
                        ...meal,
                        name: `${meal.name} (${meal.variations[activeVariation].label})`,
                        description: meal.variations[activeVariation].suggestion,
                      };
                      onFavorite(variantMeal);
                    }}
                  >
                    ♡ Save this variation
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="modal-body">
          <div className="modal-col">
            <h3 className="col-title">Ingredients</h3>
            <ul className="ingredient-list">
              {meal.ingredients?.map((ing, i) => (
                <li key={i} className="ingredient-item">
                  <span className="ing-dot" />
                  {ing}
                </li>
              ))}
            </ul>

            <div className="modal-actions">
              {onFavorite && (
                <button
                  className={`btn ${isFavorited ? "btn-ghost saved" : "btn-ghost"}`}
                  onClick={() => onFavorite(meal)}
                >
                  {isFavorited ? "♥ Saved" : "♡ Save meal"}
                </button>
              )}
            </div>

            {onAddToWeek && unplannedDays.length > 0 && (
              <div className="add-to-week">
                <div className="add-label">Add to week:</div>
                <div className="day-chips">
                  {unplannedDays.map(d => (
                    <button key={d} className="day-chip" onClick={() => { onAddToWeek(meal, d); onClose(); }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-col">
            <h3 className="col-title">How to make it</h3>
            {meal.steps?.length > 0 ? (
              <ol className="steps-list">
                {meal.steps.map((s, i) => (
                  <li key={i} className="step-item">
                    <div className="step-num">{s.step || i + 1}</div>
                    <div className="step-body">
                      <div className="step-title">
                        {s.title}
                        {s.time && <span className="step-time">{s.time}</span>}
                      </div>
                      <p className="step-instruction">{s.instruction}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="no-steps">Steps will appear here for AI-generated meals.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function tagColor(tag) {
  if (["Low Carb", "Low-Carb", "Keto", "High Protein", "Protein-Packed"].includes(tag)) return "green";
  if (["Quick", "30 min", "Easy", "Under 30"].includes(tag)) return "orange";
  return "yellow";
}
