-- Allow anonymous visitors to record ad/banner impressions & clicks
GRANT INSERT ON public.ad_analytics TO anon;
GRANT INSERT ON public.banner_analytics TO anon;

CREATE POLICY "Anyone can insert ad analytics"
ON public.ad_analytics FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anyone can insert banner analytics"
ON public.banner_analytics FOR INSERT TO anon WITH CHECK (true);

-- Login history
CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  success boolean NOT NULL DEFAULT false,
  reason text,
  provider text NOT NULL DEFAULT 'password',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.login_events TO anon;
GRANT SELECT, INSERT ON public.login_events TO authenticated;
GRANT ALL ON public.login_events TO service_role;

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a login attempt"
ON public.login_events FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view login history"
ON public.login_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_login_events_created_at ON public.login_events (created_at DESC);
CREATE INDEX idx_login_events_email ON public.login_events (lower(email));