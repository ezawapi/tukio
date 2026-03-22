import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Music, Mic2, Palette, Trophy, Church, GraduationCap, PartyPopper, Globe,
  Landmark, Lock, LucideIcon, Sparkles, Clock3, Users, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import Footer from "@/components/Footer";
import AdSlotBanner from "@/components/AdSlotBanner";
import NearbyEvents from "@/components/NearbyEvents";
import { supabase } from "@/integrations/supabase/client";
import { formatEventPrice } from "@/lib/format-price";

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

const Index = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchLiveEvents();
    fetchUpcomingEvents();
    fetchRecentEvents();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) {
      setCategories(data);
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (cat) => {
          const { count } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("category_id", cat.id).eq("is_published", true).eq("visibility", "public");
          counts[cat.id] = count || 0;
        }),
      );
      setCategoryCounts(counts);
    }
  };

  const fetchLiveEvents = async () => {
    const { data } = await supabase.from("events").select("*, categories(name)").eq("is_live", true).eq("is_published", true).eq("visibility", "public").limit(4);
    setLiveEvents(data || []);
  };

  const fetchUpcomingEvents = async () => {
    const { data } = await supabase.from("events").select("*, categories(name)").eq("is_published", true).eq("visibility", "public").gte("date", new Date().toISOString()).order("date", { ascending: true }).limit(8);
    setUpcomingEvents(data || []);
  };

  const fetchRecentEvents = async () => {
    const { data } = await supabase.from("events").select("*, categories(name)").eq("is_published", true).eq("visibility", "public").order("created_at", { ascending: false }).limit(6);
    setRecentEvents(data || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* Categories — compact inline */}
      <section className="bg-background py-8 sm:py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">Catégories</h2>
              <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">Explorez par type d'événement</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost" size="sm" className="font-body text-xs font-medium text-primary">Voir tout →</Button>
            </Link>
          </div>

          <motion.div
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            className="flex flex-wrap gap-2 sm:gap-2.5"
          >
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon] || Globe;
              const colorClass = categoryColorMap[cat.color] || "bg-primary";
              return (
                <motion.div key={cat.id} variants={itemVariants}>
                  <Link to={`/events?category=${cat.id}`}>
                    <div className={`group inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-all hover:shadow-sm sm:gap-2 sm:px-4 sm:py-2 sm:text-sm`}>
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${colorClass} sm:h-6 sm:w-6`}>
                        <Icon className="h-3 w-3 text-primary-foreground sm:h-3.5 sm:w-3.5" />
                      </span>
                      <span className="font-body text-foreground">{cat.name}</span>
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 font-body text-[10px] font-medium text-muted-foreground sm:text-xs">{categoryCounts[cat.id] || 0}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="pb-2"><div className="container mx-auto max-w-6xl px-4"><AdSlotBanner slotCode="home-between-categories-live" compact /></div></section>

      {/* Recent — overlay card style (image 2) */}
      <section className="bg-background py-10 sm:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary"><Clock3 className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">Dernières activités</h2>
                <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">Les plus récentes</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-2 text-[10px] sm:text-xs"><Sparkles className="h-3 w-3" /> Nouveau</Badge>
          </div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 max-w-4xl"
          >
            {recentEvents.map((event) => (
              <motion.div key={event.id} variants={itemVariants}>
                <Link to={`/events/${event.id}`}>
                  <div className="group relative overflow-hidden rounded-xl shadow-card transition-shadow hover:shadow-warm">
                    {/* Full image background */}
                    <div className="relative h-40 sm:h-48">
                      <img
                        src={event.image_url || "/placeholder.svg"}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      {/* Category badge top-left */}
                      <div className="absolute left-3 top-3">
                        <Badge className="border-0 bg-primary/90 text-[10px] text-primary-foreground backdrop-blur-sm">{event.categories?.name || "Événement"}</Badge>
                      </div>
                      {/* Text overlay bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-display text-base font-bold leading-tight text-white line-clamp-2 sm:text-lg">{event.title}</h3>
                        <p className="mt-1 font-body text-xs text-white/70">
                          {new Date(event.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          {" • "}{event.location}
                        </p>
                        {(
                          <span className="mt-1.5 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                            {formatEventPrice(event.price, event.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section className="bg-card py-10 sm:py-14">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-destructive animate-pulse-live" />
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">En Direct</h2>
                  <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">Événements en cours</p>
                </div>
              </div>
            </div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
            >
              {liveEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants}>
                  <Link to={`/events/${event.id}`}>
                    <EventCard compact title={event.title} date="En direct maintenant" location={event.location}
                      category={event.categories?.name || "Événement"} image={event.image_url || "/placeholder.svg"}
                      attendees={event.attendees_count || 0} isLive />
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
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">À venir</h2>
              <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">Ne manquez pas ces événements</p>
            </div>
            <Link to="/events"><Button variant="ghost" size="sm" className="font-body text-xs font-medium text-primary">Voir tout →</Button></Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-body text-muted-foreground">Aucun événement à venir pour le moment.</p>
              <Link to="/create"><Button className="mt-4 border-0 gradient-hero text-primary-foreground">Publiez le premier !</Button></Link>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
            >
              {upcomingEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants}>
                  <Link to={`/events/${event.id}`}>
                    <EventCard compact title={event.title}
                      date={new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      location={event.location} category={event.categories?.name || "Événement"}
                      image={event.image_url || "/placeholder.svg"} attendees={event.attendees_count || 0}
                      price={formatEventPrice(event.price, event.currency)} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="pb-2">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <AdSlotBanner slotCode="home-bottom-left" compact />
            <AdSlotBanner slotCode="home-bottom-center" compact />
            <AdSlotBanner slotCode="home-bottom-right" compact />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-3xl p-8 text-center gradient-hero sm:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="mb-4 font-display text-2xl font-bold text-primary-foreground sm:text-3xl">Organisez votre prochain événement</h2>
              <p className="mx-auto mb-6 max-w-lg font-body text-sm text-primary-foreground/80">Publiez, promouvez et gérez vos événements facilement sur Tukio.</p>
              <Link to="/create"><Button size="lg" className="bg-background text-foreground hover:bg-background/90">Commencer gratuitement</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
