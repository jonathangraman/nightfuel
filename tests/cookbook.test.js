import { describe, expect, it } from 'vitest';
import { recipeToMeal, groceryIngredients, validateRecipe } from '../src/lib/cookbook';
const recipe = { id: 'abc', name: 'Soup', servings: 4, course: 'Soups', cuisine: 'Mexican', instructions: 'Simmer.\nServe.', ingredients: [{ name: 'beans', quantity: 2, unit: 'cups' }, { name: 'salt', quantity: null, unit: '' }] };
describe('cookbook planning and groceries', () => {
  it('scales a planned copy without changing the original recipe', () => {
    const meal = recipeToMeal(recipe, 2);
    expect(meal.ingredients).toEqual(['1 cups beans', 'salt']);
    expect(meal.recipeId).toBe('abc');
    expect(meal.steps).toHaveLength(2);
    expect(recipe.ingredients[0].quantity).toBe(2);
  });
  it('totals repeated meals, keeps incompatible units separate, and deduplicates to taste', () => {
    const meal = recipeToMeal(recipe, 4);
    expect(groceryIngredients([meal, meal, { ingredientItems: [{ name: 'beans', quantity: 1, unit: 'lb' }] }])).toEqual(['4 cups beans', 'salt', '1 lb beans']);
    expect(meal.ingredientItems[0].quantity).toBe(2);
  });
  it('preserves older free-text recipes', () => {
    expect(groceryIngredients([{ ingredients: ['1 onion'] }, null, { ingredients: ['1 onion', '2 eggs'] }])).toEqual(['1 onion', '2 eggs']);
  });
  it('rejects unsafe links, empty ingredients, and invalid servings', () => {
    expect(() => validateRecipe({ ...recipe, sourceUrl: 'javascript:alert(1)' })).toThrow();
    expect(() => validateRecipe({ ...recipe, ingredients: [] })).toThrow();
    expect(() => recipeToMeal(recipe, 0)).toThrow();
    expect(() => recipeToMeal(recipe, Infinity)).toThrow();
  });
});
