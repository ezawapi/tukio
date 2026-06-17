
-- 1) rate_limit_events: explicit deny for anon as well (defense in depth)
DROP POLICY IF EXISTS "rate_limit_no_anon_access" ON public.rate_limit_events;
CREATE POLICY "rate_limit_no_anon_access" ON public.rate_limit_events
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 2) Document the invariant on public_profiles view
COMMENT ON VIEW public.public_profiles IS
  'Public-facing projection of profiles. MUST NEVER expose phone_primary, phone_secondary, physical_address, or any auth.users-derived email. All public queries (event organizer cards, hero counts, public profile page) must go through this view, never the profiles table.';

-- 3) Realtime defense-in-depth for events/categories topics:
--    Restrict broadcast/presence subscriptions on these channels. Postgres_changes
--    payloads are still filtered server-side by each table's RLS SELECT policy.
DROP POLICY IF EXISTS "Block broadcast subs on events/categories topics" ON realtime.messages;
CREATE POLICY "Block broadcast subs on events/categories topics" ON realtime.messages
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated, anon
  USING (
    NOT (
      extension IN ('broadcast', 'presence')
      AND (
        realtime.topic() IN ('events', 'categories')
        OR realtime.topic() LIKE 'events:%'
        OR realtime.topic() LIKE 'categories:%'
      )
    )
  );
