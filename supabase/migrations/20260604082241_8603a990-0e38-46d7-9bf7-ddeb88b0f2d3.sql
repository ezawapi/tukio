DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_campaigns_event_id_fkey') THEN
    ALTER TABLE public.notification_campaigns ADD CONSTRAINT notification_campaigns_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_analytics_campaign_id_fkey') THEN
    ALTER TABLE public.notification_analytics ADD CONSTRAINT notification_analytics_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.notification_campaigns(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_notifications_campaign_id_fkey') THEN
    ALTER TABLE public.user_notifications ADD CONSTRAINT user_notifications_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.notification_campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_notification_analytics_campaign_id ON public.notification_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_event_type ON public.notification_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_campaign_id ON public.user_notifications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_published_visibility_date ON public.events(date) WHERE is_published = true AND visibility = 'public';