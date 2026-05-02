-- 1) Add expiration / usage fields
ALTER TABLE public.event_invitations
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_uses integer,
  ADD COLUMN IF NOT EXISTS uses_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS event_invitations_qr_code_token_key
  ON public.event_invitations (qr_code_token);

CREATE INDEX IF NOT EXISTS event_invitations_event_id_idx
  ON public.event_invitations (event_id);

-- 2) Helper: is a token currently valid (not expired and not over-used)
CREATE OR REPLACE FUNCTION public.invitation_token_is_valid(_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_invitations i
    WHERE i.qr_code_token = _token
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.max_uses IS NULL OR i.uses_count < i.max_uses)
  );
$$;

-- 3) Public preview (limited fields) for a token — for the /invite/:token page
CREATE OR REPLACE FUNCTION public.get_invitation_preview(_token text)
RETURNS TABLE (
  event_id uuid,
  event_title text,
  event_date timestamptz,
  event_end_date timestamptz,
  event_location text,
  event_city text,
  event_image_url text,
  organizer_name text,
  invited_name text,
  invited_email text,
  expires_at timestamptz,
  is_expired boolean,
  is_used_up boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.title,
    e.date,
    e.end_date,
    e.location,
    e.city,
    e.image_url,
    e.organizer_name,
    i.invited_name,
    i.invited_email,
    i.expires_at,
    (i.expires_at IS NOT NULL AND i.expires_at <= now()) AS is_expired,
    (i.max_uses IS NOT NULL AND i.uses_count >= i.max_uses) AS is_used_up
  FROM public.event_invitations i
  JOIN public.events e ON e.id = i.event_id
  WHERE i.qr_code_token = _token;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invitation_token_is_valid(text) TO anon, authenticated;

-- 4) Redeem function: links the invitation to the current user
CREATE OR REPLACE FUNCTION public.redeem_invitation(_token text)
RETURNS TABLE (event_id uuid, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF inv.max_uses IS NOT NULL AND inv.uses_count >= inv.max_uses
     AND inv.invited_user_id IS DISTINCT FROM uid THEN
    RETURN QUERY SELECT inv.event_id, false, 'used_up'::text;
    RETURN;
  END IF;

  -- If already claimed by someone else, allow only if email matches
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
$$;

GRANT EXECUTE ON FUNCTION public.redeem_invitation(text) TO authenticated;