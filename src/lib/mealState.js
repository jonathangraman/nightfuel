export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const WEEKEND_DAYS = ["Saturday", "Sunday"];
const emptyDays = days => Object.fromEntries(days.map(day => [day, null]));
const object = value => value && typeof value === "object" && !Array.isArray(value);

export function emptyState() {
  return { week: emptyDays(DAYS), weekend: emptyDays(WEEKEND_DAYS), favorites: [], mealHistory: [],
    ratings: {}, notes: {}, weekendNotes: {}, unsplashKey: "", grocery: { checked: [], hidden: [], haveIt: [], extras: [] } };
}
export function normalizeState(value) {
  const result = emptyState();
  if (!object(value)) return result;
  for (const key of ["week", "weekend", "ratings", "notes", "weekendNotes", "grocery"]) {
    if (object(value[key])) result[key] = { ...result[key], ...value[key] };
  }
  for (const key of ["favorites", "mealHistory"]) if (Array.isArray(value[key])) result[key] = value[key];
  for (const key of ["checked", "hidden", "haveIt", "extras"]) {
    result.grocery[key] = Array.isArray(result.grocery[key]) ? result.grocery[key].filter(x => typeof x === "string") : [];
  }
  result.unsplashKey = typeof value.unsplashKey === "string" ? value.unsplashKey : "";
  return result;
}
export const storageKey = userId => `nf_state_v2:${userId || "guest"}`;
function read(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function loadLocal(storage, userId) {
  const saved = read(storage, storageKey(userId), null);
  if (saved) return { ...saved, data: normalizeState(saved.data), revision: 0 };
  // Claim the old unscoped cache once; retain the original keys as a recovery backup.
  const owner = storage.getItem("nf_legacy_owner");
  const scope = userId || "guest";
  const data = emptyState();
  if (!owner || owner === scope) {
    const keys = { week: "dinnerWeek", favorites: "dinnerFavs", mealHistory: "dinnerHistory", weekend: "dinnerWeekend",
      ratings: "dinnerRatings", notes: "dinnerNotes", weekendNotes: "dinnerWeekendNotes" };
    for (const [key, legacy] of Object.entries(keys)) data[key] = read(storage, legacy, data[key]);
    data.unsplashKey = storage.getItem("nf_unsplash_key") || "";
    data.grocery.checked = read(storage, "nf_grocery_checked", []);
    storage.setItem("nf_legacy_owner", scope);
  }
  const normalized = normalizeState(data);
  return { data: normalized, dirty: false, baseUpdatedAt: null, revision: 0,
    legacy: JSON.stringify(normalized) !== JSON.stringify(emptyState()) };
}
// One atomic snapshot in the existing row, keeping weekday keys compatible with old readers.
export function toCloud(data) { return { ...data.week, _nightfuel: { version: 2, ...data } }; }
export function fromCloud(week, favorites, history, local = emptyState()) {
  if (week?._nightfuel?.version === 2) return normalizeState(week._nightfuel);
  return normalizeState({ ...local, week: week || local.week, favorites: favorites ?? local.favorites, mealHistory: history ?? local.mealHistory });
}
