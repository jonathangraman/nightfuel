import "./NutritionSummary.css";

export default function NutritionSummary({ week, days }) {
  const meals = days.map(d => week[d]).filter(Boolean);
  if (meals.length === 0) return null;

  const total = meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
  }), { calories: 0, protein: 0, carbs: 0 });

  const avg = {
    calories: Math.round(total.calories / meals.length),
    protein: Math.round(total.protein / meals.length),
    carbs: Math.round(total.carbs / meals.length),
  };

  // Goals
  const calGoal = 500;
  const proteinGoal = 35;
  const carbGoal = 20;

  const calPct = Math.min(100, Math.round((avg.calories / calGoal) * 100));
  const proteinPct = Math.min(100, Math.round((avg.protein / proteinGoal) * 100));
  const carbPct = Math.min(100, Math.round((avg.carbs / carbGoal) * 100));

  const proteinStatus = avg.protein >= proteinGoal ? "on-track" : "low";
  const calStatus = avg.calories <= calGoal ? "on-track" : "over";
  const carbStatus = avg.carbs <= carbGoal ? "on-track" : "over";

  return (
    <div className="nutrition-summary">
      <div className="nutr-header">
        <div className="nutr-title">Week Nutrition</div>
        <div className="nutr-sub">{meals.length} of {days.length} nights · avg per dinner</div>
      </div>

      <div className="nutr-stats">
        <div className={`nutr-stat ${calStatus}`}>
          <div className="nutr-val">{avg.calories}<span>cal</span></div>
          <div className="nutr-bar-wrap">
            <div className="nutr-bar" style={{ width: `${calPct}%` }} />
          </div>
          <div className="nutr-label">avg calories</div>
          <div className={`nutr-badge ${calStatus}`}>{calStatus === "on-track" ? "✓ on track" : "↑ over goal"}</div>
        </div>

        <div className={`nutr-stat ${proteinStatus}`}>
          <div className="nutr-val">{avg.protein}<span>g</span></div>
          <div className="nutr-bar-wrap">
            <div className="nutr-bar protein" style={{ width: `${proteinPct}%` }} />
          </div>
          <div className="nutr-label">avg protein</div>
          <div className={`nutr-badge ${proteinStatus}`}>{proteinStatus === "on-track" ? "✓ on track" : "↓ boost it"}</div>
        </div>

        <div className={`nutr-stat ${carbStatus}`}>
          <div className="nutr-val">{avg.carbs}<span>g</span></div>
          <div className="nutr-bar-wrap">
            <div className="nutr-bar carbs" style={{ width: `${carbPct}%` }} />
          </div>
          <div className="nutr-label">avg carbs</div>
          <div className={`nutr-badge ${carbStatus}`}>{carbStatus === "on-track" ? "✓ low carb" : "↑ high carbs"}</div>
        </div>

        <div className="nutr-stat totals">
          <div className="totals-grid">
            <div><span className="tot-num">{total.calories}</span><span className="tot-label">total cal</span></div>
            <div><span className="tot-num">{total.protein}g</span><span className="tot-label">total protein</span></div>
          </div>
          <div className="nutr-label" style={{ marginTop: 8 }}>week totals</div>
        </div>
      </div>
    </div>
  );
}
