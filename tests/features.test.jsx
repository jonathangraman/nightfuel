import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useState } from "react";
import WeekPlanner from "../src/components/WeekPlanner";
import WeekendPlanner from "../src/components/WeekendPlanner";
import AIChat from "../src/components/AIChat";
import Auth from "../src/components/Auth";
import RecipeModal from "../src/components/RecipeModal";
import GroceryList from "../src/components/GroceryList";
import { callAI, requestAI, generateVariation } from "../src/lib/ai";
import { emptyState } from "../src/lib/mealState";

vi.mock("../src/lib/ai", async original => ({ ...await original(), callAI: vi.fn(), requestAI: vi.fn(), generateVariation: vi.fn() }));
const meal = { name: "Chicken dinner", description: "Roast chicken", ingredients: ["chicken", "salt"], tags: ["Quick"], steps: [{ title: "Cook", instruction: "Roast the chicken." }], variations: [{ label: "Fish", suggestion: "Use salmon instead." }] };
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
afterEach(cleanup);

it("generates and accepts a single-day suggestion", async () => {
  callAI.mockResolvedValue(meal); const add = vi.fn();
  render(<WeekPlanner week={{ Monday: null }} days={["Monday"]} favorites={[]} onAddMeal={add} mealHistory={[]} ratings={{}} notes={{}} />);
  fireEvent.click(screen.getByRole("button", { name: "✦ AI suggest" }));
  fireEvent.click(await screen.findByRole("button", { name: "✓ Add" }));
  expect(add).toHaveBeenCalledWith(expect.objectContaining({ name: meal.name, day: "Monday" }), "Monday");
  expect(screen.queryByText("Finding ideas…")).toBeNull();
});
it("recovers the single-day button after an AI failure", async () => {
  callAI.mockRejectedValue(new Error("Try again later"));
  render(<WeekPlanner week={{ Monday: null }} days={["Monday"]} favorites={[]} mealHistory={[]} ratings={{}} notes={{}} />);
  fireEvent.click(screen.getByRole("button", { name: "✦ AI suggest" }));
  expect(await screen.findByText("Try again later")).toBeTruthy();
  expect(screen.getByRole("button", { name: "✦ AI suggest" }).disabled).toBe(false);
});
it("starts Chef Claude without a browser API key and excludes the greeting from API history", async () => {
  requestAI.mockResolvedValue("Try roast chicken tonight.");
  render(<AIChat days={["Monday"]} week={{}} favorites={[]} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Chicken please" } });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  expect(await screen.findByText("Try roast chicken tonight.")).toBeTruthy();
  expect(requestAI.mock.calls[0][1]).toEqual([{ role: "user", content: expect.stringContaining("Chicken please") }]);
  expect(screen.queryByText("Add Key")).toBeNull();
});
it("completes password recovery and handles a failed update", async () => {
  const updateUser = vi.fn().mockResolvedValueOnce({ error: { message: "Password rejected" } }).mockResolvedValue({ error: null });
  const done = vi.fn(); render(<Auth supabase={{ auth: { updateUser } }} recovery onRecovered={done} />);
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password-123" } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "new-password-123" } });
  fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
  expect(await screen.findByText("Password rejected")).toBeTruthy(); expect(done).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
  await waitFor(() => expect(done).toHaveBeenCalledOnce());
});
it("saves the generated variation rather than relabeling original ingredients", async () => {
  const variant = { ...meal, name: "Salmon dinner", ingredients: ["salmon"], steps: [{ title: "Cook fish", instruction: "Cook salmon." }] };
  generateVariation.mockResolvedValue(variant); const save = vi.fn();
  render(<RecipeModal meal={meal} onFavorite={save} favorites={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Fish" }));
  fireEvent.click(screen.getByRole("button", { name: "♡ Create & save variation" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(variant));
});
it("generates a complete weekend riff before adding it", async () => {
  callAI.mockResolvedValue({ days: [{ day: "Saturday", options: [{ ...meal, riff: { name: "The Riff: Fish", twist: "Use salmon" } }, { ...meal, name: "Option 2" }, { ...meal, name: "Option 3" }] }] });
  generateVariation.mockResolvedValue({ ...meal, name: "Salmon", ingredients: ["salmon"] }); const add = vi.fn();
  render(<WeekendPlanner weekend={{ Saturday: null, Sunday: meal }} onAddMeal={add} mealHistory={[]} ratings={{}} notes={{}} />);
  fireEvent.click(screen.getByRole("button", { name: "✦ Get 3 ideas" }));
  fireEvent.click(await screen.findByRole("button", { name: "✓ Use the riff instead" }));
  await waitFor(() => expect(add).toHaveBeenCalledWith(expect.objectContaining({ ingredients: ["salmon"] }), "Saturday"));
});
it("retains grocery extras, pantry flags and removals when reopened", async () => {
  function Harness() {
    const [data, setData] = useState(emptyState().grocery); const [open, setOpen] = useState(true);
    return <><button onClick={() => setOpen(v => !v)}>Toggle</button>{open && <GroceryList week={{ Monday: meal }} days={["Monday"]} data={data} onChange={setData} />}</>;
  }
  render(<Harness />);
  fireEvent.change(screen.getByPlaceholderText("e.g. olive oil, eggs, garlic..."), { target: { value: "eggs" } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "chicken" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove checked" }));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Toggle" })); });
  fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(screen.getByRole("checkbox", { name: "eggs" })).toBeTruthy();
  expect(screen.queryByRole("checkbox", { name: "chicken" })).toBeNull();
});
