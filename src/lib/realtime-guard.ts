/**
 * Client-side realtime channel guardrail.
 *
 * Realtime topic security is enforced server-side by RLS on `realtime.messages`
 * (RESTRICTIVE policy blocking any topic outside `user_notifications:<uid>`,
 * plus per-table RLS for postgres_changes). This module adds a second line of
 * defense in the browser: every channel name MUST match an explicit allowlist
 * pattern, otherwise `safeChannel()` throws synchronously instead of opening a
 * subscription. This prevents accidental leaks via typos, copy/paste, or a
 * compromised dependency trying to listen on a sensitive topic.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Allowed channel name patterns. Update this list when adding a new realtime
 * feature — anything not listed here is rejected at runtime.
 */
const ALLOWED_CHANNEL_PATTERNS: RegExp[] = [
  /^unread-notifs$/,
  /^profile-notifs$/,
  /^home-events-sync$/,
  /^banner-analytics-admin$/,
  /^follows:[0-9a-f-]{36}$/i,
  /^user_notifications:[0-9a-f-]{36}$/i,
];

export function isChannelNameAllowed(name: string): boolean {
  if (typeof name !== "string" || name.length === 0 || name.length > 128) return false;
  return ALLOWED_CHANNEL_PATTERNS.some((re) => re.test(name));
}

/**
 * Open a realtime channel by name. Throws if the name is not in the allowlist.
 * Always prefer this helper over `supabase.channel(...)` directly.
 */
export function safeChannel(name: string) {
  if (!isChannelNameAllowed(name)) {
    // eslint-disable-next-line no-console
    console.error(`[realtime-guard] Refused subscription to unauthorized topic: ${name}`);
    throw new Error(`Unauthorized realtime topic: ${name}`);
  }
  return supabase.channel(name);
}
