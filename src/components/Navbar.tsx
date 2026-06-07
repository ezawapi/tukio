import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Compass, Heart, LogOut, Menu, Plus, Settings, Shield, UserCircle2, MapPin, Monitor, Smartphone, Tablet, Info, Briefcase, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";
import tukioLogo from "@/assets/tukio-logo.png";

const getDeviceType = () => {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const DeviceIcons = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, role } = useUserRole(user?.id);
  const isOnline = useOnlineStatus();
  const unreadCount = useUnreadNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [cityName, setCityName] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState(getDeviceType());
  const [profile, setProfile] = useState<{ display_name: string | null; account_type: string | null } | null>(null);
  const isPhone = deviceType === "mobile";

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setDeviceType(getDeviceType());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("display_name, account_type").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as any));
  }, [user?.id]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`,
            { headers: { "User-Agent": "TukioApp/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const neighbourhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || "";
          const city = addr.city || addr.town || addr.village || "";
          const province = addr.state || addr.region || "";
          const parts: string[] = [];
          if (neighbourhood) parts.push(neighbourhood);
          if (city && city !== neighbourhood) parts.push(city);
          if (province && province !== city && province !== neighbourhood) parts.push(province);
          if (parts.length > 0) setCityName(parts.join(", "));
        } catch { /* silent */ }
      },
      () => {}
    );
  }, []);

  // Harmonized nav links (used in desktop top bar)
  const navLinks = useMemo(
    () => [
      { label: "Accueil", href: "/" },
      { label: "Activités", href: "/events" },
      { label: "Carte", href: "/explorer", icon: Compass },
      { label: "Agenda", href: "/agenda" },
      { label: "Favoris", href: "/favorites" },
    ],
    [],
  );

  // Items already present in the bottom MobileTabBar — hide them from the
  // mobile hamburger to avoid duplicate navigation on phones.
  const mobileTabHrefs = user
    ? new Set(["/", "/events", "/create", "/agenda", "/favorites"])
    : new Set(["/", "/events", "/explorer", "/agenda"]);
  const hamburgerLinks = navLinks.filter((l) => !mobileTabHrefs.has(l.href));

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const accountTypeLabel = profile?.account_type === "organizer" ? "Organisateur" : "Utilisateur";
  const roleLabel = isAdmin
    ? "Administrateur"
    : role === "moderator"
      ? "Modérateur"
      : accountTypeLabel;

  const displayName =
    profile?.display_name?.trim() ||
    (user?.user_metadata as any)?.display_name ||
    user?.email?.split("@")[0] ||
    "";

  const DeviceIcon = DeviceIcons[deviceType];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
        {/* Left: Logo + City */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src={tukioLogo} alt="Tukio" className="h-9 object-contain" />
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-full px-2.5 py-1">
            {cityName ? (
              <>
                <MapPin className="w-3 h-3 text-primary" />
                <span className="font-medium max-w-[160px] truncate">{cityName}</span>
              </>
            ) : (
              <>
                <DeviceIcon className="w-3 h-3 text-primary" />
                <span className="font-medium capitalize">{deviceType === "mobile" ? "Téléphone" : deviceType === "tablet" ? "Tablette" : "Ordinateur"}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Desktop nav links */}
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className="rounded-full px-4 py-2 font-body text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <div className="sm:hidden flex items-center gap-1 text-[10px] text-muted-foreground mr-1">
            {cityName ? (
              <>
                <MapPin className="w-3 h-3 text-primary" />
                <span className="font-medium max-w-[70px] truncate">{cityName}</span>
              </>
            ) : (
              <DeviceIcon className="w-3 h-3 text-primary" />
            )}
          </div>

          {/* Publish CTA (visible only for organizers / admins) */}
          {(profile?.account_type === "organizer" || isAdmin) && (
            <Button asChild size="sm" className="hidden md:flex gradient-hero border-0 text-primary-foreground h-8 text-xs">
              <Link to="/create">
                <Plus className="h-3.5 w-3.5 mr-1" /> Publier
              </Link>
            </Button>
          )}

          {/* Profile icon (top): only visible when connected. Click → /profile */}
          {user ? (
            <Link
              to="/profile"
              aria-label="Mon profil"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <UserCircle2 className="h-5 w-5" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden lg:flex h-8 text-xs">
              <Link to="/auth">Connexion</Link>
            </Button>
          )}

          {/* Hamburger menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto px-5">
              <SheetHeader className="text-left">
                <SheetTitle>Tukio</SheetTitle>
                <SheetDescription className="sr-only">Navigation principale</SheetDescription>
              </SheetHeader>

              {/* Part 1 — User name + role (only if connected) */}
              {user && (
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <UserCircle2 className="h-10 w-10 text-primary" />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-semibold text-foreground truncate">{displayName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5">
                          {isAdmin ? (
                            <><Shield className="w-3 h-3 mr-0.5" />{roleLabel}</>
                          ) : profile?.account_type === "organizer" ? (
                            <><Briefcase className="w-3 h-3 mr-0.5" />Organisateur</>
                          ) : (
                            <><UserIcon className="w-3 h-3 mr-0.5" />Utilisateur</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Part 2 — Navigation complémentaire (les onglets de la barre mobile sont déjà accessibles en bas) */}
              <div className="mt-5 flex flex-col gap-1">
                {hamburgerLinks.length > 0 ? (
                  hamburgerLinks.map((link) => (
                    <NavLink
                      key={link.href}
                      to={link.href}
                      className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      activeClassName="bg-primary text-primary-foreground"
                    >
                      {link.label}
                    </NavLink>
                  ))
                ) : null}
                <NavLink
                  to="/about"
                  className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeClassName="bg-primary text-primary-foreground"
                >
                  À propos
                </NavLink>
                <NavLink
                  to="/settings"
                  className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground inline-flex items-center gap-2"
                  activeClassName="bg-primary text-primary-foreground"
                >
                  <Settings className="h-4 w-4" /> Paramètres
                </NavLink>
                {user && !isPhone && (
                  <NavLink
                    to="/profile"
                    className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    activeClassName="bg-primary text-primary-foreground"
                  >
                    Mon profil
                  </NavLink>
                )}
                {user && !isPhone && (profile?.account_type === "organizer" || isAdmin) && (
                  <NavLink
                    to="/create"
                    className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    activeClassName="bg-primary text-primary-foreground"
                  >
                    Publier une activité
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin" className="rounded-xl px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-muted" activeClassName="bg-muted text-primary">
                    Administration
                  </NavLink>
                )}
              </div>

              {/* Part 3 — Auth */}
              <div className="mt-6 border-t border-border pt-5">
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-1.5" /> Déconnexion
                  </Button>
                ) : (
                  <Button asChild className="gradient-hero w-full border-0 text-primary-foreground">
                    <Link to="/auth">Connexion</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
