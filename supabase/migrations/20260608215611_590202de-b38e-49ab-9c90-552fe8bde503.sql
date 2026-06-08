
-- 1) Restrict updates on ticket_orders: buyers can only modify non-sensitive fields
CREATE OR REPLACE FUNCTION public.ticket_orders_restrict_buyer_updates()
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
  -- Buyer: forbid changes to sensitive/payment/admin fields
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id
     OR NEW.amount_total IS DISTINCT FROM OLD.amount_total
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.event_id IS DISTINCT FROM OLD.event_id
     OR NEW.buyer_user_id IS DISTINCT FROM OLD.buyer_user_id
     OR NEW.ticket_type_id IS DISTINCT FROM OLD.ticket_type_id
     OR NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.unit_price IS DISTINCT FROM OLD.unit_price
  THEN
    RAISE EXCEPTION 'Modification non autorisée de champs sensibles de la commande.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_orders_restrict_buyer ON public.ticket_orders;
CREATE TRIGGER trg_ticket_orders_restrict_buyer
BEFORE UPDATE ON public.ticket_orders
FOR EACH ROW EXECUTE FUNCTION public.ticket_orders_restrict_buyer_updates();

-- 2) Restrict updates on event_invitations by invitees
CREATE OR REPLACE FUNCTION public.event_invitations_restrict_invitee_updates()
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
  -- Invitee: forbid changes to any sensitive field
  IF NEW.event_id IS DISTINCT FROM OLD.event_id
     OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
     OR NEW.invited_name IS DISTINCT FROM OLD.invited_name
     OR NEW.invited_email IS DISTINCT FROM OLD.invited_email
     OR NEW.qr_code_token IS DISTINCT FROM OLD.qr_code_token
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.max_uses IS DISTINCT FROM OLD.max_uses
     OR NEW.uses_count IS DISTINCT FROM OLD.uses_count
     OR NEW.revoked_at IS DISTINCT FROM OLD.revoked_at
     OR NEW.attendance_status IS DISTINCT FROM OLD.attendance_status
     OR NEW.scanned_at IS DISTINCT FROM OLD.scanned_at
     OR NEW.scanned_by IS DISTINCT FROM OLD.scanned_by
     OR NEW.last_sent_at IS DISTINCT FROM OLD.last_sent_at
     OR (NEW.invited_user_id IS DISTINCT FROM OLD.invited_user_id
         AND NOT (OLD.invited_user_id IS NULL AND NEW.invited_user_id = auth.uid()))
  THEN
    RAISE EXCEPTION 'Modification non autorisée de l''invitation.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_invitations_restrict_invitee ON public.event_invitations;
CREATE TRIGGER trg_event_invitations_restrict_invitee
BEFORE UPDATE ON public.event_invitations
FOR EACH ROW EXECUTE FUNCTION public.event_invitations_restrict_invitee_updates();

-- 3) Remove banner_analytics from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.banner_analytics;
