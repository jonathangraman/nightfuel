import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useMealStore from "../src/lib/useMealStore";
import { emptyState, storageKey, toCloud } from "../src/lib/mealState";
import { syncLoad, syncSave } from "../src/lib/supabase";
vi.mock("../src/lib/supabase", () => ({ syncLoad: vi.fn(), syncSave: vi.fn() }));
beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks();
  syncLoad.mockResolvedValue({ data: toCloud(emptyState()), updatedAt: "old" });
  syncSave.mockResolvedValue("new");
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("meal persistence", () => {
  it("does not overwrite an unsynced legacy plan with an older cloud plan during upgrade", async () => {
    localStorage.setItem("dinnerWeek", JSON.stringify({ Monday: { name: "My latest dinner" } }));
    const { result } = renderHook(() => useMealStore("owner"));
    await waitFor(() => expect(result.current.conflict).not.toBeNull());
    expect(result.current.data.week.Monday.name).toBe("My latest dinner");
    expect(syncSave).not.toHaveBeenCalled();
  });
  it("saves weekend meals, notes and ratings across a remount", () => {
    const first = renderHook(() => useMealStore());
    act(() => { first.result.current.update("weekend", { Saturday: { name: "Steak" } }); first.result.current.update("notes", { Monday: "Prep ahead" }); first.result.current.update("ratings", { Steak: 5 }); });
    first.unmount();
    const second = renderHook(() => useMealStore());
    expect(second.result.current.data.weekend.Saturday.name).toBe("Steak");
    expect(second.result.current.data.notes.Monday).toBe("Prep ahead");
    expect(second.result.current.data.ratings.Steak).toBe(5);
  });
  it("does not push before the initial cloud read finishes", async () => {
    let finish;
    syncLoad.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { result } = renderHook(() => useMealStore("owner"));
    expect(result.current.ready).toBe(false); expect(syncSave).not.toHaveBeenCalled();
    await act(async () => finish({ data: toCloud(emptyState()), updatedAt: "old" }));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(syncSave).not.toHaveBeenCalled();
  });
  it("autosaves changes for a signed-in user without browser credential settings", async () => {
    const { result } = renderHook(() => useMealStore("owner"));
    await waitFor(() => expect(result.current.ready).toBe(true));
    vi.useFakeTimers();
    act(() => result.current.update("weekendNotes", { Sunday: "Family BBQ" }));
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(syncSave).toHaveBeenCalledWith(expect.objectContaining({ _nightfuel: expect.objectContaining({ weekendNotes: { Sunday: "Family BBQ" } }) }), "owner", "old");
    expect(result.current.dirty).toBe(false);
  });
  it("retains changes made while a previous save is in flight", async () => {
    const { result } = renderHook(() => useMealStore("owner"));
    await waitFor(() => expect(result.current.ready).toBe(true));
    let finish; syncSave.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    vi.useFakeTimers();
    act(() => result.current.update("notes", { Monday: "First" }));
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    act(() => result.current.update("notes", { Monday: "Second" }));
    await act(async () => finish("saved-first"));
    expect(result.current.dirty).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(syncSave.mock.calls[1][0]._nightfuel.notes.Monday).toBe("Second");
    expect(syncSave.mock.calls[1][2]).toBe("saved-first");
  });
  it("shows load failures without claiming that sync succeeded", async () => {
    syncLoad.mockRejectedValue(new Error("Network unavailable"));
    const { result } = renderHook(() => useMealStore("owner"));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.status).toBe("error");
    act(() => result.current.update("notes", { Monday: "Offline note" }));
    expect(JSON.parse(localStorage.getItem(storageKey("owner"))).data.notes.Monday).toBe("Offline note");
    expect(syncSave).not.toHaveBeenCalled();
  });
  it("preserves both copies on a conflict and requires a choice", async () => {
    const local = { ...emptyState(), notes: { Monday: "Offline change" } };
    localStorage.setItem(storageKey("owner"), JSON.stringify({ data: local, dirty: true, baseUpdatedAt: "older", revision: 1 }));
    const { result } = renderHook(() => useMealStore("owner"));
    await waitFor(() => expect(result.current.conflict).not.toBeNull());
    expect(result.current.data.notes.Monday).toBe("Offline change"); expect(syncSave).not.toHaveBeenCalled();
    act(() => result.current.resolve(true));
    expect(localStorage.getItem(`${storageKey("owner")}:conflict-backup`)).toContain("Offline change");
    expect(result.current.conflict).toBeNull();
  });
});
