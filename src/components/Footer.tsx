import { Link } from "react-router-dom";
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
  const description = content["footer_description"] || "Tukio centralise les activités, les lieux et le suivi de vos publications sur tous les écrans.";

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
        <div className="border-t border-border mt-8 pt-8 text-center space-y-2">
          <p className="font-body text-xs text-muted-foreground">
            Contact : <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
          </p>
          <p className="font-body text-xs text-muted-foreground">© 2026 Tukio. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
