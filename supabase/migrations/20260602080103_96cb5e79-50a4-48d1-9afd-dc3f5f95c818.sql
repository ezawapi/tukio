
DROP FUNCTION IF EXISTS public.send_promotional_notification(uuid, text, text, text);

CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid,
  title text NOT NULL,
  body text,
  target text NOT NULL DEFAULT 'all',
  sender_id uuid,
  recipients_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.notification_campaigns TO authenticated;
GRANT ALL ON public.notification_campaigns TO service_role;
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view campaigns" ON public.notification_campaigns;
DROP POLICY IF EXISTS "Admins insert campaigns" ON public.notification_campaigns;
CREATE POLICY "Admins view campaigns" ON public.notification_campaigns FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert campaigns" ON public.notification_campaigns FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.notification_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid,
  notification_id uuid,
  user_id uuid,
  event_id uuid,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_analytics_campaign ON public.notification_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notif_analytics_type ON public.notification_analytics(event_type);
GRANT SELECT, INSERT ON public.notification_analytics TO authenticated;
GRANT ALL ON public.notification_analytics TO service_role;
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view notif analytics" ON public.notification_analytics;
DROP POLICY IF EXISTS "Users insert own notif analytics" ON public.notification_analytics;
CREATE POLICY "Admins view notif analytics" ON public.notification_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own notif analytics" ON public.notification_analytics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS campaign_id uuid;

CREATE OR REPLACE FUNCTION public.send_promotional_notification(_event_id uuid, _title text, _body text, _target text DEFAULT 'all'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  campaign uuid;
  inserted_count integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  INSERT INTO public.notification_campaigns (event_id, title, body, target, sender_id)
  VALUES (_event_id, COALESCE(NULLIF(btrim(_title), ''), 'Promotion'), NULLIF(btrim(_body), ''), COALESCE(_target, 'all'), auth.uid())
  RETURNING id INTO campaign;

  WITH ins AS (
    INSERT INTO public.user_notifications (user_id, title, body, type, related_event_id, campaign_id)
    SELECT p.id,
           COALESCE(NULLIF(btrim(_title), ''), 'Promotion'),
           NULLIF(btrim(_body), ''),
           'promotion',
           _event_id,
           campaign
    FROM public.profiles p
    WHERE p.id IS NOT NULL
      AND (
        _target = 'all'
        OR (_target = 'favorites' AND EXISTS (
          SELECT 1 FROM public.favorites f WHERE f.user_id = p.id AND f.event_id = _event_id
        ))
      )
    RETURNING id, user_id
  )
  INSERT INTO public.notification_analytics (campaign_id, notification_id, user_id, event_id, event_type)
  SELECT campaign, ins.id, ins.user_id, _event_id, 'sent' FROM ins;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  UPDATE public.notification_campaigns SET recipients_count = inserted_count WHERE id = campaign;
  RETURN campaign;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_notification_event(_notification_id uuid, _event_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  n record;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF _event_type NOT IN ('opened', 'clicked', 'failed') THEN
    RAISE EXCEPTION 'Invalid event_type';
  END IF;
  SELECT id, user_id, campaign_id, related_event_id INTO n
    FROM public.user_notifications
    WHERE id = _notification_id AND user_id = auth.uid();
  IF NOT FOUND OR n.campaign_id IS NULL THEN RETURN; END IF;

  IF _event_type = 'opened' AND EXISTS (
    SELECT 1 FROM public.notification_analytics
    WHERE campaign_id = n.campaign_id AND user_id = n.user_id AND event_type = 'opened'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.notification_analytics (campaign_id, notification_id, user_id, event_id, event_type)
  VALUES (n.campaign_id, n.id, n.user_id, n.related_event_id, _event_type);
END;
$function$;
