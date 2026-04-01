import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Phone, Mail, Linkedin } from "lucide-react";
import tukioLogo from "@/assets/tukio-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { useSiteContent } from "@/hooks/use-site-content";
import PartnersBlock from "@/components/PartnersBlock";

const Footer = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  const content = useSiteContent();

  const footerSections = [
    {
      title: "Explorer",
      links: [
        { label: "Événements", href: "/events" },
        { label: "Agenda", href: "/agenda" },
        { label: "Carte", href: "/explorer" },
        { label: "À propos", href: "/about" },
      ],
    },
    {
      title: "Mon compte",
      links: [
        { label: "Profil", href: user ? "/profile" : "/auth" },
        { label: "Favoris", href: user ? "/favorites" : "/auth" },
        { label: "Notifications", href: user ? "/notifications" : "/auth" },
        ...(isAdmin ? [{ label: "Administration", href: "/admin" }] : []),
      ],
    },
    {
      title: "Tukio",
      links: [
        { label: "Accueil", href: "/" },
        { label: "Créer un événement", href: user ? "/create" : "/auth" },
        { label: "Règlement", href: "/terms" },
        { label: "Connexion", href: "/auth" },
      ],
    },
  ];

  const contactEmail = content["footer_contact_email"] || "contact@tukio.app";
  const contactPhone = content["footer_contact_phone"] || "";
  const description = content["footer_description"] || "Tukio centralise les activités, les lieux et le suivi de vos publications sur tous les écrans.";
  const socials = [
    { key: "footer_facebook", icon: Facebook, label: "Facebook" },
    { key: "footer_twitter", icon: Twitter, label: "X" },
    { key: "footer_instagram", icon: Instagram, label: "Instagram" },
    { key: "footer_youtube", icon: Youtube, label: "YouTube" },
    { key: "footer_tiktok", icon: null, label: "TikTok" },
    { key: "footer_linkedin", icon: Linkedin, label: "LinkedIn" },
  ].filter(s => content[s.key]);

  return (
    <footer className="bg-card border-t border-border py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={tukioLogo} alt="Tukio" className="h-10 object-contain" />
            </div>
            <p className="font-body text-sm text-muted-foreground max-w-xs">
              {description}
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-display font-semibold text-foreground mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <PartnersBlock />
        <div className="border-t border-border mt-8 pt-8 text-center space-y-3">
          {socials.length > 0 && (
            <div className="flex items-center justify-center gap-4">
              {socials.map(s => (
                <a key={s.key} href={content[s.key]} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label={s.label}>
                  {s.icon ? <s.icon className="h-5 w-5" /> : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>
                  )}
                </a>
              ))}
            </div>
          )}
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-4">
            <p className="font-body text-xs text-muted-foreground">
              <Mail className="inline h-3 w-3 mr-1" />
              <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
            </p>
            {contactPhone && (
              <p className="font-body text-xs text-muted-foreground">
                <Phone className="inline h-3 w-3 mr-1" />
                <a href={`tel:${contactPhone}`} className="text-primary hover:underline">{contactPhone}</a>
              </p>
            )}
          </div>
          <p className="font-body text-xs text-muted-foreground">© 2026 Tukio. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
