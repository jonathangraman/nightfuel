export const COURSES = ['Main Dishes', 'Appetizers', 'Sides', 'Soups', 'Salads', 'Desserts'];
export const CUISINES = ['Mexican', 'Italian', 'Chinese', 'Korean', 'Japanese', 'Thai', 'French', 'American', 'Mediterranean', 'Other'];
export function validateRecipe(recipe) {
  if (typeof recipe?.name !== 'string' || !recipe.name.trim()) throw new Error('Give your recipe a name.');
  if (!Number.isFinite(recipe.servings) || recipe.servings <= 0 || recipe.servings > 100) throw new Error('Servings must be between 1 and 100.');
  if (!COURSES.includes(recipe.course)) throw new Error('Choose a course.');
  if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length || recipe.ingredients.some(i => !i || typeof i.name !== 'string' || !i.name.trim() || typeof i.unit !== 'string' || (i.quantity !== null && (!Number.isFinite(i.quantity) || i.quantity <= 0)))) throw new Error('Each ingredient needs a name and a positive quantity, or a blank quantity for “to taste”.');
  if (typeof recipe.instructions !== 'string' || !recipe.instructions.trim()) throw new Error('Add the cooking instructions.');
  for (const field of ['description', 'author', 'cuisine', 'sourceUrl', 'sourceBook', 'notes', 'cookTime']) {
    if (recipe[field] != null && typeof recipe[field] !== 'string') throw new Error('Recipe details must be text.');
  }
  if (recipe.sourceUrl) {
    let url;
    try { url = new URL(recipe.sourceUrl); } catch { throw new Error('Enter a complete source link starting with https://.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Source links must use http or https.');
  }
  return recipe;
}
export const amount = n => Number(n.toFixed(3)).toString();
export function recipeToMeal(recipe, servings) {
  validateRecipe(recipe);
  if (!Number.isFinite(servings) || servings <= 0 || servings > 100) throw new Error('Choose 1–100 servings.');
  const ingredientItems = recipe.ingredients.map(i => ({ ...i, quantity: i.quantity === null ? null : i.quantity * servings / recipe.servings }));
  return { name: recipe.name, description: recipe.description || '', recipeId: recipe.id, servings,
    course: recipe.course, cuisine: recipe.cuisine, author: recipe.author, sourceUrl: recipe.sourceUrl,
    tags: [recipe.course, recipe.cuisine].filter(Boolean), ingredientItems,
    ingredients: ingredientItems.map(formatIngredient),
    steps: recipe.instructions.split('\n').filter(s => s.trim()).map((instruction, i) => ({ step: i + 1, title: `Step ${i + 1}`, instruction })),
    cookTime: recipe.cookTime || '', nutritionEstimated: !!recipe.parentId };
}
export function formatIngredient(i) { return [i.quantity === null ? '' : amount(i.quantity), i.unit, i.name].filter(Boolean).join(' '); }
export function groceryIngredients(meals) {
  const totals = new Map();
  const legacy = new Set();
  for (const meal of meals.filter(Boolean)) {
    if (!meal.ingredientItems) { for (const text of meal.ingredients || []) legacy.add(text.trim()); continue; }
    for (const i of meal.ingredientItems) {
      const key = `${i.name.trim().toLowerCase()}|${i.unit.trim().toLowerCase()}|${i.quantity === null}`;
      const previous = totals.get(key);
      if (previous && i.quantity !== null) previous.quantity += i.quantity;
      else if (!previous) totals.set(key, { ...i });
    }
  }
  // Legacy recipes use free text; do not guess units or combine them with measured ingredients.
  return [...totals.values()].map(formatIngredient).concat([...legacy]);
}
