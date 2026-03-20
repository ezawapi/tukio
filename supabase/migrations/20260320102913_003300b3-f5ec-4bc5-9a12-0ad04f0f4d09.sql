
-- First nullify category references on existing events
UPDATE public.events SET category_id = NULL WHERE category_id IS NOT NULL;

-- Now delete old categories
DELETE FROM public.categories;

-- Insert new categories
INSERT INTO public.categories (name, icon, color) VALUES
  ('Formation', 'graduation-cap', 'bg-emerald'),
  ('Atelier', 'wrench', 'bg-amber'),
  ('Conférence', 'mic-2', 'bg-blue'),
  ('Sport et loisir', 'trophy', 'bg-green'),
  ('Art & Culture', 'palette', 'bg-purple'),
  ('Musique', 'music', 'bg-pink'),
  ('Festival', 'party-popper', 'bg-orange'),
  ('Religieux & Spirituel', 'church', 'bg-indigo'),
  ('Institutionnel', 'landmark', 'bg-slate'),
  ('Meeting', 'users', 'bg-cyan'),
  ('International', 'globe', 'bg-red'),
  ('Privé & Exclusif', 'lock', 'bg-rose'),
  ('Divers', 'sparkles', 'bg-teal');
