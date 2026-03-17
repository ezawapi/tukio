-- Reservation externe + corrections sécurité/automatisations existantes
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS ticketing_mode text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS external_ticket_url text,
ADD COLUMN IF NOT EXISTS reservation_cta_label text NOT NULL DEFAULT 'Réserver';

ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_ticketing_mode_check;

ALTER TABLE public.events
ADD CONSTRAINT events_ticketing_mode_check
CHECK (ticketing_mode IN ('none', 'external'));

-- Corriger la policy de visibilité privée cassée
DROP POLICY IF EXISTS "Users can view eligible events" ON public.events;
CREATE POLICY "Users can view eligible events"
ON public.events
FOR SELECT
USING (
  ((visibility = 'public') AND (is_published = true))
  OR (auth.uid() = organizer_id)
  OR has_role(auth.uid(), 'admin')
  OR (
    (visibility = 'private')
    AND EXISTS (
      SELECT 1
      FROM public.event_invitations i
      WHERE i.event_id = events.id
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
);

-- Améliorer la fonction d'accès avec support email externe
CREATE OR REPLACE FUNCTION public.can_view_event(_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = _event_id
      AND (
        ((e.visibility = 'public') AND (e.is_published = true))
        OR e.organizer_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR (
          e.visibility = 'private'
          AND EXISTS (
            SELECT 1
            FROM public.event_invitations i
            WHERE i.event_id = e.id
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
$$;

-- Ajouter les triggers manquants
DROP TRIGGER IF EXISTS trg_events_validate_visibility ON public.events;
CREATE TRIGGER trg_events_validate_visibility
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.validate_event_visibility();

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ads_updated_at ON public.ads;
CREATE TRIGGER trg_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ad_slots_updated_at ON public.ad_slots;
CREATE TRIGGER trg_ad_slots_updated_at
BEFORE UPDATE ON public.ad_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ticket_types_updated_at ON public.ticket_types;
CREATE TRIGGER trg_ticket_types_updated_at
BEFORE UPDATE ON public.ticket_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ticket_orders_updated_at ON public.ticket_orders;
CREATE TRIGGER trg_ticket_orders_updated_at
BEFORE UPDATE ON public.ticket_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_event_invitations_updated_at ON public.event_invitations;
CREATE TRIGGER trg_event_invitations_updated_at
BEFORE UPDATE ON public.event_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_notify_admin_new_event ON public.events;
CREATE TRIGGER trg_notify_admin_new_event
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_event();