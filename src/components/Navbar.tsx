import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Compass, Heart, LogOut, Menu, Plus, Settings, Shield, UserCircle2, Wifi, WifiOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useUserRole } from "@/hooks/use-user-role";
import tukioLogo from "@/assets/tukio-logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, role } = useUserRole(user?.id);
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = useMemo(
    () => [
      { label: "Accueil", href: "/" },
      { label: "Événements", href: "/events" },
      { label: "Agenda", href: "/agenda" },
      { label: "Carte", href: "/explorer", icon: Compass },
      { label: "À propos", href: "/about", icon: Info },
    ],
    [],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const roleLabel = isAdmin ? "Admin" : role === "moderator" ? "Modérateur" : "Connecté";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={tukioLogo} alt="Tukio" className="h-10 object-contain" />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex xl:gap-3">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className="rounded-full px-4 py-2 font-body text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeClassName="bg-muted text-foreground"
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user && (
            <Badge variant="outline" className="gap-2 rounded-full px-3 py-1">
              {isOnline ? <Wifi className="h-3.5 w-3.5 text-primary" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
              {roleLabel}
            </Badge>
          )}
          {isAdmin && (
            <Button asChild variant="ghost" size="icon">
              <Link to="/admin" aria-label="Administration">
                <Shield className="h-4 w-4 text-primary" />
              </Link>
            </Button>
          )}
          {user && (
            <>
              <Button asChild variant="ghost" size="icon">
                <Link to="/favorites" aria-label="Favoris">
                  <Heart className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link to="/profile" aria-label="Profil">
                  <UserCircle2 className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link to="/notifications" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link to="/settings" aria-label="Paramètres">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
          <Button asChild size="sm" className="gradient-hero border-0 text-primary-foreground">
            <Link to={user ? "/create" : "/auth"}>
              <Plus className="h-4 w-4" /> Publier
            </Link>
          </Button>
          {user ? (
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Déconnexion">
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Connexion</Link>
            </Button>
          )}
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto px-5">
            <SheetHeader className="text-left">
              <SheetTitle>Tukio</SheetTitle>
              <SheetDescription>Navigation</SheetDescription>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-2">
              {user && (
                <Badge variant="outline" className="mb-2 w-fit gap-2 rounded-full px-3 py-1">
                  {isOnline ? <Wifi className="h-3.5 w-3.5 text-primary" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  {roleLabel}
                </Badge>
              )}

              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeClassName="bg-muted text-foreground"
                >
                  {link.label}
                </NavLink>
              ))}

              {user && (
                <>
                  <NavLink to="/profile" className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeClassName="bg-muted text-foreground">
                    Mon profil
                  </NavLink>
                  <NavLink to="/favorites" className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeClassName="bg-muted text-foreground">
                    Mes favoris
                  </NavLink>
                  <NavLink to="/notifications" className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeClassName="bg-muted text-foreground">
                    Notifications
                  </NavLink>
                  <NavLink to="/settings" className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeClassName="bg-muted text-foreground">
                    Paramètres
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <NavLink to="/admin" className="rounded-xl px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-muted" activeClassName="bg-muted text-primary">
                  Administration
                </NavLink>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button asChild className="gradient-hero w-full border-0 text-primary-foreground">
                <Link to={user ? "/create" : "/auth"}>Publier</Link>
              </Button>
              {user ? (
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  Déconnexion
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Connexion</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
