
-- EVENTS: restrict to authenticated role (defense in depth)
DROP POLICY IF EXISTS "Users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can update their events" ON public.events;
CREATE POLICY "Organizers can update their events" ON public.events
  FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can delete their events" ON public.events;
CREATE POLICY "Organizers can delete their events" ON public.events
  FOR DELETE TO authenticated
  USING (auth.uid() = organizer_id);

-- COMMENTS: restrict insert to authenticated AND to events the user can view
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_view_event(event_id));

-- FAVORITES: restrict to authenticated and visible events
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_view_event(event_id));

DROP POLICY IF EXISTS "Users can remove favorites" ON public.favorites;
CREATE POLICY "Users can remove favorites" ON public.favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- USER_NOTIFICATIONS: only admins (or service role via SECURITY DEFINER) may insert
DROP POLICY IF EXISTS "Authenticated users can insert their own notifications" ON public.user_notifications;
CREATE POLICY "Admins can insert notifications" ON public.user_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Restrict what an owner can mutate: only is_read / is_favorite
CREATE OR REPLACE FUNCTION public.user_notifications_restrict_owner_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.related_event_id IS DISTINCT FROM OLD.related_event_id
     OR NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
  THEN
    RAISE EXCEPTION 'Modification non autorisée de la notification.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS user_notifications_restrict_owner_updates ON public.user_notifications;
CREATE TRIGGER user_notifications_restrict_owner_updates
  BEFORE UPDATE ON public.user_notifications
  FOR EACH ROW EXECUTE FUNCTION public.user_notifications_restrict_owner_updates();

-- NOTIFICATION_ANALYTICS: remove user-initiated insert (use RPC log_notification_event)
DROP POLICY IF EXISTS "Users insert own notification analytics" ON public.notification_analytics;
