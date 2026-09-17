-- 1) Replace SECURITY DEFINER view with an invoker view over a definer function
CREATE OR REPLACE FUNCTION public.list_public_profiles()
RETURNS TABLE(
  id uuid,
  slug text,
  display_name text,
  avatar_url text,
  cover_url text,
  bio text,
  organization_name text,
  organization_role text,
  website_url text,
  facebook_url text,
  instagram_url text,
  twitter_url text,
  tiktok_url text,
  linkedin_url text,
  video_url text,
  visibility_settings jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.slug, p.display_name, p.avatar_url, p.cover_url, p.bio,
         p.organization_name, p.organization_role, p.website_url,
         p.facebook_url, p.instagram_url, p.twitter_url, p.tiktok_url,
         p.linkedin_url, p.video_url, p.visibility_settings, p.created_at
  FROM public.profiles p;
$$;

REVOKE ALL ON FUNCTION public.list_public_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_profiles() TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = on) AS
  SELECT * FROM public.list_public_profiles();

GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

-- 2) Analytics: only real, active ads/banners and known event types
CREATE OR REPLACE FUNCTION public.ad_is_active(_ad_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ads a
    WHERE a.id = _ad_id
      AND a.is_active = true
      AND (a.starts_at IS NULL OR a.starts_at <= now())
      AND (a.ends_at IS NULL OR a.ends_at >= now())
  );
$$;

CREATE OR REPLACE FUNCTION public.banner_is_active(_banner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.promotional_banners b
    WHERE b.id = _banner_id AND b.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.ad_is_active(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.banner_is_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ad_is_active(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.banner_is_active(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can insert ad analytics" ON public.ad_analytics;
DROP POLICY IF EXISTS "Authenticated can insert ad analytics" ON public.ad_analytics;
CREATE POLICY "Valid ad analytics inserts" ON public.ad_analytics
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    event_type IN ('impression', 'click')
    AND public.ad_is_active(ad_id)
    AND (user_agent IS NULL OR length(user_agent) <= 400)
    AND (referrer IS NULL OR length(referrer) <= 500)
  );

DROP POLICY IF EXISTS "Anyone can insert banner analytics" ON public.banner_analytics;
DROP POLICY IF EXISTS "Authenticated can insert banner analytics" ON public.banner_analytics;
CREATE POLICY "Valid banner analytics inserts" ON public.banner_analytics
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    event_type IN ('impression', 'click')
    AND public.banner_is_active(banner_id)
    AND (user_agent IS NULL OR length(user_agent) <= 400)
    AND (referrer IS NULL OR length(referrer) <= 500)
  );

-- 3) login_events: constrain what unauthenticated clients may write
DROP POLICY IF EXISTS "Anyone can record a login attempt" ON public.login_events;
CREATE POLICY "Constrained login attempt logging" ON public.login_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    provider IN ('email', 'google')
    AND (email IS NULL OR length(email) <= 255)
    AND (reason IS NULL OR length(reason) <= 200)
    AND (user_agent IS NULL OR length(user_agent) <= 400)
    AND (
      -- signed-in context: may only log for itself
      (auth.uid() IS NOT NULL AND user_id = auth.uid())
      -- anonymous context: failed attempts only, never attributed to a user
      OR (auth.uid() IS NULL AND user_id IS NULL AND success = false)
    )
  );

-- 4) role_permissions: privileged roles only
DROP POLICY IF EXISTS "Authenticated can view permissions" ON public.role_permissions;
CREATE POLICY "Privileged users can view permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );