import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Compass, MapPin, Calendar, Search, List, Map as MapIcon, SlidersHorizontal, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import LeafletMap, { MapMarker } from "@/components/LeafletMap";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCountdown } from "@/lib/countdown";
import { useIsMobile } from "@/hooks/use-mobile";

interface MapEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  location: string;
  city: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  price: string | null;
  is_live: boolean | null;
  category_id: string | null;
  categories: { name: string } | null;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MapExplore = () => {
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortByProximity, setSortByProximity] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchEvents = async () => {
      const { isEventActive, startOfTodayISO } = await import("@/lib/event-filters");
      const { data } = await supabase
        .from("events")
        .select("id, title, date, end_date, location, city, latitude, longitude, image_url, price, is_live, category_id, categories(name)")
        .eq("is_published", true)
        .eq("visibility", "public")
        .gte("date", startOfTodayISO())
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("date", { ascending: true });

      const filtered = ((data as unknown as MapEvent[]) || []).filter((e) => isEventActive(e.date, e.end_date));
      setEvents(filtered);
      setLoading(false);
    };
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      setCategories(data || []);
    };
    fetchEvents();
    fetchCategories();

    // Get user position for proximity sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const filtered = useMemo(() => {
    let result = events;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter(e => e.category_id === selectedCategory);
    }
    if (sortByProximity && userPos) {
      result = [...result].sort((a, b) =>
        getDistance(userPos.lat, userPos.lng, a.latitude, a.longitude) -
        getDistance(userPos.lat, userPos.lng, b.latitude, b.longitude)
      );
    }
    return result;
  }, [events, search, selectedCategory, sortByProximity, userPos]);

  const markers: MapMarker[] = filtered.map((event) => ({
    id: event.id,
    lat: event.latitude,
    lng: event.longitude,
    popupHtml: `
      <div style="min-width:200px">
        ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" style="width:100%;height:96px;object-fit:cover;border-radius:6px;margin-bottom:8px" />` : ""}
        <h3 style="font-weight:bold;font-size:14px;margin-bottom:4px">${event.title}</h3>
        ${event.is_live ? '<span style="background:#ef4444;color:white;font-size:11px;padding:2px 8px;border-radius:4px">🔴 LIVE</span>' : ""}
        <p style="font-size:12px;color:#6b7280;margin:4px 0">${event.categories?.name || "Événement"}</p>
        <p style="font-size:12px;color:#6b7280;margin:2px 0">📅 ${format(new Date(event.date), "d MMM yyyy", { locale: fr })}</p>
        <p style="font-size:12px;color:#6b7280;margin:2px 0">📍 ${event.location}, ${event.city}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span style="font-size:12px;font-weight:600">${event.price || "Gratuit"}</span>
          <a href="/events/${event.id}" style="font-size:12px;color:#2563eb">Voir détails →</a>
        </div>
      </div>
    `,
  }));

  const defaultCenter: [number, number] = [2.0, 15.0];

  const eventListPanel = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un lieu, ville..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SlidersHorizontal className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={sortByProximity ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1 shrink-0"
            onClick={() => setSortByProximity(!sortByProximity)}
            disabled={!userPos}
            title={!userPos ? "Position non disponible" : "Trier par proximité"}
          >
            <Navigation className="h-3 w-3" />
            Proximité
          </Button>
        </div>
        <p className="font-body text-xs text-muted-foreground">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((event) => {
          const countdown = getCountdown(event.date, event.end_date);
          return (
            <Link key={event.id} to={`/events/${event.id}`} className="flex gap-3 p-3 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                <img src={getEventImage(event.image_url)} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
                {event.is_live && (
                  <div className="absolute top-1 left-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-semibold text-foreground truncate">{event.title}</h3>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Badge variant="secondary" className="text-[9px]">{event.categories?.name || "Événement"}</Badge>
                  {countdown && <Badge className="border-0 bg-primary/10 text-[9px] font-bold text-primary">{countdown}</Badge>}
                </div>
                <p className="font-body text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary shrink-0" />
                  {format(new Date(event.date), "d MMM yyyy", { locale: fr })}
                </p>
                <p className="font-body text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{event.city}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1 flex flex-col">
        {/* Header */}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2 sm:text-2xl">
              <Compass className="h-5 w-5 text-primary sm:h-6 sm:w-6" /> Explorer
            </h1>
            <p className="font-body text-xs text-muted-foreground sm:text-sm">
              {filtered.length} activité{filtered.length !== 1 ? "s" : ""} sur la carte
            </p>
          </div>
          {/* Mobile toggle */}
          {isMobile && (
            <div className="flex gap-1 rounded-lg border border-border p-0.5">
              <Button variant={mobileView === "map" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setMobileView("map")}>
                <MapIcon className="h-3.5 w-3.5" /> Carte
              </Button>
              <Button variant={mobileView === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setMobileView("list")}>
                <List className="h-3.5 w-3.5" /> Liste
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-[calc(100vh-180px)] bg-muted rounded-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="relative h-[calc(100vh-180px)] min-h-[420px] overflow-hidden rounded-xl border border-border bg-muted/30 flex">
              {/* Desktop: sidebar + map */}
              {!isMobile && (
                <div className="w-80 border-r border-border bg-background flex-shrink-0 overflow-hidden flex flex-col">
                  {eventListPanel}
                </div>
              )}

              {/* Mobile: toggle between map and list */}
              {isMobile && mobileView === "list" ? (
                <div className="w-full bg-background overflow-hidden flex flex-col">
                  {eventListPanel}
                </div>
              ) : (
                <div className={`flex-1 ${isMobile && mobileView !== "map" ? "hidden" : ""}`}>
                  <LeafletMap
                    center={defaultCenter}
                    zoom={4}
                    markers={markers}
                    className="z-0 h-full w-full"
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default MapExplore;
