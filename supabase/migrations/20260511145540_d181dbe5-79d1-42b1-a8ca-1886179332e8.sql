-- Block invitations on non-approved events
CREATE OR REPLACE FUNCTION public.event_invitations_block_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  st text;
  pub boolean;
BEGIN
  SELECT status, is_published INTO st, pub FROM public.events WHERE id = NEW.event_id;
  IF st IS DISTINCT FROM 'approved' OR pub IS NOT TRUE THEN
    RAISE EXCEPTION 'Impossible d''envoyer des invitations : l''événement n''est pas encore approuvé.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_invitations_block_pending ON public.event_invitations;
CREATE TRIGGER trg_event_invitations_block_pending
BEFORE INSERT ON public.event_invitations
FOR EACH ROW EXECUTE FUNCTION public.event_invitations_block_pending();

-- Block ticket orders on non-approved events
CREATE OR REPLACE FUNCTION public.ticket_orders_block_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  st text;
  pub boolean;
BEGIN
  SELECT status, is_published INTO st, pub FROM public.events WHERE id = NEW.event_id;
  IF st IS DISTINCT FROM 'approved' OR pub IS NOT TRUE THEN
    RAISE EXCEPTION 'Impossible de réserver : l''événement n''est pas encore approuvé.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_orders_block_pending ON public.ticket_orders;
CREATE TRIGGER trg_ticket_orders_block_pending
BEFORE INSERT ON public.ticket_orders
FOR EACH ROW EXECUTE FUNCTION public.ticket_orders_block_pending();