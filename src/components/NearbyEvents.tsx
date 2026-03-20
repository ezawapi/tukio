import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";

interface NearbyEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  city: string;
  image_url: string | null;
  price: string | null;
  attendees_count: number | null;
  latitude: number;
  longitude: number;
  categories: { name: string } | null;
  distance?: number;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const NearbyEvents = () => {
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "ready">("idle");

  useEffect(() => {
    if (!navigator.geolocation) { setStatus("denied"); return; }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const { data } = await supabase
          .from("events")
          .select("id, title, date, location, city, image_url, price, attendees_count, latitude, longitude, categories(name)")
          .eq("is_published", true)
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (data) {
          const withDist = (data as NearbyEvent[])
            .map((e) => ({ ...e, distance: getDistance(latitude, longitude, e.latitude, e.longitude) }))
            .sort((a, b) => a.distance! - b.distance!)
            .slice(0, 6);
          setEvents(withDist);
        }
        setStatus("ready");
      },
      () => setStatus("denied"),
      { timeout: 8000 },
    );
  }, []);

  if (status === "idle" || status === "loading") return null;
  if (status === "denied" || events.length === 0) return null;

  return (
    <section className="bg-card py-10 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary"><Navigation className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Près de vous</h2>
              <p className="mt-1 font-body text-sm text-muted-foreground">Événements les plus proches</p>
            </div>
          </div>
          <Link to="/explorer"><Button variant="ghost" className="font-body text-sm font-medium text-primary">Carte →</Button></Link>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 md:mx-0 md:grid md:grid-cols-2 md:px-0 md:pb-0 xl:grid-cols-3"
        >
          {events.map((event) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="min-w-[200px] snap-start sm:min-w-[240px] md:min-w-0">
              <Link to={`/events/${event.id}`}>
                <div className="relative">
                  <EventCard
                    compact
                    title={event.title}
                    date={new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    location={event.venue_name ? `${event.venue_name} · ${event.location}` : event.location}
                    category={event.categories?.name || "Événement"}
                    image={event.image_url || "/placeholder.svg"}
                    attendees={event.attendees_count || 0}
                    price={event.price}
                  />
                  {event.distance !== undefined && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                      <MapPin className="h-3 w-3 text-primary" />
                      {event.distance < 1 ? `${Math.round(event.distance * 1000)} m` : `${event.distance.toFixed(1)} km`}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default NearbyEvents;
