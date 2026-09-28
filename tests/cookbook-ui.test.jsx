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
