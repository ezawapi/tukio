-- Support private events, invitations, attendance, ads, and ticketing

-- Extend events with visibility + edit workflow fields
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
ADD COLUMN IF NOT EXISTS ad_slot_hint text,
ADD COLUMN IF NOT EXISTS last_submitted_at timestamp with time zone NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS updated_by_admin boolean NOT NULL DEFAULT false;

-- Keep visibility values constrained via trigger-safe function instead of check constraints
CREATE OR REPLACE FUNCTION public.validate_event_visibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility NOT IN ('public', 'private') THEN
    RAISE EXCEPTION 'Invalid visibility: %', NEW.visibility;
  END IF;

  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;

  NEW.last_submitted_at = COALESCE(NEW.last_submitted_at, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_event_visibility_trigger ON public.events;
CREATE TRIGGER validate_event_visibility_trigger
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.validate_event_visibility();

-- Ad placements managed from admin
CREATE TABLE IF NOT EXISTS public.ad_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  description text,
  placement text NOT NULL,
  recommended_width integer,
  recommended_height integer,
  format text NOT NULL DEFAULT 'image',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ad slots are viewable by everyone"
ON public.ad_slots
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert ad slots"
ON public.ad_slots
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ad slots"
ON public.ad_slots
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ad slots"
ON public.ad_slots
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_ad_slots_updated_at ON public.ad_slots;
CREATE TRIGGER update_ad_slots_updated_at
BEFORE UPDATE ON public.ad_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.ad_slots(id) ON DELETE CASCADE,
  title text NOT NULL,
  image_url text,
  target_url text,
  body text,
  cta_label text,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ads are viewable by everyone"
ON public.ads
FOR SELECT
USING (
  (is_active = true)
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can insert ads"
ON public.ads
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ads"
ON public.ads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ads"
ON public.ads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_ads_updated_at ON public.ads;
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Private event invitations and QR attendance
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invited_user_id uuid,
  invited_email text,
  invited_name text,
  qr_code_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  attendance_status text NOT NULL DEFAULT 'not_scanned',
  invited_by uuid NOT NULL,
  scanned_at timestamp with time zone,
  scanned_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers and admins can view invitations"
ON public.event_invitations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR invited_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Organizers and admins can insert invitations"
ON public.event_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Organizers and admins can update invitations"
ON public.event_invitations
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
  OR invited_user_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
  OR invited_user_id = auth.uid()
);

CREATE POLICY "Organizers and admins can delete invitations"
ON public.event_invitations
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS update_event_invitations_updated_at ON public.event_invitations;
CREATE TRIGGER update_event_invitations_updated_at
BEFORE UPDATE ON public.event_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_view_event(_event_id uuid)
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
      AND (
        e.is_published = true
        OR e.organizer_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR (
          e.visibility = 'private'
          AND EXISTS (
            SELECT 1
            FROM public.event_invitations i
            WHERE i.event_id = e.id
              AND (
                i.invited_user_id = auth.uid()
              )
          )
        )
      )
  );
$$;

DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Organizers can view own events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;

CREATE POLICY "Users can view eligible events"
ON public.events
FOR SELECT
USING (
  (
    visibility = 'public' AND is_published = true
  )
  OR auth.uid() = organizer_id
  OR public.has_role(auth.uid(), 'admin')
  OR (
    visibility = 'private'
    AND EXISTS (
      SELECT 1 FROM public.event_invitations i
      WHERE i.event_id = id
        AND i.invited_user_id = auth.uid()
    )
  )
);

-- Ticketing
CREATE TABLE IF NOT EXISTS public.ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'FCFA',
  quantity_available integer,
  quantity_sold integer NOT NULL DEFAULT 0,
  sales_start_at timestamp with time zone,
  sales_end_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible ticket types follow event visibility"
ON public.ticket_types
FOR SELECT
USING (public.can_view_event(event_id));

CREATE POLICY "Organizers and admins can manage ticket types"
ON public.ticket_types
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS update_ticket_types_updated_at ON public.ticket_types;
CREATE TRIGGER update_ticket_types_updated_at
BEFORE UPDATE ON public.ticket_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ticket_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_type_id uuid REFERENCES public.ticket_types(id) ON DELETE SET NULL,
  buyer_user_id uuid,
  buyer_email text NOT NULL,
  buyer_name text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'FCFA',
  payment_provider text NOT NULL DEFAULT 'stripe',
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id text UNIQUE,
  qr_code_token text NOT NULL UNIQUE,
  attendance_status text NOT NULL DEFAULT 'not_scanned',
  scanned_at timestamp with time zone,
  scanned_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers organizers and admins can view ticket orders"
ON public.ticket_orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR buyer_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create ticket orders"
ON public.ticket_orders
FOR INSERT
TO authenticated
WITH CHECK (
  buyer_user_id = auth.uid()
  AND public.can_view_event(event_id)
);

CREATE POLICY "Buyers organizers and admins can update ticket orders"
ON public.ticket_orders
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR buyer_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR buyer_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS update_ticket_orders_updated_at ON public.ticket_orders;
CREATE TRIGGER update_ticket_orders_updated_at
BEFORE UPDATE ON public.ticket_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed named ad slots for admin clarity
INSERT INTO public.ad_slots (name, code, description, placement, recommended_width, recommended_height, format)
VALUES
  ('Accueil - Hero latéral', 'home-hero-side', 'Bloc publicitaire à côté ou sous le hero selon écran', 'home', 300, 600, 'image'),
  ('Accueil - Entre catégories et live', 'home-between-categories-live', 'Bannière entre catégories et événements live', 'home', 970, 250, 'image'),
  ('Accueil - Avant dernières activités', 'home-before-latest', 'Bannière avant la section des activités récentes', 'home', 970, 250, 'image'),
  ('Liste événements - Haut de page', 'events-top', 'Bannière au-dessus des résultats', 'events', 970, 250, 'image'),
  ('Détail événement - Sidebar', 'event-sidebar', 'Encart dans la colonne latérale du détail', 'event-detail', 300, 250, 'image'),
  ('Explorer - Haut de carte', 'explorer-top', 'Bannière au-dessus de la carte interactive', 'explorer', 970, 250, 'image')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_slot_active ON public.ads(slot_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_invitations_event ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_user ON public.event_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON public.ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_event ON public.ticket_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_buyer ON public.ticket_orders(buyer_user_id);