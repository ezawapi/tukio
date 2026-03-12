import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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

  // Center on Africa
  const defaultCenter: [number, number] = [2.0, 15.0];
  const defaultZoom = 4;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1 flex flex-col">
        {/* Header */}
        <div className="container mx-auto px-4 py-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Explorer la carte</h1>
          <p className="font-body text-sm text-muted-foreground">
            {events.length} événement{events.length !== 1 ? "s" : ""} géolocalisé{events.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 180px)" }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              className="h-full w-full z-0"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {events.map((event) => (
                <Marker key={event.id} position={[event.latitude, event.longitude]}>
                  <Popup>
                    <div className="min-w-[200px]">
                      {event.image_url && (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-24 object-cover rounded-md mb-2"
                        />
                      )}
                      <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                      {event.is_live && (
                        <span className="inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded mb-1">
                          🔴 LIVE
                        </span>
                      )}
                      <p className="text-xs text-gray-500 mb-1">
                        {event.categories?.name || "Événement"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.date), "d MMM yyyy", { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <MapPin className="h-3 w-3" />
                        {event.location}, {event.city}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{event.price || "Gratuit"}</span>
                        <Link
                          to={`/events/${event.id}`}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Voir détails →
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MapExplore;
