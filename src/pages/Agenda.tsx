import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { formatEventPrice } from "@/lib/format-price";
import { getEventImage } from "@/lib/event-image";
import { useUserLocation, distanceKm as distanceKmFn, formatDistance } from "@/hooks/use-user-location";
import LocationPicker from "@/components/LocationPicker";

interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  location: string;
  city: string;
  image_url: string | null;
  price: string | null;
  currency: string;
  is_live: boolean | null;
  latitude: number | null;
  longitude: number | null;
  categories: { name: string } | null;
}

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [allEvents, setAllEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { location: userLocation } = useUserLocation();

  useEffect(() => {
    fetchAllEvents();
  }, []);

  useEffect(() => {
    if (selectedDate && allEvents.length > 0) {
      const filtered = allEvents.filter((e) => isSameDay(new Date(e.date), selectedDate));
      setEvents(filtered);
    } else {
      setEvents([]);
    }
  }, [selectedDate, allEvents]);

  const fetchAllEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, date, end_date, location, city, image_url, price, currency, is_live, latitude, longitude, categories(name)")
      .eq("is_published", true)
      .eq("visibility", "public")
      .gte("date", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("date", { ascending: true });
    setAllEvents((data as unknown as AgendaEvent[]) || []);
    setLoading(false);
  };

  const eventDates = allEvents.map((e) => new Date(e.date));
  const modifiers = { hasEvent: eventDates };
  const modifiersStyles = {
    hasEvent: {
      backgroundColor: "hsl(var(--primary) / 0.15)",
      borderRadius: "50%",
      fontWeight: 700,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
                <CalendarIcon className="h-8 w-8 text-primary" />
                Agenda
              </h1>
              <p className="font-body text-muted-foreground mt-1">Calendrier interactif des activités</p>
            </div>
            <LocationPicker />
          </div>

          <div className="grid lg:grid-cols-[300px_1fr] gap-4">
            {/* Calendar */}
            <Card className="h-fit sticky top-24">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  locale={fr}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="w-full"
                />
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-body">
                  <div className="w-3 h-3 rounded-full bg-primary/20" />
                  <span>Jours avec des événements</span>
                </div>
              </CardContent>
            </Card>

            {/* Events for selected date */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </h2>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedDate.toISOString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {events.length === 0 ? (
                      <div className="text-center py-16 bg-card rounded-xl">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="font-display text-lg text-foreground">Aucun événement ce jour</p>
                        <p className="font-body text-sm text-muted-foreground mt-1">
                          Sélectionnez une autre date ou explorez tous les événements
                        </p>
                      </div>
                    ) : (
                      events.map((event) => (
                        <Link key={event.id} to={`/events/${event.id}`}>
                          <motion.div
                            whileHover={{ x: 4 }}
                            className="flex gap-4 bg-card rounded-xl p-4 shadow-card hover:shadow-warm transition-shadow cursor-pointer"
                          >
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={getEventImage(event.image_url)} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">{event.categories?.name || "Événement"}</Badge>
                                {event.is_live && (
                                  <Badge className="bg-destructive text-destructive-foreground border-0 text-xs animate-pulse-live">🔴 LIVE</Badge>
                                )}
                              </div>
                              <h3 className="font-display font-semibold text-foreground line-clamp-1">{event.title}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-primary" />
                                  {format(new Date(event.date), "HH:mm", { locale: fr })}
                                  {event.end_date && ` - ${format(new Date(event.end_date), "HH:mm", { locale: fr })}`}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-primary" />
                                  <span className="truncate">{event.city}</span>
                                </span>
                              </div>
                              <p className="font-body font-semibold text-sm text-foreground mt-1">
                                {formatEventPrice(event.price, event.currency)}
                              </p>
                            </div>
                          </motion.div>
                        </Link>
                      ))
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Agenda;
