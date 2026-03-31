import { useState } from "react";
import "./AIChat.css";

const SYSTEM_PROMPT = `You are NightFuel, a family dinner assistant. Suggest healthy, flavorful weeknight dinners for a family with kids. Focus on:
- Low carb or moderate carb meals
- High protein (30g+ per serving ideal)
- Low calorie (under 600 cal/serving)
- Kid-friendly but NOT boring — think exciting flavors, global cuisines, fun presentations
- Ready in 45 minutes or less

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
      "ingredients": ["chicken thighs", "broccoli", "garlic", "soy sauce", "sesame oil"]
    }
  ],
  "message": "A short friendly message about these suggestions"
}

For follow-up questions or conversation that isn't requesting meals, respond as plain text (not JSON).
Always suggest 3-4 meals per request unless otherwise specified.
Keep ingredient lists to 5-8 items that are easy to find at any grocery store.`;

export default function AIChat({ days, week, onAddToWeek, onFavorite, favorites }) {
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

  const unplannedDays = days.filter(d => !week[d]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", type: "text", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.rawContent || m.content,
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await res.json();
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
        content: "Sorry, something went wrong. Try again in a moment!",
      }]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const quickPrompts = [
    "Surprise me with something fun",
    "Something with chicken",
    "Under 30 minutes please",
    "Kid-approved meals",
    "Mexican or Asian flavors",
    "Something with ground beef",
  ];

  return (
    <div className="aichat">
      <div>
        <h1 className="section-title">AI Chef</h1>
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
                              <div className="meal-name">{meal.name}</div>
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
                              <button className="btn btn-primary btn-sm" onClick={() => setAddTarget(t => ({ ...t, [mi]: !t[mi] }))}>
                                + Add to week
                              </button>
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
                  <div className="typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <div className="quick-prompts">
              {quickPrompts.map(q => (
                <button key={q} className="quick-chip" onClick={() => { setInput(q); }}>
                  {q}
                </button>
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
    </div>
  );
}

function tagColor(tag) {
  if (["Low Carb", "Low-Carb", "Keto", "High Protein", "Protein-Packed"].includes(tag)) return "green";
  if (["Quick", "30 min", "Easy", "Under 30"].includes(tag)) return "orange";
  return "yellow";
}
