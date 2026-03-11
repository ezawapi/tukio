import { motion } from "framer-motion";
import { Music, Mic2, Palette, Trophy, Church, GraduationCap, PartyPopper, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import CategoryCard from "@/components/CategoryCard";
import Footer from "@/components/Footer";

import eventConcert from "@/assets/event-concert.jpg";
import eventConference from "@/assets/event-conference.jpg";
import eventArt from "@/assets/event-art.jpg";
import eventSport from "@/assets/event-sport.jpg";
import eventFestival from "@/assets/event-festival.jpg";
import eventWedding from "@/assets/event-wedding.jpg";

const categories = [
  { name: "Musique", icon: Music, count: 342, color: "bg-primary" },
  { name: "Conférences", icon: Mic2, count: 156, color: "bg-accent" },
  { name: "Art & Culture", icon: Palette, count: 89, color: "bg-secondary" },
  { name: "Sport", icon: Trophy, count: 234, color: "bg-deep-green" },
  { name: "Religieux", icon: Church, count: 78, color: "bg-terracotta" },
  { name: "Académique", icon: GraduationCap, count: 112, color: "bg-earth-brown" },
  { name: "Festivals", icon: PartyPopper, count: 67, color: "bg-sunset-orange" },
  { name: "International", icon: Globe, count: 45, color: "bg-primary" },
];

const liveEvents = [
  { title: "Concert Live: Fally Ipupa à Kinshasa", date: "En direct maintenant", location: "Stade des Martyrs, Kinshasa", category: "Musique", image: eventConcert, attendees: 45000, isLive: true },
  { title: "Conférence Tech Africa Summit 2026", date: "En direct maintenant", location: "Palais des Congrès, Abidjan", category: "Conférence", image: eventConference, attendees: 2500, isLive: true },
];

const upcomingEvents = [
  { title: "Festival des Arts de Dakar", date: "15 Mars 2026", location: "Place de l'Indépendance, Dakar", category: "Festival", image: eventFestival, attendees: 12000, price: "5 000 FCFA" },
  { title: "Exposition Art Contemporain Africain", date: "18 Mars 2026", location: "Musée National, Douala", category: "Art", image: eventArt, attendees: 800, price: "Gratuit" },
  { title: "Match CAN 2026 - Demi-finale", date: "20 Mars 2026", location: "Stade Olympique, Yaoundé", category: "Sport", image: eventSport, attendees: 60000, price: "15 000 FCFA" },
  { title: "Mariage Royal - Cérémonie Grand Format", date: "22 Mars 2026", location: "Hôtel Ivoire, Abidjan", category: "Privé", image: eventWedding, attendees: 500, price: "Sur invitation" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Index = () => {
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
            <Button variant="ghost" className="text-primary font-body font-medium">
              Voir tout →
            </Button>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4"
          >
            {categories.map((cat) => (
              <motion.div key={cat.name} variants={itemVariants}>
                <CategoryCard {...cat} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Events */}
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {liveEvents.map((event) => (
              <motion.div key={event.title} variants={itemVariants}>
                <EventCard {...event} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">À Venir</h2>
              <p className="font-body text-muted-foreground mt-1">Ne manquez pas ces événements</p>
            </div>
            <Button variant="ghost" className="text-primary font-body font-medium">
              Voir tout →
            </Button>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {upcomingEvents.map((event) => (
              <motion.div key={event.title} variants={itemVariants}>
                <EventCard {...event} />
              </motion.div>
            ))}
          </motion.div>
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
                Publiez, promouvez et gérez vos événements facilement sur Tukio. Rejoignez des milliers d'organisateurs.
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-body font-semibold">
                  Commencer gratuitement
                </Button>
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
