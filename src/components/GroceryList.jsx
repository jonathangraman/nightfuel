import { useState, useEffect } from "react";
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

export default function GroceryList({ week, days, weekend, onClose }) {
  const [items, setItems] = useState(() => {
    const parsed = parseIngredients(week, days, weekend);
    // Restore checked state from localStorage
    const saved = JSON.parse(localStorage.getItem("nf_grocery_checked") || "[]");
    const checkedSet = new Set(saved);
    Object.keys(parsed).forEach(section => {
      parsed[section] = parsed[section].map(item => ({
        ...item,
        checked: checkedSet.has(item.name.toLowerCase()),
      }));
    });
    return parsed;
  });
  const [extras, setExtras] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [haveIt, setHaveIt] = useState(new Set()); // items already in pantry

  const toggleHaveIt = (name) => setHaveIt(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const totalItems  = Object.values(items).flat().length + extras.length;
  const checkedCount = [...Object.values(items).flat(), ...extras].filter(i => i.checked).length;

  const saveChecked = (newItems) => {
    const checked = Object.values(newItems).flat().filter(i => i.checked).map(i => i.name.toLowerCase());
    localStorage.setItem("nf_grocery_checked", JSON.stringify(checked));
  };

  const toggle = (section, idx) => {
    setItems(prev => {
      const next = {
        ...prev,
        [section]: prev[section].map((item, i) => i === idx ? { ...item, checked: !item.checked } : item),
      };
      saveChecked(next);
      return next;
    });
  };

  const toggleExtra = (idx) => {
    setExtras(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  };

  const addExtra = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    const cat = categorize(trimmed);
    // Add to the right section
    setItems(prev => ({
      ...prev,
      [cat]: [...prev[cat], { name: trimmed, checked: false }],
    }));
    setNewItem("");
  };

  const clearChecked = () => {
    setItems(prev => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        next[k] = v.filter(i => !i.checked);
      }
      localStorage.setItem("nf_grocery_checked", "[]");
      return next;
    });
    setExtras(prev => prev.filter(i => !i.checked));
  };

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
