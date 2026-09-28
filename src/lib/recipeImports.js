export function sourceKey(value) {
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, '').toLowerCase()}${url.pathname.replace(/\/+$/, '')}`;
  } catch { return ''; }
}
export function pendingImports(batch, records) {
  const known = new Set(records.flatMap(r => [r.importKey, sourceKey(r.sourceUrl)]).filter(Boolean));
  return batch.filter(recipe => {
    const key = sourceKey(recipe.sourceUrl);
    if (!key || known.has(key)) return false;
    known.add(key);
    return true;
  });
}
export async function importId(userId, key) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${userId}:${key}`));
  const hex = [...new Uint8Array(hash)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}
