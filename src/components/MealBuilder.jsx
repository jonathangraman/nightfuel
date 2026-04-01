import { useState } from "react";
import { PROTEINS } from "../data/proteins";
import { SAUCES, SAUCE_CUISINES } from "../data/sauces";
import SauceModal from "./SauceModal";
import SaladBuilder from "./SaladBuilder";
import "./MealBuilder.css";

const CURRENT_MONTH = new Date().getMonth() + 1;

// Grouped for display
export const SIDE_GROUPS = [
  {
    label: "🥦 Vegetables",
    sides: [
      { id: "roasted-broccoli",    name: "Roasted Broccoli",        calories: 55,  protein: 4, carbs: 10, emoji: "🥦" },
      { id: "roasted-asparagus",   name: "Roasted Asparagus",       calories: 40,  protein: 4, carbs: 7,  emoji: "🌿" },
      { id: "sauteed-zucchini",    name: "Sautéed Zucchini",        calories: 35,  protein: 2, carbs: 6,  emoji: "🥒" },
      { id: "green-beans",         name: "Garlic Green Beans",       calories: 44,  protein: 2, carbs: 10, emoji: "🫘" },
      { id: "roasted-cauliflower", name: "Roasted Cauliflower",     calories: 50,  protein: 4, carbs: 10, emoji: "🤍" },
      { id: "sauteed-spinach",     name: "Sautéed Spinach",         calories: 25,  protein: 3, carbs: 3,  emoji: "🌿" },
      { id: "roasted-brussels",    name: "Brussels Sprouts",        calories: 60,  protein: 4, carbs: 12, emoji: "🟢" },
      { id: "roasted-carrots",     name: "Roasted Carrots",         calories: 50,  protein: 1, carbs: 12, emoji: "🥕" },
      { id: "roasted-bell-pepper", name: "Roasted Bell Peppers",    calories: 40,  protein: 1, carbs: 9,  emoji: "🫑" },
      { id: "sauteed-mushrooms",   name: "Sautéed Mushrooms",       calories: 30,  protein: 3, carbs: 4,  emoji: "🍄" },
      { id: "wilted-kale",         name: "Wilted Kale",             calories: 35,  protein: 3, carbs: 5,  emoji: "🌿" },
      { id: "snap-peas",           name: "Snap Peas",               calories: 35,  protein: 2, carbs: 7,  emoji: "🫛" },
      { id: "roasted-sweet-corn",  name: "Roasted Corn",            calories: 80,  protein: 3, carbs: 17, emoji: "🌽" },
      { id: "cucumber-salad",      name: "Cucumber Salad",          calories: 25,  protein: 1, carbs: 5,  emoji: "🥒" },
      { id: "tomato-salad",        name: "Tomato Salad",            calories: 30,  protein: 1, carbs: 6,  emoji: "🍅" },
      { id: "greek-salad",         name: "Greek Salad",             calories: 80,  protein: 3, carbs: 8,  emoji: "🥗" },
      { id: "caprese",             name: "Caprese Salad",           calories: 90,  protein: 6, carbs: 4,  emoji: "🍅" },
      { id: "coleslaw",            name: "Light Coleslaw",          calories: 55,  protein: 1, carbs: 9,  emoji: "🥬" },
      { id: "mixed-salad",         name: "Side Salad",              calories: 30,  protein: 2, carbs: 5,  emoji: "🥗" },
    ],
  },
  {
    label: "🍓 Fruit Salads",
    sides: [
      { id: "strawberry-spinach",  name: "Strawberry Spinach Salad", calories: 75,  protein: 2, carbs: 10, emoji: "🍓", season: [3,4,5,6] },
      { id: "peach-arugula",       name: "Peach Arugula Salad",     calories: 80,  protein: 2, carbs: 12, emoji: "🍑", season: [7,8,9] },
      { id: "watermelon-feta",     name: "Watermelon Feta Mint",    calories: 85,  protein: 3, carbs: 14, emoji: "🍉", season: [6,7,8] },
      { id: "apple-walnut-spinach",name: "Apple Walnut Spinach",    calories: 110, protein: 3, carbs: 13, emoji: "🍎", season: [9,10,11,12] },
      { id: "pear-gorgonzola",     name: "Pear Gorgonzola Arugula", calories: 120, protein: 4, carbs: 11, emoji: "🍐", season: [9,10,11] },
      { id: "mango-avocado",       name: "Mango Avocado Salad",     calories: 130, protein: 2, carbs: 16, emoji: "🥭", season: [5,6,7,8] },
      { id: "blood-orange-fennel", name: "Blood Orange Fennel",     calories: 70,  protein: 1, carbs: 12, emoji: "🍊", season: [1,2,3,12] },
      { id: "pomegranate-spinach", name: "Pomegranate Spinach",     calories: 80,  protein: 3, carbs: 13, emoji: "🫐", season: [10,11,12,1] },
      { id: "citrus-arugula",      name: "Citrus Arugula",          calories: 60,  protein: 2, carbs: 8,  emoji: "🍋", season: [1,2,3,4] },
      { id: "grape-goat-cheese",   name: "Roasted Grape Goat Cheese",calories: 115, protein: 4, carbs: 12, emoji: "🍇", season: [8,9,10] },
    ],
  },
  {
    label: "🍠 Starches",
    sides: [
      { id: "sweet-potato",        name: "Sweet Potato",            calories: 103, protein: 2, carbs: 24, emoji: "🍠" },
      { id: "roasted-potato",      name: "Roasted Potatoes",        calories: 130, protein: 3, carbs: 28, emoji: "🥔" },
      { id: "mashed-potato",       name: "Mashed Potatoes",         calories: 150, protein: 3, carbs: 30, emoji: "🥔" },
      { id: "polenta",             name: "Polenta (½ cup)",         calories: 110, protein: 2, carbs: 23, emoji: "🌽" },
      { id: "pasta",               name: "Pasta (½ cup)",           calories: 110, protein: 4, carbs: 22, emoji: "🍝" },
      { id: "mashed-cauliflower",  name: "Mashed Cauliflower",      calories: 60,  protein: 4, carbs: 11, emoji: "🤍" },
    ],
  },
  {
    label: "🍚 Grains",
    sides: [
      { id: "brown-rice",          name: "Brown Rice (½ cup)",      calories: 110, protein: 3, carbs: 23, emoji: "🍚" },
      { id: "white-rice",          name: "Jasmine Rice (½ cup)",    calories: 100, protein: 2, carbs: 22, emoji: "🍚" },
      { id: "couscous",            name: "Couscous (½ cup)",        calories: 90,  protein: 3, carbs: 18, emoji: "🌾" },
      { id: "wild-rice",           name: "Wild Rice Blend (½ cup)", calories: 85,  protein: 3, carbs: 18, emoji: "🍚" },
    ],
  },
  {
    label: "🧀 Toppings",
    sides: [
      { id: "feta-crumbles",      name: "Feta Crumbles",         calories: 50,  protein: 3, carbs: 1,  emoji: "🧀" },
      { id: "parmesan",           name: "Shaved Parmesan",       calories: 40,  protein: 4, carbs: 0,  emoji: "🧀" },
      { id: "goat-cheese",        name: "Goat Cheese",           calories: 55,  protein: 3, carbs: 0,  emoji: "🧀" },
      { id: "blue-cheese",        name: "Blue Cheese Crumbles",  calories: 60,  protein: 4, carbs: 0,  emoji: "🧀" },
      { id: "toasted-almonds",    name: "Toasted Almonds",       calories: 55,  protein: 2, carbs: 2,  emoji: "🌰" },
      { id: "toasted-pine-nuts",  name: "Pine Nuts",             calories: 60,  protein: 1, carbs: 1,  emoji: "🌰" },
      { id: "candied-walnuts",    name: "Candied Walnuts",       calories: 70,  protein: 1, carbs: 5,  emoji: "🌰" },
      { id: "sliced-strawberries",name: "Sliced Strawberries",   calories: 20,  protein: 0, carbs: 5,  emoji: "🍓" },
      { id: "dried-cranberries",  name: "Dried Cranberries",     calories: 40,  protein: 0, carbs: 10, emoji: "🫐" },
      { id: "sliced-apple",       name: "Sliced Apple",          calories: 30,  protein: 0, carbs: 8,  emoji: "🍎" },
      { id: "mango-salsa",        name: "Mango Salsa",           calories: 35,  protein: 0, carbs: 9,  emoji: "🥭" },
      { id: "avocado-slices",     name: "Avocado Slices",        calories: 80,  protein: 1, carbs: 4,  emoji: "🥑" },
      { id: "crispy-onions",      name: "Crispy Onions",         calories: 45,  protein: 1, carbs: 5,  emoji: "🧅" },
      { id: "everything-bagel",   name: "Everything Bagel Spice",calories: 10,  protein: 0, carbs: 1,  emoji: "✨" },
      { id: "fresh-herbs",        name: "Fresh Herbs",           calories: 5,   protein: 0, carbs: 1,  emoji: "🌿" },
      { id: "lemon-zest",         name: "Lemon Zest & Juice",    calories: 5,   protein: 0, carbs: 1,  emoji: "🍋" },
      { id: "sesame-seeds",       name: "Sesame Seeds",          calories: 20,  protein: 1, carbs: 1,  emoji: "⚪" },
      { id: "pomegranate",        name: "Pomegranate Seeds",     calories: 25,  protein: 0, carbs: 6,  emoji: "💎" },
    ],
  },
  {
    label: "✕ No side",
    sides: [
      { id: "none", name: "No side", calories: 0, protein: 0, carbs: 0, emoji: "✕" },
    ],
  },
];

const SIDES = SIDE_GROUPS.flatMap(g => g.sides);

export default function MealBuilder({ days, week, onAddToWeek }) {
  const [view, setView] = useState("builder"); // "builder" | "salad" | "sauces"
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [selectedSauce, setSelectedSauce] = useState(null); // for modal
  const [builder, setBuilder] = useState({ protein: null, sauce: null, side: null });
  const [addDay, setAddDay] = useState(null);
  const [addedToDay, setAddedToDay] = useState(null);

  const unplannedDays = days.filter(d => !week[d]);

  // ── Nutrition totals ─────────────────────────────────
  const totals = {
    calories: (builder.protein?.calories || 0) + (builder.sauce?.calories || 0) + (builder.side?.calories || 0),
    protein:  (builder.protein?.protein  || 0) + (builder.sauce?.protein  || 0) + (builder.side?.protein  || 0),
    carbs:    (builder.protein?.carbs    || 0) + (builder.sauce?.carbs    || 0) + (builder.side?.carbs    || 0),
  };

  const isComplete = builder.protein && builder.sauce;

  const logMeal = (day) => {
    // Build a complete ingredients list from protein + sauce + side
    const proteinIngredient = `${builder.protein.name.toLowerCase()} (${builder.protein.servingSize})`;
    const sauceIngredients  = builder.sauce.ingredients || [];
    const sideIngredient    = builder.side && builder.side.id !== "none" ? [builder.side.name.toLowerCase()] : [];

    const meal = {
      name: `${builder.protein.name} with ${builder.sauce.name}${builder.side && builder.side.id !== "none" ? ` & ${builder.side.name}` : ""}`,
      description: `${builder.protein.cookMethods[0]} ${builder.protein.name.toLowerCase()} with ${builder.sauce.name.toLowerCase()} sauce${builder.side && builder.side.id !== "none" ? `, served with ${builder.side.name.toLowerCase()}` : ""}.`,
      tags: ["Custom", "High Protein", builder.sauce.cuisine].filter(Boolean),
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      cookTime: "30 min",
      ingredients: [proteinIngredient, ...sauceIngredients, ...sideIngredient],
      steps: builder.sauce.steps || [],
      variations: builder.sauce.variations || [],
      _custom: true,
    };
    onAddToWeek(meal, day);
    setAddDay(null);
    setBuilder({ protein: null, sauce: null, side: null });
    setAddedToDay(day);
    setTimeout(() => setAddedToDay(null), 3000);
  };

  const filteredSauces = cuisineFilter === "All"
    ? SAUCES
    : SAUCES.filter(s => s.cuisine === cuisineFilter);

  return (
    <div className="mealbuilder">
      {/* Tab switcher */}
      <div className="mb-tabs">
        <button className={`mb-tab ${view === "builder" ? "active" : ""}`} onClick={() => setView("builder")}>
          🍽 Meal Builder
        </button>
        <button className={`mb-tab ${view === "salad" ? "active" : ""}`} onClick={() => setView("salad")}>
          🥗 Salad Builder
        </button>
        <button className={`mb-tab ${view === "sauces" ? "active" : ""}`} onClick={() => setView("sauces")}>
          🫙 Sauce Library
        </button>
      </div>

      {/* ── MEAL BUILDER ────────────────────────────────── */}
      {view === "builder" && (
        <div className="builder-layout">
          <div className="builder-steps">

            {/* STEP 1: Protein */}
            <div className="builder-step">
              <div className="step-header">
                <span className="step-num-badge">1</span>
                <div>
                  <div className="step-title">Choose a Protein</div>
                  <div className="step-sub">6 oz serving · all macros shown per serving</div>
                </div>
              </div>
              <div className="protein-grid">
                {PROTEINS.map(p => (
                  <button
                    key={p.id}
                    className={`protein-card ${builder.protein?.id === p.id ? "selected" : ""}`}
                    onClick={() => setBuilder(b => ({ ...b, protein: builder.protein?.id === p.id ? null : p }))}
                  >
                    <span className="pc-emoji">{p.emoji}</span>
                    <div className="pc-name">{p.name}</div>
                    <div className="pc-macros">
                      <span>{p.calories} cal</span>
                      <span>{p.protein}g protein</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: Sauce */}
            <div className="builder-step">
              <div className="step-header">
                <span className="step-num-badge">2</span>
                <div>
                  <div className="step-title">Choose a Sauce</div>
                  <div className="step-sub">Tap a sauce to see the full recipe — highlighted = pairs great with your protein</div>
                </div>
              </div>
              <div className="sauce-grid">
                {SAUCES.map(s => {
                  const pairMatch = builder.protein && s.pairsBestWith?.includes(builder.protein.id);
                  return (
                    <button
                      key={s.id}
                      className={`sauce-card ${builder.sauce?.id === s.id ? "selected" : ""} ${pairMatch ? "pair-match" : ""}`}
                      onClick={() => setBuilder(b => ({ ...b, sauce: builder.sauce?.id === s.id ? null : s }))}
                    >
                      {pairMatch && <span className="pair-badge">✓ pairs well</span>}
                      <div className="sc-top">
                        <span className="sc-emoji">{s.emoji}</span>
                        <span className="sc-cuisine">{s.cuisine}</span>
                      </div>
                      <div className="sc-name">{s.name}</div>
                      <div className="sc-desc">{s.description}</div>
                      <div className="sc-macros">
                        <span>{s.calories} cal</span>
                        <span>{s.carbs}g carbs</span>
                        <span className="sc-serving">{s.servingNote}</span>
                      </div>
                      <button
                        className="sc-recipe-btn"
                        onClick={e => { e.stopPropagation(); setSelectedSauce(s); }}
                      >
                        View recipe →
                      </button>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Side */}
            <div className="builder-step">
              <div className="step-header">
                <span className="step-num-badge">3</span>
                <div>
                  <div className="step-title">Add a Side <span className="optional-badge">optional</span></div>
                  <div className="step-sub">Vegetables, starches, grains, and toppings to finish the dish</div>
                </div>
              </div>
              {SIDE_GROUPS.map(group => (
                <div key={group.label} className="side-group">
                  <div className="side-group-label">{group.label}</div>
                  <div className="sides-grid">
                    {group.sides.map(s => (
                      <button
                        key={s.id}
                        className={`side-card ${builder.side?.id === s.id ? "selected" : ""} ${s.season?.includes(CURRENT_MONTH) ? "in-season" : ""}`}
                        onClick={() => setBuilder(b => ({ ...b, side: builder.side?.id === s.id ? null : s }))}
                      >
                        {s.season?.includes(CURRENT_MONTH) && <span className="season-badge">In season</span>}
                        <span className="side-emoji">{s.emoji}</span>
                        <div className="side-name">{s.name}</div>
                        {s.id !== "none" && <div className="side-cal">{s.calories} cal</div>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── STICKY SUMMARY PANEL ───────────────────── */}
          <div className="builder-summary">
            <div className="summary-card">
              <div className="summary-title">Your Meal</div>

              {!builder.protein && !builder.sauce && (
                <p className="summary-empty">Select a protein and sauce to see your meal summary.</p>
              )}

              {builder.protein && (
                <div className="summary-row">
                  <span className="summary-emoji">{builder.protein.emoji}</span>
                  <div>
                    <div className="summary-item-name">{builder.protein.name}</div>
                    <div className="summary-item-sub">{builder.protein.servingSize} · {builder.protein.calories} cal · {builder.protein.protein}g protein</div>
                  </div>
                  <button className="summary-remove" onClick={() => setBuilder(b => ({ ...b, protein: null }))}>×</button>
                </div>
              )}

              {builder.sauce && (
                <div className="summary-row">
                  <span className="summary-emoji">{builder.sauce.emoji}</span>
                  <div>
                    <div className="summary-item-name">{builder.sauce.name}</div>
                    <div className="summary-item-sub">{builder.sauce.servingNote} · {builder.sauce.calories} cal · {builder.sauce.carbs}g carbs</div>
                  </div>
                  <button className="summary-remove" onClick={() => setBuilder(b => ({ ...b, sauce: null }))}>×</button>
                </div>
              )}

              {builder.side && builder.side.id !== "none" && (
                <div className="summary-row">
                  <span className="summary-emoji">{builder.side.emoji}</span>
                  <div>
                    <div className="summary-item-name">{builder.side.name}</div>
                    <div className="summary-item-sub">{builder.side.calories} cal · {builder.side.carbs}g carbs</div>
                  </div>
                  <button className="summary-remove" onClick={() => setBuilder(b => ({ ...b, side: null }))}>×</button>
                </div>
              )}

              {(builder.protein || builder.sauce) && (
                <>
                  <div className="summary-divider" />
                  <div className="summary-totals">
                    <div className="total-row">
                      <span>Calories</span>
                      <strong className={totals.calories > 600 ? "over" : "good"}>{totals.calories}</strong>
                    </div>
                    <div className="total-row">
                      <span>Protein</span>
                      <strong className={totals.protein >= 30 ? "good" : "low"}>{totals.protein}g</strong>
                    </div>
                    <div className="total-row">
                      <span>Carbs</span>
                      <strong>{totals.carbs}g</strong>
                    </div>
                  </div>

                  <div className="macro-bars">
                    <div className="mbar-label">
                      <span>Calories</span>
                      <span className={totals.calories > 600 ? "over-text" : ""}>{totals.calories} / 600</span>
                    </div>
                    <div className="mbar-track">
                      <div className={`mbar-fill ${totals.calories > 600 ? "over" : ""}`} style={{ width: `${Math.min(100, (totals.calories / 600) * 100)}%` }} />
                    </div>
                    <div className="mbar-label">
                      <span>Protein</span>
                      <span className={totals.protein >= 30 ? "good-text" : ""}>{totals.protein}g / 30g goal</span>
                    </div>
                    <div className="mbar-track">
                      <div className="mbar-fill protein" style={{ width: `${Math.min(100, (totals.protein / 40) * 100)}%` }} />
                    </div>
                  </div>
                </>
              )}

              {isComplete && (
                <div className="summary-actions">
                  {addedToDay ? (
                    <div className="added-success">
                      <span>✓</span> Added to {addedToDay}!
                      <p className="added-hint">Check the Week tab — ingredients are in your grocery list.</p>
                    </div>
                  ) : addDay === "picking" ? (
                    <div className="day-pick-area">
                      <div className="day-pick-label">Add to which day?</div>
                      <div className="day-pick-chips">
                        {days.map(d => (
                          <button
                            key={d}
                            className={`day-chip-builder ${week[d] ? "day-chip-replace" : ""}`}
                            onClick={() => logMeal(d)}
                            title={week[d] ? `Replace ${week[d].name}` : `Add to ${d}`}
                          >
                            {d}
                            {week[d] && <span className="replace-indicator"> ↺</span>}
                          </button>
                        ))}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setAddDay(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setAddDay("picking")}>
                      + Add to week
                    </button>
                  )}
                  {!addedToDay && (
                    <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8 }} onClick={() => setBuilder({ protein: null, sauce: null, side: null })}>
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SALAD BUILDER ──────────────────────────────── */}
      {view === "salad" && (
        <SaladBuilder days={days} week={week} onAddToWeek={onAddToWeek} />
      )}

      {/* ── SAUCE LIBRARY ───────────────────────────────── */}
      {view === "sauces" && (
        <div className="sauce-library">
          <div className="library-header">
            <div>
              <h2 className="section-title">Sauce Library</h2>
              <p className="section-sub">{SAUCES.length} healthy sauces · full recipes + variations included</p>
            </div>
            <div className="cuisine-filters">
              {SAUCE_CUISINES.map(c => (
                <button
                  key={c}
                  className={`cuisine-chip ${cuisineFilter === c ? "active" : ""}`}
                  onClick={() => setCuisineFilter(c)}
                >{c}</button>
              ))}
            </div>
          </div>

          <div className="library-grid">
            {filteredSauces.map(sauce => (
              <div key={sauce.id} className="library-sauce-card" onClick={() => setSelectedSauce(sauce)}>
                <div className="lsc-top">
                  <span className="lsc-emoji">{sauce.emoji}</span>
                  <div>
                    <span className="lsc-cuisine">{sauce.cuisine}</span>
                    <div className="lsc-name">{sauce.name}</div>
                  </div>
                </div>
                <p className="lsc-desc">{sauce.description}</p>
                <div className="lsc-meta">
                  {sauce.tags?.map(t => <span key={t} className="tag tag-yellow">{t}</span>)}
                </div>
                <div className="lsc-macros">
                  <span><strong>{sauce.calories}</strong> cal</span>
                  <span><strong>{sauce.protein}g</strong> protein</span>
                  <span><strong>{sauce.carbs}g</strong> carbs</span>
                  <span className="lsc-serving">{sauce.servingNote}</span>
                </div>
                <div className="lsc-pairs">
                  <span className="lsc-pairs-label">Pairs with:</span>
                  {PROTEINS.filter(p => sauce.pairsBestWith?.includes(p.id)).map(p => (
                    <span key={p.id} className="lsc-pair-chip">{p.emoji} {p.name}</span>
                  ))}
                </div>
                <div className="lsc-variations-hint">
                  🔀 {sauce.variations?.length || 0} variations · {sauce.ingredients?.length || 0} ingredients
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SAUCE RECIPE MODAL ──────────────────────────── */}
      {selectedSauce && (
        <SauceModal
          sauce={selectedSauce}
          onClose={() => setSelectedSauce(null)}
          onSelectInBuilder={() => {
            setBuilder(b => ({ ...b, sauce: selectedSauce }));
            setSelectedSauce(null);
            setView("builder");
          }}
        />
      )}
    </div>
  );
}
