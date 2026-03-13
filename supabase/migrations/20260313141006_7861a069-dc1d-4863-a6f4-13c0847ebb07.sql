
-- Add contact fields to events table
ALTER TABLE public.events ADD COLUMN phone1 text;
ALTER TABLE public.events ADD COLUMN phone2 text;
ALTER TABLE public.events ADD COLUMN contact_email text;
ALTER TABLE public.events ADD COLUMN website_url text;
ALTER TABLE public.events ADD COLUMN facebook_url text;
ALTER TABLE public.events ADD COLUMN instagram_url text;
ALTER TABLE public.events ADD COLUMN twitter_url text;
ALTER TABLE public.events ADD COLUMN tiktok_url text;

-- Create user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: admins can see all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Admin notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'new_event',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: auto-create notification on new event
CREATE OR REPLACE FUNCTION public.notify_admin_new_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (event_id, type)
  VALUES (NEW.id, 'new_event');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_event_notify_admin
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_event();

-- Allow admins to delete any event
CREATE POLICY "Admins can delete any event"
ON public.events
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any event (e.g. unpublish)
CREATE POLICY "Admins can update any event"
ON public.events
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
