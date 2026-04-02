import { useState, useMemo } from "react";
import { SALAD_BASES, SALAD_TOPPING_GROUPS, SALAD_DRESSINGS } from "../data/salad";
import { SAUCES } from "../data/sauces";
import SauceModal from "./SauceModal";
import "./SaladBuilder.css";

const MONTH = new Date().getMonth() + 1;
const MONTH_NAME = new Date().toLocaleString("default", { month: "long" });

function isInSeason(item) {
  return item.season?.includes(MONTH);
}

export default function SaladBuilder({ days, week, onAddToWeek }) {
  const [base, setBase]             = useState(null);
  const [toppings, setToppings]     = useState([]);
  const [dressing, setDressing]     = useState(null);
  const [addDay, setAddDay]         = useState(null);
  const [addedToDay, setAddedToDay] = useState(null);
  const [showAll, setShowAll]       = useState({});
  const [viewingSauce, setViewingSauce] = useState(null);

  const toggleTopping = (t) => {
    setToppings(prev =>
      prev.find(p => p.id === t.id)
        ? prev.filter(p => p.id !== t.id)
        : prev.length < 6 ? [...prev, t] : prev
    );
  };

  const totals = useMemo(() => ({
    calories: (base?.calories || 0) + toppings.reduce((s, t) => s + t.calories, 0) + (dressing?.calories || 0),
    protein:  (base?.protein  || 0) + toppings.reduce((s, t) => s + t.protein,  0),
    carbs:    (base?.carbs    || 0) + toppings.reduce((s, t) => s + t.carbs,     0),
  }), [base, toppings, dressing]);

  const isComplete = base && dressing;

  const logSalad = (day) => {
    const name = `${base.name} Salad with ${dressing.name}`;
    const ingredients = [
      `${base.name.toLowerCase()} (2 cups)`,
      ...toppings.map(t => t.name.toLowerCase()),
      `${dressing.name.toLowerCase()} dressing`,
    ];
    const meal = {
      name,
      description: `${base.name} salad${toppings.length ? ` topped with ${toppings.slice(0,3).map(t=>t.name.toLowerCase()).join(", ")}${toppings.length > 3 ? " and more" : ""}` : ""}, dressed with ${dressing.name.toLowerCase()}.`,
      tags: ["Salad", "Light", toppings.some(t => ["crispy-prosciutto","bacon-bits","hard-boiled-egg"].includes(t.id)) ? "High Protein" : "Low Cal"].filter(Boolean),
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      cookTime: "10 min",
      ingredients,
      steps: [
        { step: 1, title: "Prep base", instruction: `Wash and dry ${base.name.toLowerCase()}. Add to a large bowl.` },
        { step: 2, title: "Add toppings", instruction: toppings.length ? `Layer on ${toppings.map(t=>t.name.toLowerCase()).join(", ")}.` : "Add your chosen toppings." },
        { step: 3, title: "Dress and serve", instruction: `Drizzle with ${dressing.name.toLowerCase()} dressing. Toss gently and serve immediately.` },
      ],
      variations: [
        { label: "Add a protein", suggestion: "Top with grilled chicken breast, seared salmon, or shrimp to make it a full meal." },
        { label: "Swap the dressing", suggestion: "Try a different dressing — the whole salad character changes with the sauce." },
        { label: "Bulk it up", suggestion: "Add couscous or wild rice to turn it into a grain bowl." },
      ],
      _salad: true,
    };
    onAddToWeek(meal, day);
    setAddDay(null);
    setAddedToDay(day);
    setTimeout(() => setAddedToDay(null), 3000);
    setBase(null); setToppings([]); setDressing(null);
  };

  const inSeasonCount = SALAD_TOPPING_GROUPS.flatMap(g => g.toppings).filter(isInSeason).length;

  return (
    <>
      <div className="salad-builder">
        <div className="salad-header">
          <h2 className="section-title">🥗 Salad Builder</h2>
          <p className="section-sub">{inSeasonCount} toppings in season for {MONTH_NAME} · pick a base, up to 6 toppings, and a dressing</p>
        </div>

        <div className="salad-layout">
          <div className="salad-steps">

            {/* BASE */}
            <div className="builder-step">
              <div className="step-header">
                <span className="step-num-badge">1</span>
                <div><div className="step-title">Choose a Base</div><div className="step-sub">2 cup serving</div></div>
              </div>
              <div className="base-grid">
                {SALAD_BASES.map(b => (
                  <button key={b.id} className={`base-card ${base?.id === b.id ? "selected" : ""}`} onClick={() => setBase(base?.id === b.id ? null : b)}>
                    <span>{b.emoji}</span>
                    <div className="base-name">{b.name}</div>
                    <div className="base-cal">{b.calories} cal</div>
                  </button>
                ))}
              </div>
            </div>

            {/* TOPPINGS */}
            <div className="builder-step">
              <div className="step-header">
                <span className="step-num-badge">2</span>
                <div>
                  <div className="step-title">Add Toppings <span className="optional-badge">up to 6</span></div>
                  <div className="step-sub">{toppings.length}/6 selected · green border = in season now</div>
                </div>
              </div>
              {SALAD_TOPPING_GROUPS.map(group => {
                const inSeason   = group.toppings.filter(isInSeason);
                const others     = group.toppings.filter(t => !isInSeason(t));
                const isExpanded = showAll[group.label];
                const displayed  = isExpanded ? group.toppings : [...inSeason, ...others.slice(0, Math.max(0, 5 - inSeason.length))];
                return (
                  <div key={group.label} className="topping-group">
                    <div className="topping-group-label">{group.label}</div>
                    <div className="topping-grid">
                      {displayed.map(t => {
                        const sel      = !!toppings.find(p => p.id === t.id);
                        const maxed    = toppings.length >= 6 && !sel;
                        const seasonal = isInSeason(t);
                        return (
                          <button key={t.id} className={`topping-card ${sel ? "selected" : ""} ${seasonal ? "in-season" : ""} ${maxed ? "maxed" : ""}`} onClick={() => !maxed && toggleTopping(t)} disabled={maxed}>
                            {seasonal && <span className="season-badge">Now</span>}
                            <span className="topping-emoji">{t.emoji}</span>
                            <div className="topping-name">{t.name}</div>
                            <div className="topping-cal">{t.calories} cal</div>
                          </button>
                        );
                      })}
                    </div>
                    {!isExpanded && group.toppings.length > displayed.length && (
                      <button className="show-more-btn" onClick={() => setShowAll(s => ({ ...s, [group.label]: true }))}>
                        + {group.toppings.length - displayed.length} more
                      </button>
                    )}
                    {isExpanded && (
                      <button className="show-more-btn" onClick={() => setShowAll(s => ({ ...s, [group.label]: false }))}>Show less</button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DRESSING */}
            <div className="builder-step">
              <div className="step-header">
                <span className="step-num-badge">3</span>
                <div><div className="step-title">Pick a Dressing</div><div className="step-sub">Green border = in season · tap "Recipe" to see full instructions</div></div>
              </div>
              <div className="dressing-grid">
                {SALAD_DRESSINGS.map(d => {
                  const sauceData = SAUCES.find(s => s.id === d.id);
                  return (
                    <div key={d.id} className={`dressing-card ${dressing?.id === d.id ? "selected" : ""} ${d.season?.includes(MONTH) ? "in-season" : ""}`} onClick={() => setDressing(dressing?.id === d.id ? null : d)}>
                      {d.season?.includes(MONTH) && <span className="season-badge">Now</span>}
                      <span className="dressing-emoji">{d.emoji}</span>
                      <div className="dressing-name">{d.name}</div>
                      <div className="dressing-cal">{d.calories} cal</div>
                      {sauceData && (
                        <button className="dressing-recipe-btn" onClick={e => { e.stopPropagation(); setViewingSauce(sauceData); }}>
                          Recipe →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* SUMMARY */}
          <div className="builder-summary">
            <div className="summary-card">
              <div className="summary-title">Your Salad</div>

              {!base && !dressing && <p className="summary-empty">Pick a base and dressing to start.</p>}

              {base && (
                <div className="summary-row">
                  <span className="summary-emoji">{base.emoji}</span>
                  <div><div className="summary-item-name">{base.name}</div><div className="summary-item-sub">2 cups · {base.calories} cal</div></div>
                  <button className="summary-remove" onClick={() => setBase(null)}>×</button>
                </div>
              )}

              {toppings.length > 0 && (
                <div className="summary-toppings">
                  <div className="summary-toppings-label">Toppings ({toppings.length}/6)</div>
                  {toppings.map(t => (
                    <div key={t.id} className="summary-topping-row">
                      <span>{t.emoji} {t.name}</span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className="topping-cal-small">{t.calories} cal</span>
                        <button className="summary-remove" style={{ fontSize: 14 }} onClick={() => toggleTopping(t)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {dressing && (
                <div className="summary-row">
                  <span className="summary-emoji">{dressing.emoji}</span>
                  <div><div className="summary-item-name">{dressing.name}</div><div className="summary-item-sub">{dressing.calories} cal</div></div>
                  <button className="summary-remove" onClick={() => setDressing(null)}>×</button>
                </div>
              )}

              {(base || dressing) && (
                <>
                  <div className="summary-divider" />
                  <div className="summary-totals">
                    <div className="total-row"><span>Calories</span><strong className={totals.calories > 500 ? "over" : "good"}>{totals.calories}</strong></div>
                    <div className="total-row"><span>Protein</span><strong>{totals.protein}g</strong></div>
                    <div className="total-row"><span>Carbs</span><strong>{totals.carbs}g</strong></div>
                  </div>
                  <div className="macro-bars">
                    <div className="mbar-label"><span>Calories</span><span>{totals.calories} / 500</span></div>
                    <div className="mbar-track"><div className={`mbar-fill ${totals.calories > 500 ? "over" : ""}`} style={{ width: `${Math.min(100, (totals.calories / 500) * 100)}%` }} /></div>
                  </div>
                </>
              )}

              {isComplete && (
                <div className="summary-actions">
                  {addedToDay ? (
                    <div className="added-success"><span>✓</span> Added to {addedToDay}!<p className="added-hint">Ingredients in your grocery list.</p></div>
                  ) : addDay === "picking" ? (
                    <div className="day-pick-area">
                      <div className="day-pick-label">Add to which day?</div>
                      <div className="day-pick-chips">
                        {days.map(d => (
                          <button key={d} className={`day-chip-builder ${week[d] ? "day-chip-replace" : ""}`} onClick={() => logSalad(d)}>
                            {d}{week[d] && <span className="replace-indicator"> ↺</span>}
                          </button>
                        ))}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setAddDay(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setAddDay("picking")}>+ Add to week</button>
                  )}
                  {!addedToDay && (
                    <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8 }} onClick={() => { setBase(null); setToppings([]); setDressing(null); }}>Reset</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SAUCE RECIPE MODAL */}
      {viewingSauce && (
        <SauceModal
          sauce={viewingSauce}
          onClose={() => setViewingSauce(null)}
          onSelectInBuilder={() => {
            setDressing(SALAD_DRESSINGS.find(d => d.id === viewingSauce.id) || null);
            setViewingSauce(null);
          }}
        />
      )}
    </>
  );
}
