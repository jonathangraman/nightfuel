import { expect, it } from 'vitest';
import { chefBatch001 } from '../src/data/chefBatch001';
import { chefBatch002 } from '../src/data/chefBatch002';
import { chefBatches } from '../src/data/chefBatches';
import { importId, pendingImports, sourceKey } from '../src/lib/recipeImports';
import { validateRecipe, recipeToMeal } from '../src/lib/cookbook';

it('provides collections of ten valid, distinct recipes with scalable groceries', () => {
  const newBatches = chefBatches.slice(2);
  expect(newBatches).toHaveLength(15);
  const all = chefBatches.flatMap(b => b.recipes);
  expect(new Set(all.map(r => r.importKey)).size).toBe(170);
  for (const batch of newBatches) {
    expect(batch.recipes).toHaveLength(10);
    for (const r of batch.recipes) {
      expect(validateRecipe(r)).toBe(r);
      expect(r.batchId).toBe(batch.id);
      expect(r.reviewStatus).toBe('new');
      expect(r.importKey).toBe(sourceKey(r.sourceUrl));
      const meal = recipeToMeal(r, r.servings * 2);
      expect(meal.ingredientItems).toHaveLength(r.ingredients.length);
      meal.ingredientItems.forEach((item, index) => {
        const original = r.ingredients[index];
        expect(item.name).toBe(original.name);
        expect(item.unit).toBe(original.unit);
        if (original.quantity === null) expect(item.quantity).toBeNull();
        else expect(item.quantity).toBeCloseTo(original.quantity * 2, 10);
      });
    }
  }
  const earlier = [...chefBatch001, ...chefBatch002].map(r => ({ ...r, reviewStatus: 'removed' }));
  expect(pendingImports(all, earlier)).toHaveLength(150);
  expect(pendingImports(all, all)).toEqual([]);
});

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
it('adds ten Greek selections without resetting the earlier batch review history', () => {
  expect(chefBatch002).toHaveLength(10);
  expect(new Set([...chefBatch001, ...chefBatch002].map(r => r.importKey)).size).toBe(20);
  for (const recipe of chefBatch002) {
    expect(validateRecipe(recipe)).toBe(recipe);
    expect(recipe.cuisine).toBe('Greek');
    expect(recipe.reviewStatus).toBe('new');
    expect(sourceKey(recipe.sourceUrl)).toBe(recipe.importKey);
  }
  const history = chefBatch001.map(r => ({ ...r, reviewStatus: 'removed' }));
  expect(pendingImports(chefBatch002, history)).toEqual(chefBatch002);
  expect(pendingImports(chefBatch002, [...history, ...chefBatch002])).toEqual([]);
});
it('uses repeatable owner-specific IDs to make retries safe', async () => {
  const key = chefBatch001[0].importKey;
  expect(await importId('owner', key)).toBe(await importId('owner', key));
  expect(await importId('owner', key)).not.toBe(await importId('other', key));
  expect(await importId('owner', key)).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-a[a-f0-9]{3}-[a-f0-9]{12}$/);
});
