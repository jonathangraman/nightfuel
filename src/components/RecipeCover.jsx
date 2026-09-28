import { useState } from 'react';
import { Utensils } from 'lucide-react';

export default function RecipeCover({ recipe }) {
  const [failed, setFailed] = useState('');
  const url = recipe.imageUrl || '';
  const safe = /^https:\/\//i.test(url) || /^data:image\/(jpeg|png|webp);base64,/i.test(url);
  return <div className={`cb-cover cb-cover-${(recipe.cuisine || 'other').toLowerCase().replace(/[^a-z]/g, '')}`}>
    {safe && failed !== url ? <img src={url} alt={recipe.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(url)} /> : <div className="cb-cover-art" aria-hidden="true"><Utensils size={36} strokeWidth={1.2} /><span>{recipe.cuisine || 'From your kitchen'}</span></div>}
  </div>;
}
