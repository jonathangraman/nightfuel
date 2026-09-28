import { createClient } from "@supabase/supabase-js";
function config() {
  const env = import.meta.env;
  return {
    url: env.VITE_SUPABASE_URL || env.VITE_SB_URL || localStorage.getItem("nf_sb_url") || "",
    key: env.VITE_SUPABASE_ANON_KEY || env.VITE_SB_KEY || localStorage.getItem("nf_sb_key") || "",
  };
}
let client;
export function isSupabaseConfigured() { const { url, key } = config(); return !!(url && key); }
export function getSupabaseClient() {
  const { url, key } = config();
  if (!url || !key) return null;
  return client ||= createClient(url, key);
}
export async function syncLoad(table, userId) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from(table).select("data, updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return { data: null, updatedAt: null };
  return { data: JSON.parse(data.data), updatedAt: data.updated_at };
}
export async function syncSave(data, userId, previousUpdatedAt) {
  const sb = getSupabaseClient();
  const previousTime = previousUpdatedAt ? Date.parse(previousUpdatedAt) : 0;
  const updatedAt = new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
  const row = { user_id: userId, data: JSON.stringify(data), updated_at: updatedAt };
  const query = previousUpdatedAt
    ? sb.from("nf_week").update(row).eq("user_id", userId).eq("updated_at", previousUpdatedAt)
    : sb.from("nf_week").insert(row);
  const { data: saved, error } = await query.select("updated_at").maybeSingle();
  if (error?.code === "23505" || (!error && !saved)) throw new Error("Your cloud plan changed on another device. Review the two copies before saving.");
  if (error) throw error;
  return saved.updated_at;
}
