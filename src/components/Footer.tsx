import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-sm">T</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">Tukio</span>
            </div>
            <p className="font-body text-sm text-muted-foreground">
              La plateforme centrale d'information événementielle.
            </p>
          </div>
          {[
            { title: "Explorer", links: ["Événements", "Catégories", "Carte", "En direct"] },
            { title: "Organisateurs", links: ["Publier", "Tarifs", "Ressources"] },
            { title: "Support", links: ["Contact", "FAQ", "Mentions légales"] },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-display font-semibold text-foreground mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link to="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="font-body text-sm text-muted-foreground">© 2026 Tukio. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
