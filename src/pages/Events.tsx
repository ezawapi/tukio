import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Filter, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EventRow {
  id: string;
  title: string;
  date: string;
  location: string;
  city: string;
  image_url: string | null;
  price: string | null;
  attendees_count: number | null;
  is_live: boolean | null;
  categories: { name: string } | null;
}

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") || "");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "all");
    setSelectedCity(searchParams.get("city") || "");
    setSelectedDate(searchParams.get("date") || "");
  }, [searchParams]);

  useEffect(() => {
    fetchEvents();
  }, [searchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    if (data) setCategories(data);
  };

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from("events")
      .select("id, title, date, location, city, image_url, price, currency, attendees_count, is_live, visibility, categories(name)")
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("date", { ascending: true });

    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const date = searchParams.get("date");

    if (category && category !== "all") {
      query = query.eq("category_id", category);
    }
    if (city) {
      query = query.ilike("city", `%${city}%`);
    }
    if (q) {
      query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,city.ilike.%${q}%`);
    }
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      query = query.gte("date", start.toISOString()).lte("date", end.toISOString());
    }

    const { data } = await query;
    setEvents((data as unknown as EventRow[]) || []);
    setLoading(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedCity.trim()) params.set("city", selectedCity.trim());
    if (selectedDate) params.set("date", selectedDate);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Événements</h1>
            <p className="font-body text-muted-foreground mt-1">Découvrez tous les événements</p>
          </div>

          <div className="bg-card rounded-xl p-4 mb-8 flex flex-col xl:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted min-w-0">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto p-0"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted xl:w-40">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Ville"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto p-0"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted xl:w-44">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto p-0"
              />
            </div>
            <Button onClick={handleSearch} className="gradient-hero text-primary-foreground border-0">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <div className="flex gap-1 self-end xl:self-auto">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("grid")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl bg-card animate-pulse h-72" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-foreground mb-2">Aucun événement trouvé</p>
              <p className="font-body text-muted-foreground">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {events.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className={`group rounded-xl overflow-hidden bg-card shadow-card hover:shadow-warm transition-all cursor-pointer ${
                      viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                    }`}
                  >
                    <div className={`relative overflow-hidden ${viewMode === "list" ? "w-full sm:w-48 h-48 sm:h-32" : "h-48"}`}>
                      <img
                        src={event.image_url || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {event.is_live && (
                        <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground border-0 text-xs animate-pulse-live">
                          🔴 LIVE
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {event.categories?.name || "Événement"}
                      </Badge>
                      <h3 className="font-display font-semibold text-lg text-card-foreground line-clamp-2 mb-2">{event.title}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{format(new Date(event.date), "d MMMM yyyy", { locale: fr })}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-3">
                        <span className="font-body font-semibold text-sm text-foreground truncate">{event.price || "Gratuit"}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{event.attendees_count || 0} participants</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Events;
