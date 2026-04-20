import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, ArrowLeft, Archive, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import PaginationControls from "@/components/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isEventActive } from "@/lib/event-filters";

const ITEMS_PER_PAGE = 15;

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, city, date, end_date, image_url, status, is_published, attendees_count")
        .eq("organizer_id", user.id)
        .order("date", { ascending: false });
      const past = (data || []).filter((e) => !isEventActive(e.date, e.end_date));
      setPastEvents(past);
      setLoading(false);
    };
    fetchHistory();
  }, [user, navigate]);

  if (!user) return null;

  const totalPages = Math.ceil(pastEvents.length / ITEMS_PER_PAGE);
  const paginated = pastEvents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalAttendees = pastEvents.reduce((sum, e) => sum + (e.attendees_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 space-y-6 max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                  <Archive className="h-6 w-6 text-primary" /> Historique
                </h1>
                <p className="font-body text-sm text-muted-foreground">Vos activités passées et archivées</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-2xl shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-muted p-3"><Archive className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-display text-2xl font-bold">{pastEvents.length}</p>
                  <p className="font-body text-sm text-muted-foreground">Activités passées</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-muted p-3"><Users className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-display text-2xl font-bold">{totalAttendees}</p>
                  <p className="font-body text-sm text-muted-foreground">Participants cumulés</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="font-display text-xl">Mes activités passées ({pastEvents.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
              ) : pastEvents.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground py-8 text-center">
                  Aucune activité passée. Vos événements terminés apparaîtront ici automatiquement.
                </p>
              ) : (
                paginated.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`} className="block rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-card shrink-0">
                        <img src={event.image_url || "/placeholder.svg"} alt={event.title} className="h-full w-full object-cover opacity-75" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-body font-semibold text-foreground truncate">{event.title}</h3>
                          <Badge variant="outline">Terminé</Badge>
                        </div>
                        <p className="mt-1 font-body text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {event.city || "—"}</span>
                          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {format(new Date(event.date), "d MMM yyyy", { locale: fr })}</span>
                          {event.attendees_count > 0 && (
                            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-primary" /> {event.attendees_count}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
              <PaginationControls currentPage={page} totalPages={totalPages} totalItems={pastEvents.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPage} label="activités" />
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default History;
