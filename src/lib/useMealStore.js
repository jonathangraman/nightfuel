import { useCallback, useEffect, useRef, useState } from "react";
import { emptyState, loadLocal, storageKey, fromCloud, toCloud } from "./mealState";
import { syncLoad, syncSave } from "./supabase";

export default function useMealStore(userId) {
  const [record, setRecord] = useState(() => {
    try { return loadLocal(localStorage, userId); }
    catch { return { data: emptyState(), dirty: false, baseUpdatedAt: null, revision: 0 }; }
  });
  const [ready, setReady] = useState(!userId);
  const [status, setStatus] = useState(userId ? "syncing" : "idle");
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [conflict, setConflict] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const alive = useRef(false);
  const latest = useRef(record);
  useEffect(() => { latest.current = record; }, [record]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey(userId), JSON.stringify(record)); }
    catch { setStorageError("This browser could not save your changes. Keep this page open until cloud sync succeeds."); }
  }, [record, userId]);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      try {
        const remote = await syncLoad("nf_week", userId);
        let favorites = null, history = null;
        if (remote.data?._nightfuel?.version !== 2) {
          const [f, h] = await Promise.all([syncLoad("nf_favorites", userId), syncLoad("nf_history", userId)]);
          favorites = f.data; history = h.data;
        }
        if (cancelled) return;
        const local = latest.current;
        const cloud = fromCloud(remote.data, favorites, history, local.data);
        const legacyConflict = local.legacy && (remote.data || favorites || history) && JSON.stringify(local.data) !== JSON.stringify(cloud);
        if (legacyConflict || (local.dirty && local.baseUpdatedAt !== remote.updatedAt)) {
          setConflict({ data: cloud, updatedAt: remote.updatedAt });
          setStatus("error");
          setError("Your cloud plan and this device both have changes. Choose which copy to keep.");
        } else {
          const data = local.dirty ? local.data : cloud;
          setRecord({ ...local, data, legacy: false, baseUpdatedAt: remote.updatedAt, dirty: local.dirty || remote.data?._nightfuel?.version !== 2 });
          setConflict(null); setError(""); setStatus("synced");
        }
      } catch (err) {
        if (!cancelled) { setError(err.message || "Cloud sync failed. Your local copy is still available."); setStatus("error"); }
      } finally { if (!cancelled) setReady(true); }
    }
    load();
    return () => { cancelled = true; };
  }, [userId, reload]);
  useEffect(() => {
    if (!userId || !ready || !record.dirty || error || saving || conflict) return;
    const timer = setTimeout(async () => {
      setSaving(true); setStatus("syncing");
      try {
        const updatedAt = await syncSave(toCloud(record.data), userId, record.baseUpdatedAt);
        if (!alive.current) return;
        setRecord(current => ({ ...current, baseUpdatedAt: updatedAt, dirty: current.revision !== record.revision }));
        setStatus("synced");
      } catch (err) {
        if (alive.current) { setError(err.message || "Cloud save failed. Your changes are saved on this device."); setStatus("error"); }
      } finally { if (alive.current) setSaving(false); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [userId, ready, record, error, saving, conflict]);
  const update = useCallback((key, value) => {
    setRecord(current => ({ ...current, dirty: true, revision: current.revision + 1,
      data: { ...current.data, [key]: typeof value === "function" ? value(current.data[key]) : value } }));
  }, []);
  const retry = () => { if (!saving) { setReady(false); setError(""); setStatus("syncing"); setReload(n => n + 1); } };
  const resolve = keepLocal => {
    try { localStorage.setItem(`${storageKey(userId)}:conflict-backup`, JSON.stringify({ local: record, cloud: conflict })); }
    catch { setStorageError("Could not back up both copies. Free browser storage before resolving this conflict."); return; }
    setRecord(current => ({ ...current, legacy: false, data: keepLocal ? current.data : conflict.data, baseUpdatedAt: conflict.updatedAt,
      dirty: keepLocal, revision: current.revision + 1 }));
    setConflict(null); setError(""); setStatus("synced");
  };
  return { data: record.data, update, ready, status, error, storageError, retry, conflict, resolve, saving, dirty: record.dirty };
}
