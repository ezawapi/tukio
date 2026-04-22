
-- Recreate the view with security_invoker so it respects caller permissions/RLS
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, display_name, avatar_url, organization_name, organization_role,
       website_url, facebook_url, instagram_url, twitter_url, tiktok_url, linkedin_url,
       created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Restore public bucket (event posters are intentionally public, served via getPublicUrl)
UPDATE storage.buckets SET public = true WHERE id = 'event-images';
