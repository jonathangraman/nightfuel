import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "../src/App";
import { emptyState, toCloud } from "../src/lib/mealState";
import { getSupabaseClient, isSupabaseConfigured, syncLoad, syncSave } from "../src/lib/supabase";
vi.mock("../src/lib/supabase", () => ({ getSupabaseClient: vi.fn(), isSupabaseConfigured: vi.fn(), syncLoad: vi.fn(), syncSave: vi.fn() }));
let authCallback;
beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks(); window.history.replaceState({}, "", "/");
  isSupabaseConfigured.mockReturnValue(true);
  getSupabaseClient.mockReturnValue({ auth: {
    getSession: async () => ({ data: { session: { user: { id: "owner" } } } }),
    onAuthStateChange: callback => { authCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; },
  } });
  const state = emptyState(); state.week.Monday = { name: "Owner meal", description: "Dinner", ingredients: ["chicken"], tags: [] };
  syncLoad.mockImplementation(async (table, id) => ({ data: toCloud(id === "owner" ? state : emptyState()), updatedAt: "old" }));
  syncSave.mockResolvedValue("new");
});
afterEach(cleanup);
it("loads the cloud plan with environment configuration and isolates an account switch", async () => {
  render(<App />);
  expect(await screen.findByText("Owner meal")).toBeTruthy();
  expect(screen.getByText("☁ synced")).toBeTruthy();
  await act(async () => authCallback("SIGNED_IN", { user: { id: "other" } }));
  await waitFor(() => expect(syncLoad).toHaveBeenCalledWith("nf_week", "other"));
  await waitFor(() => expect(screen.queryByText("Loading your meal plan…")).toBeNull());
  expect(screen.queryByText("Owner meal")).toBeNull();
});
it("routes a recovery session to the new-password screen", async () => {
  window.history.replaceState({}, "", "/?recovery=1");
  render(<App />);
  expect(await screen.findByText("Choose a new password")).toBeTruthy();
  expect(screen.queryByText("Owner meal")).toBeNull();
});
