
ALTER VIEW public.public_profiles SET (security_invoker = true);

DROP POLICY IF EXISTS "Authenticated can view follows" ON public.follows;

DROP POLICY IF EXISTS "Users insert own notif analytics" ON public.notification_analytics;
