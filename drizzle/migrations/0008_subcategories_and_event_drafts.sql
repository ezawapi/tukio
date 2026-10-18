CREATE TABLE public.sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);
GRANT SELECT ON public.sub_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sub_categories TO authenticated;
GRANT ALL ON public.sub_categories TO service_role;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sub categories are public" ON public.sub_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert sub categories" ON public.sub_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update sub categories" ON public.sub_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete sub categories" ON public.sub_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX sub_categories_category_idx ON public.sub_categories(category_id);

ALTER TABLE public.events ADD COLUMN sub_category_ids uuid[] NOT NULL DEFAULT '{}';

CREATE TABLE public.event_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  draft_key text NOT NULL,
  event_id uuid,
  title text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  UNIQUE (user_id, draft_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_drafts TO authenticated;
GRANT ALL ON public.event_drafts TO service_role;
ALTER TABLE public.event_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read drafts" ON public.event_drafts FOR SELECT TO authenticated USING (user_id = auth.uid() AND expires_at > now());
CREATE POLICY "Owners insert drafts" ON public.event_drafts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners update drafts" ON public.event_drafts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners delete drafts" ON public.event_drafts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX event_drafts_expires_idx ON public.event_drafts(expires_at);

-- The 48h window starts at the first save of a draft and is never extended.
-- Expired rows are deleted on every new draft insert; an hourly backstop cleans the rest.
CREATE OR REPLACE FUNCTION public.event_drafts_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    DELETE FROM public.event_drafts WHERE expires_at <= now();
    NEW.created_at := now();
    NEW.expires_at := now() + interval '48 hours';
  ELSE
    NEW.created_at := OLD.created_at;
    NEW.expires_at := OLD.expires_at;
    NEW.user_id := OLD.user_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER event_drafts_guard BEFORE INSERT OR UPDATE ON public.event_drafts
FOR EACH ROW EXECUTE FUNCTION public.event_drafts_guard();

CREATE OR REPLACE FUNCTION public.purge_expired_event_drafts()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.event_drafts WHERE expires_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.purge_expired_event_drafts() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('purge-expired-event-drafts', '0 * * * *', $$SELECT public.purge_expired_event_drafts();$$);