import { useState } from "react";
import RecipeModal from "./RecipeModal";
import "./AIChat.css";
import { getCurrentSeason } from "../data/seasons";

const SYSTEM_PROMPT = `You are NightFuel, a family dinner assistant. Suggest healthy, flavorful weeknight dinners for a family with kids.

FAMILY PREFERENCES:
- Proteins they regularly buy: lean ground beef (90/10), ground chicken, chicken breast, skinless chicken thighs, salmon fillets, pork loin, pork chops, flank steak, shrimp
- They like most vegetables
- Cuisine styles they enjoy: American, Greek, Italian, Mexican, Asian
- They do NOT like casseroles
- They prefer simple meals: protein + simple sauce + sides
- Easy weeknight cooking — nothing fussy or overly complex

HEALTH GOALS:
- Low carb or moderate carb
- High protein (30g+ per serving ideal)
- Low calorie (under 600 cal/serving)
- Kid-friendly but NOT boring

COOKING STYLE:
- Ready in 45 minutes or less
- Simple techniques: grilling, pan-searing, roasting, stir-fry, skillet meals
- Clean flavors, not heavy sauces
- Prioritize meals from their existing protein list whenever possible

When the user asks for meal ideas, respond ONLY with valid JSON (no markdown, no backticks, no explanation) in this exact format:
{
  "meals": [
    {
      "name": "Meal Name",
      "description": "1-2 sentence description that makes it sound delicious",
      "tags": ["Low Carb", "High Protein", "Quick"],
      "calories": 420,
      "protein": 38,
      "carbs": 12,
      "cookTime": "30 min",
      "ingredients": ["chicken thighs", "broccoli", "garlic", "soy sauce", "sesame oil"],
      "sides": [
        { "name": "Roasted Broccoli", "description": "Toss with olive oil, roast 18 min at 425F.", "calories": 55 },
        { "name": "Side Salad", "description": "Mixed greens, lemon vinaigrette.", "calories": 30 }
      ],
      "steps": [
        { "step": 1, "title": "Prep", "instruction": "Pat chicken dry and season with salt, pepper, and garlic powder.", "time": null },
        { "step": 2, "title": "Sear", "instruction": "Heat oil in a skillet over medium-high. Cook chicken 5-6 min per side until golden.", "time": "12 min" },
        { "step": 3, "title": "Rest & Serve", "instruction": "Let rest 3 minutes. Serve with roasted broccoli and a squeeze of lemon.", "time": "3 min" }
      ],
      "variations": [
        {
          "label": "Swap the protein",
          "suggestion": "Use salmon fillets instead — reduce cook time to 4 min per side and finish with a squeeze of lemon."
        },
        {
          "label": "Change the sauce",
          "suggestion": "Sub the soy sauce for coconut aminos + a spoonful of peanut butter for a Thai-style peanut glaze."
        },
        {
          "label": "Swap the vegetable",
          "suggestion": "Try asparagus or snap peas instead of broccoli — roast at the same temp for 10 minutes."
        }
      ]
    }
  ],
  "message": "A short friendly message about these suggestions"
}

For follow-up questions or conversation, respond as plain text (not JSON).
Always suggest 3-4 meals unless specified otherwise.
Ingredient lists: 5-8 items. Steps: 3-5 instructions. Variations: always include exactly 3, covering protein swap, sauce/flavor change, and vegetable swap.`;

export default function AIChat({ days, week, onAddToWeek, onFavorite, favorites, apiKey, onNeedKey, unsplashKey }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      type: "text",
      content: "Hey! 👋 I'm your AI dinner coach. Tell me what you're in the mood for — a cuisine, an ingredient you have, how much time you have, or just say \"surprise me\" and I'll pick something your family will love.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addTarget, setAddTarget] = useState({});
  const [selectedMeal, setSelectedMeal] = useState(null);

  const unplannedDays = days.filter(d => !week[d]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", type: "text", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const season = getCurrentSeason();
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.rawContent || m.content,
      }));
      // Prepend seasonal context to last user message
      if (apiMessages.length > 0) {
        const last = apiMessages[apiMessages.length - 1];
        apiMessages[apiMessages.length - 1] = {
          ...last,
          content: `${last.content}

[Context: It is ${season.month}. Seasonal produce available: ${season.produce.slice(0,5).join(", ")}. Include 2 suggested sides per meal in the JSON.]`,
        };
      }

      if (!apiKey) {
        setLoading(false);
        onNeedKey?.();
        return;
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = data.error?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const raw = data.content?.[0]?.text || "";

      let parsed = null;
      try {
        const cleaned = raw.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch (_) {}

      if (parsed?.meals) {
        setMessages(prev => [...prev, {
          role: "assistant",
          type: "meals",
          content: parsed.message || "Here are some ideas!",
          meals: parsed.meals,
          rawContent: raw,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          type: "text",
          content: raw,
          rawContent: raw,
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        type: "text",
        content: `Error: ${err.message || "Something went wrong. Check your API key."}`,
      }]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const quickPrompts = [
    "Surprise me",
    "Something with chicken",
    "Under 30 minutes",
    "Kid-approved",
    "Mexican or Asian",
    "Ground beef tonight",
  ];

  return (
    <div className="aichat">
      <div>
        <h1 className="section-title">Chef Claude</h1>
        <p className="section-sub">Tell me what you're craving and I'll find the perfect family dinner</p>
      </div>

      <div className="chat-layout">
        <div className="chat-main">
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message message-${msg.role}`}>
                {msg.role === "assistant" && <div className="msg-avatar">✦</div>}
                <div className="msg-body">
                  {msg.type === "meals" ? (
                    <div>
                      <p className="msg-text">{msg.content}</p>
                      <div className="meal-list">
                        {msg.meals.map((meal, mi) => (
                          <div key={mi} className="meal-card">
                            <div className="meal-top">
                              <div className="meal-name" onClick={() => setSelectedMeal(meal)} style={{ cursor: "pointer" }}>{meal.name}</div>
                              <span className="cook-time">⏱ {meal.cookTime}</span>
                            </div>
                            <div className="meal-meta">
                              {meal.tags?.map(t => <span key={t} className={`tag tag-${tagColor(t)}`}>{t}</span>)}
                            </div>
                            <p className="meal-desc">{meal.description}</p>
                            <div className="meal-macros">
                              {meal.calories && <span><strong>{meal.calories}</strong> cal</span>}
                              {meal.protein && <span><strong>{meal.protein}g</strong> protein</span>}
                              {meal.carbs && <span><strong>{meal.carbs}g</strong> carbs</span>}
                            </div>
                            <div className="meal-actions">
                              <button className="btn btn-primary btn-sm" onClick={() => setAddTarget(t => ({ ...t, [mi]: !t[mi] }))}>+ Add to week</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMeal(meal)}>View recipe</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => onFavorite(meal)}>♡ Save</button>
                            </div>
                            {addTarget[mi] && (
                              <div className="day-picker">
                                <span className="day-picker-label">Pick a day:</span>
                                {unplannedDays.length === 0
                                  ? <span style={{ color: "var(--text-muted)", fontSize: 13 }}>All days planned!</span>
                                  : unplannedDays.map(d => (
                                    <button key={d} className="day-chip" onClick={() => {
                                      onAddToWeek(meal, d);
                                      setAddTarget(t => ({ ...t, [mi]: false }));
                                    }}>{d}</button>
                                  ))
                                }
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="msg-text">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && <div className="msg-avatar user-avatar">you</div>}
              </div>
            ))}
            {loading && (
              <div className="message message-assistant">
                <div className="msg-avatar">✦</div>
                <div className="msg-body">
                  <div className="typing"><span /><span /><span /></div>
                </div>
              </div>
            )}
          </div>

          {!apiKey && (
            <div className="no-key-banner">
              <span>⚿</span>
              <span>Add your Anthropic API key to use Chef Claude</span>
              <button className="btn btn-primary btn-sm" onClick={onNeedKey}>Add Key</button>
            </div>
          )}
          <div className="chat-input-area">
            <div className="quick-prompts">
              {quickPrompts.map(q => (
                <button key={q} className="quick-chip" onClick={() => setInput(q)}>{q}</button>
              ))}
            </div>
            <div className="input-row">
              <textarea
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="What are you in the mood for? e.g. 'something Asian with chicken, under 30 min'"
                rows={2}
              />
              <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
                {loading ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedMeal && (
        <RecipeModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onFavorite={onFavorite}
          onAddToWeek={onAddToWeek}
          days={days}
          week={week}
          favorites={favorites}
          unsplashKey={unsplashKey}
        />
      )}
    </div>
  );
}

function tagColor(tag) {
  if (["Low Carb", "Low-Carb", "Keto", "High Protein", "Protein-Packed"].includes(tag)) return "green";
  if (["Quick", "30 min", "Easy", "Under 30"].includes(tag)) return "orange";
  return "yellow";
}
