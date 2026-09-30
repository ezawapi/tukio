ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blog_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;