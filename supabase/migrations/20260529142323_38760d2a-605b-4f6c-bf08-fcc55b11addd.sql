DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id, slug, display_name, avatar_url, cover_url, bio,
  organization_name, organization_role,
  website_url, facebook_url, instagram_url, twitter_url, tiktok_url, linkedin_url,
  video_url, visibility_settings, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;