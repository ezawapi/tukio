
-- Restrict comments visibility to viewers of the parent event
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments viewable by event viewers"
  ON public.comments FOR SELECT
  USING (public.can_view_event(event_id));

-- Tighten ticket_orders UPDATE: remove buyer self-update entirely (payments handled server-side)
DROP POLICY IF EXISTS "Buyers organizers and admins can update ticket orders" ON public.ticket_orders;
CREATE POLICY "Organizers and admins can update ticket orders"
  ON public.ticket_orders FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = ticket_orders.event_id AND e.organizer_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = ticket_orders.event_id AND e.organizer_id = auth.uid())
  );
