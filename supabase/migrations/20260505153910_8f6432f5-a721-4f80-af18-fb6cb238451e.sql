
-- 1. Profile cover and visibility settings
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS visibility_settings jsonb NOT NULL DEFAULT '{
    "bio": true, "video_url": true,
    "phone_primary": false, "phone_secondary": false, "physical_address": false,
    "organization_name": true, "organization_role": true,
    "facebook_url": true, "instagram_url": true, "twitter_url": true,
    "tiktok_url": true, "linkedin_url": true, "website_url": true
  }'::jsonb;

-- 2. Server-side rate-limit RPC for resend (60s)
CREATE OR REPLACE FUNCTION public.mark_invitation_resent(_invitation_id uuid)
RETURNS TABLE(success boolean, message text, wait_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.event_invitations%ROWTYPE;
  uid uuid := auth.uid();
  remaining integer;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, 'auth_required'::text, 0; RETURN;
  END IF;
  SELECT * INTO inv FROM public.event_invitations WHERE id = _invitation_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_found'::text, 0; RETURN;
  END IF;
  IF NOT (public.has_role(uid, 'admin'::app_role) OR public.is_event_organizer(inv.event_id, uid)) THEN
    RETURN QUERY SELECT false, 'forbidden'::text, 0; RETURN;
  END IF;
  IF inv.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'revoked'::text, 0; RETURN;
  END IF;
  IF inv.last_sent_at IS NOT NULL AND (now() - inv.last_sent_at) < interval '60 seconds' THEN
    remaining := 60 - EXTRACT(EPOCH FROM (now() - inv.last_sent_at))::int;
    RETURN QUERY SELECT false, 'cooldown'::text, GREATEST(remaining, 1); RETURN;
  END IF;
  UPDATE public.event_invitations SET last_sent_at = now(), updated_at = now() WHERE id = inv.id;
  RETURN QUERY SELECT true, 'ok'::text, 0;
END;
$$;

-- 3. Request a fresh invitation from the /invite/:token page (revoke old, generate new)
CREATE OR REPLACE FUNCTION public.request_new_invitation(_token text)
RETURNS TABLE(success boolean, message text, new_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.event_invitations%ROWTYPE;
  uid uuid := auth.uid();
  user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  fresh text;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, 'auth_required'::text, NULL::text; RETURN;
  END IF;
  SELECT * INTO inv FROM public.event_invitations WHERE qr_code_token = _token;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_found'::text, NULL::text; RETURN;
  END IF;
  -- Only the intended invitee or someone matching the email may request a fresh token
  IF NOT (
    inv.invited_user_id = uid
    OR (inv.invited_email IS NOT NULL AND user_email <> '' AND lower(inv.invited_email) = user_email)
  ) THEN
    RETURN QUERY SELECT false, 'forbidden'::text, NULL::text; RETURN;
  END IF;
  fresh := 'tukio-' || replace(gen_random_uuid()::text, '-', '');
  fresh := substr(fresh, 1, 26);
  -- Revoke old, create a clone
  UPDATE public.event_invitations SET revoked_at = COALESCE(revoked_at, now()), updated_at = now() WHERE id = inv.id;
  INSERT INTO public.event_invitations (
    event_id, invited_by, invited_name, invited_email, invited_user_id,
    qr_code_token, status, expires_at, max_uses
  ) VALUES (
    inv.event_id, inv.invited_by, inv.invited_name, inv.invited_email, NULL,
    fresh, 'pending',
    CASE WHEN inv.expires_at IS NOT NULL THEN GREATEST(inv.expires_at, now() + interval '7 days') ELSE NULL END,
    inv.max_uses
  );
  RETURN QUERY SELECT true, 'ok'::text, fresh;
END;
$$;

-- 4. Lock down RPC execution: require authentication for sensitive ones
REVOKE EXECUTE ON FUNCTION public.redeem_invitation(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.redeem_invitation(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_invitation_resent(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_invitation_resent(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_new_invitation(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.request_new_invitation(text) TO authenticated;

-- get_invitation_preview stays callable by anon (used to preview before login) — but still SECURITY DEFINER
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated;
