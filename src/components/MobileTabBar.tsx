import { Link, useLocation } from "react-router-dom";
import { Home, Compass, PlusCircle, CalendarDays, User, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const MobileTabBar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Harmonized tabs:
  // - Connected: Accueil, Activités, Carte, Agenda, Favoris (profile lives in the top navbar)
  // - Anonymous: Accueil, Activités, Carte, Agenda, Profil (-> /auth)
  const tabs = user
    ? [
        { label: "Accueil", icon: Home, href: "/" },
        { label: "Carte", icon: Compass, href: "/explorer" },
        { label: "Créer", icon: PlusCircle, href: "/create" },
        { label: "Agenda", icon: CalendarDays, href: "/agenda" },
        { label: "Favoris", icon: Heart, href: "/favorites" },
      ]
    : [
        { label: "Accueil", icon: Home, href: "/" },
        { label: "Activités", icon: Compass, href: "/events" },
        { label: "Carte", icon: Compass, href: "/explorer" },
        { label: "Agenda", icon: CalendarDays, href: "/agenda" },
        { label: "Profil", icon: User, href: "/auth" },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden safe-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = location.pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", tab.href === "/create" && "h-6 w-6")} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
