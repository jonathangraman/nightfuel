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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_SB_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SB_KEY;
  const allowed = process.env.NIGHTFUEL_ALLOWED_EMAIL?.trim().toLowerCase();
  if (!apiKey || !url || !key || !allowed) return res.status(503).json({ error: "AI is not configured. Check the server's Anthropic, Supabase, and allowed-email settings." });
  const authorization = req.headers?.authorization;
  if (!/^Bearer \S+$/.test(authorization || "")) return res.status(401).json({ error: "Please sign in to use Chef Claude." });
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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: Math.min(8000, Math.max(256, Number.isInteger(body.max_tokens) ? body.max_tokens : 6000)),
        system: body.system,
        messages: body.messages.map(({ role, content }) => ({ role, content })),
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) {
      console.error("Anthropic request failed:", response.status);
      return res.status(response.status === 429 ? 429 : 502).json({ error: response.status === 429 ? "Chef Claude is busy. Please try again shortly." : "Chef Claude could not complete the request. Please try again." });
    }
    return res.status(200).json(await response.json());
  } catch (err) {
    console.error("AI request failed:", err.name);
    return res.status(err.name === "TimeoutError" ? 504 : 502).json({ error: "Chef Claude could not respond in time. Please try again." });
  }
};
