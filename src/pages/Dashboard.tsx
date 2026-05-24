import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Heart, MapPin, Archive, Ticket, Mail, PlusCircle, ArrowRight, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import PaginationControls from "@/components/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isEventActive } from "@/lib/event-filters";
import { getEventImage } from "@/lib/event-image";

const PAGE = 10;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [pEv, setPEv] = useState(1);
  const [pFav, setPFav] = useState(1);
  const [pPart, setPPart] = useState(1);
  const [pHist, setPHist] = useState(1);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const email = (user.email || "").toLowerCase();
      const [evRes, favRes, invRes, ordRes] = await Promise.all([
        supabase.from("events")
          .select("id, title, city, date, end_date, image_url, status, is_published, attendees_count")
          .eq("organizer_id", user.id)
          .order("date", { ascending: false }),
        supabase.from("favorites")
          .select("id, created_at, events(id, title, city, date, end_date, image_url, status, is_published)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("event_invitations")
          .select("id, status, attendance_status, claimed_at, scanned_at, expires_at, revoked_at, created_at, events(id, title, city, date, end_date, image_url)")
          .or(`invited_user_id.eq.${user.id}${email ? `,invited_email.eq.${email}` : ""}`)
          .not("claimed_at", "is", null)
          .order("created_at", { ascending: false }),
        supabase.from("ticket_orders")
          .select("id, quantity, total_amount, currency, payment_status, attendance_status, created_at, events(id, title, city, date, end_date, image_url)")
          .eq("buyer_user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      const ev = evRes.data || [];
      setMyEvents(ev);
      setPast(ev.filter((e) => !isEventActive(e.date, e.end_date)));
      setFavorites(favRes.data || []);

      const parts: any[] = [];
      (invRes.data || []).forEach((i: any) => {
        if (i.events) parts.push({
          key: `inv-${i.id}`, kind: "invitation", event: i.events,
          status: i.attendance_status === "scanned" ? "scanned" : (i.revoked_at ? "revoked" : "confirmed"),
          when: i.claimed_at || i.created_at,
        });
      });
      (ordRes.data || []).forEach((o: any) => {
        if (o.events) parts.push({
          key: `ord-${o.id}`, kind: "ticket", event: o.events,
          status: o.attendance_status === "scanned" ? "scanned" : o.payment_status,
          extra: `${o.quantity} × ${Number(o.total_amount || 0).toLocaleString()} ${o.currency}`,
          when: o.created_at,
        });
      });
      parts.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
      setParticipations(parts);
      setLoading(false);
    })();
  }, [user, navigate]);

  if (!user) return null;

  const upcomingMine = myEvents.filter((e) => isEventActive(e.date, e.end_date));
  const stats = [
    { label: "Mes activités", value: myEvents.length, icon: Calendar },
    { label: "À venir", value: upcomingMine.length, icon: ArrowRight },
    { label: "Mes favoris", value: favorites.length, icon: Heart },
    { label: "Participations", value: participations.length, icon: Ticket },
    { label: "Historique", value: past.length, icon: Archive },
  ];

  const slice = <T,>(arr: T[], p: number) => arr.slice((p - 1) * PAGE, p * PAGE);

  const eventRow = (e: any, badge?: React.ReactNode, sub?: React.ReactNode) => (
    <Link key={e.id} to={`/events/${e.id}`} className="block rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-xl bg-card shrink-0">
          <img src={getEventImage(e.image_url)} alt={e.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-body font-semibold text-foreground truncate">{e.title}</h3>
            {badge}
          </div>
          <p className="mt-1 font-body text-sm text-muted-foreground flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" />{e.city || "—"}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" />{format(new Date(e.date), "d MMM yyyy", { locale: fr })}</span>
            {sub}
          </p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Mon tableau de bord</h1>
              <p className="font-body text-sm text-muted-foreground">Vos activités, favoris, participations et historique en un coup d'œil.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/create"><Button className="gradient-hero text-primary-foreground border-0"><PlusCircle className="h-4 w-4" /> Créer</Button></Link>
              <Link to="/profile"><Button variant="outline">Mon profil</Button></Link>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-2xl bg-muted p-3"><s.icon className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="font-display text-2xl font-bold">{s.value}</p>
                    <p className="font-body text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="events" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="events">Mes événements</TabsTrigger>
              <TabsTrigger value="favorites">Favoris</TabsTrigger>
              <TabsTrigger value="participations">Participations</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              <Card>
                <CardHeader><CardTitle className="font-display text-xl">Mes événements créés ({myEvents.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {loading ? [1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
                  : myEvents.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground py-6 text-center">Aucun événement créé. <Link to="/create" className="text-primary underline">Créer le premier</Link>.</p>
                  ) : slice(myEvents, pEv).map((e) => eventRow(e,
                    <Badge variant={e.is_published ? "default" : e.status === "rejected" ? "destructive" : "secondary"}>
                      {e.is_published ? "Publié" : e.status === "rejected" ? "Rejeté" : "En attente"}
                    </Badge>
                  ))}
                  <PaginationControls currentPage={pEv} totalPages={Math.ceil(myEvents.length/PAGE)} totalItems={myEvents.length} itemsPerPage={PAGE} onPageChange={setPEv} label="événements" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader><CardTitle className="font-display text-xl">Mes favoris ({favorites.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {loading ? [1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
                  : favorites.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground py-6 text-center">Aucun favori pour le moment.</p>
                  ) : slice(favorites, pFav).map((f) => f.events && eventRow(f.events, <Badge variant="outline" className="gap-1"><Heart className="h-3 w-3 fill-current" /> Favori</Badge>))}
                  <PaginationControls currentPage={pFav} totalPages={Math.ceil(favorites.length/PAGE)} totalItems={favorites.length} itemsPerPage={PAGE} onPageChange={setPFav} label="favoris" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participations">
              <Card>
                <CardHeader><CardTitle className="font-display text-xl">Mes participations ({participations.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {loading ? [1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
                  : participations.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground py-6 text-center">Aucune participation. Réservez un billet ou acceptez une invitation.</p>
                  ) : slice(participations, pPart).map((p) => {
                    const isInv = p.kind === "invitation";
                    const badge = p.status === "scanned"
                      ? <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> Présent</Badge>
                      : p.status === "revoked"
                      ? <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Annulée</Badge>
                      : p.status === "paid" || p.status === "confirmed"
                      ? <Badge variant="default" className="gap-1">{isInv ? <Mail className="h-3 w-3" /> : <Ticket className="h-3 w-3" />} {isInv ? "Confirmée" : "Payée"}</Badge>
                      : <Badge variant="secondary" className="gap-1"><Clock3 className="h-3 w-3" /> {p.status}</Badge>;
                    return <div key={p.key}>{eventRow(p.event, badge, p.extra ? <span className="inline-flex items-center gap-1"><Ticket className="h-3.5 w-3.5 text-primary" />{p.extra}</span> : undefined)}</div>;
                  })}
                  <PaginationControls currentPage={pPart} totalPages={Math.ceil(participations.length/PAGE)} totalItems={participations.length} itemsPerPage={PAGE} onPageChange={setPPart} label="participations" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center justify-between">
                    <span>Historique ({past.length})</span>
                    <Link to="/history"><Button variant="ghost" size="sm">Vue complète <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? [1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
                  : past.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground py-6 text-center">Aucune activité passée.</p>
                  ) : slice(past, pHist).map((e) => eventRow(e, <Badge variant="outline">Terminé</Badge>))}
                  <PaginationControls currentPage={pHist} totalPages={Math.ceil(past.length/PAGE)} totalItems={past.length} itemsPerPage={PAGE} onPageChange={setPHist} label="activités" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Dashboard;
