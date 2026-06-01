import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "tukio:site-content:v1";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

type ContentMap = Record<string, string>;
interface CacheEntry { data: ContentMap; ts: number }

let memoryCache: ContentMap | null = null;
let inflight: Promise<ContentMap> | null = null;
const listeners = new Set<(c: ContentMap) => void>();

const loadFromStorage = (): CacheEntry | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch { return null; }
};

const saveToStorage = (data: ContentMap) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, ts: Date.now() } as CacheEntry)); } catch {}
};

const fetchFromNetwork = async (): Promise<ContentMap> => {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase.from("site_content").select("key, value");
    const map: ContentMap = {};
    (data || []).forEach((row: any) => { map[row.key] = row.value; });
    memoryCache = map;
    saveToStorage(map);
    listeners.forEach((cb) => cb(map));
    inflight = null;
    return map;
  })();
  return inflight;
};

export function invalidateSiteContent() {
  memoryCache = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  void fetchFromNetwork();
}

export function useSiteContent() {
  const cached = memoryCache ?? loadFromStorage()?.data ?? null;
  const [content, setContent] = useState<ContentMap>(cached || {});
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const entry = loadFromStorage();
    const fresh = entry && Date.now() - entry.ts < TTL_MS;
    if (entry?.data) {
      memoryCache = entry.data;
      setContent(entry.data);
      setLoading(false);
    }
    if (!fresh) {
      fetchFromNetwork().then((data) => { setContent(data); setLoading(false); });
    }
    const cb = (c: ContentMap) => setContent(c);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  return useMemo(() => ({ content, loading }), [content, loading]);
}
