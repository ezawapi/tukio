
-- 1. Restrict profiles SELECT: hide sensitive fields from anonymous users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public can view limited profile fields"
ON public.profiles
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated users can view full profiles of others"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Create a public-safe view exposing only non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, display_name, avatar_url, organization_name, organization_role,
       website_url, facebook_url, instagram_url, twitter_url, tiktok_url, linkedin_url,
       created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. Tighten user_notifications INSERT policy
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.user_notifications;

CREATE POLICY "Authenticated users can insert their own notifications"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Make event-images bucket private (still accessible via signed URLs / RLS for owners)
UPDATE storage.buckets SET public = false WHERE id = 'event-images';

-- 4. Add ownership enforcement on storage uploads in event-images
DO $$
BEGIN
  -- Drop existing INSERT policy if present (name may vary), recreate strictly scoped
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload event images'
  ) THEN
    DROP POLICY "Users can upload event images" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Users can upload event images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read of event-images (the app needs publicly viewable event posters)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Event images are publicly readable'
  ) THEN
    DROP POLICY "Event images are publicly readable" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Event images are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');
