
-- Replace overly permissive policy with a scoped one
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.admin_notifications;

CREATE POLICY "Authenticated users can create notifications for their events"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);
