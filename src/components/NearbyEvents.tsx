import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Navigation, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getCountdown } from "@/lib/countdown";
import { useTranslation } from "@/contexts/I18nContext";

interface NearbyEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
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
  const { t } = useTranslation();
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "ready">("idle");
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) { setStatus("denied"); return; }
    setStatus("loading");

    const fetchNearby = async (latitude: number, longitude: number) => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date, end_date, location, city, image_url, price, attendees_count, latitude, longitude, categories(name)")
        .eq("is_published", true)
        .eq("visibility", "public")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (data) {
        const withDist = (data as unknown as NearbyEvent[])
          .map((e) => ({ ...e, distance: getDistance(latitude, longitude, e.latitude, e.longitude) }))
          .sort((a, b) => a.distance! - b.distance!)
          .slice(0, 6);
        setEvents(withDist);
      }
      setStatus("ready");
    };

    let resolved = false;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!resolved || pos.coords.accuracy < 500) {
          resolved = true;
          fetchNearby(pos.coords.latitude, pos.coords.longitude);
        }
        if (pos.coords.accuracy < 100 && watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  if (status === "idle" || status === "loading") return null;
  if (status === "denied" || events.length === 0) return null;

  return (
    <section className="bg-card py-6 sm:py-10">
      <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary"><Navigation className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t("home.nearby")}</h2>
              <p className="mt-1 font-body text-sm text-muted-foreground">{t("home.nearby_sub")}</p>
            </div>
          </div>
          <Link to="/explorer"><Button variant="ghost" className="font-body text-sm font-medium text-primary">{t("home.map_link")}</Button></Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0 -mr-4 pr-4 md:mr-0 md:pr-0">
          {events.map((event) => {
            const countdown = getCountdown(event.date, event.end_date);
            return (
              <motion.div key={event.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="min-w-[260px] max-w-[280px] flex-shrink-0 snap-start md:min-w-0 md:max-w-none">
                <Link to={`/events/${event.id}`} className="group flex gap-3 rounded-xl bg-background p-2.5 shadow-card transition-shadow hover:shadow-warm sm:gap-4 sm:p-3">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-32">
                    <img src={event.image_url || "/placeholder.svg"} alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    {event.distance !== undefined && (
                      <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold text-foreground backdrop-blur-sm">
                        <MapPin className="h-2.5 w-2.5 text-primary" />
                        {event.distance < 1 ? `${Math.round(event.distance * 1000)} m` : `${event.distance.toFixed(1)} km`}
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="w-fit text-[9px] sm:text-[10px]">{event.categories?.name || t("home.event")}</Badge>
                      {countdown && (
                        <Badge className="border-0 bg-primary/10 text-[9px] font-bold text-primary sm:text-[10px]">{countdown}</Badge>
                      )}
                    </div>
                    <h3 className="font-display text-sm font-semibold leading-tight text-card-foreground line-clamp-2 sm:text-base">{event.title}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
                      <Calendar className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NearbyEvents;
