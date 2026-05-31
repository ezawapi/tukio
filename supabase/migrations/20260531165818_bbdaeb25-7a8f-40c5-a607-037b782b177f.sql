GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;

INSERT INTO public.site_content (key, value)
VALUES
  ('home_badge_text', '🎉 La plateforme événementielle #1'),
  ('home_hero_title', 'Découvrez les événements qui comptent'),
  ('home_hero_description', 'Explorez, suivez et participez aux événements publics et privés. Concerts, conférences, festivals et bien plus encore.'),
  ('home_search_placeholder', 'Rechercher un événement...'),
  ('home_city_placeholder', 'Ville'),
  ('home_search_button', 'Rechercher')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.send_promotional_notification(
  _event_id uuid,
  _title text,
  _body text,
  _target text DEFAULT 'all'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  INSERT INTO public.user_notifications (user_id, title, body, type, related_event_id)
  SELECT p.id,
         COALESCE(NULLIF(btrim(_title), ''), 'Promotion'),
         NULLIF(btrim(_body), ''),
         'promotion',
         _event_id
  FROM public.profiles p
  WHERE p.id IS NOT NULL
    AND (
      _target = 'all'
      OR (_target = 'favorites' AND EXISTS (
        SELECT 1
        FROM public.favorites f
        WHERE f.user_id = p.id
          AND f.event_id = _event_id
      ))
    );

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_promotional_notification(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_promotional_notification(uuid, text, text, text) TO service_role;