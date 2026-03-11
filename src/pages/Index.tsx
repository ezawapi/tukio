import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Mic2, Palette, Trophy, Church, GraduationCap, PartyPopper, Globe, Landmark, Lock, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import CategoryCard from "@/components/CategoryCard";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, LucideIcon> = {
  music: Music, "mic-2": Mic2, palette: Palette, trophy: Trophy,
  church: Church, "graduation-cap": GraduationCap, "party-popper": PartyPopper,
  globe: Globe, landmark: Landmark, lock: Lock,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Index = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchLiveEvents();
    fetchUpcomingEvents();
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">Catégories</h2>
              <p className="font-body text-muted-foreground mt-1">Explorez par type d'événement</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost" className="text-primary font-body font-medium">Voir tout →</Button>
            </Link>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon] || Globe;
              return (
                <motion.div key={cat.id} variants={itemVariants}>
                  <Link to={`/events?category=${cat.id}`}>
                    <CategoryCard name={cat.name} icon={Icon} count={0} color={cat.color} />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse-live" />
                <div>
                  <h2 className="font-display text-3xl font-bold text-foreground">En Direct</h2>
                  <p className="font-body text-muted-foreground mt-1">Événements en cours de diffusion</p>
                </div>
              </div>
            </div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 gap-6">
              {liveEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants}>
                  <Link to={`/events/${event.id}`}>
                    <EventCard
                      title={event.title}
                      date="En direct maintenant"
                      location={event.location}
                      category={event.categories?.name || "Événement"}
                      image={event.image_url || "/placeholder.svg"}
                      attendees={event.attendees_count || 0}
                      isLive={true}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">À Venir</h2>
              <p className="font-body text-muted-foreground mt-1">Ne manquez pas ces événements</p>
            </div>
            <Link to="/events">
              <Button variant="ghost" className="text-primary font-body font-medium">Voir tout →</Button>
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-body text-muted-foreground">Aucun événement à venir pour le moment.</p>
              <Link to="/create">
                <Button className="mt-4 gradient-hero text-primary-foreground border-0">Publiez le premier !</Button>
              </Link>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event) => (
                <motion.div key={event.id} variants={itemVariants}>
                  <Link to={`/events/${event.id}`}>
                    <EventCard
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

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl gradient-hero p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Organisez votre prochain événement
              </h2>
              <p className="font-body text-primary-foreground/80 max-w-lg mx-auto mb-8">
                Publiez, promouvez et gérez vos événements facilement sur Tukio.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/create">
                  <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-body font-semibold">
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
