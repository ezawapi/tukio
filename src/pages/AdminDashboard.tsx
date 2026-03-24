import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Trash2, Eye, Bell, BellOff, AlertTriangle, CheckCircle, XCircle, BarChart3, Calendar, TrendingUp, Video, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminAdsManager from "@/components/admin/AdminAdsManager";
import AdminPartnersManager from "@/components/admin/AdminPartnersManager";
import AdminEventEditDialog from "@/components/admin/AdminEventEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [adStats, setAdStats] = useState({ total: 0, active: 0 });
  const [adAnalytics, setAdAnalytics] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminRole();
  }, [user, navigate]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) {
      toast({ title: "Accès refusé", description: "Vous n'avez pas les droits administrateur.", variant: "destructive" });
      navigate("/");
      return;
    }
    setIsAdmin(true);
    setLoading(false);
    fetchAll();
  };

  const fetchAll = () => {
    fetchEvents();
    fetchPendingEvents();
    fetchNotifications();
    fetchAdStats();
    fetchAdAnalytics();
  };

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events").select("*, categories(name)")
      .order("created_at", { ascending: false });
    setEvents(data || []);
  };

  const fetchPendingEvents = async () => {
    const { data } = await supabase
      .from("events").select("*, categories(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingEvents(data || []);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("admin_notifications").select("*, events(title, organizer_name)")
      .eq("is_read", false).order("created_at", { ascending: false });
    setNotifications(data || []);
  };

  const fetchAdStats = async () => {
    const { count: total } = await supabase.from("ads").select("*", { count: "exact", head: true });
    const { count: active } = await supabase.from("ads").select("*", { count: "exact", head: true }).eq("is_active", true);
    setAdStats({ total: total || 0, active: active || 0 });
  };

  const fetchAdAnalytics = async () => {
    const { data } = await supabase
      .from("ad_analytics")
      .select("ad_id, event_type, created_at, ads(title)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) {
      // Aggregate by ad
      const map = new Map<string, { title: string; impressions: number; clicks: number }>();
      data.forEach((row: any) => {
        const key = row.ad_id;
        if (!map.has(key)) map.set(key, { title: row.ads?.title || "Pub supprimée", impressions: 0, clicks: 0 });
        const entry = map.get(key)!;
        if (row.event_type === "impression") entry.impressions++;
        else if (row.event_type === "click") entry.clicks++;
      });
      setAdAnalytics(Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats })));
    }
  };

  const markAsRead = async (notifId: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", notifId);
    fetchNotifications();
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Événement supprimé" });
      fetchAll();
    }
  };

  const approveEvent = async (eventId: string) => {
    const { error } = await supabase.from("events")
      .update({ status: "approved", is_published: true, last_reviewed_at: new Date().toISOString(), updated_by_admin: true }).eq("id", eventId);
    if (!error) {
      toast({ title: "Événement approuvé et publié !" });
      fetchAll();
    }
  };

  const rejectEvent = async (eventId: string) => {
    const { error } = await supabase.from("events")
      .update({ status: "rejected", is_published: false, last_reviewed_at: new Date().toISOString(), updated_by_admin: true }).eq("id", eventId);
    if (!error) {
      toast({ title: "Événement rejeté" });
      fetchAll();
    }
  };

  const togglePublish = async (eventId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("events")
      .update({ is_published: !currentStatus, updated_by_admin: true }).eq("id", eventId);
    if (!error) {
      toast({ title: currentStatus ? "Événement dépublié" : "Événement republié" });
      fetchEvents();
    }
  };

  const toggleLive = async (eventId: string, currentLive: boolean) => {
    const { error } = await supabase.from("events")
      .update({ is_live: !currentLive, updated_by_admin: true }).eq("id", eventId);
    if (!error) {
      toast({ title: currentLive ? "Live désactivé" : "Live activé" });
      fetchEvents();
    }
  };

  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.is_published).length;
  const pendingCount = pendingEvents.length;
  const liveEvents = events.filter((e) => e.is_live).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded bg-card" />
            <div className="h-64 rounded-xl bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 pt-20">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center gap-3 sm:mb-8">
            <Shield className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Tableau de bord Admin</h1>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-5">
            {[
              { label: "Total", value: totalEvents, icon: BarChart3 },
              { label: "Publiés", value: publishedEvents, icon: CheckCircle },
              { label: "En attente", value: pendingCount, icon: Calendar },
              { label: "En direct", value: liveEvents, icon: TrendingUp },
              { label: "Pubs actives", value: adStats.active, icon: BarChart3 },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                  <div className="rounded-xl bg-muted p-2 sm:rounded-2xl sm:p-3">
                    <stat.icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground sm:text-2xl">{stat.value}</p>
                    <p className="font-body text-[10px] text-muted-foreground sm:text-xs">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="pending" className="space-y-4 sm:space-y-6">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted p-1 md:w-auto md:grid-cols-6">
              <TabsTrigger value="pending" className="text-xs sm:text-sm">En attente</TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm">Tous</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifs</TabsTrigger>
              <TabsTrigger value="ads" className="text-xs sm:text-sm">Publicités</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
              <TabsTrigger value="partners" className="text-xs sm:text-sm">Partenaires</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base sm:text-lg">Événements en attente ({pendingCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingEvents.length === 0 ? (
                    <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucun événement en attente.</p>
                  ) : (
                    <div className="space-y-5">
                      {(() => {
                        const grouped = new Map<string, any[]>();
                        pendingEvents.forEach((event) => {
                          const cat = event.categories?.name || "Sans catégorie";
                          if (!grouped.has(cat)) grouped.set(cat, []);
                          grouped.get(cat)!.push(event);
                        });
                        return Array.from(grouped.entries()).map(([catName, catEvents]) => (
                          <div key={catName}>
                            <div className="mb-2 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{catName}</Badge>
                              <span className="font-body text-xs text-muted-foreground">({catEvents.length})</span>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              {catEvents.map((event) => (
                                <EventRow key={event.id} event={event}
                                  actions={
                                    <div className="flex flex-wrap items-center gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)} className="h-8 w-8 p-0">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <AdminEventEditDialog event={event} onSaved={fetchAll} />
                                      <Button variant="ghost" size="sm" onClick={() => approveEvent(event.id)} className="h-8 w-8 p-0">
                                        <CheckCircle className="h-4 w-4 text-primary" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => rejectEvent(event.id)} className="h-8 w-8 p-0">
                                        <XCircle className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base sm:text-lg">Tous les événements ({totalEvents})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {events.map((event) => (
                      <EventRow key={event.id} event={event}
                        actions={
                          <div className="flex flex-wrap items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)} className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AdminEventEditDialog event={event} onSaved={fetchAll} />
                            <Button variant="ghost" size="sm" onClick={() => togglePublish(event.id, event.is_published)} className="h-8 w-8 p-0">
                              <AlertTriangle className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleLive(event.id, event.is_live)} className="h-8 w-8 p-0">
                              <Video className={`h-4 w-4 ${event.is_live ? "text-destructive" : "text-muted-foreground"}`} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. L'événement « {event.title} » sera définitivement supprimé.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteEvent(event.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        }
                      />
                    ))}
                    {events.length === 0 && (
                      <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucun événement trouvé.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
                    <Bell className="h-5 w-5 text-primary" /> Notifications ({notifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucune notification non lue.</p>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                          <div>
                            <p className="font-body text-sm text-foreground">
                              <span className="font-semibold">Nouvel événement :</span>{" "}
                              {notif.events?.title || "Événement supprimé"}
                            </p>
                            <p className="font-body text-xs text-muted-foreground">
                              par {notif.events?.organizer_name || "Inconnu"} • {format(new Date(notif.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)} className="h-8 w-8 p-0">
                            <BellOff className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ads">
              <AdminAdsManager userId={user?.id} />
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
                    <MousePointerClick className="h-5 w-5 text-primary" /> Performance publicitaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {adAnalytics.length === 0 ? (
                    <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucune donnée analytique pour le moment.</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 border-b border-border pb-2 font-body text-xs font-semibold text-muted-foreground">
                        <span>Publicité</span><span className="text-center">Impressions</span><span className="text-center">Clics</span><span className="text-center">CTR</span>
                      </div>
                      {adAnalytics.map((row) => (
                        <div key={row.id} className="grid grid-cols-4 gap-2 rounded-lg bg-muted/30 p-3 font-body text-sm">
                          <span className="truncate text-foreground">{row.title}</span>
                          <span className="text-center text-muted-foreground">{row.impressions}</span>
                          <span className="text-center text-muted-foreground">{row.clicks}</span>
                          <span className="text-center font-semibold text-primary">
                            {row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(1) : "0.0"}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="partners">
              <AdminPartnersManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const EventRow = ({ event, actions }: { event: any; actions: React.ReactNode }) => {
  const statusBadge = () => {
    switch (event.status) {
      case "approved":
        return <Badge className="text-[10px]">Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[10px]">Rejeté</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">En attente</Badge>;
    }
  };

  return (
    <div className="flex flex-col justify-between gap-2 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <h3 className="truncate font-body text-sm font-semibold text-foreground">{event.title}</h3>
          {statusBadge()}
          <Badge variant={event.is_published ? "default" : "secondary"} className="text-[10px]">
            {event.is_published ? "Publié" : "Non publié"}
          </Badge>
          {event.is_live && <Badge className="text-[10px] bg-destructive text-destructive-foreground">LIVE</Badge>}
          {event.visibility === "private" && <Badge variant="outline" className="text-[10px]">Privé</Badge>}
          {event.categories?.name && <Badge variant="outline" className="text-[10px]">{event.categories.name}</Badge>}
        </div>
        <p className="font-body text-xs text-muted-foreground">
          {event.organizer_name || "Anonyme"} • {event.city} • {format(new Date(event.created_at), "d MMM yyyy", { locale: fr })}
        </p>
      </div>
      {actions}
    </div>
  );
};

export default AdminDashboard;
