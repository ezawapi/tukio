import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Facebook, Globe, Heart, Instagram, Linkedin, Mail, MapPin, Phone, Shield, Twitter, Users, Youtube } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";

const About = () => {
  const content = useSiteContent();
  const intro = content["about_intro"] || "Tukio est la plateforme africaine de référence pour découvrir, organiser et promouvoir des événements et activités locales.";
  const vision = content["about_vision"] || "";
  const contactEmail = content["footer_contact_email"] || "contact@tukio.app";
  const contactPhone = content["footer_contact_phone"] || "";

  const socials = [
    { key: "footer_facebook", icon: Facebook, label: "Facebook" },
    { key: "footer_twitter", icon: Twitter, label: "X / Twitter" },
    { key: "footer_instagram", icon: Instagram, label: "Instagram" },
    { key: "footer_youtube", icon: Youtube, label: "YouTube" },
    { key: "footer_tiktok", icon: null, label: "TikTok" },
  ].filter(s => content[s.key]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="pb-16 pt-24">
        <div className="container mx-auto max-w-4xl px-4">
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

            {/* Contact & Réseaux sociaux */}
            <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Nous contacter
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="h-4 w-4" /> {contactEmail}
                </a>
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <Phone className="h-4 w-4" /> {contactPhone}
                  </a>
                )}
              </div>
              {socials.length > 0 && (
                <div className="flex items-center gap-4 pt-2">
                  {socials.map(s => (
                    <a key={s.key} href={content[s.key]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" aria-label={s.label}>
                      {s.icon ? <s.icon className="h-5 w-5" /> : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>
                      )}
                      <span className="text-sm hidden sm:inline">{s.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default About;
