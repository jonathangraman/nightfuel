import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Cookbook from '../src/components/Cookbook';
import useCookbook from '../src/lib/useCookbook';
import { callAI } from '../src/lib/ai';
vi.mock('../src/lib/useCookbook');
vi.mock('../src/lib/ai', () => ({ callAI: vi.fn() }));
const recipe = { id: 'original', name: 'Chocolate pudding', course: 'Desserts', cuisine: 'American', author: 'My chef', servings: 4, ingredients: [{ name: 'milk', quantity: 2, unit: 'cups' }], instructions: 'Cook gently.', description: '', sourceUrl: '', sourceBook: '', cookTime: '', notes: '' };
let store;
beforeEach(() => { vi.clearAllMocks(); store = { recipes: [], loading: false, error: '', saving: false, save: vi.fn().mockResolvedValue(recipe), load: vi.fn() }; useCookbook.mockReturnValue(store); });
afterEach(cleanup);
const show = onSchedule => render(<Cookbook userId="owner" days={['Monday', 'Saturday']} plan={{}} favorites={[]} onSchedule={onSchedule} />);
it('starts empty and does not seed or save any recipes', () => {
  show(); expect(screen.getByText('Your cookbook starts here')).toBeTruthy(); expect(store.save).not.toHaveBeenCalled(); expect(callAI).not.toHaveBeenCalled();
});
it('filters sauces and scales a cup-based sauce into the meal plan', () => {
  const sauce = { ...recipe, id: 'salsa', name: 'Salsa verde', course: 'Sauces & Condiments', cuisine: 'Mexican', servings: 1.5, yieldUnit: 'cups', ingredients: [{ name: 'tomatillos', quantity: 12, unit: 'oz' }] };
  store.recipes = [recipe, sauce];
  const schedule = vi.fn(); show(schedule);
  fireEvent.change(screen.getByLabelText('Course'), { target: { value: 'Sauces & Condiments' } });
  expect(screen.queryByRole('button', { name: /Chocolate pudding/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Salsa verde/ }));
  fireEvent.change(screen.getByLabelText('Servings'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add to meal plan' }));
  expect(schedule).toHaveBeenCalledWith(expect.objectContaining({ ingredients: ['24 oz tomatillos'], course: 'Sauces & Condiments' }), 'Monday');
});
it('schedules scaled ingredients on a weekend day', () => {
  store.recipes = [recipe]; const schedule = vi.fn(); show(schedule);
  fireEvent.click(screen.getByRole('button', { name: /Chocolate pudding/ }));
  fireEvent.change(screen.getByLabelText('Servings'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Plan for'), { target: { value: 'Saturday' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add to meal plan' }));
  expect(schedule).toHaveBeenCalledWith(expect.objectContaining({ ingredients: ['1 cups milk'], servings: 2, recipeId: 'original' }), 'Saturday');
});
it('requires explicit review and saving for healthier suggestions', async () => {
  store.recipes = [recipe]; callAI.mockResolvedValue({ name: 'Lighter pudding', servings: 4, ingredients: [{ name: 'low-fat milk', quantity: 2, unit: 'cups' }], description: 'Less fat; lighter texture.', instructions: 'Cook gently.' }); show();
  fireEvent.click(screen.getByRole('button', { name: /Chocolate pudding/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Suggest changes' }));
  expect(await screen.findByRole('dialog', { name: 'Recipe editor' })).toBeTruthy();
  expect(store.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save to my cookbook' }));
  await waitFor(() => expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ parentId: 'original', author: 'NightFuel AI adaptation', originalAuthor: 'My chef' })));
  expect(store.save.mock.calls[0][0].id).toBeUndefined();
  expect(recipe.ingredients[0].name).toBe('milk');
});
it('keeps the draft visible after a failed save', async () => {
  store.recipes = [recipe]; store.save.mockRejectedValue(new Error('Connection lost')); show();
  fireEvent.click(screen.getByRole('button', { name: /Chocolate pudding/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit recipe' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save to my cookbook' }));
  await waitFor(() => expect(screen.getAllByText('Connection lost').length).toBeGreaterThan(0));
  expect(screen.getByLabelText('Recipe name').value).toBe('Chocolate pudding');
});
it('removes recipes without deleting their import history and supports restoration', async () => {
  store.recipes = [{ ...recipe, batchId: '001-jet-tila', reviewStatus: 'new' }]; show();
  fireEvent.click(screen.getByRole('button', { name: /Chocolate pudding/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove from cookbook' }));
  await waitFor(() => expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'original', batchId: '001-jet-tila', reviewStatus: 'removed', removedAt: expect.any(String) })));
  cleanup();
  store.recipes = [{ ...recipe, batchId: '001-jet-tila', reviewStatus: 'removed' }]; show();
  expect(screen.queryByRole('button', { name: /Chocolate pudding/ })).toBeNull();
  fireEvent.change(screen.getByLabelText('Review status'), { target: { value: 'removed' } });
  fireEvent.click(screen.getByRole('button', { name: /Chocolate pudding/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Restore to cookbook' }));
  await waitFor(() => expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ reviewStatus: 'kept', removedAt: null })));
});
it('groups cuisines by default and shows review status on cards', () => {
  store.recipes = [{ ...recipe, reviewStatus: 'new' }, { ...recipe, id: 'two', name: 'Noodles', cuisine: 'Chinese', reviewStatus: 'kept' }]; show();
  expect(screen.getByRole('region', { name: 'American recipes' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Chinese recipes' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Needs review.*Chocolate pudding/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Reviewed · kept 1/ }));
  expect(screen.queryByRole('button', { name: /Chocolate pudding/ })).toBeNull();
  expect(screen.getByRole('button', { name: /Noodles/ })).toBeTruthy();
});
it('saves a credited photo with a recipe and keeps review history', async () => {
  store.recipes = [{ ...recipe, reviewStatus: 'kept' }]; show();
  fireEvent.click(screen.getByRole('button', { name: /Chocolate pudding/ }));
  expect(screen.getByRole('heading', { name: "Let's cook" })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Edit recipe' }));
  fireEvent.change(screen.getByLabelText('Or photo URL'), { target: { value: 'https://example.com/pudding.jpg' } });
  fireEvent.change(screen.getByLabelText('Photo credit'), { target: { value: 'My kitchen' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save to my cookbook' }));
  await waitFor(() => expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: 'https://example.com/pudding.jpg', imageCredit: 'My kitchen', reviewStatus: 'kept' })));
});
