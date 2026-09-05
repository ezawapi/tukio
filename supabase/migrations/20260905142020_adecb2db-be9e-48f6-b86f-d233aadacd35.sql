CREATE TABLE IF NOT EXISTS public.event_participations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  guests integer not null default 1 check (guests between 1 and 20),
  message text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_event_participations_event ON public.event_participations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participations_user ON public.event_participations(user_id);

GRANT INSERT ON public.event_participations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_participations TO authenticated;
GRANT ALL ON public.event_participations TO service_role;

ALTER TABLE public.event_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register to a public published event"
ON public.event_participations FOR INSERT TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
      AND e.is_published = true
      AND e.visibility = 'public'
      AND e.status = 'approved'
  )
);

CREATE POLICY "Participants, organizers and admins can view registrations"
ON public.event_participations FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_event_organizer(event_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Organizers and admins can update registrations"
ON public.event_participations FOR UPDATE TO authenticated
USING (public.is_event_organizer(event_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_event_organizer(event_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners, organizers and admins can delete registrations"
ON public.event_participations FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_event_organizer(event_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER event_participations_updated_at
BEFORE UPDATE ON public.event_participations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_event_attendees_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event uuid := COALESCE(NEW.event_id, OLD.event_id);
BEGIN
  UPDATE public.events e
  SET attendees_count = COALESCE((
    SELECT SUM(p.guests) FROM public.event_participations p
    WHERE p.event_id = _event AND p.status = 'confirmed'
  ), 0)
  WHERE e.id = _event;
  RETURN NULL;
END;
$$;

CREATE TRIGGER event_participations_sync_count
AFTER INSERT OR UPDATE OR DELETE ON public.event_participations
FOR EACH ROW EXECUTE FUNCTION public.sync_event_attendees_count();