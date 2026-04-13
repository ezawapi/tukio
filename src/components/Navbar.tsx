import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Compass, Heart, LogOut, Menu, Plus, Settings, Shield, UserCircle2, MapPin, Monitor, Smartphone, Tablet, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useUserRole } from "@/hooks/use-user-role";
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

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setDeviceType(getDeviceType());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reverse geocoding
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
          if (parts.length > 0) {
            setCityName(parts.join(", "));
          }
        } catch { /* silent */ }
      },
      () => {}
    );
  }, []);

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
  const DeviceIcon = DeviceIcons[deviceType];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
        {/* Left: Logo + City */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src={tukioLogo} alt="Tukio" className="h-9 object-contain" />
          </Link>
          {/* City / Device badge – desktop */}
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
          {/* Mobile city badge */}
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

          {/* Publish CTA */}
          <Button asChild size="sm" className="hidden md:flex gradient-hero border-0 text-primary-foreground h-8 text-xs">
            <Link to={user ? "/create" : "/auth"}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Publier
            </Link>
          </Button>

          {/* User dropdown – Wapi style */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <UserCircle2 className="h-5 w-5" />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate flex-1">
                      {user.user_metadata?.display_name || user.email?.split("@")[0]}
                    </p>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {(isAdmin || role === "moderator") && (
                    <Badge className="mt-1.5 bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5">
                      <Shield className="w-3 h-3 mr-0.5" />{roleLabel}
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <UserCircle2 className="w-4 h-4" /> Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorites" className="flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Favoris
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications" className="flex items-center gap-2 relative">
                    <Bell className="w-4 h-4" /> Notifications
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Paramètres
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 text-primary">
                        <Shield className="w-4 h-4" /> Administration
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden lg:flex h-8 text-xs">
              <Link to="/auth">Connexion</Link>
            </Button>
          )}

          {/* Notification bell (desktop, outside dropdown for quick access) */}
          {user && (
            <Button asChild variant="ghost" size="icon" className="relative hidden lg:flex h-8 w-8">
              <Link to="/notifications" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* Mobile hamburger menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto px-5">
              <SheetHeader className="text-left">
                <SheetTitle>Tukio</SheetTitle>
                <SheetDescription>Navigation</SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    className="rounded-xl px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    activeClassName="bg-primary text-primary-foreground"
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
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </NavLink>
                  </>
                )}

                {isAdmin && (
                  <NavLink to="/admin" className="rounded-xl px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-muted" activeClassName="bg-muted text-primary">
                    Administration
                  </NavLink>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button asChild className="gradient-hero w-full border-0 text-primary-foreground">
                  <Link to={user ? "/create" : "/auth"}>
                    <Plus className="h-4 w-4 mr-1.5" /> Publier
                  </Link>
                </Button>
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-1.5" /> Déconnexion
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
      </div>
    </nav>
  );
};

export default Navbar;
