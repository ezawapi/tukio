-- Restore the minimum helper privileges required while RLS evaluates authenticated policies.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_organizer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_invited_to_event(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_event(uuid) TO authenticated;

-- Split public reads from authenticated privileged reads so anonymous requests
-- never need EXECUTE on security-definer role helpers.
DROP POLICY IF EXISTS "Users can view eligible events" ON public.events;
CREATE POLICY "Public can view published public events"
ON public.events FOR SELECT TO anon, authenticated
USING (visibility = 'public' AND is_published = true);
CREATE POLICY "Authenticated users can view owned invited or administered events"
ON public.events FOR SELECT TO authenticated
USING (
  organizer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    visibility = 'private'
    AND public.is_invited_to_event(id, auth.uid(), auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "Partners are viewable by everyone" ON public.partners;
CREATE POLICY "Public can view active partners"
ON public.partners FOR SELECT TO anon, authenticated
USING (is_active = true);
CREATE POLICY "Admins can view all partners"
ON public.partners FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- The view exposes an explicit non-sensitive projection only. It must run with
-- the view owner's rights because the base profiles table intentionally blocks third parties.
ALTER VIEW public.public_profiles SET (security_invoker = false);
REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
COMMENT ON VIEW public.public_profiles IS
'Public profile projection only. Never add email, phone, address, account flags, or other private fields.';

-- Immutable audit trail for sensitive comment/admin-notification mutations.
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  entity_type text NOT NULL CHECK (entity_type IN ('comments', 'admin_notifications')),
  entity_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX audit_log_entity_changed_idx
ON public.audit_log (entity_type, entity_id, changed_at DESC);
CREATE INDEX audit_log_actor_changed_idx
ON public.audit_log (actor_id, changed_at DESC);

CREATE OR REPLACE FUNCTION public.capture_sensitive_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_id uuid;
BEGIN
  row_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    row_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_sensitive_audit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_sensitive_audit() TO service_role;

DROP TRIGGER IF EXISTS comments_sensitive_audit ON public.comments;
CREATE TRIGGER comments_sensitive_audit
AFTER INSERT OR UPDATE OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.capture_sensitive_audit();
DROP TRIGGER IF EXISTS admin_notifications_sensitive_audit ON public.admin_notifications;
CREATE TRIGGER admin_notifications_sensitive_audit
AFTER INSERT OR UPDATE OR DELETE ON public.admin_notifications
FOR EACH ROW EXECUTE FUNCTION public.capture_sensitive_audit();

-- Explicitly reject arbitrary custom realtime topics. PostgreSQL Changes remain
-- protected by each source table's RLS and are not authorized through this table.
DROP POLICY IF EXISTS "Block other realtime topics" ON realtime.messages;
DROP POLICY IF EXISTS "Users can subscribe to their own notifications topic" ON realtime.messages;
CREATE POLICY "Users can receive only their notification topic"
ON realtime.messages FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND realtime.topic() = 'user_notifications:' || auth.uid()::text
);
CREATE POLICY "Users can send only to their notification topic"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND realtime.topic() = 'user_notifications:' || auth.uid()::text
);