-- Helper: check organizer ownership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_event_organizer(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = _event_id
      AND e.organizer_id = _user_id
  );
$$;

-- Helper: check invitation eligibility for private events
CREATE OR REPLACE FUNCTION public.is_invited_to_event(_event_id uuid, _user_id uuid, _email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_invitations i
    WHERE i.event_id = _event_id
      AND (
        i.invited_user_id = _user_id
        OR (
          _email IS NOT NULL
          AND i.invited_email IS NOT NULL
          AND lower(i.invited_email) = lower(_email)
        )
      )
  );
$$;

-- Rebuild events SELECT policy to avoid cross-table recursion
DROP POLICY IF EXISTS "Users can view eligible events" ON public.events;
CREATE POLICY "Users can view eligible events"
ON public.events
FOR SELECT
TO public
USING (
  (
    visibility = 'public'
    AND is_published = true
  )
  OR auth.uid() = organizer_id
  OR public.has_role(auth.uid(), 'admin')
  OR (
    visibility = 'private'
    AND public.is_invited_to_event(id, auth.uid(), auth.jwt() ->> 'email')
  )
);

-- Rebuild invitation policies to use security-definer helper
DROP POLICY IF EXISTS "Organizers and admins can view invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Organizers and admins can insert invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Organizers and admins can update invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Organizers and admins can delete invitations" ON public.event_invitations;

CREATE POLICY "Organizers and admins can view invitations"
ON public.event_invitations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_event_organizer(event_id, auth.uid())
  OR invited_user_id = auth.uid()
  OR (
    invited_email IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND lower(invited_email) = lower(auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Organizers and admins can insert invitations"
ON public.event_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_event_organizer(event_id, auth.uid())
);

CREATE POLICY "Organizers and admins can update invitations"
ON public.event_invitations
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_event_organizer(event_id, auth.uid())
  OR invited_user_id = auth.uid()
  OR (
    invited_email IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND lower(invited_email) = lower(auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_event_organizer(event_id, auth.uid())
  OR invited_user_id = auth.uid()
  OR (
    invited_email IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND lower(invited_email) = lower(auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Organizers and admins can delete invitations"
ON public.event_invitations
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_event_organizer(event_id, auth.uid())
);