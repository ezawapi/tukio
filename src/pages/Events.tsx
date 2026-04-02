import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Filter, Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import PaginationControls from "@/components/PaginationControls";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatEventPrice } from "@/lib/format-price";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_EVENT_IMAGE = "/placeholder.svg";
const ITEMS_PER_PAGE = 15;

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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

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
    setCurrentPage(1);
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

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (showFreeOnly) return !event.price || event.price === "Gratuit";
      const numPrice = parseFloat((event.price || "0").replace(/[^\d]/g, ""));
      if (!event.price || event.price === "Gratuit") return priceRange[0] === 0;
      return numPrice >= priceRange[0] && numPrice <= priceRange[1];
    });
  }, [events, priceRange, showFreeOnly]);

  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedCity.trim()) params.set("city", selectedCity.trim());
    if (selectedDate) params.set("date", selectedDate);
    setSearchParams(params);
  };

  // On mobile, force list view
  const effectiveViewMode = isMobile ? "list" : viewMode;

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
            <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="default" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Prix
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Fourchette de prix</h4>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showFreeOnly} onChange={(e) => { setShowFreeOnly(e.target.checked); setCurrentPage(1); }} className="rounded" />
                    Gratuit uniquement
                  </label>
                  {!showFreeOnly && (
                    <>
                      <Slider
                        min={0} max={100000} step={1000}
                        value={priceRange}
                        onValueChange={(v) => { setPriceRange(v as [number, number]); setCurrentPage(1); }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{priceRange[0].toLocaleString()} CDF</span>
                        <span>{priceRange[1].toLocaleString()} CDF</span>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={handleSearch} className="gradient-hero text-primary-foreground border-0">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            {/* Only show view toggle on desktop */}
            {!isMobile && (
              <div className="flex gap-1 self-end xl:self-auto">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("grid")}>
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("list")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl bg-card animate-pulse h-72" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-foreground mb-2">Aucun événement trouvé</p>
              <p className="font-body text-muted-foreground">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <>
              <div className={effectiveViewMode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {paginatedEvents.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className={`group rounded-xl overflow-hidden bg-card shadow-card hover:shadow-warm transition-all cursor-pointer ${
                        effectiveViewMode === "list" ? "flex flex-col sm:flex-row" : ""
                      }`}
                    >
                      <div className={`relative overflow-hidden ${effectiveViewMode === "list" ? "w-full sm:w-48 h-48 sm:h-32" : "h-48"}`}>
                        <img
                          src={event.image_url || DEFAULT_EVENT_IMAGE}
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
                          <span className="font-body font-semibold text-sm text-foreground truncate">{formatEventPrice(event.price, (event as any).currency)}</span>
                          {(event.attendees_count || 0) > 0 && (
                            <span className="text-xs text-muted-foreground shrink-0">{event.attendees_count} participants</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                label="activités"
              />
            </>
          )}
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Events;
