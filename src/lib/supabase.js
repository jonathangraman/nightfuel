import { createClient } from "@supabase/supabase-js";

// These get set from the in-app settings modal
// and stored in localStorage just like the API key
const getSupabaseUrl = () => localStorage.getItem("nf_sb_url") || "";
const getSupabaseKey = () => localStorage.getItem("nf_sb_key") || "";

let _client = null;

export function getSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return null;
  // Re-create client if credentials changed
  if (!_client) {
    _client = createClient(url, key);
  }
  return _client;
}

export function resetSupabaseClient() {
  _client = null;
}

export function isSupabaseConfigured() {
  return !!(getSupabaseUrl() && getSupabaseKey());
}

// ── USER ID ─────────────────────────────────────────────
// We use a random UUID stored in localStorage as the user identifier.
// No auth needed — just a stable device identity that can be shared
// across devices by entering the same "household ID" in settings.
export function getHouseholdId() {
  let id = localStorage.getItem("nf_household_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("nf_household_id", id);
  }
  return id;
}

// ── SYNC FUNCTIONS ───────────────────────────────────────

export async function syncSave(table, data) {
  const sb = getSupabaseClient();
  if (!sb) return { error: "not configured" };
  const household_id = getHouseholdId();
  const { error } = await sb
    .from(table)
    .upsert({ household_id, data: JSON.stringify(data), updated_at: new Date().toISOString() }, { onConflict: "household_id" });
  return { error };
}

export async function syncLoad(table) {
  const sb = getSupabaseClient();
  if (!sb) return { data: null, error: "not configured" };
  const household_id = getHouseholdId();
  const { data, error } = await sb
    .from(table)
    .select("data")
    .eq("household_id", household_id)
    .single();
  if (error || !data) return { data: null, error };
  try {
    return { data: JSON.parse(data.data), error: null };
  } catch {
    return { data: null, error: "parse error" };
  }
}
