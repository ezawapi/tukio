
CREATE TABLE public.ad_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'impression',
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  referrer text
);

ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ad analytics" ON public.ad_analytics
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can view ad analytics" ON public.ad_analytics
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
