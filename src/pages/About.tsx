import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Globe, Heart, MapPin, Shield, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 pt-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">À propos de Tukio</h1>

          <div className="space-y-8 font-body text-muted-foreground leading-relaxed">
            <p className="text-lg text-foreground">
              <strong>Tukio</strong> est la plateforme africaine de référence pour découvrir, organiser et promouvoir des événements et activités locales. Notre mission : connecter les communautés à travers des expériences culturelles, éducatives et sociales.
            </p>

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

            <div className="rounded-2xl bg-card border border-border p-6">
              <h2 className="mb-3 font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" /> Notre vision
              </h2>
              <p>
                Nous croyons que chaque événement mérite d'être vu. Que ce soit un festival de musique, une conférence académique, un atelier créatif ou une rencontre communautaire, Tukio vous aide à trouver ce qui se passe autour de vous et à y participer.
              </p>
              <p className="mt-3">
                Basée en Afrique, notre équipe travaille chaque jour pour rendre la découverte d'événements plus simple, plus inclusive et plus connectée.
              </p>
            </div>

            <p className="text-center text-sm">
              Des questions ? Contactez-nous à <a href="mailto:contact@tukio.app" className="text-primary underline">contact@tukio.app</a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
