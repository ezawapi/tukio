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

  return (
    <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl space-y-4">
      {banners.map(banner => {
        const widthPct = banner.width_percent ?? 100;
        const style: React.CSSProperties = {
          backgroundColor: banner.bg_gradient ? undefined : (banner.bg_color || "#f59e0b"),
          backgroundImage: banner.bg_gradient || undefined,
          color: banner.text_color || "#ffffff",
          width: `${widthPct}%`,
          height: banner.height_px ? `${banner.height_px}px` : undefined,
          border: banner.border_width ? `${banner.border_width}px solid ${banner.border_color || "#000"}` : undefined,
          margin: widthPct < 100 ? "0 auto" : undefined,
        };

        const animClass = getAnimationClass(banner.text_animation || "none");
        const isExternal = banner.button_url?.startsWith("http");

        const content = (
          <div className="overflow-hidden rounded-3xl p-6 sm:p-8 relative" style={style}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10 flex items-center gap-4 sm:gap-6">
              <div className="flex-1 space-y-2">
                {banner.subtitle && (
                  <p className={`font-body text-sm opacity-80 ${animClass}`}>{banner.subtitle}</p>
                )}
                <h2 className={`font-display font-bold text-${banner.title_font_size || "2xl"} sm:text-${banner.title_font_size === "2xl" ? "3xl" : banner.title_font_size} ${animClass}`}>
                  {banner.title}
                </h2>
                {banner.body && (
                  <p className={`font-body text-${banner.subtitle_font_size || "base"} opacity-90 max-w-lg ${animClass}`}>{banner.body}</p>
                )}
                {banner.button_label && (
                  <span className="inline-block mt-3 px-6 py-2.5 rounded-xl font-body font-semibold text-sm border-2 transition-colors hover:bg-white/20"
                    style={{ borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.15)" }}>
                    {banner.button_label}
                  </span>
                )}
              </div>
              {banner.image_url && (
                <img src={banner.image_url} alt="" className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover shadow-lg flex-shrink-0" />
              )}
            </div>
          </div>
        );

        if (!banner.button_url) return <div key={banner.id}>{content}</div>;
        if (isExternal) return <a key={banner.id} href={banner.button_url} target="_blank" rel="noopener noreferrer" className="block">{content}</a>;
        return <Link key={banner.id} to={banner.button_url} className="block">{content}</Link>;
      })}
    </div>
  );
};

export default PromotionalBanner;
