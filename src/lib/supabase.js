import { createClient } from "@supabase/supabase-js";

let _client = null;

export function getSupabaseClient() {
  const url = localStorage.getItem("nf_sb_url") || "";
  const key = localStorage.getItem("nf_sb_key") || "";
  if (!url || !key) return null;
  if (!_client) _client = createClient(url, key);
  return _client;
}

export function resetSupabaseClient() { _client = null; }
export function isSupabaseConfigured() {
  return !!(localStorage.getItem("nf_sb_url") && localStorage.getItem("nf_sb_key"));
}

// ── AUTH ─────────────────────────────────────────────────
export async function getCurrentUser() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function signOut() {
  const sb = getSupabaseClient();
  if (sb) await sb.auth.signOut();
}

export function onAuthStateChange(callback) {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data: { subscription } } = sb.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

// ── SYNC (user-scoped via auth) ───────────────────────────
export async function syncSave(table, data) {
  const sb = getSupabaseClient();
  if (!sb) return { error: "not configured" };
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.id) return { error: "not authenticated" };
  const { error } = await sb
    .from(table)
    .upsert({ user_id: user.id, data: JSON.stringify(data), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return { error };
}

export async function syncLoad(table) {
  const sb = getSupabaseClient();
  if (!sb) return { data: null, error: "not configured" };
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.id) return { data: null, error: "not authenticated" };
  const { data, error } = await sb
    .from(table)
    .select("data")
    .eq("user_id", user.id)
    .single();
  if (error || !data) return { data: null, error };
  try { return { data: JSON.parse(data.data), error: null }; }
  catch { return { data: null, error: "parse error" }; }
}

export function getHouseholdId() {
  let id = localStorage.getItem("nf_household_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("nf_household_id", id); }
  return id;
}
