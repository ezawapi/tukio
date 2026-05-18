-- Allow admins, moderators, and event organizers to delete comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Authors organizers admins moderators can delete comments"
ON public.comments
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderator'::app_role)
  OR public.is_event_organizer(event_id, auth.uid())
);