
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS bg_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bg_gradient text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS text_animation text DEFAULT 'none';
