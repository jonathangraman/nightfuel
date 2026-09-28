import { expect, it } from 'vitest';
import { chefBatch001 } from '../src/data/chefBatch001';
import { importId, pendingImports, sourceKey } from '../src/lib/recipeImports';
import { validateRecipe } from '../src/lib/cookbook';

it('has ten complete sourced recipes, all marked for review', () => {
  expect(chefBatch001).toHaveLength(10);
  expect(new Set(chefBatch001.map(r => r.importKey)).size).toBe(10);
  for (const recipe of chefBatch001) {
    expect(validateRecipe(recipe)).toBe(recipe);
    expect(recipe.author).toBe('Jet Tila');
    expect(recipe.reviewStatus).toBe('new');
    expect(sourceKey(recipe.sourceUrl)).toBe(recipe.importKey);
  }
});
it('does not reimport removed recipes or manually saved source matches', () => {
  const records = [
    { ...chefBatch001[0], reviewStatus: 'removed' },
    { sourceUrl: `${chefBatch001[1].sourceUrl}/?utm_source=share#ingredients` },
  ];
  expect(pendingImports(chefBatch001, records)).toHaveLength(8);
  expect(pendingImports([...chefBatch001, ...chefBatch001], [])).toHaveLength(10);
});
it('uses repeatable owner-specific IDs to make retries safe', async () => {
  const key = chefBatch001[0].importKey;
  expect(await importId('owner', key)).toBe(await importId('owner', key));
  expect(await importId('owner', key)).not.toBe(await importId('other', key));
  expect(await importId('owner', key)).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-a[a-f0-9]{3}-[a-f0-9]{12}$/);
});
