import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Trash2, Eye, Bell, BellOff, AlertTriangle, CheckCircle, XCircle, BarChart3, Calendar, Users, TrendingUp } from "lucide-react";
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
    if (!user) { navigate("/auth"); return; }
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) {
      toast({ title: "Accès refusé", description: "Vous n'avez pas les droits administrateur.", variant: "destructive" });
      navigate("/"); return;
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
    else { toast({ title: "Événement supprimé" }); fetchAll(); }
  };

  const approveEvent = async (eventId: string) => {
    const { error } = await supabase.from("events")
      .update({ status: "approved", is_published: true }).eq("id", eventId);
    if (!error) { toast({ title: "Événement approuvé et publié !" }); fetchAll(); }
  };

  const rejectEvent = async (eventId: string) => {
    const { error } = await supabase.from("events")
      .update({ status: "rejected", is_published: false }).eq("id", eventId);
    if (!error) { toast({ title: "Événement rejeté" }); fetchAll(); }
  };

  const togglePublish = async (eventId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("events")
      .update({ is_published: !currentStatus }).eq("id", eventId);
    if (!error) { toast({ title: currentStatus ? "Événement dépublié" : "Événement republié" }); fetchEvents(); }
  };

  // Stats
  const totalEvents = events.length;
  const publishedEvents = events.filter(e => e.is_published).length;
  const pendingCount = pendingEvents.length;
  const liveEvents = events.filter(e => e.is_live).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container mx-auto px-4">
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
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Tableau de bord Admin</h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total événements", value: totalEvents, icon: BarChart3, color: "text-primary" },
              { label: "Publiés", value: publishedEvents, icon: CheckCircle, color: "text-green-600" },
              { label: "En attente", value: pendingCount, icon: Calendar, color: "text-yellow-600" },
              { label: "En direct", value: liveEvents, icon: TrendingUp, color: "text-destructive" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={`h-8 w-8 ${stat.color} flex-shrink-0`} />
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="pending" className="flex-1 sm:flex-initial">
                En attente {pendingCount > 0 && <Badge className="ml-2 bg-yellow-500 text-foreground">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1 sm:flex-initial">Tous</TabsTrigger>
              <TabsTrigger value="notifications" className="flex-1 sm:flex-initial">
                Notifs {notifications.length > 0 && <Badge className="ml-2 bg-destructive text-destructive-foreground">{notifications.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Événements en attente de validation ({pendingCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingEvents.length === 0 ? (
                      <p className="text-center text-muted-foreground font-body py-8">Aucun événement en attente.</p>
                    ) : pendingEvents.map((event) => (
                      <EventRow key={event.id} event={event} navigate={navigate}
                        actions={
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => approveEvent(event.id)} className="text-green-600 hover:text-green-700">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => rejectEvent(event.id)} className="text-destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Events Tab */}
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Tous les événements ({totalEvents})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.map((event) => (
                      <EventRow key={event.id} event={event} navigate={navigate}
                        actions={
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => togglePublish(event.id, event.is_published)}>
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
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
                      <p className="text-center text-muted-foreground font-body py-8">Aucun événement trouvé.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notifications ({notifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground font-body py-8">Aucune notification non lue.</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
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
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Extracted event row component
const EventRow = ({ event, navigate, actions }: { event: any; navigate: any; actions: React.ReactNode }) => {
  const statusBadge = () => {
    switch (event.status) {
      case "approved": return <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Approuvé</Badge>;
      case "rejected": return <Badge className="text-xs bg-red-100 text-red-700 border-red-200">Rejeté</Badge>;
      default: return <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">En attente</Badge>;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-body font-semibold text-foreground truncate text-sm">{event.title}</h3>
          {statusBadge()}
          <Badge variant={event.is_published ? "default" : "secondary"} className="text-xs">
            {event.is_published ? "Publié" : "Non publié"}
          </Badge>
          {event.categories?.name && (
            <Badge variant="outline" className="text-xs">{event.categories.name}</Badge>
          )}
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
