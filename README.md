# 🍽 NightFuel — Weeknight Dinner Planner

AI-powered family dinner planning. Healthy, high-protein, low-carb meals for weeknights — powered by Claude.

## Features
- 📅 **Week Planner** — Plan Mon–Fri dinners at a glance
- 🤖 **AI Chef** — Chat with Claude for personalized meal ideas
- ❤️ **Favorites** — Save and reuse meals you love
- 🛒 **Grocery List** — Auto-generated from your plan

## Stack
React + Vite · Claude API (claude-sonnet-4-20250514) · localStorage

## Local Dev
```bash
npm install && npm run dev
```

## Deploy to Vercel via GitHub
1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import repo
3. Vercel auto-detects Vite — just deploy!

> Note: For production, move API calls to a Vercel serverless function to protect your API key.
