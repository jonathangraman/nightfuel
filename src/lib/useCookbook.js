import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from './supabase';
import { validateRecipe } from './cookbook';
import { importId, pendingImports, sourceKey } from './recipeImports';

export default function useCookbook(userId) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (!userId) throw new Error('Sign in to use your private cookbook.');
      const { data, error } = await getSupabaseClient().from('nf_recipes').select('id,data,updated_at').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      setRecipes(data.map(row => ({ ...row.data, id: row.id, updatedAt: row.updated_at })));
    } catch (err) { setError(err.code === 'PGRST205' || err.code === '42P01' ? 'The cookbook database needs its one-time setup. Your existing meals are safe.' : err.message); }
    finally { setLoading(false); }
  }, [userId]);
  useEffect(() => { load(); }, [load]);
  const save = async recipe => {
    validateRecipe(recipe);
    if (!userId) throw new Error('Sign in to save recipes.');
    setSaving(true);
    try {
      const { updatedAt, ...data } = recipe;
      const id = recipe.id || crypto.randomUUID();
      const row = { id, user_id: userId, data: { ...data, id }, updated_at: new Date(Math.max(Date.now(), (Date.parse(updatedAt) || 0) + 1)).toISOString() };
      const table = getSupabaseClient().from('nf_recipes');
      const query = recipe.id ? table.update(row).eq('id', id).eq('user_id', userId).eq('updated_at', updatedAt) : table.insert(row);
      const { data: saved, error } = await query.select('id,data,updated_at').maybeSingle();
      if (error) throw error;
      if (!saved) throw new Error('This recipe changed on another device. Close the editor and refresh the cookbook before editing again.');
      const result = { ...saved.data, id: saved.id, updatedAt: saved.updated_at };
      setRecipes(list => [result, ...list.filter(r => r.id !== id)]);
      return result;
    } finally { setSaving(false); }
  };
  const importBatch = async batch => {
    if (!userId || loading || error) throw new Error('Load your cookbook successfully before importing.');
    setSaving(true);
    try {
      const pending = pendingImports(batch, recipes);
      const rows = await Promise.all(pending.map(async recipe => {
        validateRecipe(recipe);
        const importKey = sourceKey(recipe.sourceUrl);
        const id = await importId(userId, importKey);
        return { id, user_id: userId, data: { ...recipe, id, importKey, importedAt: new Date().toISOString(), reviewStatus: 'new' } };
      }));
      if (!rows.length) return 0;
      // Deterministic owner/source IDs plus ignoreDuplicates protect concurrent retries and removals.
      const { data, error } = await getSupabaseClient().from('nf_recipes').upsert(rows, { onConflict: 'id', ignoreDuplicates: true }).select('id,data,updated_at');
      if (error) throw error;
      setRecipes(list => [...data.map(row => ({ ...row.data, id: row.id, updatedAt: row.updated_at })), ...list]);
      return data.length;
    } finally { setSaving(false); }
  };
  return { recipes, loading, error, saving, load, save, importBatch };
}
