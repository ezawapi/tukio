import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Facebook, Globe, Heart, Instagram, Mail, MapPin, Phone, Shield, Twitter, Users, Youtube } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";

const About = () => {
  const content = useSiteContent();
  const intro = content["about_intro"] || "Tukio est la plateforme africaine de référence pour découvrir, organiser et promouvoir des événements et activités locales.";
  const vision = content["about_vision"] || "";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="pb-16 pt-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">À propos de Tukio</h1>

          <div className="space-y-8 font-body text-muted-foreground leading-relaxed">
            <p className="text-lg text-foreground">{intro}</p>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { icon: Globe, title: "Visibilité locale & internationale", desc: "Nous offrons aux organisateurs une vitrine numérique pour toucher un public local et international." },
                { icon: Users, title: "Communauté", desc: "Tukio rassemble organisateurs, participants et partenaires autour d'événements de qualité." },
                { icon: MapPin, title: "Géolocalisation", desc: "Trouvez les activités les plus proches de vous grâce à notre carte interactive." },
                { icon: Shield, title: "Fiabilité", desc: "Chaque publication est vérifiée par notre équipe avant d'être mise en ligne." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-display text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            {vision && (
              <div className="rounded-2xl bg-card border border-border p-6">
                <h2 className="mb-3 font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" /> Notre vision
                </h2>
                <p>{vision}</p>
              </div>
            )}

            <p className="text-center text-sm">
              Des questions ? Contactez-nous à <a href={`mailto:${content["footer_contact_email"] || "contact@tukio.app"}`} className="text-primary underline">{content["footer_contact_email"] || "contact@tukio.app"}</a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default About;
