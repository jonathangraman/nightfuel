import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { parseAI, requestAI, validateMeal } from "../src/lib/ai";
import { getSupabaseClient } from "../src/lib/supabase";
vi.mock("../src/lib/supabase", () => ({ getSupabaseClient: vi.fn() }));
beforeEach(() => { getSupabaseClient.mockReturnValue({ auth: { getSession: async () => ({ data: { session: { access_token: "session" } } }) } }); });
afterEach(() => vi.unstubAllGlobals());
it("sends the current access token and surfaces string errors", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Please sign in again." }) }));
  await expect(requestAI("system", [{ role: "user", content: "dinner" }])).rejects.toThrow("Please sign in again.");
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer session");
});
it("rejects truncated responses before attempting to save recipes", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "The recipe response was cut short. Try requesting fewer meals." }) }));
  await expect(requestAI("system", [{ role: "user", content: "dinner" }])).rejects.toThrow("cut short");
});
it("parses fenced JSON and rejects structurally invalid meals", () => {
  expect(parseAI('```json\n{"name":"Chicken"}\n```').name).toBe("Chicken");
  expect(() => validateMeal({ name: "Chicken", ingredients: "not an array" })).toThrow("incomplete");
});
