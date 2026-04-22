import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from("favorites")
      .select("*, events(*, categories(name))")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setFavorites(data || []);
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from("favorites").delete().eq("id", favoriteId);
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground mb-8">Mes Favoris</h1>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="rounded-xl bg-card animate-pulse h-72" />)}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="font-display text-2xl text-foreground mb-2">Aucun favori</p>
              <p className="font-body text-muted-foreground mb-4">Explorez les événements et ajoutez-les à vos favoris</p>
              <Link to="/events"><Button className="gradient-hero text-primary-foreground border-0">Explorer</Button></Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => {
                const event = fav.events;
                if (!event) return null;
                return (
                  <motion.div key={fav.id} whileHover={{ y: -4 }} className="group rounded-xl overflow-hidden bg-card shadow-card hover:shadow-warm transition-all">
                    <Link to={`/events/${event.id}`}>
                      <div className="relative h-48 overflow-hidden">
                        <img src={getEventImage(event.image_url)} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground border-0 text-xs">
                          {event.categories?.name || "Événement"}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-lg text-card-foreground line-clamp-2 mb-2">{event.title}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>{format(new Date(event.date), "d MMMM yyyy", { locale: fr })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => removeFavorite(fav.id)}
                        className="text-destructive hover:text-destructive/80 font-body text-xs flex items-center gap-1"
                      >
                        <Heart className="h-3 w-3 fill-current" /> Retirer
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

// Need Button import
import { Button } from "@/components/ui/button";

export default Favorites;
