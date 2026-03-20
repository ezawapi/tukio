import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdMedia from "@/components/AdMedia";
import { cn } from "@/lib/utils";

interface AdSlotBannerProps {
  slotCode: string;
  className?: string;
  compact?: boolean;
}

const trackEvent = async (adId: string, eventType: "impression" | "click") => {
  try {
    await supabase.from("ad_analytics").insert({
      ad_id: adId,
      event_type: eventType,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    });
  } catch {}
};

const AdSlotBanner = ({ slotCode, className, compact = false }: AdSlotBannerProps) => {
  const [ad, setAd] = useState<any | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    let mounted = true;

    const fetchAd = async () => {
      const { data: slot } = await supabase
        .from("ad_slots")
        .select("id, name, code, recommended_width, recommended_height")
        .eq("code", slotCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!mounted || !slot) { setAd(null); return; }

      const { data: ads } = await supabase
        .from("ads")
        .select("id, title, image_url, target_url, display_order, starts_at, ends_at, slot_id")
        .eq("slot_id", slot.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(1);

      if (!mounted) return;
      setAd(ads?.[0] ? { ...ads[0], slot } : null);
    };

    fetchAd();
    return () => { mounted = false; };
  }, [slotCode]);

  // Track impression once
  useEffect(() => {
    if (ad?.id && !tracked.current) {
      tracked.current = true;
      trackEvent(ad.id, "impression");
    }
  }, [ad?.id]);

  if (!ad?.image_url) return null;

  const handleClick = () => {
    trackEvent(ad.id, "click");
  };

  const mediaOnly = (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-warm", className)}>
      <AdMedia src={ad.image_url} title={ad.title || "Publicité"} className={cn(compact ? "h-36 sm:h-44" : "h-44 sm:h-56 md:h-64")} />
    </div>
  );

  if (!ad.target_url) return mediaOnly;

  return (
    <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="block" onClick={handleClick}>
      {mediaOnly}
    </a>
  );
};

export default AdSlotBanner;
