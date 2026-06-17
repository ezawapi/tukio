
-- 1) event_invitations: restrict SELECT
DROP POLICY IF EXISTS "Organizers and admins can view invitations" ON public.event_invitations;
CREATE POLICY "Inviter invitee or admin can view invitations"
ON public.event_invitations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR invited_by = auth.uid()
  OR invited_user_id = auth.uid()
  OR (
    invited_email IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND lower(invited_email) = lower(auth.jwt() ->> 'email')
  )
);

-- 2) ticket_orders: remove organizer raw read
DROP POLICY IF EXISTS "Buyers organizers and admins can view ticket orders" ON public.ticket_orders;
CREATE POLICY "Buyers and admins can view ticket orders"
ON public.ticket_orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR buyer_user_id = auth.uid()
);

DROP VIEW IF EXISTS public.ticket_orders_organizer_view;
CREATE VIEW public.ticket_orders_organizer_view
WITH (security_invoker = on)
AS
SELECT
  o.id, o.event_id, o.ticket_type_id, o.quantity,
  o.unit_price_amount, o.total_amount, o.currency,
  o.payment_status, o.attendance_status, o.scanned_at, o.created_at
FROM public.ticket_orders o
WHERE
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_event_organizer(o.event_id, auth.uid());
GRANT SELECT ON public.ticket_orders_organizer_view TO authenticated;

-- 3) realtime.messages RLS
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to their own notifications topic" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own notifications topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND realtime.topic() = 'user_notifications:' || auth.uid()::text
);

DROP POLICY IF EXISTS "Block broadcast subs on events/categories topics" ON realtime.messages;
DROP POLICY IF EXISTS "Block other realtime topics" ON realtime.messages;
CREATE POLICY "Block other realtime topics"
ON realtime.messages
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (
  realtime.topic() IS NULL
  OR realtime.topic() = 'user_notifications:' || COALESCE(auth.uid()::text, '')
)
WITH CHECK (false);

-- 4) Revoke broad EXECUTE on SECURITY DEFINER functions
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.has_role(uuid, app_role)',
    'public.is_event_organizer(uuid, uuid)',
    'public.is_invited_to_event(uuid, uuid, text)',
    'public.can_view_event(uuid)',
    'public.redeem_invitation(text)',
    'public.request_new_invitation(text)',
    'public.mark_invitation_resent(uuid)',
    'public.log_notification_event(uuid, text)',
    'public.send_promotional_notification(uuid, text, text, text)',
    'public.check_rate_limit(text, text, integer, integer)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.get_invitation_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.invitation_token_is_valid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invitation_token_is_valid(text) TO anon, authenticated;

-- 5) Public bucket: remove broad listing
DROP POLICY IF EXISTS "Event images are publicly readable" ON storage.objects;
CREATE POLICY "Users can list their own event image folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 6) Analytics inserts: no more WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can insert ad analytics" ON public.ad_analytics;
CREATE POLICY "Authenticated can insert ad analytics"
ON public.ad_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert banner analytics" ON public.banner_analytics;
CREATE POLICY "Authenticated can insert banner analytics"
ON public.banner_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
