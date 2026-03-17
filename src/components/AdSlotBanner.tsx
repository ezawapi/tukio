import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AdSlotBannerProps {
  slotCode: string;
  className?: string;
  compact?: boolean;
}

const AdSlotBanner = ({ slotCode, className, compact = false }: AdSlotBannerProps) => {
  const [ad, setAd] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAd = async () => {
      const { data: slot } = await supabase
        .from("ad_slots")
        .select("id, name, code, recommended_width, recommended_height")
        .eq("code", slotCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!mounted || !slot) {
        setAd(null);
        return;
      }

      const { data: ads } = await supabase
        .from("ads")
        .select("id, title, body, cta_label, image_url, target_url, display_order, starts_at, ends_at, slot_id")
        .eq("slot_id", slot.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(1);

      if (!mounted) return;
      setAd(ads?.[0] ? { ...ads[0], slot } : null);
    };

    fetchAd();

    return () => {
      mounted = false;
    };
  }, [slotCode]);

  if (!ad) return null;

  const Wrapper = ad.target_url ? "a" : "div";

  return (
    <Wrapper
      {...(ad.target_url
        ? {
            href: ad.target_url,
            target: "_blank",
            rel: "noopener noreferrer",
          }
        : {})}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-warm",
        className,
      )}
    >
      <div className={cn("grid gap-0", compact ? "sm:grid-cols-[140px_minmax(0,1fr)]" : "md:grid-cols-[220px_minmax(0,1fr)]")}>
        {ad.image_url ? (
          <div className={cn("overflow-hidden bg-muted", compact ? "h-32 sm:h-full" : "h-40 md:h-full")}>
            <img
              src={ad.image_url}
              alt={ad.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className={cn("space-y-3", compact ? "p-4" : "p-5") }>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Publicité</Badge>
            <Badge variant="secondary">{ad.slot?.name}</Badge>
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold text-card-foreground">{ad.title}</h3>
            {ad.body ? <p className="font-body text-sm text-muted-foreground">{ad.body}</p> : null}
          </div>

          {ad.cta_label ? <p className="font-body text-sm font-semibold text-primary">{ad.cta_label} →</p> : null}
        </div>
      </div>
    </Wrapper>
  );
};

export default AdSlotBanner;
