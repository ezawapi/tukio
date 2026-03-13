import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Users, Heart, Share2, ArrowLeft, Phone, Mail, Globe, Facebook, Instagram, Twitter, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LeafletMap from "@/components/LeafletMap";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchComments();
      if (user) checkFavorite();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, categories(name)")
      .eq("id", id!)
      .single();
    setEvent(data);
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("event_id", id!)
      .order("created_at", { ascending: false });
    setComments(data || []);
  };

  const checkFavorite = async () => {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("event_id", id!)
      .eq("user_id", user!.id)
      .maybeSingle();
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({ title: "Connectez-vous pour ajouter aux favoris", variant: "destructive" });
      return;
    }
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("event_id", id!).eq("user_id", user.id);
      setIsFavorite(false);
      toast({ title: "Retiré des favoris" });
    } else {
      await supabase.from("favorites").insert({ event_id: id!, user_id: user.id });
      setIsFavorite(true);
      toast({ title: "Ajouté aux favoris !" });
    }
  };

  const addComment = async () => {
    if (!user) {
      toast({ title: "Connectez-vous pour commenter", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      event_id: id!,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
      fetchComments();
      toast({ title: "Commentaire ajouté !" });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Lien copié !" });
  };

  const hasContactInfo = event && (event.phone1 || event.phone2 || event.contact_email || event.website_url || event.facebook_url || event.instagram_url || event.twitter_url || event.tiktok_url);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-80 rounded-xl bg-card" />
            <div className="h-8 w-1/2 rounded bg-card" />
            <div className="h-4 w-3/4 rounded bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container mx-auto px-4 text-center py-20">
          <h1 className="font-display text-3xl text-foreground">Événement non trouvé</h1>
          <Link to="/events">
            <Button className="mt-4">Retour aux événements</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 font-body text-sm">
            <ArrowLeft className="h-4 w-4" /> Retour aux événements
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image */}
              <div className="relative rounded-xl overflow-hidden h-64 md:h-96">
                <img src={event.image_url || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
                {event.is_live && (
                  <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground border-0 animate-pulse-live text-sm px-4 py-1">
                    🔴 EN DIRECT
                  </Badge>
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary text-primary-foreground border-0">
                    {event.categories?.name || "Événement"}
                  </Badge>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">{event.title}</h1>
                <p className="font-body text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description || "Aucune description disponible."}
                </p>
              </div>

              {/* Contact Info */}
              {hasContactInfo && (
                <div className="bg-card rounded-xl p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" /> Contact & Réseaux
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {event.phone1 && (
                      <a href={`tel:${event.phone1}`} className="flex items-center gap-3 text-sm font-body text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                        <Phone className="h-4 w-4 text-primary" /> {event.phone1}
                      </a>
                    )}
                    {event.phone2 && (
                      <a href={`tel:${event.phone2}`} className="flex items-center gap-3 text-sm font-body text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                        <Phone className="h-4 w-4 text-primary" /> {event.phone2}
                      </a>
                    )}
                    {event.contact_email && (
                      <a href={`mailto:${event.contact_email}`} className="flex items-center gap-3 text-sm font-body text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                        <Mail className="h-4 w-4 text-primary" /> {event.contact_email}
                      </a>
                    )}
                    {event.website_url && (
                      <a href={event.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-body text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                        <Globe className="h-4 w-4 text-primary" /> Site web
                      </a>
                    )}
                    {event.facebook_url && (
                      <a href={event.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-body text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                        <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                      </a>
                    )}
                    {event.instagram_url && (
                      <a href={event.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-body text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                        <Instagram className="h-4 w-4 text-pink-500" /> Instagram
                      </a>
                    )}
                    {event.twitter_url && (
                      <a href={event.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-body text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                        <Twitter className="h-4 w-4 text-sky-500" /> Twitter / X
                      </a>
                    )}
                    {event.tiktok_url && (
                      <a href={event.tiktok_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-body text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                        <Globe className="h-4 w-4 text-foreground" /> TikTok
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Mini Map */}
              {event.latitude && event.longitude && (
                <div className="bg-card rounded-xl p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Localisation
                  </h2>
                  <div className="rounded-lg overflow-hidden h-64">
                    <LeafletMap
                      center={[event.latitude, event.longitude]}
                      zoom={14}
                      markers={[{
                        id: event.id,
                        lat: event.latitude,
                        lng: event.longitude,
                        popupHtml: `<strong>${event.title}</strong><br />${event.location}, ${event.city}`,
                      }]}
                      className="z-0"
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                    />
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="bg-card rounded-xl p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  Commentaires ({comments.length})
                </h2>
                {user && (
                  <div className="flex gap-3 mb-6">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addComment} className="gradient-hero text-primary-foreground border-0 self-end">
                      Envoyer
                    </Button>
                  </div>
                )}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-muted-foreground font-body text-sm">Aucun commentaire pour le moment.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border-b border-border pb-3 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-body text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                          </span>
                        </div>
                        <p className="font-body text-sm text-foreground">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-6 space-y-4 sticky top-24">
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-foreground">{event.price || "Gratuit"}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-body font-medium text-foreground">
                        {format(new Date(event.date), "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                      <p className="font-body text-muted-foreground">
                        {format(new Date(event.date), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-body font-medium text-foreground">{event.location}</p>
                      <p className="font-body text-muted-foreground">{event.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-5 w-5 text-primary" />
                    <p className="font-body text-foreground">{event.attendees_count || 0} participants</p>
                  </div>
                  {event.organizer_name && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-5 w-5 text-primary" />
                      <p className="font-body text-foreground">{event.organizer_name}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={toggleFavorite} variant={isFavorite ? "default" : "outline"} className="flex-1">
                    <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                    {isFavorite ? "Favori" : "Ajouter"}
                  </Button>
                  <Button onClick={handleShare} variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                <Button className="w-full gradient-hero text-primary-foreground border-0" size="lg">
                  Participer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventDetail;
