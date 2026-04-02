// api/claude.js - Vercel serverless function
// Proxies requests to Anthropic API so the key never reaches the browser
// Deploy env var: ANTHROPIC_API_KEY in Vercel dashboard

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured in Vercel environment variables" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Forward the exact status and body from Anthropic
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Anthropic proxy error:", err);
    return res.status(500).json({ error: "Proxy request failed", details: err.message });
  }
}
