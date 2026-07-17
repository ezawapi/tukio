import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { icons as lucideIcons, Sparkles, Clock3, ChevronLeft, ChevronRight, Play, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import AdSlotBanner from "@/components/AdSlotBanner";
import NearbyEvents from "@/components/NearbyEvents";
import PromotionalBanner from "@/components/PromotionalBanner";
import { supabase } from "@/integrations/supabase/client";
import { safeChannel } from "@/lib/realtime-guard";
import { toast } from "sonner";
import { formatEventPrice } from "@/lib/format-price";
import { getCountdown } from "@/lib/countdown";
import { isEventActive, startOfTodayISO } from "@/lib/event-filters";
import { useFavoriteAlerts } from "@/hooks/use-favorite-alerts";
import { useTranslation } from "@/contexts/I18nContext";
import defaultEventImg from "@/assets/fallback-tukio.png";
import { useUserRole } from "@/hooks/use-user-role";

const UPCOMING_PAGE_SIZE = 6;

const UpcomingSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-56 w-full rounded-xl sm:h-64" />
    ))}
  </div>
);

const toPascal = (kebab: string) => kebab.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");

const DynIcon = ({ name, className }: { name: string; className?: string }) => {
  const Comp = (lucideIcons as any)[toPascal(name)];
  if (!Comp) {
    const Globe = (lucideIcons as any)["Globe"];
    return Globe ? <Globe className={className} /> : null;
  }
  return <Comp className={className} />;
};

const categoryColorMap: Record<string, string> = {
  "bg-emerald": "hsl(160,60%,38%)", "bg-amber": "hsl(38,90%,50%)",
  "bg-blue": "hsl(210,70%,50%)", "bg-green": "hsl(142,55%,38%)",
  "bg-purple": "hsl(270,55%,50%)", "bg-pink": "hsl(330,65%,50%)",
  "bg-orange": "hsl(25,90%,50%)", "bg-indigo": "hsl(240,50%,50%)",
  "bg-slate": "hsl(215,20%,42%)", "bg-cyan": "hsl(190,65%,38%)",
  "bg-red": "hsl(0,70%,50%)", "bg-rose": "hsl(350,60%,50%)",
  "bg-teal": "hsl(170,50%,38%)", "bg-primary": "hsl(205,65%,45%)",
  "bg-secondary": "hsl(35,70%,52%)", "bg-accent": "hsl(38,80%,50%)",
  "bg-lime": "hsl(84,60%,45%)", "bg-fuchsia": "hsl(292,60%,50%)",
  "bg-sky": "hsl(200,80%,50%)", "bg-yellow": "hsl(50,90%,50%)",
  "bg-violet": "hsl(258,60%,55%)", "bg-stone": "hsl(30,10%,40%)",
  "bg-zinc": "hsl(240,5%,35%)", "bg-brown": "hsl(20,50%,35%)",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* Reusable horizontal carousel component */
const HorizontalCarousel = ({ events, renderCard }: { events: any[]; renderCard: (event: any) => React.ReactNode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [events]);

  useEffect(() => {
    if (events.length === 0) return;
    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        const el = scrollRef.current;
        if (!el || isPaused) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: 280, behavior: "smooth" });
        }
      }, 4000);
    };
    startAutoScroll();
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [events, isPaused]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative group" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      {canScrollLeft && (
        <button onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-background/90 border border-border shadow-md text-foreground hover:bg-accent transition-colors"
          aria-label="Précédent">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-background/90 border border-border shadow-md text-foreground hover:bg-accent transition-colors"
          aria-label="Suivant">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      <motion.div ref={scrollRef} variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:gap-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {events.map((event) => (
          <motion.div key={event.id} variants={itemVariants} className="snap-start shrink-0 w-[200px] sm:w-[240px]">
            {renderCard(event)}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

const CategorySkeleton = () => (
  <div className="flex flex-wrap gap-2.5">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-32 rounded-full" />
    ))}
  </div>
);

const CarouselSkeleton = () => (
  <div className="flex gap-3 overflow-hidden">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-64 w-[220px] shrink-0 rounded-2xl sm:w-[260px] sm:h-72" />
    ))}
  </div>
);

import { useUserLocation, distanceKm as distanceKmFn, formatDistance } from "@/hooks/use-user-location";

/**
 * Re-rank events around the user position:
 * events with coords closer first, then events without coords keep original order.
 */
const sortByProximity = <T extends { latitude?: number | null; longitude?: number | null }>(
  events: T[],
  coords: { lat: number; lng: number } | null,
): T[] => {
  if (!coords) return events;
  const withCoords = events.filter((e) => e.latitude != null && e.longitude != null);
  const withoutCoords = events.filter((e) => e.latitude == null || e.longitude == null);
  withCoords.sort(
    (a, b) =>
      distanceKmFn(coords.lat, coords.lng, a.latitude!, a.longitude!) -
      distanceKmFn(coords.lat, coords.lng, b.latitude!, b.longitude!),
  );
  return [...withCoords, ...withoutCoords];
};

const Index = () => {
  const { t } = useTranslation();
  useFavoriteAlerts();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [visibleUpcoming, setVisibleUpcoming] = useState(UPCOMING_PAGE_SIZE);
  const [nowTick, setNowTick] = useState(Date.now());
  const [userId, setUserId] = useState<string | undefined>();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const upcomingSectionRef = useRef<HTMLElement | null>(null);
  const upcomingSentinelRef = useRef<HTMLDivElement | null>(null);
  const prefetchedRef = useRef(false);
  const { location: userLocation } = useUserLocation();
  const userCoords = useMemo(
    () => (userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null),
    [userLocation?.lat, userLocation?.lng],
  );
  const { isAdmin } = useUserRole(userId);

  // Compute distance from user to an event (km) or null
  const distanceFor = (lat?: number | null, lng?: number | null): number | null => {
    if (!userCoords || lat == null || lng == null) return null;
    return distanceKmFn(userCoords.lat, userCoords.lng, lat, lng);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  // Simulate a brand-new public event toast (test mode, admin only)
  const simulateInsertToast = () => {
    toast(`✨ Événement test ${Math.floor(Math.random() * 1000)}`, {
      description: "Nouvel événement publié (simulation)",
      duration: 4000,
      action: { label: "Voir", onClick: () => {} },
    });
  };
  // Simulate an event going LIVE (test mode, admin only)
  const simulateLiveToast = () => {
    toast(`🔴 Concert test ${Math.floor(Math.random() * 1000)}`, {
      description: "Événement en direct maintenant (simulation)",
      duration: 5000,
      action: { label: "Regarder", onClick: () => {} },
    });
  };

  // Tick every 5 minutes so "Nouveau" (<24h) badges update without reload
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const refreshAll = useCallback(() => {
    startTransition(() => {
      fetchCategories();
      fetchHomeEvents();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCoords]);

  useEffect(() => {
    refreshAll();
    const mountedAt = Date.now();
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => refreshAll(), 600);
    };
    // Realtime: keep homepage data in sync across all open clients
    const channel = safeChannel("home-events-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, (payload: any) => {
        debouncedRefresh();
        if (Date.now() - mountedAt < 1500) return;
        // Discreet toast when a brand-new public event appears
        if (payload.eventType === "INSERT") {
          const ev = payload.new;
          if (ev?.is_published && ev?.visibility === "public") {
            toast(`✨ ${ev.title}`, {
              description: "Nouvel événement publié",
              duration: 4000,
              action: {
                label: "Voir",
                onClick: () => { window.location.href = `/events/${ev.id}`; },
              },
            });
          }
        }
        // Discreet toast when an event goes LIVE
        if (payload.eventType === "UPDATE") {
          const ev = payload.new;
          const old = payload.old;
          if (ev?.is_live && !old?.is_live && ev?.is_published && ev?.visibility === "public") {
            toast(`🔴 ${ev.title}`, {
              description: "Événement en direct maintenant",
              duration: 5000,
              action: {
                label: "Regarder",
                onClick: () => { window.location.href = ev.live_url || `/events/${ev.id}`; },
              },
            });
          }
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => fetchCategories())
      .subscribe();
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [refreshAll]);

  const fetchCategories = async () => {
    const catCacheKey = "tukio:home-cats:v1";
    try {
      const raw = sessionStorage.getItem(catCacheKey);
      if (raw) {
        const { ts, cats, counts } = JSON.parse(raw);
        if (Date.now() - ts < 5 * 60_000 && Array.isArray(cats)) {
          setCategories(cats);
          setCategoryCounts(counts || {});
          setLoadingCats(false);
        }
      }
    } catch {}
    const todayISO = startOfTodayISO();
    const [{ data: cats }, { data: evRows }] = await Promise.all([
      supabase.from("categories").select("id,name,slug,icon,color").order("name"),
      supabase
        .from("events")
        .select("category_id")
        .eq("is_published", true)
        .eq("visibility", "public")
        .gte("date", todayISO),
    ]);
    if (cats) {
      const counts: Record<string, number> = {};
      (evRows || []).forEach((row: any) => {
        if (row.category_id) counts[row.category_id] = (counts[row.category_id] || 0) + 1;
      });
      setCategories(cats);
      setCategoryCounts(counts);
      try { sessionStorage.setItem(catCacheKey, JSON.stringify({ ts: Date.now(), cats, counts })); } catch {}
    }
    setLoadingCats(false);
  };

  const splitEvents = (data: any[]) => {
    const filtered = data.filter((e: any) => isEventActive(e.date, e.end_date));
    setLiveEvents(filtered.filter((e: any) => e.is_live).slice(0, 8));
    const upcomingRanked = sortByProximity([...filtered], userCoords);
    setUpcomingEvents(upcomingRanked.slice(0, 30));
    const recentSorted = [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setRecentEvents(sortByProximity(recentSorted, userCoords).slice(0, 8));
    setLoadingRecent(false);
    setLoadingUpcoming(false);
  };

  // Combined fetch for live + upcoming + recent (all share base filter)
  const fetchHomeEvents = async () => {
    const todayISO = startOfTodayISO();
    const poolSize = userCoords ? 60 : 30;
    const cacheKey = `tukio:home-events:v3:${poolSize}`;
    let hadCache = false;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts < 5 * 60_000 && Array.isArray(data)) {
          splitEvents(data);
          hadCache = true;
        }
      }
    } catch {}
    if (!hadCache) setLoadingRecent(true);
    // Slim column list to reduce payload size (~50% smaller than SELECT *)
    const { data } = await supabase
      .from("events")
      .select("id,title,date,end_date,image_url,is_live,live_url,price,currency,latitude,longitude,category_id,created_at,visibility,is_published,city,categories(name)")
      .eq("is_published", true)
      .eq("visibility", "public")
      .gte("date", todayISO)
      .order("date", { ascending: true })
      .limit(poolSize);
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: data || [] })); } catch {}
    splitEvents(data || []);
  };

  const isNewEvent = (createdAt: string | undefined) => {
    if (!createdAt) return false;
    return nowTick - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
  };

  const renderRecentCard = (event: any) => {
    const countdown = getCountdown(event.date, event.end_date);
    const hasImage = !!event.image_url;
    const isNew = isNewEvent(event.created_at);
    return (
      <Link to={`/events/${event.id}`}>
        <div className="group/card relative overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="relative h-64 sm:h-72">
              <img src={hasImage ? event.image_url : defaultEventImg} alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                loading="lazy"
                decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
              <Badge className="border-0 bg-secondary/90 text-[9px] font-semibold text-secondary-foreground backdrop-blur-sm px-2 py-1 sm:text-xs">
                {formatEventPrice(event.price, event.currency)}
              </Badge>
              {isNew && (
                <Badge className="border-0 bg-gradient-to-r from-secondary to-accent text-[8px] font-bold text-white px-2 py-0.5 shadow-md animate-pulse sm:text-[10px] flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Nouveau
                </Badge>
              )}
              {(() => {
                const d = distanceFor(event.latitude, event.longitude);
                return d != null ? (
                  <Badge className="border-0 bg-background/90 text-[8px] font-semibold text-foreground backdrop-blur-sm px-2 py-0.5 sm:text-[10px] flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 text-primary" />
                    {formatDistance(d)}
                  </Badge>
                ) : null;
              })()}
            </div>
            <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
              {countdown && (
                <Badge className="border-0 bg-primary/90 text-[8px] font-bold text-primary-foreground backdrop-blur-sm px-2 py-1 sm:text-[10px]">
                  {countdown}
                </Badge>
              )}
              {event.is_live && (
                <a
                  href={event.live_url || `/events/${event.id}`}
                  target={event.live_url ? "_blank" : undefined}
                  rel={event.live_url ? "noopener noreferrer" : undefined}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex"
                >
                  <Badge className="border-0 bg-destructive text-[8px] font-bold text-destructive-foreground backdrop-blur-sm px-2 py-0.5 sm:text-[10px] flex items-center gap-1 animate-pulse hover:bg-destructive/90 transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping inline-block" />
                    LIVE
                  </Badge>
                </a>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-display text-sm font-bold leading-snug text-white line-clamp-2 sm:text-base">{event.title}</h3>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="font-body text-[10px] text-white/80 sm:text-xs">{event.categories?.name || t("home.event")}</span>
                <span className="text-white/50">·</span>
                <span className="font-body text-[10px] text-white/70 truncate sm:text-xs">{event.attendees_count || 0} {t("home.visits")}</span>
              </div>
              <p className="mt-0.5 font-body text-[9px] text-white/60 truncate sm:text-[11px]">
                {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {event.city || event.location}
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const renderLiveCard = (event: any) => {
    const countdown = getCountdown(event.date, event.end_date);
    const hasImage = !!event.image_url;
    return (
      <Link to={event.live_url || `/events/${event.id}`} target={event.live_url ? "_blank" : undefined}>
        <div className="group/card overflow-hidden rounded-2xl bg-[hsl(var(--card))] shadow-md transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="relative h-36 sm:h-44 overflow-hidden">
             <img src={hasImage ? event.image_url : defaultEventImg} alt={event.title}
              className={`h-full w-full transition-transform duration-500 group-hover/card:scale-105 ${hasImage ? "object-cover" : "object-contain bg-muted p-6"}`}
               loading="lazy"
               decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {/* Play button when live_url exists */}
            {event.live_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground shadow-lg backdrop-blur-sm transition-transform group-hover/card:scale-110 sm:h-12 sm:w-12">
                  <Play className="h-5 w-5 fill-current sm:h-6 sm:w-6" />
                </div>
              </div>
            )}
            <div className="absolute left-2 bottom-2 flex items-center gap-1.5">
              <Badge className="animate-pulse border-0 bg-destructive text-[9px] font-bold text-destructive-foreground backdrop-blur-sm px-2 py-0.5 sm:text-[10px] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping inline-block" />
                LIVE
              </Badge>
              {countdown && (
                <Badge className="border-0 bg-black/60 text-[8px] font-semibold text-white backdrop-blur-sm px-1.5 py-0.5 sm:text-[10px]">
                  {countdown}
                </Badge>
              )}
            </div>
            <div className="absolute right-2 top-2">
              <Badge className="border-0 bg-secondary/90 text-[8px] font-semibold text-secondary-foreground backdrop-blur-sm px-1.5 py-0.5 sm:text-[10px]">
                {formatEventPrice(event.price, event.currency)}
              </Badge>
            </div>
          </div>
          <div className="bg-[hsl(220,15%,16%)] px-3 py-2.5">
            <h3 className="font-display text-xs font-bold leading-snug text-white line-clamp-2 sm:text-sm">{event.title}</h3>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/60 sm:text-xs">
              <span className="font-body">{event.categories?.name || t("home.event")}</span>
              <span>·</span>
              <span className="font-body truncate">
                {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <HeroSection />

      {/* Categories */}
      <section className="bg-background pt-8 pb-4 sm:pt-12 sm:pb-6">
        <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{t("home.categories")}</h2>
              <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">{t("home.categories_sub")}</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost" size="sm" className="font-body text-xs font-medium text-primary">{t("home.see_all")} →</Button>
            </Link>
          </div>
          {loadingCats ? <CategorySkeleton /> : (
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              className="flex flex-wrap gap-2.5 sm:gap-3">
              {categories.map((cat) => {
                const color = categoryColorMap[cat.color] || "hsl(205,65%,45%)";
                const count = categoryCounts[cat.id] ?? 0;
                return (
                  <motion.div key={cat.id} variants={itemVariants}>
                    <Link to={`/events?category=${cat.id}`}>
                      <div className="group flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-2.5 py-1 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 sm:pl-1.5 sm:pr-3 sm:py-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110 sm:h-7 sm:w-7"
                          style={{ backgroundColor: color }}>
                          <DynIcon name={cat.icon} className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
                        </div>
                        <span className="font-body text-[10px] font-medium text-card-foreground whitespace-nowrap sm:text-xs">{cat.name}</span>
                        <Badge variant="secondary" className="ml-0.5 h-4 min-w-[16px] justify-center rounded-full px-1 text-[8px] font-bold sm:h-5 sm:text-[10px]">
                          {count}
                        </Badge>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      <section className="pb-2"><div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl"><AdSlotBanner slotCode="home-between-categories-live" compact /></div></section>
      <section className="pb-2"><div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl"><AdSlotBanner slotCode="home-before-latest" compact /></div></section>

      {/* Recent — horizontal scroll carousel */}
      <section className="bg-background py-5 sm:py-7">
        <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary"><Clock3 className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{t("home.recent")}</h2>
                <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">{t("home.recent_sub")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-2 text-[10px] sm:text-xs"><Sparkles className="h-3 w-3" /> {t("home.new")}</Badge>
              <Link to="/events?sort=recent">
                <Button variant="ghost" size="sm" className="font-body text-xs font-medium text-primary">{t("home.see_all")}</Button>
              </Link>
            </div>
          </div>
          {loadingRecent ? <CarouselSkeleton /> : <HorizontalCarousel events={recentEvents} renderCard={renderRecentCard} />}
        </div>
      </section>

      {/* Live Events — horizontal scroll carousel */}
      {liveEvents.length > 0 && (
        <section className="bg-card py-6 sm:py-8">
          <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-destructive animate-pulse-live" />
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{t("home.live")}</h2>
                  <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">{t("home.live_sub")}</p>
                </div>
              </div>
            </div>
            <HorizontalCarousel events={liveEvents} renderCard={renderLiveCard} />
          </div>
        </section>
      )}

      {/* Nearby Events */}
      <NearbyEvents />

      {/* Promotional Banner */}
      <section className="py-3 sm:py-5">
        <PromotionalBanner />
      </section>

      {/* Upcoming */}
      <section className="bg-background py-5 sm:py-7">
        <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{t("home.upcoming")}</h2>
              <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">{t("home.upcoming_sub")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/events"><Button variant="ghost" size="sm" className="font-body text-xs font-medium text-primary">{t("home.see_all")}</Button></Link>
            </div>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-body text-muted-foreground">{t("home.no_upcoming")}</p>
              <Link to="/create"><Button className="mt-4 border-0 gradient-hero text-primary-foreground">{t("home.publish_first")}</Button></Link>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants}>
                  <Link to={`/events/${event.id}`}>
                    <EventCard compact title={event.title}
                      date={new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      location={event.location} category={event.categories?.name || t("home.event")}
                      image={event.image_url || ""} attendees={event.attendees_count || 0}
                      price={formatEventPrice(event.price, event.currency)} eventDate={event.date} endDate={event.end_date}
                      distanceKm={distanceFor(event.latitude, event.longitude)} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="pb-2">
        <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <AdSlotBanner slotCode="home-bottom-left" compact />
            <AdSlotBanner slotCode="home-bottom-center" compact />
            <AdSlotBanner slotCode="home-bottom-right" compact />
          </div>
        </div>
      </section>

      {isAdmin && (
        <div className="fixed bottom-20 right-3 z-40 flex flex-col gap-1.5 rounded-xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur md:bottom-4">
          <span className="px-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Mode test</span>
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={simulateInsertToast}>✨ Simuler INSERT</Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={simulateLiveToast}>🔴 Simuler LIVE</Button>
        </div>
      )}
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Index;
