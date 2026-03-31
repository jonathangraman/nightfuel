import { useState } from "react";
import { PROTEINS } from "../data/proteins";
import "./SauceModal.css";

export default function SauceModal({ sauce, onClose, onSelectInBuilder }) {
  const [activeVariation, setActiveVariation] = useState(null);

  if (!sauce) return null;

  const pairedProteins = PROTEINS.filter(p => sauce.pairsBestWith?.includes(p.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sauce-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <div className="sauce-modal-top">
            <span className="sauce-modal-emoji">{sauce.emoji}</span>
            <div>
              <div className="sauce-modal-cuisine">{sauce.cuisine}</div>
              <h2 className="modal-title" style={{ marginBottom: 4 }}>{sauce.name}</h2>
            </div>
          </div>
          <p className="modal-desc">{sauce.description}</p>

          <div className="modal-macros">
            <div className="macro-box">
              <div className="macro-val">{sauce.calories}</div>
              <div className="macro-label">calories</div>
            </div>
            <div className="macro-divider" />
            <div className="macro-box">
              <div className="macro-val">{sauce.protein}<span>g</span></div>
              <div className="macro-label">protein</div>
            </div>
            <div className="macro-divider" />
            <div className="macro-box">
              <div className="macro-val">{sauce.carbs}<span>g</span></div>
              <div className="macro-label">carbs</div>
            </div>
            <div className="macro-divider" />
            <div className="macro-box">
              <div className="macro-val" style={{ fontSize: 14, color: "var(--text-muted)" }}>{sauce.servingNote}</div>
              <div className="macro-label">serving</div>
            </div>
          </div>
        </div>

        {/* VARIATIONS */}
        {sauce.variations?.length > 0 && (
          <div className="variations-bar">
            <div className="variations-label">🔀 Mix it up</div>
            <div className="variations-chips">
              {sauce.variations.map((v, i) => (
                <button
                  key={i}
                  className={`variation-chip ${activeVariation === i ? "active" : ""}`}
                  onClick={() => setActiveVariation(activeVariation === i ? null : i)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {activeVariation != null && (
              <div className="variation-detail">
                <div className="variation-detail-label">{sauce.variations[activeVariation].label}</div>
                <p className="variation-detail-text">{sauce.variations[activeVariation].suggestion}</p>
              </div>
            )}
          </div>
        )}

        <div className="modal-body">
          <div className="modal-col">
            <h3 className="col-title">Ingredients</h3>
            <ul className="ingredient-list">
              {sauce.ingredients?.map((ing, i) => (
                <li key={i} className="ingredient-item">
                  <span className="ing-dot" />
                  {ing}
                </li>
              ))}
            </ul>

            <h3 className="col-title" style={{ marginTop: 20 }}>Pairs best with</h3>
            <div className="pairs-list">
              {pairedProteins.map(p => (
                <span key={p.id} className="pair-item">{p.emoji} {p.name}</span>
              ))}
            </div>

            {onSelectInBuilder && (
              <button className="btn btn-primary" style={{ marginTop: 20, width: "100%" }} onClick={onSelectInBuilder}>
                Use in Meal Builder →
              </button>
            )}
          </div>

          <div className="modal-col">
            <h3 className="col-title">How to make it</h3>
            <ol className="steps-list">
              {sauce.steps?.map((s, i) => (
                <li key={i} className="step-item">
                  <div className="step-num">{s.step || i + 1}</div>
                  <div className="step-body">
                    <div className="step-title">{s.title}</div>
                    <p className="step-instruction">{s.instruction}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
