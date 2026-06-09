
-- 1) Restrict profiles SELECT to self + admin/moderator. Other users go through public_profiles view.
DROP POLICY IF EXISTS "Authenticated users can view full profiles of others" ON public.profiles;

CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
);

-- 2) Make public_profiles view bypass RLS (security definer) so it can serve non-sensitive
--    fields for any user. The view already excludes phone_primary, phone_secondary,
--    physical_address, is_blocked, account_type, email, role.
ALTER VIEW public.public_profiles SET (security_invoker = false);
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3) Add UPDATE policy on storage.objects for event-images to prevent overwriting
--    other users' files (folder must match auth.uid()).
DROP POLICY IF EXISTS "Users can update own event images" ON storage.objects;
CREATE POLICY "Users can update own event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
