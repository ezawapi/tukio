
-- Allow authenticated users to insert notifications (for event modifications)
CREATE POLICY "Authenticated users can create notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create a trigger to auto-notify admin on event update by organizer
CREATE OR REPLACE FUNCTION public.notify_admin_event_modified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only notify if the organizer modified their event (not admin)
  IF NEW.updated_by_admin = false AND OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    INSERT INTO public.admin_notifications (event_id, type)
    VALUES (NEW.id, 'event_modified');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_modified
AFTER UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_event_modified();
