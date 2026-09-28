import { describe, it, expect } from "vitest";
import { emptyState, loadLocal, storageKey, toCloud, fromCloud } from "../src/lib/mealState";

describe("saved meal state", () => {
  it("round trips every feature through the existing cloud row", () => {
    const state = { ...emptyState(), weekend: { Saturday: { name: "Steak" }, Sunday: null }, ratings: { Steak: 5 },
      notes: { Monday: "Leftovers" }, weekendNotes: { Saturday: "Grill" }, unsplashKey: "photo-key", favorites: [{ name: "Fish" }],
      grocery: { checked: ["salt"], haveIt: ["oil"], hidden: [], extras: ["eggs"] } };
    expect(fromCloud(toCloud(state))).toEqual(state);
  });
  it("migrates legacy data once and isolates the next account", () => {
    localStorage.clear(); localStorage.setItem("dinnerWeek", JSON.stringify({ Monday: { name: "Chicken" } }));
    expect(loadLocal(localStorage, "owner").data.week.Monday.name).toBe("Chicken");
    expect(loadLocal(localStorage, "other").data.week.Monday).toBeNull();
    expect(localStorage.getItem("dinnerWeek")).toContain("Chicken");
  });
  it("preserves local-only fields when importing the old cloud format", () => {
    const local = { ...emptyState(), ratings: { Chicken: 5 }, weekendNotes: { Sunday: "BBQ" } };
    const result = fromCloud({ Monday: { name: "Fish" } }, [], [], local);
    expect(result.week.Monday.name).toBe("Fish"); expect(result.ratings.Chicken).toBe(5);
    expect(result.weekendNotes.Sunday).toBe("BBQ");
  });
  it("recovers from malformed local JSON", () => {
    localStorage.clear(); localStorage.setItem(storageKey("owner"), "not json");
    expect(loadLocal(localStorage, "owner").data).toEqual(emptyState());
  });
});
