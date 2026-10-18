import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Drafts live 48h from their first save, then are deleted automatically. */
export const DRAFT_TTL_HOURS = 48;

interface Options<T> {
  /** Unique per form, e.g. "create" or "edit:<eventId>". */
  draftKey: string;
  userId?: string | null;
  form: T;
  setForm: (next: T) => void;
  /** True once the form holds its initial (server) values. */
  ready: boolean;
  eventId?: string | null;
  /** Disable autosave (e.g. dialog closed). */
  enabled?: boolean;
  debounceMs?: number;
}

export interface DraftState {
  restoredAt: string | null;
  savedAt: string | null;
  expiresAt: string | null;
  saving: boolean;
  /** Delete the draft (call after a successful submit). */
  clear: () => Promise<void>;
  /** Drop the draft and go back to the original values. */
  discard: () => Promise<void>;
}

const stable = (v: unknown) => JSON.stringify(v ?? null);

export function useEventDraft<T extends Record<string, any>>({
  draftKey,
  userId,
  form,
  setForm,
  ready,
  eventId = null,
  enabled = true,
  debounceMs = 1200,
}: Options<T>): DraftState {
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const baselineRef = useRef<T | null>(null);
  const lastSavedRef = useRef<string>("");
  const loadedRef = useRef(false);
  const stoppedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const formRef = useRef(form);
  formRef.current = form;

  // Reset when the target form changes.
  useEffect(() => {
    loadedRef.current = false;
    stoppedRef.current = false;
    baselineRef.current = null;
    lastSavedRef.current = "";
    setRestoredAt(null);
    setSavedAt(null);
    setExpiresAt(null);
  }, [draftKey, userId]);

  // Load an existing draft once the base form is ready.
  useEffect(() => {
    if (!ready || !enabled || !userId || loadedRef.current) return;
    loadedRef.current = true;
    baselineRef.current = formRef.current;
    lastSavedRef.current = stable(formRef.current);
    (async () => {
      const { data } = await supabase
        .from("event_drafts")
        .select("data, updated_at, expires_at")
        .eq("user_id", userId)
        .eq("draft_key", draftKey)
        .maybeSingle();
      if (data && data.data && typeof data.data === "object") {
        const merged = { ...(baselineRef.current as T), ...(data.data as T) };
        lastSavedRef.current = stable(merged);
        setForm(merged);
        setRestoredAt(data.updated_at);
        setSavedAt(data.updated_at);
        setExpiresAt(data.expires_at);
      }
    })();
  }, [ready, enabled, userId, draftKey, setForm]);

  const save = useCallback(async () => {
    if (!userId || stoppedRef.current || !loadedRef.current) return;
    const snapshot = formRef.current;
    const serialized = stable(snapshot);
    if (serialized === lastSavedRef.current) return;
    // Nothing changed compared to the original values: no draft needed.
    if (serialized === stable(baselineRef.current) && !savedAt) return;
    lastSavedRef.current = serialized;
    setSaving(true);
    const { data } = await supabase
      .from("event_drafts")
      .upsert(
        {
          user_id: userId,
          draft_key: draftKey,
          event_id: eventId,
          title: (snapshot as any).title || null,
          data: snapshot as any,
        },
        { onConflict: "user_id,draft_key" },
      )
      .select("updated_at, expires_at")
      .maybeSingle();
    setSaving(false);
    if (data) {
      setSavedAt(data.updated_at);
      setExpiresAt(data.expires_at);
    }
  }, [userId, draftKey, eventId, savedAt]);

  // Debounced autosave on every change.
  useEffect(() => {
    if (!enabled || !loadedRef.current || stoppedRef.current) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(save, debounceMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [form, enabled, save, debounceMs]);

  // Flush immediately when the user leaves the tab / app.
  useEffect(() => {
    if (!enabled) return;
    const onHide = () => { if (document.visibilityState === "hidden") save(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
    };
  }, [enabled, save]);

  const clear = useCallback(async () => {
    stoppedRef.current = true;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!userId) return;
    await supabase.from("event_drafts").delete().eq("user_id", userId).eq("draft_key", draftKey);
    setSavedAt(null);
    setExpiresAt(null);
    setRestoredAt(null);
  }, [userId, draftKey]);

  const discard = useCallback(async () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (userId) {
      await supabase.from("event_drafts").delete().eq("user_id", userId).eq("draft_key", draftKey);
    }
    if (baselineRef.current) {
      lastSavedRef.current = stable(baselineRef.current);
      setForm(baselineRef.current);
    }
    setSavedAt(null);
    setExpiresAt(null);
    setRestoredAt(null);
  }, [userId, draftKey, setForm]);

  return { restoredAt, savedAt, expiresAt, saving, clear, discard };
}
