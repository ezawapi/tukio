import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Mic2, Palette, Trophy, Church, GraduationCap, PartyPopper, Globe, Landmark, Lock, LucideIcon, Sparkles, Clock3 } from "lucide-react";
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
};

const normalizedCategoryColors: Record<string, string> = {
  académique: "bg-primary",
  academique: "bg-primary",
  privé: "bg-secondary",
  prive: "bg-secondary",
  religieux: "bg-accent",
  réligieux: "bg-accent",
  sport: "bg-primary",
  saport: "bg-primary",
  festival: "bg-secondary",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Index = () => {
  const [categories, setCategories] = useState<any[]>([]);
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
    if (data) setCategories(data);
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

      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">Catégories</h2>
              <p className="mt-1 font-body text-muted-foreground">Explorez par type d'événement</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost" className="font-body font-medium text-primary">Voir tout →</Button>
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
          >
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon] || Globe;
              const normalizedColor = normalizedCategoryColors[cat.name.toLowerCase()] || cat.color || "bg-primary";
              return (
                <motion.div key={cat.id} variants={itemVariants}>
                  <Link to={`/events?category=${cat.id}`}>
                    <CategoryCard name={cat.name} icon={Icon} count={0} color={normalizedColor} />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="pb-4">
        <div className="container mx-auto px-4">
          <AdSlotBanner slotCode="home-between-categories-live" compact />
        </div>
      </section>

      {liveEvents.length > 0 && (
        <section className="bg-card py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-destructive animate-pulse-live" />
                <div>
                  <h2 className="font-display text-3xl font-bold text-foreground">En Direct</h2>
                  <p className="mt-1 font-body text-muted-foreground">Événements en cours de diffusion</p>
                </div>
              </div>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:px-0 md:pb-0 xl:grid-cols-4"
            >
              {liveEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants} className="min-w-[220px] snap-start md:min-w-0">
                  <Link to={`/events/${event.id}`}>
                    <EventCard
                      compact
                      title={event.title}
                      date="En direct maintenant"
                      location={event.location}
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

      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">À venir</h2>
              <p className="mt-1 font-body text-muted-foreground">Ne manquez pas ces événements</p>
            </div>
            <Link to="/events">
              <Button variant="ghost" className="font-body font-medium text-primary">Voir tout →</Button>
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
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:pb-0">
              {upcomingEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants} className="min-w-[220px] snap-start lg:min-w-0">
                  <Link to={`/events/${event.id}`}>
                    <EventCard
                      compact
                      title={event.title}
                      date={new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      location={event.location}
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

      <section className="pb-4">
        <div className="container mx-auto px-4">
          <AdSlotBanner slotCode="home-before-latest" compact />
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground">Dernières activités</h2>
                <p className="mt-1 font-body text-muted-foreground">Les plus récentes selon leur enregistrement</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Nouveau</Badge>
          </div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recentEvents.map((event) => (
              <motion.div key={event.id} variants={itemVariants}>
                <Link to={`/events/${event.id}`}>
                  <EventCard
                    compact
                    title={event.title}
                    date={new Date(event.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    location={event.location}
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

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl p-12 text-center gradient-hero md:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
                Organisez votre prochain événement
              </h2>
              <p className="mx-auto mb-8 max-w-lg font-body text-primary-foreground/80">
                Publiez, promouvez et gérez vos événements facilement sur Tukio.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/create">
                  <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
                    Commencer gratuitement
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
