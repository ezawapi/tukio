GRANT SELECT ON public.ad_slots, public.ads, public.promotional_banners, public.partners TO anon;
GRANT SELECT ON public.ad_slots, public.ads, public.promotional_banners, public.partners TO authenticated;

DROP POLICY IF EXISTS "Ad slots are viewable by everyone" ON public.ad_slots;
CREATE POLICY "Public can view active ad slots"
ON public.ad_slots FOR SELECT TO anon, authenticated
USING (is_active = true);
CREATE POLICY "Admins can view all ad slots"
ON public.ad_slots FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Ads are viewable by everyone" ON public.ads;
CREATE POLICY "Public can view active scheduled ads"
ON public.ads FOR SELECT TO anon, authenticated
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);
CREATE POLICY "Admins can view all ads"
ON public.ads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Banners are viewable by everyone" ON public.promotional_banners;
CREATE POLICY "Public can view active banners"
ON public.promotional_banners FOR SELECT TO anon, authenticated
USING (is_active = true AND is_draft = false);
CREATE POLICY "Admins can view all banners"
ON public.promotional_banners FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));