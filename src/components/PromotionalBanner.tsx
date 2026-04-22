import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import bannerFallback from "@/assets/banner-fallback-tukio.jpg";

const MAX_LEN = { title: 40, subtitle: 25, body: 140, button: 20 };

const truncate = (s: string | null | undefined, max: number) => {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
};

const getAnimationClass = (anim: string) => {
  switch (anim) {
    case "fade-in": return "animate-[fade-in_1.5s_ease-out]";
    case "slide-up": return "animate-[slideUp_1s_ease-out]";
    case "slide-left": return "animate-[slideLeft_1s_ease-out]";
    case "pulse": return "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]";
    case "bounce": return "animate-bounce";
    default: return "";
  }
};

const trackBannerEvent = async (bannerId: string, eventType: "impression" | "click") => {
  try {
    await supabase.from("banner_analytics").insert({
      banner_id: bannerId,
      event_type: eventType,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    });
  } catch {/* silent */}
};

export const renderBannerCard = (banner: any) => {
  const style: React.CSSProperties = {
    backgroundColor: banner.bg_gradient ? undefined : (banner.bg_color || "#f59e0b"),
    backgroundImage: banner.bg_gradient || undefined,
    color: banner.text_color || "#ffffff",
    border: banner.border_width ? `${banner.border_width}px solid ${banner.border_color || "#000"}` : undefined,
  };

  const animClass = getAnimationClass(banner.text_animation || "none");
  const hasImage = !!banner.image_url;
  const imgSrc = banner.image_url || bannerFallback;

  return (
    <div
      className="overflow-hidden rounded-2xl p-5 sm:p-6 relative h-full flex flex-col min-h-[260px] sm:min-h-[290px] transition-transform hover:-translate-y-0.5"
      style={style}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_70%)]" />
      <img
        src={imgSrc}
        alt=""
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover ${hasImage ? "opacity-25 mix-blend-overlay" : "opacity-60"}`}
      />
      {!hasImage && <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />}
      <div className="relative z-10 flex flex-col h-full">
        <p className={`font-body text-xs sm:text-sm opacity-80 mb-2 min-h-[1.25rem] line-clamp-1 ${animClass}`}>
          {truncate(banner.subtitle, MAX_LEN.subtitle) || "\u00A0"}
        </p>
        <h2 className={`font-display font-bold leading-tight text-xl sm:text-2xl line-clamp-2 ${animClass}`}>
          {truncate(banner.title, MAX_LEN.title)}
        </h2>
        <p className={`font-body text-xs sm:text-sm opacity-90 mt-3 line-clamp-3 min-h-[3rem] ${animClass}`}>
          {truncate(banner.body, MAX_LEN.body) || "\u00A0"}
        </p>
        <div className="mt-auto pt-4">
          {banner.button_label ? (
            <span
              className="inline-block px-4 py-2 rounded-lg font-body font-medium text-xs sm:text-sm border transition-colors hover:bg-white/20 truncate max-w-full"
              style={{ borderColor: "rgba(255,255,255,0.35)", backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              {truncate(banner.button_label, MAX_LEN.button)}
            </span>
          ) : (
            <span className="inline-block h-[34px]" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
};

const renderBanner = (banner: any, onClick: (id: string) => void) => {
  const isExternal = banner.button_url?.startsWith("http");
  const wrapperClass = "block h-full";
  const card = renderBannerCard(banner);
  const handleClick = () => onClick(banner.id);

  if (!banner.button_url) return <div key={banner.id} className={wrapperClass}>{card}</div>;
  if (isExternal) return <a key={banner.id} href={banner.button_url} target="_blank" rel="noopener noreferrer" className={wrapperClass} onClick={handleClick}>{card}</a>;
  return <Link key={banner.id} to={banner.button_url} className={wrapperClass} onClick={handleClick}>{card}</Link>;
};

const PromotionalBanner = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("promotional_banners")
        .select("*")
        .eq("is_active", true)
        .eq("is_draft", false)
        .order("display_order")
        .limit(4);
      setBanners(data || []);
    };
    fetch();
  }, []);

  // Track impressions once per banner per session
  useEffect(() => {
    banners.forEach((b) => {
      if (!trackedRef.current.has(b.id)) {
        trackedRef.current.add(b.id);
        trackBannerEvent(b.id, "impression");
      }
    });
  }, [banners]);

  if (banners.length === 0) return null;

  const cols =
    banners.length === 1 ? "grid-cols-1" :
    banners.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
    banners.length === 3 ? "grid-cols-2 md:grid-cols-3" :
    "grid-cols-2 md:grid-cols-4";

  return (
    <div className="container mx-auto w-full px-4 md:w-[88%] md:px-0 max-w-7xl">
      <div className={`grid gap-3 sm:gap-4 items-stretch ${cols}`}>
        {banners.map((b) => renderBanner(b, (id) => trackBannerEvent(id, "click")))}
      </div>
    </div>
  );
};

export default PromotionalBanner;
