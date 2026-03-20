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
import CategoryCard from "@/components/CategoryCard";
import Footer from "@/components/Footer";
import AdSlotBanner from "@/components/AdSlotBanner";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, LucideIcon> = {
  music: Music,
  "mic-2": Mic2,
  palette: Palette,
  trophy: Trophy,
  church: Church,
  "graduation-cap": GraduationCap,
  "party-popper": PartyPopper,
  globe: Globe,
  landmark: Landmark,
  lock: Lock,
  users: Users,
  wrench: Wrench,
  sparkles: Sparkles,
};

const categoryColorMap: Record<string, string> = {
  "bg-emerald": "bg-[hsl(160,60%,38%)]",
  "bg-amber": "bg-[hsl(38,90%,50%)]",
  "bg-blue": "bg-primary",
  "bg-green": "bg-[hsl(142,55%,38%)]",
  "bg-purple": "bg-[hsl(270,55%,50%)]",
  "bg-pink": "bg-[hsl(330,65%,50%)]",
  "bg-orange": "bg-secondary",
  "bg-indigo": "bg-[hsl(240,50%,50%)]",
  "bg-slate": "bg-[hsl(215,20%,42%)]",
  "bg-cyan": "bg-[hsl(190,65%,38%)]",
  "bg-red": "bg-accent",
  "bg-rose": "bg-[hsl(350,60%,50%)]",
  "bg-teal": "bg-[hsl(170,50%,38%)]",
  "bg-primary": "bg-primary",
  "bg-secondary": "bg-secondary",
  "bg-accent": "bg-accent",
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
      // Fetch counts in parallel
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (cat) => {
          const { count } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("is_published", true);
          counts[cat.id] = count || 0;
        })
      );
      setCategoryCounts(counts);
    }
  };

  const fetchLiveEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, categories(name)")
      .eq("is_live", true)
      .eq("is_published", true)
      .limit(4);
    setLiveEvents(data || []);
  };

  const fetchUpcomingEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, categories(name)")
      .eq("is_published", true)
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(8);
    setUpcomingEvents(data || []);
  };

  const fetchRecentEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, categories(name)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6);
    setRecentEvents(data || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* Categories */}
      <section className="bg-background py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Catégories</h2>
              <p className="mt-1 font-body text-sm text-muted-foreground">Explorez par type d'événement</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost" className="font-body text-sm font-medium text-primary">Voir tout →</Button>
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-7"
          >
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon] || Globe;
              const colorClass = categoryColorMap[cat.color] || "bg-primary";
              return (
                <motion.div key={cat.id} variants={itemVariants}>
                  <Link to={`/events?category=${cat.id}`}>
                    <CategoryCard name={cat.name} icon={Icon} count={categoryCounts[cat.id] || 0} color={colorClass} />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="pb-2">
        <div className="container mx-auto px-4">
          <AdSlotBanner slotCode="home-between-categories-live" compact />
        </div>
      </section>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section className="bg-card py-10 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-destructive animate-pulse-live" />
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">En Direct</h2>
                  <p className="mt-1 font-body text-sm text-muted-foreground">Événements en cours</p>
                </div>
              </div>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 md:mx-0 md:grid md:grid-cols-2 md:px-0 md:pb-0 xl:grid-cols-4"
            >
              {liveEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants} className="min-w-[180px] snap-start sm:min-w-[220px] md:min-w-0">
                  <Link to={`/events/${event.id}`}>
                    <EventCard
                      compact
                      title={event.title}
                      date="En direct maintenant"
                      location={event.venue_name ? `${event.venue_name} · ${event.location}` : event.location}
                      category={event.categories?.name || "Événement"}
                      image={event.image_url || "/placeholder.svg"}
                      attendees={event.attendees_count || 0}
                      isLive
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section className="bg-background py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">À venir</h2>
              <p className="mt-1 font-body text-sm text-muted-foreground">Ne manquez pas ces événements</p>
            </div>
            <Link to="/events">
              <Button variant="ghost" className="font-body text-sm font-medium text-primary">Voir tout →</Button>
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-body text-muted-foreground">Aucun événement à venir pour le moment.</p>
              <Link to="/create">
                <Button className="mt-4 border-0 gradient-hero text-primary-foreground">Publiez le premier !</Button>
              </Link>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 sm:-mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:pb-0">
              {upcomingEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants} className="min-w-[180px] snap-start sm:min-w-[220px] lg:min-w-0">
                  <Link to={`/events/${event.id}`}>
                    <EventCard
                      compact
                      title={event.title}
                      date={new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      location={event.venue_name ? `${event.venue_name} · ${event.location}` : event.location}
                      category={event.categories?.name || "Événement"}
                      image={event.image_url || "/placeholder.svg"}
                      attendees={event.attendees_count || 0}
                      price={event.price}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="pb-2">
        <div className="container mx-auto px-4">
          <AdSlotBanner slotCode="home-before-latest" compact />
        </div>
      </section>

      {/* Recent */}
      <section className="bg-card py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Dernières activités</h2>
                <p className="mt-1 font-body text-sm text-muted-foreground">Les plus récentes</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Nouveau</Badge>
          </div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {recentEvents.map((event) => (
              <motion.div key={event.id} variants={itemVariants}>
                <Link to={`/events/${event.id}`}>
                  <EventCard
                    compact
                    title={event.title}
                    date={new Date(event.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    location={event.venue_name ? `${event.venue_name} · ${event.location}` : event.location}
                    category={event.categories?.name || "Événement"}
                    image={event.image_url || "/placeholder.svg"}
                    attendees={event.attendees_count || 0}
                    price={event.price}
                  />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl p-8 text-center gradient-hero sm:p-12 md:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="mb-4 font-display text-2xl font-bold text-primary-foreground sm:text-3xl md:text-4xl">
                Organisez votre prochain événement
              </h2>
              <p className="mx-auto mb-8 max-w-lg font-body text-sm text-primary-foreground/80 sm:text-base">
                Publiez, promouvez et gérez vos événements facilement sur Tukio.
              </p>
              <Link to="/create">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
