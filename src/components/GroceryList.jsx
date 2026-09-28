import { useState } from "react";
import "./GroceryList.css";

const SECTIONS = {
  meat:    { label: "🥩 Meat & Seafood",  keywords: ["chicken", "beef", "pork", "salmon", "shrimp", "steak", "ground", "thighs", "breast", "loin", "chop", "fillet", "flank"] },
  produce: { label: "🥦 Produce",          keywords: ["broccoli", "spinach", "kale", "zucchini", "tomato", "onion", "garlic", "pepper", "asparagus", "lettuce", "carrot", "celery", "cucumber", "lemon", "lime", "ginger", "herb", "basil", "parsley", "cilantro", "thyme", "rosemary", "dill", "mint", "corn", "mushroom", "potato", "sweet potato", "squash", "cauliflower", "green bean", "pea", "avocado", "scallion", "shallot", "jalapeño", "chili", "tomatillo", "cabbage", "arugula", "artichoke"] },
  dairy:   { label: "🧀 Dairy",            keywords: ["cheese", "yogurt", "milk", "butter", "cream", "parmesan", "mozzarella", "feta", "cheddar", "gruyere"] },
  pantry:  { label: "🫙 Pantry",           keywords: ["soy sauce", "olive oil", "sesame oil", "vinegar", "honey", "mustard", "miso", "fish sauce", "chipotle", "adobo", "cumin", "paprika", "oregano", "salt", "pepper", "cornstarch", "flour", "stock", "broth", "tomato", "can", "beans", "rice", "pasta", "nuts", "almonds", "pine nuts", "capers", "anchovy", "coconut", "mirin", "sake", "gochujang", "harissa", "tahini", "peanut butter", "sriracha", "worcestershire", "balsamic", "dijon"] },
};

function categorize(ingredient) {
  const lower = ingredient.toLowerCase();
  for (const [key, section] of Object.entries(SECTIONS)) {
    if (section.keywords.some(k => lower.includes(k))) return key;
  }
  return "pantry";
}

function parseIngredients(week, days, weekend) {
  const weekendDays = ["Saturday", "Sunday"];
  const raw = [
    ...days.flatMap(d => week[d]?.ingredients || []),
    ...weekendDays.flatMap(d => weekend?.[d]?.ingredients || []),
  ];
  const seen = new Set();
  const unique = raw.filter(i => {
    const key = i.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const grouped = { meat: [], produce: [], dairy: [], pantry: [] };
  unique.forEach(ing => {
    const cat = categorize(ing);
    grouped[cat].push({ name: ing, checked: false });
  });
  return grouped;
}

export default function GroceryList({ week, days, weekend, onClose, data, onChange }) {
  const [newItem, setNewItem] = useState("");
  const items = parseIngredients(week, days, weekend);
  const names = new Set(Object.values(items).flat().map(item => item.name.toLowerCase().trim()));
  for (const name of data.extras) {
    if (!names.has(name.toLowerCase().trim())) items[categorize(name)].push({ name });
  }
  for (const section of Object.keys(items)) {
    items[section] = items[section].filter(item => !data.hidden.includes(item.name.toLowerCase().trim()))
      .map(item => ({ ...item, checked: data.checked.includes(item.name.toLowerCase().trim()) }));
  }
  const haveIt = new Set(data.haveIt);
  const toggleHaveIt = name => onChange(previous => ({ ...previous, haveIt: previous.haveIt.includes(name) ? previous.haveIt.filter(n => n !== name) : [...previous.haveIt, name] }));
  const totalItems = Object.values(items).flat().length;
  const checkedCount = Object.values(items).flat().filter(item => item.checked).length;
  const toggle = (section, index) => {
    const name = items[section][index].name.toLowerCase().trim();
    onChange(previous => ({ ...previous, checked: previous.checked.includes(name) ? previous.checked.filter(n => n !== name) : [...previous.checked, name] }));
  };
  const addExtra = () => {
    const name = newItem.trim();
    if (!name) return;
    onChange(previous => ({ ...previous, hidden: previous.hidden.filter(n => n !== name.toLowerCase()), extras: [...new Set([...previous.extras, name])] }));
    setNewItem("");
  };
  const clearChecked = () => onChange(previous => ({ ...previous, hidden: [...new Set([...previous.hidden, ...previous.checked])],
    extras: previous.extras.filter(name => !previous.checked.includes(name.toLowerCase().trim())), checked: [] }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal grocery-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="grocery-header">
          <div>
            <h2 className="modal-title">🛒 Grocery List</h2>
            <p className="modal-desc">{checkedCount} of {totalItems} items checked</p>
          </div>
          {checkedCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearChecked}>Remove checked</button>
          )}
        </div>

        <button className="btn btn-ghost btn-sm" onClick={() => onChange({ checked: [], hidden: [], haveIt: [], extras: data.extras })}>Reset checkmarks & restore items</button>
        <div className="grocery-progress">
          <div className="grocery-progress-bar" style={{ width: `${totalItems ? (checkedCount / totalItems) * 100 : 0}%` }} />
        </div>

        <div className="grocery-body">
          {Object.entries(SECTIONS).map(([key, section]) => {
            const sectionItems = items[key] || [];
            if (sectionItems.length === 0) return null;
            return (
              <div key={key} className="grocery-section">
                <div className="grocery-section-title">{section.label}</div>
                {sectionItems.map((item, idx) => (
                  <div key={idx} className={`grocery-item ${item.checked ? "checked" : ""} ${haveIt.has(item.name) ? "have-it" : ""}`}>
                    <input
                      type="checkbox"
                      aria-label={item.name}
                      checked={item.checked}
                      onChange={() => toggle(key, idx)}
                      className="grocery-checkbox"
                    />
                    <span className="grocery-item-name">{item.name}</span>
                    <button
                      className={`have-it-btn ${haveIt.has(item.name) ? "active" : ""}`}
                      onClick={() => toggleHaveIt(item.name)}
                      title={haveIt.has(item.name) ? "Remove from pantry" : "Already have this"}
                    >{haveIt.has(item.name) ? "✓ Have it" : "Have it"}</button>
                  </div>
                ))}
              </div>
            );
          })}

          {/* ADD ITEM */}
          <div className="grocery-section">
            <div className="grocery-section-title">➕ Add item</div>
            <div className="grocery-add-row">
              <input
                type="text"
                className="grocery-add-input"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addExtra()}
                placeholder="e.g. olive oil, eggs, garlic..."
              />
              <button className="btn btn-primary btn-sm" onClick={addExtra} disabled={!newItem.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
