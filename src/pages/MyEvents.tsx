import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Eye, Plus, Calendar, MapPin, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaginationControls from "@/components/PaginationControls";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PAGE_SIZE = 10;

type Tab = "upcoming" | "ongoing" | "past";

interface EventRow {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  location: string | null;
  city: string | null;
  image_url: string | null;
  is_published: boolean | null;
  status: string | null;
  visibility: string | null;
  attendees_count: number | null;
}

const MyEvents = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("events")
        .select("id, title, date, end_date, location, city, image_url, is_published, status, visibility, attendees_count", { count: "exact" })
        .eq("organizer_id", user.id);

      if (tab === "upcoming") {
        query = query.gt("date", nowIso).order("date", { ascending: true });
      } else if (tab === "ongoing") {
        // Started but not ended (uses end_date if set, otherwise treat as same-day)
        query = query
          .lte("date", nowIso)
          .or(`end_date.gte.${nowIso},end_date.is.null`)
          .order("date", { ascending: false });
      } else {
        // past: end_date < now (or date < now if no end_date)
        query = query
          .lt("end_date", nowIso)
          .order("date", { ascending: false });
      }

      const { data, count } = await query.range(from, to);
      setEvents((data as EventRow[]) || []);
      setTotal(count || 0);
      setLoading(false);
    };
    load();
  }, [user, tab, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusBadge = (e: EventRow) => {
    if (!e.is_published) return <Badge variant="outline" className="gap-1 text-[10px]"><AlertCircle className="h-3 w-3" /> Brouillon</Badge>;
    if (e.status === "pending") return <Badge variant="secondary" className="gap-1 text-[10px]"><Clock className="h-3 w-3" /> En attente</Badge>;
    if (e.status === "rejected") return <Badge variant="destructive" className="text-[10px]">Rejeté</Badge>;
    return <Badge className="gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" /> Publié</Badge>;
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-20 pt-20">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-center justify-between">
            <Link to="/profile" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
            <Button onClick={() => navigate("/create")} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Nouveau
            </Button>
          </div>

          <h1 className="mb-6 font-display text-2xl sm:text-3xl font-bold text-foreground">
            Mes événements
          </h1>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="space-y-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">À venir</TabsTrigger>
              <TabsTrigger value="ongoing" className="flex-1 sm:flex-none">En cours</TabsTrigger>
              <TabsTrigger value="past" className="flex-1 sm:flex-none">Terminés</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="font-body text-sm text-muted-foreground">
                      {tab === "upcoming" && "Aucun événement à venir."}
                      {tab === "ongoing" && "Aucun événement en cours."}
                      {tab === "past" && "Aucun événement terminé."}
                    </p>
                    <Button onClick={() => navigate("/create")} variant="outline" size="sm" className="mt-4 gap-1.5">
                      <Plus className="h-4 w-4" /> Créer un événement
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                events.map((e) => (
                  <Card key={e.id} className="overflow-hidden">
                    <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
                      <div className="h-20 w-full sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                        {e.image_url ? (
                          <img src={e.image_url} alt={e.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-display text-base font-semibold text-foreground">{e.title}</h3>
                          {statusBadge(e)}
                          {e.visibility === "private" && (
                            <Badge variant="outline" className="text-[10px]">Privé</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(e.date), "d MMM yyyy · HH:mm", { locale: fr })}
                          </span>
                          {(e.location || e.city) && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{[e.location, e.city].filter(Boolean).join(", ")}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/events/${e.id}`)} className="gap-1.5">
                          <Eye className="h-3.5 w-3.5" /> Voir
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/events/${e.id}/edit`)} className="gap-1.5">
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                label="événements"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default MyEvents;
