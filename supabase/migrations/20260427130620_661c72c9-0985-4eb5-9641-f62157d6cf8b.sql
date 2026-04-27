-- 1. Permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage permissions insert"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage permissions delete"
  ON public.role_permissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Default capabilities
INSERT INTO public.role_permissions (role, permission) VALUES
  ('moderator', 'events.moderate'),
  ('moderator', 'events.delete'),
  ('moderator', 'notifications.view'),
  ('admin', 'events.moderate'),
  ('admin', 'events.delete'),
  ('admin', 'events.publish'),
  ('admin', 'notifications.view'),
  ('admin', 'ads.manage'),
  ('admin', 'banners.manage'),
  ('admin', 'partners.manage'),
  ('admin', 'content.manage'),
  ('admin', 'categories.manage'),
  ('admin', 'users.manage'),
  ('admin', 'roles.manage'),
  ('admin', 'analytics.view')
ON CONFLICT DO NOTHING;

-- 2. Helper to validate URL strictly (mirrors src/lib/url-validation.ts)
CREATE OR REPLACE FUNCTION public.validate_safe_url(_url text, _field text)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text := _url;
BEGIN
  IF v IS NULL OR length(btrim(v)) = 0 THEN
    RETURN;
  END IF;
  v := btrim(v);

  IF v ~ '\s' THEN
    RAISE EXCEPTION 'Champ % invalide : l''URL ne doit contenir aucun espace.', _field
      USING ERRCODE = 'check_violation';
  END IF;

  IF v ~ '[\x00-\x1F\x7F]' THEN
    RAISE EXCEPTION 'Champ % invalide : caractères de contrôle interdits.', _field
      USING ERRCODE = 'check_violation';
  END IF;

  IF v ~* '^(javascript|data|vbscript|file|about|blob):' THEN
    RAISE EXCEPTION 'Champ % invalide : protocole interdit (javascript:, data:, vbscript:, file:, etc.).', _field
      USING ERRCODE = 'check_violation';
  END IF;

  IF v ~* '%(00|0a|0d|09|20)' THEN
    RAISE EXCEPTION 'Champ % invalide : séquences encodées suspectes (%%00, %%0A...).', _field
      USING ERRCODE = 'check_violation';
  END IF;

  IF v ~* '[?&](url|redirect|next|return|continue|dest|destination)=https?%3a' THEN
    RAISE EXCEPTION 'Champ % invalide : redirection ouverte détectée (paramètre ?url=, ?redirect=...).', _field
      USING ERRCODE = 'check_violation';
  END IF;

  IF v LIKE '//%' THEN
    RAISE EXCEPTION 'Champ % invalide : URL protocole-relative interdite (//domaine).', _field
      USING ERRCODE = 'check_violation';
  END IF;

  -- Internal path is OK
  IF v LIKE '/%' THEN
    RETURN;
  END IF;

  -- External must be http(s)
  IF v !~* '^https?://' THEN
    RAISE EXCEPTION 'Champ % invalide : doit commencer par /, http:// ou https://.', _field
      USING ERRCODE = 'check_violation';
  END IF;

  -- Reject userinfo
  IF v ~* '^https?://[^/@]*@' THEN
    RAISE EXCEPTION 'Champ % invalide : URL avec identifiants intégrés (user:pass@) interdite.', _field
      USING ERRCODE = 'check_violation';
  END IF;

  -- Reject raw IP host
  IF v ~* '^https?://\d+\.\d+\.\d+\.\d+([/:?#]|$)' THEN
    RAISE EXCEPTION 'Champ % invalide : adresse IP brute non autorisée.', _field
      USING ERRCODE = 'check_violation';
  END IF;

  -- Hostname must contain a dot
  IF substring(v from '^https?://([^/?#]+)') !~ '\.' THEN
    RAISE EXCEPTION 'Champ % invalide : domaine mal formé.', _field
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

-- 3. Trigger to enforce on partners
CREATE OR REPLACE FUNCTION public.partners_validate_urls()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.validate_safe_url(NEW.logo_url, 'logo_url');
  PERFORM public.validate_safe_url(NEW.website_url, 'website_url');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partners_validate_urls_trg ON public.partners;
CREATE TRIGGER partners_validate_urls_trg
  BEFORE INSERT OR UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.partners_validate_urls();