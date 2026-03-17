import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Trash2, Eye, Bell, BellOff, AlertTriangle, CheckCircle, XCircle, BarChart3, Calendar, TrendingUp } from "lucide-react";
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
      .update({ status: "approved", is_published: true }).eq("id", eventId);
    if (!error) {
      toast({ title: "Événement approuvé et publié !" });
      fetchAll();
    }
  };

  const rejectEvent = async (eventId: string) => {
    const { error } = await supabase.from("events")
      .update({ status: "rejected", is_published: false }).eq("id", eventId);
    if (!error) {
      toast({ title: "Événement rejeté" });
      fetchAll();
    }
  };

  const togglePublish = async (eventId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("events")
      .update({ is_published: !currentStatus }).eq("id", eventId);
    if (!error) {
      toast({ title: currentStatus ? "Événement dépublié" : "Événement republié" });
      fetchEvents();
    }
  };

  const totalEvents = events.length;
  const publishedEvents = events.filter((event) => event.is_published).length;
  const pendingCount = pendingEvents.length;
  const liveEvents = events.filter((event) => event.is_live).length;

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
          <div className="mb-8 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Tableau de bord Admin</h1>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total événements", value: totalEvents, icon: BarChart3 },
              { label: "Publiés", value: publishedEvents, icon: CheckCircle },
              { label: "En attente", value: pendingCount, icon: Calendar },
              { label: "En direct", value: liveEvents, icon: TrendingUp },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-2xl bg-muted p-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 md:w-auto md:grid-cols-4">
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="notifications">Notifs</TabsTrigger>
              <TabsTrigger value="ads">Publicités</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Événements en attente ({pendingCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingEvents.length === 0 ? (
                      <p className="py-8 text-center font-body text-muted-foreground">Aucun événement en attente.</p>
                    ) : pendingEvents.map((event) => (
                      <EventRow key={event.id} event={event}
                        actions={
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AdminEventEditDialog event={event} onSaved={fetchAll} />
                            <Button variant="ghost" size="sm" onClick={() => approveEvent(event.id)}>
                              <CheckCircle className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => rejectEvent(event.id)}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Tous les événements ({totalEvents})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.map((event) => (
                      <EventRow key={event.id} event={event}
                        actions={
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AdminEventEditDialog event={event} onSaved={fetchAll} />
                            <Button variant="ghost" size="sm" onClick={() => togglePublish(event.id, event.is_published)}>
                              <AlertTriangle className="h-4 w-4 text-primary" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                      <p className="py-8 text-center font-body text-muted-foreground">Aucun événement trouvé.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-lg">
                    <Bell className="h-5 w-5 text-primary" /> Notifications ({notifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="py-8 text-center font-body text-muted-foreground">Aucune notification non lue.</p>
                  ) : (
                    <div className="space-y-3">
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
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)}>
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
        return <Badge>Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  return (
    <div className="flex flex-col justify-between gap-2 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="truncate font-body text-sm font-semibold text-foreground">{event.title}</h3>
          {statusBadge()}
          <Badge variant={event.is_published ? "default" : "secondary"}>
            {event.is_published ? "Publié" : "Non publié"}
          </Badge>
          {event.categories?.name && <Badge variant="outline">{event.categories.name}</Badge>}
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
