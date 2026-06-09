
-- Tighten notification_analytics INSERT to require user_id = auth.uid()
DROP POLICY IF EXISTS "Users can insert own notification analytics" ON public.notification_analytics;
DROP POLICY IF EXISTS "Users insert own notification analytics" ON public.notification_analytics;
DROP POLICY IF EXISTS "Insert notification analytics" ON public.notification_analytics;

CREATE POLICY "Users insert own notification analytics"
ON public.notification_analytics
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Admins insert any notification analytics"
ON public.notification_analytics
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Restrict follows SELECT to follower or organizer only
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Authenticated users can view follows" ON public.follows;
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Public can view follows" ON public.follows;

CREATE POLICY "Users view own follow relationships"
ON public.follows
FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = organizer_id);

CREATE POLICY "Admins view all follows"
ON public.follows
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
