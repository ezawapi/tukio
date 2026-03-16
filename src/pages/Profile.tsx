import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Heart, MessageSquare, PlusCircle, Shield, Wifi, WifiOff, MapPin, Clock3, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { role, isAdmin } = useUserRole(user?.id);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchDashboard = async () => {
      const [eventsResult, commentsResult, favoritesResult] = await Promise.all([
        supabase
          .from("events")
          .select("id, title, city, date, created_at, status, is_published")
          .eq("organizer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("comments")
          .select("id, content, created_at, event_id, events(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("favorites")
          .select("id, created_at, events(id, title, city, date, image_url)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setEvents(eventsResult.data || []);
      setComments(commentsResult.data || []);
      setFavorites(favoritesResult.data || []);
      setLoading(false);
    };

    fetchDashboard();
  }, [user, navigate]);

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

  const publishedCount = events.filter((event) => event.is_published).length;
  const pendingCount = events.filter((event) => event.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 space-y-8">
          <Card className="overflow-hidden border-border">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? "Administrateur" : role === "moderator" ? "Modérateur" : "Utilisateur"}
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
                  <p className="max-w-2xl font-body text-sm text-muted-foreground">
                    Suivez vos publications, commentaires et favoris depuis votre mini tableau de bord personnel.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/create">
                    <Button className="w-full gradient-hero text-primary-foreground border-0 sm:w-auto">
                      <PlusCircle className="h-4 w-4" /> Nouvelle activité
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
            {[
              { label: "Publications", value: events.length, icon: Calendar },
              { label: "Publiées", value: publishedCount, icon: ArrowRight },
              { label: "En attente", value: pendingCount, icon: Clock3 },
              { label: "Commentaires", value: comments.length, icon: MessageSquare },
            ].map((stat) => (
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

          <Tabs defaultValue="events" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:w-auto">
              <TabsTrigger value="events">Mes activités</TabsTrigger>
              <TabsTrigger value="comments">Commentaires</TabsTrigger>
              <TabsTrigger value="favorites">Favoris</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Mes publications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {events.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground">Vous n'avez encore publié aucune activité.</p>
                  ) : (
                    events.map((event) => (
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
                          <Button variant="ghost" size="sm">Voir</Button>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Mes commentaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground">Aucun commentaire enregistré pour le moment.</p>
                  ) : (
                    comments.map((comment) => (
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Mes favoris</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {favorites.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground">Aucun favori pour le moment.</p>
                  ) : (
                    favorites.map((favorite) => {
                      const event = favorite.events;
                      if (!event) return null;

                      return (
                        <Link key={favorite.id} to={`/events/${event.id}`} className="block rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 overflow-hidden rounded-xl bg-card shrink-0">
                              <img src={event.image_url || "/placeholder.svg"} alt={event.title} className="h-full w-full object-cover" />
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

export default Profile;
