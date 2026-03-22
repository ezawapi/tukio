INSERT INTO public.ad_slots (name, code, placement, format, recommended_width, recommended_height, is_active)
VALUES
  ('Accueil bas gauche', 'home-bottom-left', 'home-bottom', 'banner', 400, 200, true),
  ('Accueil bas centre', 'home-bottom-center', 'home-bottom', 'banner', 400, 200, true),
  ('Accueil bas droite', 'home-bottom-right', 'home-bottom', 'banner', 400, 200, true)
ON CONFLICT (code) DO NOTHING;