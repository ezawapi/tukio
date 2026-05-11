import { getEventImage } from "@/lib/event-image";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Heart, MessageSquare, PlusCircle, Shield, Wifi, WifiOff, MapPin, Clock3, ArrowRight, Pencil, Archive, Bell, Trash2, Star, StarOff, CheckCheck, Briefcase, UserCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import ProfileEditor from "@/components/ProfileEditor";
import PaginationControls from "@/components/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrganizerInvitations from "@/components/OrganizerInvitations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const ITEMS_PER_PAGE = 15;
const NOTIFS_PAGE_SIZE = 15;

interface UserNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  is_favorite: boolean;
  related_event_id: string | null;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  new_event: "Nouvel événement",
  event_modified: "Modification",
  info: "Information",
  reminder: "Rappel",
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const { role, isAdmin } = useUserRole(user?.id);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<"user" | "organizer">("user");
  const [events, setEvents] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notifsTotal, setNotifsTotal] = useState(0);
  const [notifsLoadedCount, setNotifsLoadedCount] = useState(NOTIFS_PAGE_SIZE);
  const [notifsLoadingMore, setNotifsLoadingMore] = useState(false);
  const [eventsPage, setEventsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [selectedNotif, setSelectedNotif] = useState<UserNotification | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const fetchDashboard = async () => {
      const [profileResult, eventsResult, commentsResult, favoritesResult, notifsResult] = await Promise.all([
        supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle(),
        supabase.from("events").select("id, title, city, date, created_at, status, is_published").eq("organizer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("comments").select("id, content, created_at, event_id, events(title)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("favorites").select("id, created_at, events(id, title, city, date, image_url)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      ]);
      const acct = (profileResult.data as any)?.account_type;
      setAccountType(acct === "organizer" ? "organizer" : "user");
      setEvents(eventsResult.data || []);
      setComments(commentsResult.data || []);
      setFavorites(favoritesResult.data || []);
      setNotifications((notifsResult.data as UserNotification[]) || []);
      setLoading(false);
    };
    fetchDashboard();

    // Real-time updates for notifications
    if (user) {
      const channel = supabase
        .channel("profile-notifs")
        .on("postgres_changes", { event: "*", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` }, async () => {
          const { data } = await supabase.from("user_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
          setNotifications((data as UserNotification[]) || []);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, navigate]);

  const markAsRead = async (id: string) => {
    await supabase.from("user_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("user_notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast({ title: "Toutes les notifications marquées comme lues" });
  };
  const toggleFavoriteNotif = async (id: string, current: boolean) => {
    await supabase.from("user_notifications").update({ is_favorite: !current }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_favorite: !current } : n));
  };
  const deleteNotification = async (id: string) => {
    await supabase.from("user_notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (selectedNotif?.id === id) setSelectedNotif(null);
  };
  const openNotif = (n: UserNotification) => {
    setSelectedNotif(n);
    if (!n.is_read) markAsRead(n.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isOrganizer = accountType === "organizer" || isAdmin;
  const publishedCount = events.filter((event) => event.is_published).length;
  const pendingCount = events.filter((event) => event.status === "pending").length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const eventsTotalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const paginatedEvents = events.slice((eventsPage - 1) * ITEMS_PER_PAGE, eventsPage * ITEMS_PER_PAGE);
  const commentsTotalPages = Math.ceil(comments.length / ITEMS_PER_PAGE);
  const paginatedComments = comments.slice((commentsPage - 1) * ITEMS_PER_PAGE, commentsPage * ITEMS_PER_PAGE);
  const favoritesTotalPages = Math.ceil(favorites.length / ITEMS_PER_PAGE);
  const paginatedFavorites = favorites.slice((favoritesPage - 1) * ITEMS_PER_PAGE, favoritesPage * ITEMS_PER_PAGE);
  const notifsTotalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const paginatedNotifs = notifications.slice((notifsPage - 1) * ITEMS_PER_PAGE, notifsPage * ITEMS_PER_PAGE);

  const tabsList = [
    ...(isOrganizer ? [{ value: "events", label: "Mes activités" }] : []),
    { value: "notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { value: "comments", label: "Commentaires" },
    { value: "favorites", label: "Favoris" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 space-y-8">
          <Card className={`overflow-hidden ${isOrganizer ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isAdmin ? "default" : "secondary"} className="gap-1">
                      {isAdmin ? <Shield className="h-3 w-3" /> : isOrganizer ? <Briefcase className="h-3 w-3" /> : <UserCircle2 className="h-3 w-3" />}
                      {isAdmin ? "Administrateur" : role === "moderator" ? "Modérateur" : isOrganizer ? "Organisateur" : "Utilisateur"}
                    </Badge>
                    <Badge variant="outline" className="gap-2">
                      {isOnline ? <Wifi className="h-3.5 w-3.5 text-primary" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      {isOnline ? "En ligne" : "Hors ligne"}
                    </Badge>
                  </div>
                  <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Mon profil</h1>
                    <p className="font-body text-muted-foreground mt-1 break-all">{user.email}</p>
                  </div>
                  <div className="pt-2">
                    <ProfileEditor userId={user.id} email={user.email || ""} />
                  </div>
                  <p className="max-w-2xl font-body text-sm text-muted-foreground">
                    Suivez vos {isOrganizer ? "publications, " : ""}notifications, commentaires et favoris depuis votre mini tableau de bord personnel.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {isOrganizer && (
                    <Link to="/create">
                      <Button className="w-full gradient-hero text-primary-foreground border-0 sm:w-auto">
                        <PlusCircle className="h-4 w-4" /> Nouvelle activité
                      </Button>
                    </Link>
                  )}
                  <Link to="/history">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Archive className="h-4 w-4" /> Historique
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <Shield className="h-4 w-4" /> Dashboard admin
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(isOrganizer
              ? [
                  { label: "Publications", value: events.length, icon: Calendar },
                  { label: "Publiées", value: publishedCount, icon: ArrowRight },
                  { label: "En attente", value: pendingCount, icon: Clock3 },
                  { label: "Notifications", value: unreadCount, icon: Bell },
                ]
              : [
                  { label: "Notifications", value: unreadCount, icon: Bell },
                  { label: "Commentaires", value: comments.length, icon: MessageSquare },
                  { label: "Favoris", value: favorites.length, icon: Heart },
                  { label: "Connexion", value: isOnline ? "Active" : "Hors-ligne", icon: Wifi },
                ]
            ).map((stat: any) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="rounded-2xl bg-muted p-3">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="font-body text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue={tabsList[0].value} className="space-y-6">
            <TabsList className={`grid w-full md:w-auto`} style={{ gridTemplateColumns: `repeat(${tabsList.length}, minmax(0, 1fr))` }}>
              {tabsList.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>

            {isOrganizer && (
              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-xl">Mes publications ({events.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {events.length === 0 ? (
                      <p className="font-body text-sm text-muted-foreground">Vous n'avez encore publié aucune activité.</p>
                    ) : (
                      paginatedEvents.map((event) => (
                        <Link key={event.id} to={`/events/${event.id}`} className="block rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-body font-semibold text-foreground truncate">{event.title}</h3>
                                <Badge variant={event.is_published ? "default" : event.status === "rejected" ? "destructive" : "secondary"}>
                                  {event.is_published ? "Publié" : event.status === "rejected" ? "Rejeté" : "En attente"}
                                </Badge>
                              </div>
                              <p className="font-body text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {event.city || "Ville non précisée"}</span>
                                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {format(new Date(event.date), "d MMM yyyy", { locale: fr })}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link to={`/events/${event.id}/edit`} onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" size="sm" className="gap-1"><Pencil className="h-3 w-3" /> Modifier</Button>
                              </Link>
                              <Button variant="ghost" size="sm">Ouvrir</Button>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                    <PaginationControls currentPage={eventsPage} totalPages={eventsTotalPages} totalItems={events.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setEventsPage} label="activités" />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="notifications">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="font-display text-xl">Notifications ({notifications.length})</CardTitle>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs gap-1">
                      <CheckCheck className="h-3.5 w-3.5" /> Tout lire
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {paginatedNotifs.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="font-body text-sm text-muted-foreground">Aucune notification.</p>
                    </div>
                  ) : (
                    paginatedNotifs.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => openNotif(n)}
                        className={`w-full text-left rounded-xl border p-3 flex gap-3 items-start transition-colors ${n.is_read ? "border-border bg-card hover:bg-muted/60" : "border-primary/30 bg-primary/5 hover:bg-primary/10"}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="secondary" className="text-[9px]">{typeLabels[n.type] || n.type}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                            </span>
                            {!n.is_read && <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />}
                          </div>
                          <p className="font-body text-sm font-medium text-foreground truncate">{n.title}</p>
                          {n.body && <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                        </div>
                      </button>
                    ))
                  )}
                  <PaginationControls currentPage={notifsPage} totalPages={notifsTotalPages} totalItems={notifications.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setNotifsPage} label="notifications" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Mes commentaires ({comments.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground">Aucun commentaire enregistré pour le moment.</p>
                  ) : (
                    paginatedComments.map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-border bg-muted/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-body text-sm font-semibold text-foreground">
                            {comment.events?.title || "Événement"}
                          </p>
                          <span className="font-body text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "d MMM yyyy • HH:mm", { locale: fr })}
                          </span>
                        </div>
                        <p className="mt-2 font-body text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))
                  )}
                  <PaginationControls currentPage={commentsPage} totalPages={commentsTotalPages} totalItems={comments.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCommentsPage} label="commentaires" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Mes favoris ({favorites.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {favorites.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground">Aucun favori pour le moment.</p>
                  ) : (
                    paginatedFavorites.map((favorite) => {
                      const event = favorite.events;
                      if (!event) return null;
                      return (
                        <Link key={favorite.id} to={`/events/${event.id}`} className="block rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 overflow-hidden rounded-xl bg-card shrink-0">
                              <img src={getEventImage(event.image_url)} alt={event.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-primary" />
                                <h3 className="truncate font-body font-semibold text-foreground">{event.title}</h3>
                              </div>
                              <p className="mt-1 font-body text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {event.city}</span>
                                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {format(new Date(event.date), "d MMM yyyy", { locale: fr })}</span>
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                  <PaginationControls currentPage={favoritesPage} totalPages={favoritesTotalPages} totalItems={favorites.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setFavoritesPage} label="favoris" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {isOrganizer && (
            <div className="rounded-xl border border-primary/30 ring-1 ring-primary/10 p-1">
              <OrganizerInvitations userId={user.id} />
            </div>
          )}
        </div>
      </div>

      {/* Notification detail popup */}
      <Dialog open={!!selectedNotif} onOpenChange={(open) => { if (!open) setSelectedNotif(null); }}>
        <DialogContent className="sm:max-w-md">
          {selectedNotif && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">{typeLabels[selectedNotif.type] || selectedNotif.type}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(selectedNotif.created_at), "d MMM yyyy • HH:mm", { locale: fr })}
                  </span>
                </div>
                <DialogTitle className="font-display text-lg leading-snug">{selectedNotif.title}</DialogTitle>
                {selectedNotif.body && (
                  <DialogDescription className="whitespace-pre-wrap text-sm text-foreground/80 pt-1">
                    {selectedNotif.body}
                  </DialogDescription>
                )}
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
                <Button variant="ghost" size="sm" onClick={() => toggleFavoriteNotif(selectedNotif.id, selectedNotif.is_favorite)} className="gap-1">
                  {selectedNotif.is_favorite ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-4 w-4" />}
                  Favori
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteNotification(selectedNotif.id)} className="gap-1 text-destructive">
                  <Trash2 className="h-4 w-4" /> Supprimer
                </Button>
                {selectedNotif.related_event_id && (
                  <Button asChild size="sm" className="gap-1">
                    <Link to={`/events/${selectedNotif.related_event_id}`} onClick={() => setSelectedNotif(null)}>
                      Voir l'événement <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Profile;
