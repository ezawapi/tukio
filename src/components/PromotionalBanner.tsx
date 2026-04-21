import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

const renderBanner = (banner: any, inRow: boolean) => {
  const widthPct = banner.width_percent ?? 100;
  const style: React.CSSProperties = {
    backgroundColor: banner.bg_gradient ? undefined : (banner.bg_color || "#f59e0b"),
    backgroundImage: banner.bg_gradient || undefined,
    color: banner.text_color || "#ffffff",
    width: inRow ? "100%" : `${widthPct}%`,
    height: banner.height_px ? `${banner.height_px}px` : undefined,
    border: banner.border_width ? `${banner.border_width}px solid ${banner.border_color || "#000"}` : undefined,
    margin: !inRow && widthPct < 100 ? "0 auto" : undefined,
  };

  const animClass = getAnimationClass(banner.text_animation || "none");
  const isExternal = banner.button_url?.startsWith("http");
  const hasBg = !!(banner.bg_color || banner.bg_gradient);

  const content = (
    <div className="overflow-hidden rounded-2xl p-4 sm:p-5 relative h-full flex flex-col" style={style}>
      {hasBg && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
      )}
      <div className="relative z-10 flex items-start gap-3 h-full">
        <div className="flex-1 flex flex-col h-full space-y-1.5">
          {banner.subtitle && (
            <p className={`font-body text-[11px] sm:text-xs opacity-80 ${animClass}`}>{banner.subtitle}</p>
          )}
          <h2 className={`font-display font-bold leading-tight text-${banner.title_font_size || "lg"} ${animClass}`}>
            {banner.title}
          </h2>
          {banner.body && (
            <p className={`font-body text-${banner.subtitle_font_size || "xs"} opacity-90 ${animClass}`}>{banner.body}</p>
          )}
          {banner.button_label && (
            <span className="inline-block mt-auto pt-2">
              <span className="inline-block px-3 py-1.5 rounded-lg font-body font-semibold text-[11px] sm:text-xs border-2 transition-colors hover:bg-white/20"
                style={{ borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.15)" }}>
                {banner.button_label}
              </span>
            </span>
          )}
        </div>
        {banner.image_url && (
          <img src={banner.image_url} alt="" loading="lazy" className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover shadow-lg flex-shrink-0" />
        )}
      </div>
    </div>
  );

  const wrapperClass = inRow ? "block h-full" : "block";

  if (!banner.button_url) return <div key={banner.id} className={wrapperClass}>{content}</div>;
  if (isExternal) return <a key={banner.id} href={banner.button_url} target="_blank" rel="noopener noreferrer" className={wrapperClass}>{content}</a>;
  return <Link key={banner.id} to={banner.button_url} className={wrapperClass}>{content}</Link>;
};

const PromotionalBanner = () => {
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("promotional_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      setBanners(data || []);
    };
    fetch();
  }, []);

  if (banners.length === 0) return null;

  // Group banners by display_order — same order = same row
  const rows: Record<number, any[]> = {};
  banners.forEach((b) => {
    const key = b.display_order ?? 0;
    if (!rows[key]) rows[key] = [];
    rows[key].push(b);
  });
  const sortedRowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);

  return (
    <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl space-y-3">
      {sortedRowKeys.map((key) => {
        const rowBanners = rows[key];
        if (rowBanners.length === 1) {
          return <div key={key}>{renderBanner(rowBanners[0], false)}</div>;
        }
        const cols = rowBanners.length >= 4 ? "grid-cols-2 md:grid-cols-4" :
                     rowBanners.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
                     "grid-cols-1 sm:grid-cols-2";
        return (
          <div key={key} className={`grid gap-3 ${cols}`}>
            {rowBanners.map((b) => renderBanner(b, true))}
          </div>
        );
      })}
    </div>
  );
};

export default PromotionalBanner;
