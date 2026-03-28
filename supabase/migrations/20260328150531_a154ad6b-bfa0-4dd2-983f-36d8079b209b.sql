
-- Fix the overly permissive insert policy on user_notifications
DROP POLICY "System can insert notifications" ON public.user_notifications;
CREATE POLICY "Users can receive notifications" ON public.user_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
