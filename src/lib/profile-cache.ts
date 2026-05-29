import { supabase } from "@/integrations/supabase/client";

export interface CachedProfile {
  id: string;
  slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  organization_name: string | null;
  organization_role: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  video_url: string | null;
  visibility_settings: Record<string, boolean> | null;
  created_at: string;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "tukio:profile-cache:v1";

interface Entry {
  data: CachedProfile;
  ts: number;
}

type CacheMap = Record<string, Entry>;

const memCache: CacheMap = {};

const loadFromStorage = (): CacheMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
};

const persistToStorage = (cache: CacheMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
};

// Hydrate memory from storage on first import
Object.assign(memCache, loadFromStorage());

const isFresh = (entry?: Entry) => entry && Date.now() - entry.ts < TTL_MS;

const setEntry = (key: string, data: CachedProfile) => {
  const entry: Entry = { data, ts: Date.now() };
  memCache[key] = entry;
  if (data.id) memCache[data.id] = entry;
  if (data.slug) memCache[data.slug] = entry;
  persistToStorage(memCache);
};

const PROFILE_FIELDS =
  "id, slug, display_name, avatar_url, cover_url, bio, organization_name, organization_role, physical_address, phone_primary, phone_secondary, website_url, facebook_url, instagram_url, twitter_url, tiktok_url, linkedin_url, video_url, visibility_settings, created_at";

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/**
 * Resolve a public profile by slug or UUID with client-side caching.
 * Returns cached data immediately if fresh, otherwise fetches.
 */
export const resolvePublicProfile = async (
  identifier: string,
): Promise<CachedProfile | null> => {
  if (!identifier) return null;

  const cached = memCache[identifier];
  if (isFresh(cached)) return cached.data;

  const query = supabase.from("profiles").select(PROFILE_FIELDS);
  const { data } = isUuid(identifier)
    ? await query.eq("id", identifier).maybeSingle()
    : await query.eq("slug", identifier).maybeSingle();

  if (!data) return null;
  const profile = data as CachedProfile;
  setEntry(identifier, profile);
  return profile;
};

/** Returns cached entry synchronously if fresh, useful for fast-paint. */
export const getCachedProfile = (identifier: string): CachedProfile | null => {
  const cached = memCache[identifier];
  return isFresh(cached) ? cached.data : null;
};

/** Prefetch a profile in the background (no-await fire-and-forget). */
export const prefetchPublicProfile = (identifier: string) => {
  if (!identifier) return;
  if (isFresh(memCache[identifier])) return;
  void resolvePublicProfile(identifier);
};

/** Invalidate cache for a given identifier (and its aliases if known). */
export const invalidateProfile = (identifier: string) => {
  const entry = memCache[identifier];
  if (entry) {
    if (entry.data.id) delete memCache[entry.data.id];
    if (entry.data.slug) delete memCache[entry.data.slug];
  }
  delete memCache[identifier];
  persistToStorage(memCache);
};
