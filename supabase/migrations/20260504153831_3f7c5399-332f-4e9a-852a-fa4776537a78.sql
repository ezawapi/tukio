ALTER TABLE public.event_invitations
  ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone;

DROP FUNCTION IF EXISTS public.get_invitation_preview(text);

CREATE OR REPLACE FUNCTION public.get_invitation_preview(_token text)
 RETURNS TABLE(event_id uuid, event_title text, event_date timestamp with time zone, event_end_date timestamp with time zone, event_location text, event_city text, event_image_url text, organizer_name text, invited_name text, invited_email text, expires_at timestamp with time zone, is_expired boolean, is_used_up boolean, is_revoked boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    e.id, e.title, e.date, e.end_date, e.location, e.city, e.image_url, e.organizer_name,
    i.invited_name, i.invited_email, i.expires_at,
    (i.expires_at IS NOT NULL AND i.expires_at <= now()) AS is_expired,
    (i.max_uses IS NOT NULL AND i.uses_count >= i.max_uses) AS is_used_up,
    (i.revoked_at IS NOT NULL) AS is_revoked
  FROM public.event_invitations i
  JOIN public.events e ON e.id = i.event_id
  WHERE i.qr_code_token = _token;
$function$;

CREATE OR REPLACE FUNCTION public.invitation_token_is_valid(_token text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.event_invitations i
    WHERE i.qr_code_token = _token
      AND i.revoked_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.max_uses IS NULL OR i.uses_count < i.max_uses)
  );
$function$;

CREATE OR REPLACE FUNCTION public.redeem_invitation(_token text)
 RETURNS TABLE(event_id uuid, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inv public.event_invitations%ROWTYPE;
  uid uuid := auth.uid();
  user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, false, 'auth_required'::text; RETURN;
  END IF;
  SELECT * INTO inv FROM public.event_invitations WHERE qr_code_token = _token;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, false, 'not_found'::text; RETURN;
  END IF;
  IF inv.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT inv.event_id, false, 'revoked'::text; RETURN;
  END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at <= now() THEN
    RETURN QUERY SELECT inv.event_id, false, 'expired'::text; RETURN;
  END IF;
  IF inv.invited_email IS NOT NULL AND length(btrim(inv.invited_email)) > 0 THEN
    IF user_email = '' OR lower(inv.invited_email) <> user_email THEN
      RETURN QUERY SELECT inv.event_id, false, 'email_mismatch'::text; RETURN;
    END IF;
  END IF;
  IF inv.max_uses IS NOT NULL AND inv.uses_count >= inv.max_uses
     AND inv.invited_user_id IS DISTINCT FROM uid THEN
    RETURN QUERY SELECT inv.event_id, false, 'used_up'::text; RETURN;
  END IF;
  IF inv.invited_user_id IS NOT NULL AND inv.invited_user_id <> uid THEN
    IF inv.invited_email IS NULL OR lower(inv.invited_email) <> user_email THEN
      RETURN QUERY SELECT inv.event_id, false, 'already_claimed'::text; RETURN;
    END IF;
  END IF;
  UPDATE public.event_invitations
    SET invited_user_id = uid,
        claimed_at = COALESCE(claimed_at, now()),
        uses_count = uses_count + CASE WHEN invited_user_id IS DISTINCT FROM uid THEN 1 ELSE 0 END,
        status = CASE WHEN status = 'pending' THEN 'accepted' ELSE status END,
        updated_at = now()
    WHERE id = inv.id;
  RETURN QUERY SELECT inv.event_id, true, 'ok'::text;
END;
$function$;