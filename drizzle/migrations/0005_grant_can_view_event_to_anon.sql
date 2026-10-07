-- Les politiques RLS de comments et ticket_types appellent public.can_view_event
-- pour tous les rôles (y compris anon), mais EXECUTE n'était accordé qu'à authenticated.
-- Résultat : "permission denied for function can_view_event" pour les visiteurs non connectés.
-- La fonction est une simple vérification de visibilité en lecture : l'accorder à anon est sûr.
GRANT EXECUTE ON FUNCTION public.can_view_event(uuid) TO anon;