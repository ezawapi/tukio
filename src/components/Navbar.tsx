import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import tukioLogo from "@/assets/tukio-logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Événements", href: "/events" },
    { label: "Catégories", href: "/categories" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={tukioLogo} alt="Tukio" className="h-10 object-contain" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user && (
            <Link to="/favorites">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {user ? (
            <>
              <Link to="/create">
                <Button size="sm" className="gradient-hero text-primary-foreground border-0">Publier</Button>
              </Link>
              <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" size="sm">Connexion</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="gradient-hero text-primary-foreground border-0">Publier</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="font-body text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link to="/favorites" className="font-body text-sm font-medium text-muted-foreground hover:text-foreground py-2" onClick={() => setIsOpen(false)}>
                  Mes Favoris
                </Link>
              )}
              <div className="flex gap-2 pt-2">
                {user ? (
                  <>
                    <Link to="/create" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button size="sm" className="w-full gradient-hero text-primary-foreground border-0">Publier</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>Déconnexion</Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Connexion</Button>
                    </Link>
                    <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button size="sm" className="w-full gradient-hero text-primary-foreground border-0">Publier</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
