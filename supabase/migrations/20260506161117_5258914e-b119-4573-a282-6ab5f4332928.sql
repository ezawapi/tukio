-- Add organizer logo and author tracking to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS organizer_logo_url text,
  ADD COLUMN IF NOT EXISTS author_id uuid;

-- Backfill: author = organizer for existing rows
UPDATE public.events SET author_id = organizer_id WHERE author_id IS NULL;

-- Trigger to auto-set author_id on insert when missing
CREATE OR REPLACE FUNCTION public.events_set_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    NEW.author_id := COALESCE(auth.uid(), NEW.organizer_id);
  END IF;
  -- Validate logo URL if provided
  IF NEW.organizer_logo_url IS NOT NULL AND length(btrim(NEW.organizer_logo_url)) > 0 THEN
    PERFORM public.validate_safe_url(NEW.organizer_logo_url, 'organizer_logo_url');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_set_author_trigger ON public.events;
CREATE TRIGGER events_set_author_trigger
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.events_set_author();