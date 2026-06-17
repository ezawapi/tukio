
-- 1) Ticket orders: restrict buyer-controlled fields at INSERT
CREATE OR REPLACE FUNCTION public.ticket_orders_restrict_buyer_inserts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_priv boolean;
BEGIN
  is_priv := public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_event_organizer(NEW.event_id, auth.uid());
  IF is_priv THEN
    RETURN NEW;
  END IF;

  -- Buyer-driven inserts: force safe defaults regardless of submitted values
  NEW.buyer_user_id := auth.uid();
  NEW.payment_status := 'pending';
  NEW.stripe_checkout_session_id := NULL;
  NEW.amount_total := NULL;

  IF NEW.quantity IS NULL OR NEW.quantity <= 0 OR NEW.quantity > 50 THEN
    RAISE EXCEPTION 'Quantité invalide (1 à 50 autorisée).'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Force unit_price/currency to match the referenced ticket_type
  IF NEW.ticket_type_id IS NOT NULL THEN
    SELECT tt.price, tt.currency
      INTO NEW.unit_price, NEW.currency
    FROM public.ticket_types tt
    WHERE tt.id = NEW.ticket_type_id
      AND tt.event_id = NEW.event_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Type de billet introuvable pour cet événement.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ticket_orders_restrict_buyer_inserts ON public.ticket_orders;
CREATE TRIGGER ticket_orders_restrict_buyer_inserts
BEFORE INSERT ON public.ticket_orders
FOR EACH ROW EXECUTE FUNCTION public.ticket_orders_restrict_buyer_inserts();

-- 2) Realtime: restrict user_notifications channel subscriptions to the owner
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    -- Enable RLS if not already
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
  END IF;
END$$;

DROP POLICY IF EXISTS "Users read their own notification realtime msgs" ON realtime.messages;
CREATE POLICY "Users read their own notification realtime msgs"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Only allow if the channel topic targets this user's notifications.
  -- Convention: topic = 'user_notifications:' || auth.uid()
  (realtime.topic() = 'user_notifications:' || auth.uid()::text)
  OR (realtime.topic() NOT LIKE 'user_notifications:%')
);

-- 3) Reusable rate-limit table (login, invitation send, password reset, etc.)
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON public.rate_limit_events (action, subject, created_at DESC);

GRANT SELECT, INSERT ON public.rate_limit_events TO authenticated;
GRANT ALL ON public.rate_limit_events TO service_role;

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

-- No client read/write directly; only the SECURITY DEFINER helper touches it.
DROP POLICY IF EXISTS "rate_limit_no_direct_access" ON public.rate_limit_events;
CREATE POLICY "rate_limit_no_direct_access"
ON public.rate_limit_events
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action text,
  _subject text,
  _max_events integer,
  _window_seconds integer
) RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer;
  oldest timestamptz;
BEGIN
  IF _action IS NULL OR _subject IS NULL OR _max_events IS NULL OR _window_seconds IS NULL THEN
    RAISE EXCEPTION 'Invalid arguments';
  END IF;

  -- Garbage-collect old rows opportunistically
  DELETE FROM public.rate_limit_events
   WHERE action = _action
     AND created_at < now() - make_interval(secs => _window_seconds * 10);

  SELECT count(*), min(created_at)
    INTO cnt, oldest
  FROM public.rate_limit_events
  WHERE action = _action
    AND subject = _subject
    AND created_at > now() - make_interval(secs => _window_seconds);

  IF cnt >= _max_events THEN
    RETURN QUERY SELECT false,
      GREATEST(1, _window_seconds - EXTRACT(EPOCH FROM (now() - oldest))::int);
    RETURN;
  END IF;

  INSERT INTO public.rate_limit_events (action, subject) VALUES (_action, _subject);
  RETURN QUERY SELECT true, 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated, service_role;
