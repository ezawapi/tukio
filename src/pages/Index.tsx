import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Music, Mic2, Palette, Trophy, Church, GraduationCap, PartyPopper, Globe,
  Landmark, Lock, LucideIcon, Sparkles, Clock3, Users, Wrench, ChevronLeft, ChevronRight,
} from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { formatEventPrice } from "@/lib/format-price";
import { getCountdown } from "@/lib/countdown";
import { useFavoriteAlerts } from "@/hooks/use-favorite-alerts";
import { useTranslation } from "@/contexts/I18nContext";
import defaultEventImg from "@/assets/default-event.png";

const iconMap: Record<string, LucideIcon> = {
  music: Music, "mic-2": Mic2, palette: Palette, trophy: Trophy, church: Church,
  "graduation-cap": GraduationCap, "party-popper": PartyPopper, globe: Globe,
  landmark: Landmark, lock: Lock, users: Users, wrench: Wrench, sparkles: Sparkles,
};

const categoryColorMap: Record<string, string> = {
  "bg-emerald": "bg-[hsl(160,60%,38%)]", "bg-amber": "bg-[hsl(38,90%,50%)]",
  "bg-blue": "bg-primary", "bg-green": "bg-[hsl(142,55%,38%)]",
  "bg-purple": "bg-[hsl(270,55%,50%)]", "bg-pink": "bg-[hsl(330,65%,50%)]",
  "bg-orange": "bg-secondary", "bg-indigo": "bg-[hsl(240,50%,50%)]",
  "bg-slate": "bg-[hsl(215,20%,42%)]", "bg-cyan": "bg-[hsl(190,65%,38%)]",
  "bg-red": "bg-accent", "bg-rose": "bg-[hsl(350,60%,50%)]",
  "bg-teal": "bg-[hsl(170,50%,38%)]", "bg-primary": "bg-primary",
  "bg-secondary": "bg-secondary", "bg-accent": "bg-accent",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const RecentCarousel = ({ events }: { events: any[] }) => {
  const { t } = useTranslation();
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

  // Auto-scroll
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
        {events.map((event) => {
          const countdown = getCountdown(event.date, event.end_date);
          const hasImage = !!event.image_url;
          return (
            <motion.div key={event.id} variants={itemVariants} className="snap-start shrink-0 w-[220px] sm:w-[260px]">
              <Link to={`/events/${event.id}`}>
                <div className="group/card relative overflow-hidden rounded-2xl shadow-card transition-all hover:shadow-warm hover:-translate-y-1">
                  <div className="relative h-64 sm:h-72">
                    <img src={hasImage ? event.image_url : defaultEventImg} alt={event.title}
                      className={`h-full w-full transition-transform duration-500 group-hover/card:scale-105 ${hasImage ? "object-cover" : "object-contain bg-muted p-8"}`}
                      loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute right-2 top-2">
                      <Badge className="border-0 bg-secondary/90 text-[9px] font-semibold text-secondary-foreground backdrop-blur-sm px-2 py-1 sm:text-xs">
                        {formatEventPrice(event.price, event.currency)}
                      </Badge>
                    </div>
                    {countdown && (
                      <div className="absolute left-2 top-2">
                        <Badge className="border-0 bg-primary/90 text-[8px] font-bold text-primary-foreground backdrop-blur-sm px-2 py-1 sm:text-[10px]">
                          {countdown}
                        </Badge>
                      </div>
                    )}
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
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

const CategorySkeleton = () => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} className="h-9 w-28 rounded-full" />
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

  useEffect(() => {
    fetchCategories();
    fetchLiveEvents();
    fetchUpcomingEvents();
    fetchRecentEvents();
  }, []);

  const fetchCategories = async () => {
    setLoadingCats(true);
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) {
      setCategories(data);
      setLoadingCats(false);
      // Fetch counts in background
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (cat) => {
          const { count } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("category_id", cat.id).eq("is_published", true).eq("visibility", "public");
          counts[cat.id] = count || 0;
        }),
      );
      setCategoryCounts(counts);
    } else {
      setLoadingCats(false);
    }
  };

  const fetchLiveEvents = async () => {
    const { data } = await supabase.from("events").select("*, categories(name)").eq("is_live", true).eq("is_published", true).eq("visibility", "public").limit(6);
    setLiveEvents(data || []);
  };

  const fetchUpcomingEvents = async () => {
    const { data } = await supabase.from("events").select("*, categories(name)").eq("is_published", true).eq("visibility", "public").gte("date", new Date().toISOString()).order("date", { ascending: true }).limit(6);
    setUpcomingEvents(data || []);
  };

  const fetchRecentEvents = async () => {
    setLoadingRecent(true);
    const { data } = await supabase.from("events").select("*, categories(name)").eq("is_published", true).eq("visibility", "public").order("created_at", { ascending: false }).limit(8);
    setRecentEvents(data || []);
    setLoadingRecent(false);
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <HeroSection />

      {/* Categories */}
      <section className="bg-background py-8 sm:py-12">
        <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{t("home.categories")}</h2>
              <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">{t("home.categories_sub")}</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost" size="sm" className="font-body text-xs font-medium text-primary">{t("home.see_all")}</Button>
            </Link>
          </div>
          {loadingCats ? <CategorySkeleton /> : (
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:gap-3">
              {categories.map((cat) => {
                const Icon = iconMap[cat.icon] || Globe;
                const colorClass = categoryColorMap[cat.color] || "bg-primary";
                return (
                  <motion.div key={cat.id} variants={itemVariants}>
                    <Link to={`/events?category=${cat.id}`}>
                      <div className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-card transition-all hover:shadow-warm hover:-translate-y-1 sm:gap-2.5 sm:p-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass} shadow-sm transition-transform group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl`}>
                          <Icon className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-body text-[11px] font-semibold leading-tight text-card-foreground sm:text-xs">{cat.name}</p>
                          <p className="font-body text-[10px] text-muted-foreground sm:text-xs">{categoryCounts[cat.id] || 0} évén.</p>
                        </div>
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
      <section className="bg-background py-10 sm:py-14">
        <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="mb-5 flex items-end justify-between gap-4">
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
          {loadingRecent ? <CarouselSkeleton /> : <RecentCarousel events={recentEvents} />}
        </div>
      </section>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section className="bg-card py-10 sm:py-14">
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
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {liveEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants}>
                  <Link to={`/events/${event.id}`}>
                    <EventCard compact title={event.title} date={t("home.live_now")} location={event.location}
                      category={event.categories?.name || t("home.event")} image={event.image_url || "/placeholder.svg"}
                      attendees={event.attendees_count || 0} isLive eventDate={event.date} endDate={event.end_date} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Nearby Events */}
      <NearbyEvents />

      {/* Upcoming */}
      <section className="bg-background py-10 sm:py-14">
        <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{t("home.upcoming")}</h2>
              <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">{t("home.upcoming_sub")}</p>
            </div>
            <Link to="/events"><Button variant="ghost" size="sm" className="font-body text-xs font-medium text-primary">{t("home.see_all")}</Button></Link>
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
                      image={event.image_url || "/placeholder.svg"} attendees={event.attendees_count || 0}
                      price={formatEventPrice(event.price, event.currency)} eventDate={event.date} endDate={event.end_date} />
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

      {/* CTA */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl p-8 text-center gradient-hero sm:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="mb-4 font-display text-2xl font-bold text-primary-foreground sm:text-3xl">{t("home.cta_title")}</h2>
              <p className="mx-auto mb-6 max-w-lg font-body text-sm text-primary-foreground/80">{t("home.cta_desc")}</p>
              <Link to="/create"><Button size="lg" className="bg-background text-foreground hover:bg-background/90">{t("home.cta_button")}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Index;
