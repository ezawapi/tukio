
-- Table for admin-managed site content (footer, about, etc.)
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site content viewable by everyone" ON public.site_content FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert site content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site content" ON public.site_content FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete site content" ON public.site_content FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed default content
INSERT INTO public.site_content (key, value) VALUES
  ('footer_description', 'Tukio centralise les activités, les lieux et le suivi de vos publications sur tous les écrans.'),
  ('footer_contact_email', 'contact@tukio.app'),
  ('about_intro', 'Tukio est la plateforme africaine de référence pour découvrir, organiser et promouvoir des événements et activités locales. Notre mission : connecter les communautés à travers des expériences culturelles, éducatives et sociales.'),
  ('about_vision', 'Nous croyons que chaque événement mérite d''être vu. Que ce soit un festival de musique, une conférence académique, un atelier créatif ou une rencontre communautaire, Tukio vous aide à trouver ce qui se passe autour de vous et à y participer. Basée en Afrique, notre équipe travaille chaque jour pour rendre la découverte d''événements plus simple, plus inclusive et plus connectée.');

-- User notifications table
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  is_favorite boolean NOT NULL DEFAULT false,
  related_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.user_notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.user_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Function to notify all users when a new event is published
CREATE OR REPLACE FUNCTION public.notify_users_new_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
    INSERT INTO public.user_notifications (user_id, title, body, type, related_event_id)
    SELECT p.id, 'Nouvel événement publié', NEW.title, 'new_event', NEW.id
    FROM public.profiles p
    WHERE p.id != COALESCE(NEW.organizer_id, '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_published
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_new_event();
