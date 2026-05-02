ALTER TABLE public.event_invitations
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz;

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
    RETURN QUERY SELECT NULL::uuid, false, 'auth_required'::text;
    RETURN;
  END IF;

  SELECT * INTO inv FROM public.event_invitations WHERE qr_code_token = _token;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, false, 'not_found'::text;
    RETURN;
  END IF;

  IF inv.expires_at IS NOT NULL AND inv.expires_at <= now() THEN
    RETURN QUERY SELECT inv.event_id, false, 'expired'::text;
    RETURN;
  END IF;

  -- Strict email match when invitation is nominative
  IF inv.invited_email IS NOT NULL AND length(btrim(inv.invited_email)) > 0 THEN
    IF user_email = '' OR lower(inv.invited_email) <> user_email THEN
      RETURN QUERY SELECT inv.event_id, false, 'email_mismatch'::text;
      RETURN;
    END IF;
  END IF;

  IF inv.max_uses IS NOT NULL AND inv.uses_count >= inv.max_uses
     AND inv.invited_user_id IS DISTINCT FROM uid THEN
    RETURN QUERY SELECT inv.event_id, false, 'used_up'::text;
    RETURN;
  END IF;

  IF inv.invited_user_id IS NOT NULL AND inv.invited_user_id <> uid THEN
    IF inv.invited_email IS NULL OR lower(inv.invited_email) <> user_email THEN
      RETURN QUERY SELECT inv.event_id, false, 'already_claimed'::text;
      RETURN;
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