// Limits are a per-instance backstop; authentication is the security boundary.
const requests = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_SB_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SB_KEY;
  const allowed = process.env.NIGHTFUEL_ALLOWED_EMAIL?.trim().toLowerCase();
  if (!apiKey || !url || !key || !allowed) return res.status(503).json({ error: "AI is not configured. Check the server's OpenAI, Supabase, and allowed-email settings." });
  const authorization = req.headers?.authorization;
  if (!/^Bearer \S+$/.test(authorization || "")) return res.status(401).json({ error: "Please sign in to use NightFuel AI." });
  const body = req.body;
  if (!body || typeof body !== "object" || Buffer.byteLength(JSON.stringify(body)) > 80_000 ||
      typeof body.system !== "string" || body.system.length > 20_000 ||
      !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 30 ||
      body.messages[0]?.role !== "user" ||
      body.messages.some(m => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || !m.content.trim() || m.content.length > 30_000)) {
    return res.status(400).json({ error: "The conversation is too long or invalid. Start a new chat and try again." });
  }
  try {
    const auth = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: key, Authorization: authorization }, signal: AbortSignal.timeout(10_000),
    });
    if (!auth.ok) return res.status(auth.status >= 500 ? 503 : 401).json({ error: "Could not verify your session. Please sign in again." });
    const user = await auth.json();
    if (!user.id) return res.status(401).json({ error: "Please sign in again." });
    if (user.email?.toLowerCase() !== allowed) return res.status(403).json({ error: "This account does not have access to NightFuel AI." });
    const now = Date.now();
    for (const [id, entry] of requests) if (now - entry.start >= WINDOW_MS) requests.delete(id);
    const entry = requests.get(user.id) || { start: now, count: 0 };
    if (entry.count >= MAX_REQUESTS) {
      res.setHeader("Retry-After", String(Math.ceil((WINDOW_MS - now + entry.start) / 1000)));
      return res.status(429).json({ error: "Please wait a minute before asking for more meal ideas." });
    }
    entry.count++; requests.set(user.id, entry);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        max_output_tokens: Math.min(8000, Math.max(256, Number.isInteger(body.max_tokens) ? body.max_tokens : 6000)),
        instructions: body.system,
        store: false,
        input: body.messages.map(({ role, content }) => ({ role, content })),
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) {
      console.error("OpenAI request failed:", response.status);
      const failure = await response.json().catch(() => ({}));
      if (response.status === 401) return res.status(502).json({ error: "OpenAI rejected the API key. Update OPENAI_API_KEY in Vercel and redeploy." });
      if (failure.error?.code === "insufficient_quota") return res.status(502).json({ error: "Your OpenAI API account needs available credits or a higher usage limit." });
      if (failure.error?.code === "model_not_found") return res.status(502).json({ error: "The configured OpenAI model is unavailable for this API key. Check OPENAI_MODEL in Vercel." });
      return res.status(response.status === 429 ? 429 : 502).json({ error: response.status === 429 ? "NightFuel AI is busy. Please try again shortly." : "NightFuel AI could not complete the request. Please try again." });
    }
    const data = await response.json();
    if (data.status !== "completed") return res.status(502).json({ error: "The recipe response was cut short. Try requesting fewer meals." });
    const content = (data.output || []).filter(item => item.type === "message").flatMap(item => item.content || []);
    if (content.some(item => item.type === "refusal")) return res.status(422).json({ error: "NightFuel AI could not help with that request. Try another meal idea." });
    const text = content.filter(item => item.type === "output_text").map(item => item.text).join("\n");
    if (!text.trim()) return res.status(502).json({ error: "NightFuel AI returned an empty response. Please try again." });
    return res.status(200).json({ text });
  } catch (err) {
    console.error("AI request failed:", err.name);
    return res.status(err.name === "TimeoutError" ? 504 : 502).json({ error: "NightFuel AI could not respond in time. Please try again." });
  }
};
