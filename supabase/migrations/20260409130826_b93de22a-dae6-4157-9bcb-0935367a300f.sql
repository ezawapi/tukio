-- Add video_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS video_url text;

-- Create promotional_banners table
CREATE TABLE public.promotional_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  subtitle text,
  body text,
  image_url text,
  button_label text,
  button_url text,
  bg_color text DEFAULT '#f59e0b',
  bg_gradient text,
  text_color text DEFAULT '#ffffff',
  title_font_size text DEFAULT '2xl',
  subtitle_font_size text DEFAULT 'base',
  text_animation text DEFAULT 'none',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners are viewable by everyone"
ON public.promotional_banners FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert banners"
ON public.promotional_banners FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banners"
ON public.promotional_banners FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners"
ON public.promotional_banners FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_promotional_banners_updated_at
BEFORE UPDATE ON public.promotional_banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();