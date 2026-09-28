import { useEffect, useRef, useState } from 'react';
import { findRecipePhotos } from '../lib/recipePhotos';

export default function PhotoSearch({ name, onChoose }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(name || '');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const search = async term => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setBusy(true); setError(''); setResults(null);
    try { const photos = await findRecipePhotos(term, controller.signal); if (request.current === controller) setResults(photos); }
    catch (err) { if (request.current === controller) setError(err.name === 'AbortError' ? 'Search timed out. Please try again.' : err.message); }
    finally { clearTimeout(timeout); if (request.current === controller) setBusy(false); }
  };
  return <div className="cb-photo-search"><button type="button" className="btn btn-primary" onClick={() => { setOpen(true); if (!open) { setQuery(name || ''); search(name || ''); } }}>Find a photo</button>{open && <div><p>Search licensed dish photos from Wikimedia Commons. These are illustrative photos, not verified photos of this chef’s recipe.</p><div className="cb-actions"><label>Dish to search<input value={query} maxLength={160} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(query); } }} /></label><button className="btn btn-ghost" type="button" disabled={busy || !query.trim()} onClick={() => search(query)}>Search photos</button></div>{busy && <p role="status">Finding photo options…</p>}{error && <p role="alert">{error}</p>}{results?.length === 0 && <p role="status">No suitable licensed photos found. Try a simpler name, such as “lo mein,” or upload your own photo.</p>}<div className="cb-photo-results">{results?.map(photo => <article key={photo.imageSourceUrl}><img src={photo.imageUrl} alt={photo.title} loading="lazy" referrerPolicy="no-referrer" /><p>{photo.title}</p><small>{photo.imageCredit} · {photo.imageLicense}</small><a href={photo.imageSourceUrl} target="_blank" rel="noreferrer">View source and license</a><button type="button" className="btn btn-ghost" onClick={() => { const fields = { ...photo }; delete fields.title; onChoose(fields); setOpen(false); }}>Use this photo</button></article>)}</div></div>}</div>;
}

