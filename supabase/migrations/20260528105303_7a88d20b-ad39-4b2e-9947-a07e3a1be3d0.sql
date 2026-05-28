
-- 1. Fix is_invited_to_event to respect revoked/expired invitations
CREATE OR REPLACE FUNCTION public.is_invited_to_event(_event_id uuid, _user_id uuid, _email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_invitations i
    WHERE i.event_id = _event_id
      AND i.revoked_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (
        i.invited_user_id = _user_id
        OR (
          _email IS NOT NULL
          AND i.invited_email IS NOT NULL
          AND lower(i.invited_email) = lower(_email)
        )
      )
  );
$function$;

-- 2. Remove overly broad storage INSERT policy + duplicate SELECT on event-images
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;

-- 3. Restrict follows SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Authenticated can view follows"
ON public.follows
FOR SELECT
TO authenticated
USING (true);

-- 4. Restrict profiles columns exposed to anon (column-level grants)
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, display_name, avatar_url, slug, cover_url, bio,
  website_url, linkedin_url, tiktok_url, twitter_url, instagram_url, facebook_url,
  organization_name, organization_role, account_type, visibility_settings,
  created_at, updated_at, video_url
) ON public.profiles TO anon;

-- 5. Restrict events sensitive columns from anon (admin_notes never public)
-- Keep contact fields readable since they're displayed on public event pages by design,
-- but hide admin_notes from anon and authenticated non-organizers via column revoke.
REVOKE SELECT (admin_notes) ON public.events FROM anon, authenticated;

-- 6. Revoke EXECUTE on internal SECURITY DEFINER helpers from anon/public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_organizer(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_invited_to_event(uuid, uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_view_event(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_invitation_resent(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_new_invitation(text) FROM anon, public;

-- redeem_invitation requires auth.uid(), keep for authenticated only
REVOKE EXECUTE ON FUNCTION public.redeem_invitation(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.redeem_invitation(text) TO authenticated;

-- get_invitation_preview and invitation_token_is_valid are used pre-auth on InvitePage,
-- keep accessible to anon explicitly
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invitation_token_is_valid(text) TO anon, authenticated;

-- has_role/is_event_organizer/can_view_event/is_invited_to_event are called by RLS policies,
-- which run with the caller's role -> need EXECUTE for authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_organizer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_invited_to_event(uuid, uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_view_event(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.mark_invitation_resent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_new_invitation(text) TO authenticated;
