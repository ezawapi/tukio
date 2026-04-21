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
  const style: React.CSSProperties = {
    backgroundColor: banner.bg_gradient ? undefined : (banner.bg_color || "#f59e0b"),
    backgroundImage: banner.bg_gradient || undefined,
    color: banner.text_color || "#ffffff",
    border: banner.border_width ? `${banner.border_width}px solid ${banner.border_color || "#000"}` : undefined,
  };

  const animClass = getAnimationClass(banner.text_animation || "none");
  const isExternal = banner.button_url?.startsWith("http");
  const hasBg = !!(banner.bg_color || banner.bg_gradient);

  const content = (
    <div
      className="overflow-hidden rounded-2xl p-5 sm:p-6 relative h-full flex flex-col min-h-[260px] sm:min-h-[290px] transition-transform hover:-translate-y-0.5"
      style={style}
    >
      {hasBg && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_70%)]" />
      )}
      {banner.image_url && (
        <img
          src={banner.image_url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay"
        />
      )}
      <div className="relative z-10 flex flex-col h-full">
        {banner.subtitle && (
          <p className={`font-body text-xs sm:text-sm opacity-80 mb-2 ${animClass}`}>{banner.subtitle}</p>
        )}
        <h2 className={`font-display font-bold leading-tight text-xl sm:text-2xl ${animClass}`}>
          {banner.title}
        </h2>
        {banner.body && (
          <p className={`font-body text-xs sm:text-sm opacity-90 mt-3 line-clamp-3 ${animClass}`}>
            {banner.body}
          </p>
        )}
        {banner.button_label && (
          <div className="mt-auto pt-4">
            <span
              className="inline-block px-4 py-2 rounded-lg font-body font-medium text-xs sm:text-sm border transition-colors hover:bg-white/20"
              style={{ borderColor: "rgba(255,255,255,0.35)", backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              {banner.button_label}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const wrapperClass = "block h-full";

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
    <div className="container mx-auto w-full px-4 md:w-[78%] md:px-0 max-w-6xl space-y-3">
      {sortedRowKeys.map((key) => {
        const rowBanners = rows[key];
        if (rowBanners.length === 1) {
          return <div key={key}>{renderBanner(rowBanners[0], false)}</div>;
        }
        // 4+ banners: keep all on a single row from sm upwards (2 cols mobile, 4 cols sm+)
        const cols = rowBanners.length >= 4 ? "grid-cols-2 sm:grid-cols-4" :
                     rowBanners.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
                     "grid-cols-1 sm:grid-cols-2";
        return (
          <div key={key} className={`grid gap-2 sm:gap-3 ${cols}`}>
            {rowBanners.map((b) => renderBanner(b, true))}
          </div>
        );
      })}
    </div>
  );
};

export default PromotionalBanner;
