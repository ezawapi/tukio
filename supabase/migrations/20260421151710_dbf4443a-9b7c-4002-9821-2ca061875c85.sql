INSERT INTO public.promotional_banners (
  title, subtitle, body, button_label, button_url,
  bg_color, bg_gradient, text_color, text_animation,
  title_font_size, subtitle_font_size, display_order, is_active, width_percent
) VALUES
(
  'Créez votre propre événement ✨',
  'Organisateurs',
  'Publiez gratuitement vos concerts, conférences ou festivals et touchez des milliers de participants.',
  'Commencer',
  '/create',
  NULL,
  'linear-gradient(135deg, hsl(35,70%,52%), hsl(15,75%,50%))',
  '#ffffff',
  'fade-in',
  'xl',
  'sm',
  10,
  true,
  100
),
(
  'Rejoignez la communauté Tukio',
  'Inscrivez-vous',
  'Sauvegardez vos favoris, recevez des alertes et ne ratez plus aucun événement près de chez vous.',
  'S''inscrire',
  '/auth',
  '#c97050',
  NULL,
  '#ffffff',
  'slide-up',
  'lg',
  'sm',
  20,
  true,
  100
),
(
  'Explorez la carte interactive 🗺️',
  'Géolocalisation',
  'Trouvez les événements les plus proches de votre position en un clin d''œil.',
  'Voir la carte',
  '/explorer',
  NULL,
  'linear-gradient(135deg, hsl(205,65%,30%), hsl(210,70%,45%))',
  '#ffffff',
  'fade-in',
  'lg',
  'sm',
  20,
  true,
  100
);