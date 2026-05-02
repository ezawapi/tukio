
-- 1. Add bio + slug to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique_idx ON public.profiles (slug) WHERE slug IS NOT NULL;

-- 2. Slugify helper
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  IF _input IS NULL OR length(btrim(_input)) = 0 THEN
    RETURN NULL;
  END IF;
  v := lower(btrim(_input));
  -- Replace common accented chars (basic)
  v := translate(v,
    'àâäáãåçèéêëìíîïñòóôöõùúûüýÿ',
    'aaaaaaceeeeiiiinooooouuuuyy');
  v := regexp_replace(v, '[^a-z0-9]+', '-', 'g');
  v := regexp_replace(v, '(^-+|-+$)', '', 'g');
  IF length(v) = 0 THEN
    RETURN NULL;
  END IF;
  RETURN v;
END;
$$;

-- 3. Trigger to auto-generate unique slug
CREATE OR REPLACE FUNCTION public.profiles_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  -- Only set/refresh if slug is null or display_name changed and slug was auto
  IF NEW.slug IS NOT NULL AND NEW.slug = OLD.slug THEN
    RETURN NEW;
  END IF;

  IF NEW.slug IS NULL OR length(btrim(NEW.slug)) = 0 THEN
    base := public.slugify(NEW.display_name);
    IF base IS NULL THEN
      base := 'user-' || substr(replace(NEW.id::text, '-', ''), 1, 8);
    END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = candidate AND id <> NEW.id) LOOP
      n := n + 1;
      candidate := base || '-' || n::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_slug_trg ON public.profiles;
CREATE TRIGGER profiles_set_slug_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_set_slug();

-- Backfill existing profiles
DO $$
DECLARE
  r record;
  base text;
  candidate text;
  n int;
BEGIN
  FOR r IN SELECT id, display_name FROM public.profiles WHERE slug IS NULL LOOP
    base := COALESCE(public.slugify(r.display_name), 'user-' || substr(replace(r.id::text, '-', ''), 1, 8));
    candidate := base;
    n := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = candidate) LOOP
      n := n + 1;
      candidate := base || '-' || n::text;
    END LOOP;
    UPDATE public.profiles SET slug = candidate WHERE id = r.id;
  END LOOP;
END$$;

-- 4. follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  organizer_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (follower_id, organizer_id)
);

CREATE INDEX IF NOT EXISTS follows_organizer_idx ON public.follows (organizer_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows (follower_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id AND follower_id <> organizer_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);
