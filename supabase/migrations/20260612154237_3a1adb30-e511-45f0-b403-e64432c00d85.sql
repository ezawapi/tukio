
-- user_notifications: audit
ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- event_invitations: audit
ALTER TABLE public.event_invitations
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Trigger: set created_by / updated_by from auth.uid()
CREATE OR REPLACE FUNCTION public.set_audit_user_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
    -- created_by is immutable
    NEW.created_by := OLD.created_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_notifications_audit ON public.user_notifications;
CREATE TRIGGER user_notifications_audit
  BEFORE INSERT OR UPDATE ON public.user_notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_user_notifications();

CREATE OR REPLACE FUNCTION public.set_audit_event_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.invited_by IS NULL THEN NEW.invited_by := auth.uid(); END IF;
    NEW.updated_by := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
    -- invited_by is immutable
    NEW.invited_by := OLD.invited_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_invitations_audit ON public.event_invitations;
CREATE TRIGGER event_invitations_audit
  BEFORE INSERT OR UPDATE ON public.event_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_event_invitations();

-- Index for audit lookups
CREATE INDEX IF NOT EXISTS user_notifications_created_by_idx ON public.user_notifications(created_by);
CREATE INDEX IF NOT EXISTS event_invitations_updated_by_idx ON public.event_invitations(updated_by);
