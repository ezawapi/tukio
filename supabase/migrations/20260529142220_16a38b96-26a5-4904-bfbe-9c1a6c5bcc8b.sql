DROP POLICY IF EXISTS "Public can view limited profile fields" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.public_profiles TO anon;