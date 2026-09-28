import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import useCookbook from '../src/lib/useCookbook';
import { getSupabaseClient } from '../src/lib/supabase';
vi.mock('../src/lib/supabase', () => ({ getSupabaseClient: vi.fn() }));
const recipe = { name: 'Soup', servings: 4, course: 'Soups', ingredients: [{ name: 'water', quantity: 2, unit: 'cups' }], instructions: 'Simmer.' };
let query;
beforeEach(() => {
  vi.clearAllMocks();
  query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [] }), insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), maybeSingle: vi.fn() };
  getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });
});
afterEach(cleanup);
it('loads only the current owner and never seeds recipes', async () => {
  const { result } = renderHook(() => useCookbook('owner'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(query.eq).toHaveBeenCalledWith('user_id', 'owner');
  expect(result.current.recipes).toEqual([]); expect(query.insert).not.toHaveBeenCalled();
});
it('waits for database acknowledgment before displaying a saved recipe', async () => {
  const { result } = renderHook(() => useCookbook('owner'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  query.maybeSingle.mockResolvedValue({ data: { id: 'new', data: recipe, updated_at: 'now' } });
  await act(async () => result.current.save(recipe));
  expect(query.insert.mock.calls[0][0].user_id).toBe('owner');
  expect(result.current.recipes[0].id).toBe('new');
});
it('rejects stale edits without replacing local records', async () => {
  const { result } = renderHook(() => useCookbook('owner'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  query.maybeSingle.mockResolvedValue({ data: null });
  await act(async () => { await expect(result.current.save({ ...recipe, id: 'old', updatedAt: '2026-01-01T00:00:00Z' })).rejects.toThrow('changed on another device'); });
  expect(query.eq).toHaveBeenCalledWith('updated_at', '2026-01-01T00:00:00Z');
  expect(result.current.recipes).toEqual([]);
});
it('shows missing migration failures and does not report an empty success', async () => {
  query.order.mockResolvedValue({ error: { code: 'PGRST205' } });
  const { result } = renderHook(() => useCookbook('owner'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toContain('one-time setup');
});
it('imports a batch with conflict-safe IDs and preserves returned metadata', async () => {
  const selected = { ...recipe, sourceUrl: 'https://example.com/recipe', batchId: '001-jet-tila' };
  const inserted = { id: 'imported', data: { ...selected, reviewStatus: 'new', importedAt: 'today' }, updated_at: 'now' };
  query.upsert = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [inserted] }) });
  const { result } = renderHook(() => useCookbook('owner'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => expect(await result.current.importBatch([selected])).toBe(1));
  expect(query.upsert).toHaveBeenCalledWith([expect.objectContaining({ user_id: 'owner', data: expect.objectContaining({ importKey: 'example.com/recipe', reviewStatus: 'new' }) })], { onConflict: 'id', ignoreDuplicates: true });
  expect(result.current.recipes[0].batchId).toBe('001-jet-tila');
  await act(async () => expect(await result.current.importBatch([selected])).toBe(0));
  expect(query.upsert).toHaveBeenCalledTimes(1);
});
it('does not report a successful import after a database failure', async () => {
  query.upsert = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ error: new Error('Offline') }) });
  const { result } = renderHook(() => useCookbook('owner'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => expect(result.current.importBatch([{ ...recipe, sourceUrl: 'https://example.com/r' }])).rejects.toThrow('Offline'));
  expect(result.current.recipes).toEqual([]);
  expect(result.current.saving).toBe(false);
});
