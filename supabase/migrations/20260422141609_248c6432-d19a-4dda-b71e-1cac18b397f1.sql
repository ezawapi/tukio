
-- 1. Banner analytics table
CREATE TABLE public.banner_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id UUID NOT NULL REFERENCES public.promotional_banners(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'impression',
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_banner_analytics_banner_id ON public.banner_analytics(banner_id);
CREATE INDEX idx_banner_analytics_created_at ON public.banner_analytics(created_at DESC);

ALTER TABLE public.banner_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert banner analytics"
  ON public.banner_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view banner analytics"
  ON public.banner_analytics FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Banner history (snapshots)
CREATE TABLE public.banner_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id UUID NOT NULL REFERENCES public.promotional_banners(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_banner_history_banner_id ON public.banner_history(banner_id, created_at DESC);

ALTER TABLE public.banner_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view banner history"
  ON public.banner_history FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert banner history"
  ON public.banner_history FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banner history"
  ON public.banner_history FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Draft mode on promotional_banners
ALTER TABLE public.promotional_banners
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;

-- 4. Realtime for analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.banner_analytics;
