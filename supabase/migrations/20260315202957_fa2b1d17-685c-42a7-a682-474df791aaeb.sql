
-- Add new columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'FCFA';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url2 text;

-- Change default is_published to false for admin approval workflow
ALTER TABLE public.events ALTER COLUMN is_published SET DEFAULT false;

-- Add status column for approval workflow
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true) ON CONFLICT (id) DO NOTHING;

-- RLS policies for event-images bucket
CREATE POLICY "Anyone can view event images" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Authenticated users can upload event images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-images');
CREATE POLICY "Users can delete own event images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow admins to view all events (including unpublished) for admin dashboard
CREATE POLICY "Admins can view all events" ON public.events FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow organizers to view their own unpublished events
CREATE POLICY "Organizers can view own events" ON public.events FOR SELECT TO authenticated USING (auth.uid() = organizer_id);
