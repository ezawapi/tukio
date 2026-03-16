import { useState, useEffect } from "react";
import { Compass } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeafletMap, { MapMarker } from "@/components/LeafletMap";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MapEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  city: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  price: string | null;
  is_live: boolean | null;
  categories: { name: string } | null;
}

const MapExplore = () => {
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date, location, city, latitude, longitude, image_url, price, is_live, categories(name)")
        .eq("is_published", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("date", { ascending: true });

      setEvents((data as unknown as MapEvent[]) || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const markers: MapMarker[] = events.map((event) => ({
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-4">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2"><Compass className="h-6 w-6 text-primary" /> Explorer</h1>
          <p className="font-body text-sm text-muted-foreground">
            {events.length} activité{events.length !== 1 ? "s" : ""} affichée{events.length !== 1 ? "s" : ""} sur la carte interactive selon leur lieu
          </p>
        </div>

        <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 180px)" }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <LeafletMap
              center={defaultCenter}
              zoom={4}
              markers={markers}
              className="z-0"
              style={{ height: "100%", width: "100%" }}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MapExplore;
