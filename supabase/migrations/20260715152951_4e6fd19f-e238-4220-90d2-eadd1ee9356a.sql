
-- 1) Revoke EXECUTE on trigger/internal SECURITY DEFINER functions from public roles.
--    These are invoked by triggers or the postgres owner, never directly by clients.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.handle_new_user()',
    'public.partners_validate_urls()',
    'public.notify_users_new_event()',
    'public.notify_admin_event_modified()',
    'public.notify_admin_new_event()',
    'public.events_set_author()',
    'public.set_audit_event_invitations()',
    'public.ticket_orders_block_pending()',
    'public.ticket_orders_restrict_buyer_inserts()',
    'public.validate_event_visibility()',
    'public.profiles_set_slug()',
    'public.ticket_orders_restrict_buyer_updates()',
    'public.set_audit_user_notifications()',
    'public.event_invitations_restrict_invitee_updates()',
    'public.event_invitations_block_pending()',
    'public.user_notifications_restrict_owner_updates()',
    'public.update_updated_at_column()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- 2) Restrict RPC-callable SECURITY DEFINER helpers to the minimum needed roles.
-- Anonymous users have no legitimate reason to call any of these.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_event_organizer(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_invited_to_event(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_event(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_organizer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_invited_to_event(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_event(uuid) TO authenticated;

-- Auth-only RPCs (must be signed in)
REVOKE ALL ON FUNCTION public.redeem_invitation(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_new_invitation(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_notification_event(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_invitation_resent(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_promotional_notification(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_new_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_notification_event(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invitation_resent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_promotional_notification(uuid, text, text, text) TO authenticated;

-- Invitation preview may be viewed pre-login (users often open an invite link before signing in)
REVOKE ALL ON FUNCTION public.get_invitation_preview(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invitation_token_is_valid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invitation_token_is_valid(text) TO anon, authenticated;

-- 3) admin_notifications: allow admins to delete
DROP POLICY IF EXISTS "Admins can delete admin notifications" ON public.admin_notifications;
CREATE POLICY "Admins can delete admin notifications"
  ON public.admin_notifications
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) comments: allow authors to edit their own comments
DROP POLICY IF EXISTS "Authors can update their own comments" ON public.comments;
CREATE POLICY "Authors can update their own comments"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
