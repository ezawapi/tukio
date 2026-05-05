import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles, Percent, Tag, Gift, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MAX_LEN = { title: 40, subtitle: 25, body: 140, button: 20 };

const truncate = (s: string | null | undefined, max: number) => {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
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

const ICONS = [Sparkles, Percent, Tag, Gift];

const FeaturedCard = ({ banner }: { banner: any }) => {
  const style: React.CSSProperties = {
    backgroundColor: banner.bg_gradient ? undefined : (banner.bg_color || "hsl(var(--primary))"),
    backgroundImage: banner.bg_gradient || undefined,
    color: banner.text_color || "#ffffff",
  };
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[150px] h-full shadow-sm"
      style={style}
    >
      <div>
        {banner.subtitle && (
          <p className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            {truncate(banner.subtitle, MAX_LEN.subtitle)}
          </p>
        )}
        <h3 className="font-display text-base sm:text-lg font-semibold mt-1.5">
          {truncate(banner.title, MAX_LEN.title)}
        </h3>
      </div>
      {banner.body && (
        <p className="font-body text-xs sm:text-sm opacity-90 mt-2 line-clamp-3">
          {truncate(banner.body, MAX_LEN.body)}
        </p>
      )}
    </div>
  );
};

const SecondaryCard = ({ banner, idx, locked }: { banner: any; idx: number; locked?: boolean }) => {
  const Icon = ICONS[idx % ICONS.length];
  return (
    <div
      className={`relative rounded-2xl p-4 sm:p-5 border bg-card flex flex-col min-h-[150px] h-full transition-colors ${
        locked ? "opacity-70" : "hover:border-primary/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-sm sm:text-base font-semibold text-foreground line-clamp-2 leading-snug">
          {truncate(banner.title, MAX_LEN.title)}
        </h4>
        {locked ? (
          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <Icon className="h-4 w-4 text-primary flex-shrink-0" />
        )}
      </div>
      <p className="font-body text-xs sm:text-[13px] text-muted-foreground mt-2 line-clamp-3 flex-1">
        {truncate(banner.body, MAX_LEN.body) || truncate(banner.subtitle, MAX_LEN.subtitle)}
      </p>
      {banner.button_label && !locked && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
          {truncate(banner.button_label, MAX_LEN.button)}
          <ChevronRight className="h-3 w-3" />
        </span>
      )}
    </div>
  );
};

export const renderBannerCard = (banner: any) => <FeaturedCard banner={banner} />;

// Smart redirect for "Install Tukio" banner: detect platform + auth and pick best target
const isInstallBanner = (banner: any) =>
  /install/i.test(banner?.title || "") ||
  /install/i.test(banner?.body || "") ||
  /install=1/.test(banner?.button_url || "");

const resolveInstallTarget = async (): Promise<{ url: string; external: boolean }> => {
  // Already installed PWA?
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
  if (isStandalone) return { url: "/", external: false };

  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(ua);

  // Logged-in users: deep link to app or settings/install help
  const { data } = await supabase.auth.getSession();
  const loggedIn = !!data.session;

  if (isIOS) return { url: "/?install=ios", external: false };
  if (isAndroid) return { url: "/?install=android", external: false };
  return { url: loggedIn ? "/?install=web" : "/auth?install=1", external: false };
};

const SmartInstallLink = ({
  banner,
  onClick,
  children,
}: {
  banner: any;
  onClick: (id: string) => void;
  children: React.ReactNode;
}) => {
  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(banner.id);
    const { url } = await resolveInstallTarget();
    window.location.href = url;
  };
  return (
    <a href={banner.button_url || "/?install=1"} onClick={handle} className="block h-full">
      {children}
    </a>
  );
};

const wrapWithLink = (banner: any, child: React.ReactNode, onClick: (id: string) => void) => {
  const handleClick = () => onClick(banner.id);
  if (isInstallBanner(banner)) {
    return <SmartInstallLink key={banner.id} banner={banner} onClick={onClick}>{child}</SmartInstallLink>;
  }
  if (!banner.button_url) return <div key={banner.id} className="block h-full">{child}</div>;
  const isExternal = banner.button_url?.startsWith("http");
  if (isExternal)
    return (
      <a key={banner.id} href={banner.button_url} target="_blank" rel="noopener noreferrer" className="block h-full" onClick={handleClick}>
        {child}
      </a>
    );
  return (
    <Link key={banner.id} to={banner.button_url} className="block h-full" onClick={handleClick}>
      {child}
    </Link>
  );
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

  useEffect(() => {
    banners.forEach((b) => {
      if (!trackedRef.current.has(b.id)) {
        trackedRef.current.add(b.id);
        trackBannerEvent(b.id, "impression");
      }
    });
  }, [banners]);

  if (banners.length === 0) return null;

  const featured = banners[0];
  const others = banners.slice(1);
  const onClick = (id: string) => trackBannerEvent(id, "click");

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {wrapWithLink(featured, <FeaturedCard banner={featured} />, onClick)}
        {others.map((b, i) =>
          wrapWithLink(
            b,
            <SecondaryCard banner={b} idx={i} locked={i === others.length - 1 && others.length >= 3} />,
            onClick
          )
        )}
      </div>
    </div>
  );
};

export default PromotionalBanner;
