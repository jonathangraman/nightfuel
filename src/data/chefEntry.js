import { sourceKey } from '../lib/recipeImports.js';
export const chefEntry = (batchId, author, cuisine) => (name, course, servings, sourceUrl, items, instructions, notes = '', yieldUnit = '') => ({
  name, course, cuisine, servings, author, sourceUrl, sourceBook: '', cookTime: '',
  description: 'NightFuel preparation overview. Read the linked original method before cooking.',
  ingredients: items.map(([quantity, unit, name]) => ({ quantity, unit, name })), instructions, notes, yieldUnit,
  batchId, batchLabel: `Batch ${batchId.slice(0, 3)} · ${author}`, reviewStatus: 'new',
  importKey: sourceKey(sourceUrl), sourceCheckedAt: '2026-09-28',
});
