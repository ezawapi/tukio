ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_url text;

CREATE OR REPLACE FUNCTION public.get_account_type(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT account_type FROM public.profiles WHERE id = _user_id
$$;
GRANT EXECUTE ON FUNCTION public.get_account_type(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t text := NEW.raw_user_meta_data->>'account_type';
BEGIN
  IF _t NOT IN ('user','organizer') OR _t IS NULL THEN _t := 'user'; END IF;
  INSERT INTO public.profiles (id, account_type) VALUES (NEW.id, _t)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TABLE public.partnership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  organization_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website_url text,
  logo_url text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.partnership_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partnership_requests TO authenticated;
GRANT ALL ON public.partnership_requests TO service_role;
ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit partnership" ON public.partnership_requests FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND (user_id IS NULL OR user_id = auth.uid()) AND length(organization_name) BETWEEN 2 AND 150 AND length(email) BETWEEN 5 AND 255);
CREATE POLICY "Admins read partnership" ON public.partnership_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update partnership" ON public.partnership_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete partnership" ON public.partnership_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (is_read = false AND (user_id IS NULL OR user_id = auth.uid()) AND length(message) BETWEEN 5 AND 3000 AND length(email) BETWEEN 5 AND 255);
CREATE POLICY "Admins read contact" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update contact" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete contact" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));