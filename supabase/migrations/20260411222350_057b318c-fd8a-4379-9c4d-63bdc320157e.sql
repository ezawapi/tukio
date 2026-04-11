
-- Events: add missing columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS live_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_name text;

-- Profiles: add extended contact fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_primary text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_secondary text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS physical_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url text;

-- Promotional banners: add layout/styling fields
ALTER TABLE public.promotional_banners ADD COLUMN IF NOT EXISTS width_percent integer DEFAULT 100;
ALTER TABLE public.promotional_banners ADD COLUMN IF NOT EXISTS height_px integer;
ALTER TABLE public.promotional_banners ADD COLUMN IF NOT EXISTS border_width integer DEFAULT 0;
ALTER TABLE public.promotional_banners ADD COLUMN IF NOT EXISTS border_color text DEFAULT '#000000';
ALTER TABLE public.promotional_banners ADD COLUMN IF NOT EXISTS text_lines jsonb DEFAULT '[]'::jsonb;
