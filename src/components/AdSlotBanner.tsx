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

const getAnimationClass = (anim: string) => {
  switch (anim) {
    case "fade-in": return "animate-[fade-in_1.5s_ease-out]";
    case "slide-up": return "animate-[slideUp_1s_ease-out]";
    case "slide-left": return "animate-[slideLeft_1s_ease-out]";
    case "pulse": return "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]";
    case "bounce": return "animate-bounce";
    case "typewriter": return "animate-[typewriter_3s_steps(40)]";
    default: return "";
  }
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
        .select("id, title, body, cta_label, image_url, target_url, display_order, starts_at, ends_at, slot_id, text_color, bg_color, bg_gradient, text_animation")
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

  useEffect(() => {
    if (ad?.id && !tracked.current) {
      tracked.current = true;
      trackEvent(ad.id, "impression");
    }
  }, [ad?.id]);

  if (!ad?.image_url && !ad?.body) return null;

  const handleClick = () => { trackEvent(ad.id, "click"); };

  const hasTextContent = !!ad.body;
  const bannerStyle: React.CSSProperties = {
    backgroundColor: ad.bg_gradient ? undefined : (ad.bg_color || undefined),
    backgroundImage: ad.bg_gradient || undefined,
  };

  const content = (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-warm", className)}
      style={hasTextContent ? bannerStyle : undefined}>
      {ad.image_url && (
        <AdMedia src={ad.image_url} title={ad.title || "Publicité"} className={cn(compact ? "h-36 sm:h-44" : "h-44 sm:h-56 md:h-64")} />
      )}
      {hasTextContent && (
        <div className="p-4 sm:p-5 space-y-2">
          <p className={`text-sm sm:text-base font-semibold leading-snug ${getAnimationClass(ad.text_animation || "none")}`}
            style={{ color: ad.text_color || "#ffffff" }}>
            {ad.body}
          </p>
          {ad.cta_label && (
            <span className="inline-block text-xs px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm font-medium"
              style={{ color: ad.text_color || "#ffffff" }}>
              {ad.cta_label}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!ad.target_url) return content;

  return (
    <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="block" onClick={handleClick}>
      {content}
    </a>
  );
};

export default AdSlotBanner;
