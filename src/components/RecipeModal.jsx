import { useState } from "react";
import StarRating from "./StarRating";
import "./RecipeModal.css";

export default function RecipeModal({ meal, onClose, onFavorite, onAddToWeek, days, week, favorites, rating, onRate, unsplashKey }) {
  const [activeVariation, setActiveVariation] = useState(null);
  const [photo, setPhoto]       = useState(meal._photo || null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  if (!meal) return null;

  const isFavorited  = favorites?.find(f => f.name === meal.name);
  const unplannedDays = days?.filter(d => !week?.[d]) || [];

  const generatePhoto = async () => {
    if (!unsplashKey) { setPhotoError("Add your Unsplash key in Settings."); return; }
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      // Build a clean search query from the meal name
      const query = encodeURIComponent(`${meal.name} food dish`);
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      );
      const data = await res.json();
      const url = data.results?.[0]?.urls?.regular;
      if (url) {
        setPhoto(url);
        meal._photo = url;
      } else {
        setPhotoError("No photo found for this meal.");
      }
    } catch {
      setPhotoError("Photo fetch failed. Check your Unsplash key.");
    }
    setPhotoLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        {/* PHOTO */}
        {photo ? (
          <div className="recipe-photo" style={{ backgroundImage: `url(${photo})` }} />
        ) : (
          <div className="recipe-photo-placeholder">
            {photoLoading ? (
              <div className="photo-loading"><span className="spinner-dark" /> Generating photo…</div>
            ) : (
              <button className="photo-generate-btn" onClick={generatePhoto} disabled={!unsplashKey}>
                📷 Generate photo
              </button>
            )}
            {photoError && <span className="photo-error">{photoError}</span>}
          </div>
        )}

        <div className="modal-header">
          <div className="modal-meta">
            {meal.tags?.map(t => <span key={t} className={`tag tag-${tagColor(t)}`}>{t}</span>)}
            {meal.cookTime && <span className="modal-time">⏱ {meal.cookTime}</span>}
          </div>
          <h2 className="modal-title">{meal.name}</h2>
          <p className="modal-desc">{meal.description}</p>

          {/* RATING */}
          <div className="modal-rating">
            <span className="modal-rating-label">Your rating:</span>
            <StarRating value={rating || 0} onChange={onRate} size="md" />
          </div>

          <div className="modal-macros">
            <div className="macro-box"><div className="macro-val">{meal.calories ?? "—"}</div><div className="macro-label">calories</div></div>
            <div className="macro-divider" />
            <div className="macro-box"><div className="macro-val">{meal.protein ?? "—"}<span>g</span></div><div className="macro-label">protein</div></div>
            <div className="macro-divider" />
            <div className="macro-box"><div className="macro-val">{meal.carbs ?? "—"}<span>g</span></div><div className="macro-label">carbs</div></div>
          </div>
        </div>

        {/* VARIATIONS */}
        {meal.variations?.length > 0 && (
          <div className="variations-bar">
            <div className="variations-label">🔀 Mix it up</div>
            <div className="variations-chips">
              {meal.variations.map((v, i) => (
                <button key={i} className={`variation-chip ${activeVariation === i ? "active" : ""}`} onClick={() => setActiveVariation(activeVariation === i ? null : i)}>
                  {v.label}
                </button>
              ))}
            </div>
            {activeVariation != null && meal.variations[activeVariation] && (
              <div className="variation-detail">
                <div className="variation-detail-label">{meal.variations[activeVariation].label}</div>
                <p className="variation-detail-text">{meal.variations[activeVariation].suggestion}</p>
                {onFavorite && (
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => {
                    const variantMeal = { ...meal, name: `${meal.name} (${meal.variations[activeVariation].label})`, description: meal.variations[activeVariation].suggestion };
                    onFavorite(variantMeal);
                  }}>♡ Save this variation</button>
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
                <li key={i} className="ingredient-item"><span className="ing-dot" />{ing}</li>
              ))}
            </ul>

            {/* SIDES */}
            {meal.sides?.length > 0 && (
              <div className="sides-section">
                <h3 className="col-title">Suggested Sides</h3>
                {meal.sides.map((side, i) => (
                  <div key={i} className="side-suggestion">
                    <div className="side-suggestion-name">{side.name} {side.calories && <span className="side-cal-badge">{side.calories} cal</span>}</div>
                    <p className="side-suggestion-desc">{side.description}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              {onFavorite && (
                <button className={`btn ${isFavorited ? "btn-ghost saved" : "btn-ghost"}`} onClick={() => onFavorite(meal)}>
                  {isFavorited ? "♥ Saved" : "♡ Save meal"}
                </button>
              )}
            </div>

            {onAddToWeek && unplannedDays.length > 0 && (
              <div className="add-to-week">
                <div className="add-label">Add to week:</div>
                <div className="day-chips">
                  {unplannedDays.map(d => (
                    <button key={d} className="day-chip" onClick={() => { onAddToWeek(meal, d); onClose(); }}>{d}</button>
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
                      <div className="step-title">{s.title}{s.time && <span className="step-time">{s.time}</span>}</div>
                      <p className="step-instruction">{s.instruction}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className="no-steps">Steps will appear for AI-generated meals.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function tagColor(tag) {
  if (["Low Carb", "Low-Carb", "Keto", "High Protein"].includes(tag)) return "green";
  if (["Quick", "30 min", "Easy"].includes(tag)) return "orange";
  return "yellow";
}
