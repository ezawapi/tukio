
-- 1. Drop unused admin_notes column to eliminate exposure risk
ALTER TABLE public.events DROP COLUMN IF EXISTS admin_notes;

-- 2. Tighten can_view_event to honor revoked/expired invitations
CREATE OR REPLACE FUNCTION public.can_view_event(_event_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = _event_id
      AND (
        ((e.visibility = 'public') AND (e.is_published = true))
        OR e.organizer_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR (
          e.visibility = 'private'
          AND EXISTS (
            SELECT 1
            FROM public.event_invitations i
            WHERE i.event_id = e.id
              AND i.revoked_at IS NULL
              AND (i.expires_at IS NULL OR i.expires_at > now())
              AND (
                i.invited_user_id = auth.uid()
                OR (
                  i.invited_email IS NOT NULL
                  AND auth.uid() IS NOT NULL
                  AND lower(i.invited_email) = lower(auth.jwt() ->> 'email')
                )
              )
          )
        )
      )
  );
$function$;

-- 3. Remove profiles from realtime publication to avoid broadcasting sensitive fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles';
  END IF;
END$$;
