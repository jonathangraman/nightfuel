import { getSupabaseClient } from "./supabase";

export async function requestAI(system, messages, maxTokens = 8000) {
  const sb = getSupabaseClient();
  const session = sb ? await sb.auth.getSession() : null;
  const token = session?.data?.session?.access_token;
  if (!token) throw new Error("Please sign in to use Chef Claude.");
  const response = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens }), signal: AbortSignal.timeout(65_000),
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error("The AI service is unavailable. For local development, run the Vercel development server."); }
  if (!response.ok || data.error) throw new Error(typeof data.error === "string" ? data.error : data.error?.message || "Chef Claude could not complete the request.");
  if (data.stop_reason === "max_tokens") throw new Error("The recipe response was cut short. Try requesting fewer meals.");
  const text = data.content?.filter(block => block.type === "text").map(block => block.text).join("\n");
  if (!text?.trim()) throw new Error("Chef Claude returned an empty response. Try again.");
  return text;
}
export function parseAI(text) {
  try { return JSON.parse(text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()); }
  catch { throw new Error("Chef Claude returned an incomplete recipe. Please try again."); }
}
export function validateMeal(meal) {
  const strings = value => Array.isArray(value) && value.every(x => typeof x === "string");
  if (!meal || typeof meal.name !== "string" || !meal.name.trim() ||
      typeof meal.description !== "string" || !strings(meal.ingredients) || !meal.ingredients.length ||
      !Array.isArray(meal.steps) || !meal.steps.length || meal.steps.some(s => !s || typeof s.instruction !== "string" || typeof s.title !== "string")) {
    throw new Error("Chef Claude returned an incomplete recipe. Please try again.");
  }
  if (meal.tags != null && !strings(meal.tags)) throw new Error("The recipe tags were invalid. Please try again.");
  for (const key of ["calories", "protein", "carbs"]) {
    if (meal[key] != null && (typeof meal[key] !== "number" || !Number.isFinite(meal[key]) || meal[key] < 0)) throw new Error("The recipe nutrition was invalid. Please try again.");
  }
  for (const [key, fields] of [["sides", ["name", "description"]], ["variations", ["label", "suggestion"]]]) {
    if (meal[key] != null && (!Array.isArray(meal[key]) || meal[key].some(item => !item || fields.some(field => typeof item[field] !== "string")))) throw new Error("The recipe details were invalid. Please try again.");
  }
  if (meal.cookTime != null && typeof meal.cookTime !== "string") throw new Error("The recipe cooking time was invalid. Please try again.");
  if (meal.steps.some(s => (s.time != null && typeof s.time !== "string") || (s.step != null && !Number.isInteger(s.step)))) throw new Error("The recipe instructions were invalid. Please try again.");
  if (meal.sides?.some(s => s.calories != null && (typeof s.calories !== "number" || !Number.isFinite(s.calories) || s.calories < 0))) throw new Error("The side nutrition was invalid. Please try again.");
  if (meal.riff != null && (typeof meal.riff.name !== "string" || typeof meal.riff.twist !== "string")) throw new Error("The recipe variation was invalid. Please try again.");
  return meal;
}
export async function callAI(system, message) { return parseAI(await requestAI(system, [{ role: "user", content: message }])); }
export async function generateVariation(meal, suggestion) {
  const result = await callAI(
    'Create a complete revised recipe for this variation. Return ONLY one JSON meal object with name, description, tags (strings), calories, protein, carbs (numbers per serving including sides), cookTime, ingredients (strings with quantities for 4 servings, including sides), sides (name, description), steps (step, title, instruction), and variations (label, suggestion). Update every ingredient, instruction and nutrition estimate to match the variation. Include how to cook the protein and sides.',
    JSON.stringify({ original: meal, requestedVariation: suggestion }),
  );
  return validateMeal(result);
}
