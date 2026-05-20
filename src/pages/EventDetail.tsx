import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Users, Heart, Share2, ArrowLeft, Phone, Mail, Globe, Facebook, Instagram, Twitter, User, MessageCircle, Expand, Lock, Ticket, Navigation, Video, Pencil, Clock3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import ShareDialog from "@/components/ShareDialog";
import ImageLightbox from "@/components/ImageLightbox";
import AdSlotBanner from "@/components/AdSlotBanner";
import InvitationManager from "@/components/InvitationManager";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LeafletMap from "@/components/LeafletMap";
import { formatEventPrice } from "@/lib/format-price";
import { useUserLocation, distanceKm as distanceKmFn, formatDistance } from "@/hooks/use-user-location";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, role } = useUserRole(user?.id);
  const isModerator = role === "moderator";
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [organizerProfile, setOrganizerProfile] = useState<{ slug: string | null; avatar_url: string | null; display_name: string | null } | null>(null);
  const [authorProfile, setAuthorProfile] = useState<{ id: string; slug: string | null; avatar_url: string | null; display_name: string | null } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Handle QR code scan
  const qrToken = searchParams.get("qr");

  // Scroll to top on mount (fixes mobile footer-first issue)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchComments();
      if (user) checkFavorite();
    }
  }, [id, user]);

  // Redeem QR token if present (?qr=TOKEN). If not signed-in, redirect to /invite/:token
  useEffect(() => {
    if (!qrToken || !id) return;
    if (!user) {
      window.location.replace(`/invite/${qrToken}`);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("redeem_invitation", { _token: qrToken });
      if (error) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.success) {
        toast({ title: "🎫 Invitation acceptée", description: "Vous avez accès à cet événement privé." });
        fetchEvent();
      } else if (row?.message === "expired") {
        toast({ title: "Invitation expirée", variant: "destructive" });
      } else if (row?.message === "used_up") {
        toast({ title: "Invitation épuisée", description: "Nombre maximum d'utilisations atteint.", variant: "destructive" });
      } else if (row?.message === "email_mismatch") {
        toast({ title: "Email non autorisé", description: "Cette invitation est nominative. Connectez-vous avec l'email auquel elle a été envoyée.", variant: "destructive" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrToken, user?.id, id]);

  const fetchEvent = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, categories(name)")
      .eq("id", id!)
      .maybeSingle();
    setEvent(data);
    setLoading(false);
    if (data?.organizer_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("slug, avatar_url, display_name")
        .eq("id", data.organizer_id)
        .maybeSingle();
      setOrganizerProfile(prof as any);
      // Prefetch full public profile into cache for fast nav
      const ident = (prof as any)?.slug || data.organizer_id;
      if (ident) {
        import("@/lib/profile-cache").then((m) => m.prefetchPublicProfile(ident));
      }
    }
    const authorId = (data as any)?.author_id || data?.organizer_id;
    if (authorId) {
      const { data: aprof } = await supabase
        .from("profiles")
        .select("id, slug, avatar_url, display_name")
        .eq("id", authorId)
        .maybeSingle();
      setAuthorProfile(aprof as any);
    } else {
      setAuthorProfile(null);
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("event_id", id!)
      .order("created_at", { ascending: false });
    const rows = data || [];
    const userIds = Array.from(new Set(rows.map((c: any) => c.user_id).filter(Boolean)));
    let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null; slug: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, slug")
        .in("id", userIds);
      (profs || []).forEach((p: any) => { profilesMap[p.id] = p; });
    }
    setComments(rows.map((c: any) => ({ ...c, author: profilesMap[c.user_id] || null })));
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Commentaire supprimé" });
      fetchComments();
    }
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

  const isOrganizer = user && event?.organizer_id === user.id;
  const canManageInvitations = isOrganizer || isAdmin;
  const isPending = event && (event.status === "pending" || event.is_published === false);
  const canInteract = !isPending || isOrganizer || isAdmin;
  const showPendingActionMessage = (action: "partage" | "billetterie" | "invitation") => {
    const descriptions = {
      partage: "Le partage sera disponible après validation de l'événement.",
      billetterie: "L'achat de billets et la participation seront disponibles après validation de l'événement.",
      invitation: "L'envoi d'invitations sera disponible après validation de l'événement.",
    };
    toast({
      title: `Action indisponible`,
      description: descriptions[action],
      variant: "destructive",
    });
  };

  const hasContactInfo = event && (event.phone1 || event.phone2 || event.whatsapp || event.contact_email || event.website_url || event.facebook_url || event.instagram_url || event.twitter_url || event.tiktok_url);

  const galleryImages = useMemo(() => {
    if (!event) return [];
    return [
      event.image_url ? { src: event.image_url, alt: event.title } : null,
      event.image_url2 ? { src: event.image_url2, alt: `${event.title} - photo 2` } : null,
    ].filter(Boolean) as { src: string; alt: string }[];
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-64 rounded-xl bg-card sm:h-80" />
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
        <div className="container mx-auto px-4 py-20 pt-20 text-center">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Événement non trouvé</h1>
          <Link to="/events">
            <Button className="mt-4">Retour aux événements</Button>
          </Link>
        </div>
      </div>
    );
  }

  const priceDisplay = formatEventPrice(event.price, event.currency);

  const bookingEnabled = event.ticketing_mode === "external" && event.external_ticket_url && canInteract;

  const itineraryUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
    : null;

  const organizerHref = event.organizer_id
    ? `/u/${organizerProfile?.slug || event.organizer_id}`
    : null;


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 pt-20">
        <div className="container mx-auto px-4">
          <Link to="/events" className="mb-4 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground sm:mb-6">
            <ArrowLeft className="h-4 w-4" /> Retour aux événements
          </Link>

          {isPending && (
            <div className="mb-4 sm:mb-6 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
              <Clock3 className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Événement en attente d'approbation
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                  {isOrganizer
                    ? "Votre événement est en cours de modération. Les actions de partage, billetterie et invitations seront activées dès l'approbation."
                    : "Cet événement n'est pas encore approuvé par la modération."}
                </p>
              </div>
              <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-300 shrink-0">En attente</Badge>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {/* On mobile, sidebar shows AFTER main content via order */}
            <div className="space-y-5 lg:col-span-2 lg:space-y-6 order-1">
              {/* Gallery - grid layout */}
              {galleryImages.length === 1 ? (
                <button type="button" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                  className="group relative block w-full overflow-hidden rounded-xl h-48 sm:h-64 md:h-96">
                  <img src={galleryImages[0].src} alt={galleryImages[0].alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
                  <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm"><Expand className="h-3.5 w-3.5" /> Voir</div>
                  {event.is_live && <Badge className="absolute left-3 top-3 border-0 bg-destructive px-3 py-1 text-sm text-destructive-foreground animate-pulse-live">🔴 EN DIRECT</Badge>}
                </button>
              ) : galleryImages.length >= 2 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.2fr_0.8fr] sm:gap-3">
                  <button type="button" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                    className="group relative block w-full overflow-hidden rounded-xl h-48 sm:h-72 md:h-[380px]">
                    <img src={galleryImages[0].src} alt={galleryImages[0].alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
                    <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm"><Expand className="h-3.5 w-3.5" /> Voir</div>
                    {event.is_live && <Badge className="absolute left-3 top-3 border-0 bg-destructive px-3 py-1 text-sm text-destructive-foreground animate-pulse-live">🔴 EN DIRECT</Badge>}
                  </button>
                  <div className="flex flex-row gap-2 sm:flex-col sm:gap-3">
                    {galleryImages.slice(1).map((image, idx) => (
                      <button key={image.src} type="button" onClick={() => { setLightboxIndex(idx + 1); setLightboxOpen(true); }}
                        className="group relative block w-full overflow-hidden rounded-xl h-32 sm:h-full sm:flex-1">
                        <img src={image.src} alt={image.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
                        <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm"><Expand className="h-3 w-3" /> Voir</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Info */}
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-primary text-primary-foreground">
                    {event.categories?.name || "Événement"}
                  </Badge>
                  {event.visibility === "private" && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3.5 w-3.5 text-primary" /> Privé
                    </Badge>
                  )}
                  {event.is_live && event.live_url && (
                    <a href={event.live_url} target="_blank" rel="noopener noreferrer">
                      <Badge className="gap-1 bg-destructive text-destructive-foreground">
                        <Video className="h-3.5 w-3.5" /> Regarder le Live
                      </Badge>
                    </a>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl">{event.title}</h1>
                  {isOrganizer && (
                    <Link to={`/events/${id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                        <Pencil className="h-3.5 w-3.5" /> Modifier
                      </Button>
                    </Link>
                  )}
                </div>
                <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {event.description || "Aucune description disponible."}
                </p>
              </div>

              {/* Mobile-only summary card (price/date/location/organizer) — shown right after description, before Map */}
              <div className="lg:hidden space-y-4 rounded-xl bg-card p-4">
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-foreground">{priceDisplay}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-body font-medium text-foreground">
                        {format(new Date(event.date), "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                      <p className="font-body text-muted-foreground">
                        {format(new Date(event.date), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                    <div>
                      {event.venue_name && <p className="font-body font-bold text-foreground">{event.venue_name}</p>}
                      <p className="font-body text-foreground">{event.location}</p>
                      <p className="font-body text-muted-foreground">{event.city}</p>
                    </div>
                  </div>
                  {(event.attendees_count ?? 0) > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-5 w-5 flex-shrink-0 text-primary" />
                      <p className="font-body text-foreground">{event.attendees_count} participants</p>
                    </div>
                  )}
                  {event.organizer_name && (
                    <div className="flex items-center gap-3 text-sm">
                      {organizerHref ? (
                        <Link to={organizerHref} className="flex items-center gap-3 hover:text-primary">
                          {event.organizer_logo_url ? (
                            <img src={event.organizer_logo_url} alt={event.organizer_name} className="h-8 w-8 shrink-0 rounded-md object-cover bg-muted" />
                          ) : organizerProfile?.avatar_url ? (
                            <img src={organizerProfile.avatar_url} alt={event.organizer_name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </span>
                          )}
                          <span className="font-body text-foreground underline-offset-2 hover:underline">{event.organizer_name}</span>
                        </Link>
                      ) : (
                        <>
                          {event.organizer_logo_url ? (
                            <img src={event.organizer_logo_url} alt={event.organizer_name} className="h-8 w-8 shrink-0 rounded-md object-cover bg-muted" />
                          ) : (
                            <User className="h-5 w-5 flex-shrink-0 text-primary" />
                          )}
                          <p className="font-body text-foreground">{event.organizer_name}</p>
                        </>
                      )}
                    </div>
                  )}
                  {authorProfile && authorProfile.id !== event.organizer_id && authorProfile.display_name && (
                    <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
                      <span>Par</span>
                      <Link to={`/u/${authorProfile.slug || authorProfile.id}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                        {authorProfile.avatar_url ? (
                          <img src={authorProfile.avatar_url} alt={authorProfile.display_name} className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted"><User className="h-3 w-3" /></span>
                        )}
                        <span className="font-medium underline-offset-2 hover:underline">{authorProfile.display_name}</span>
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={toggleFavorite} variant={isFavorite ? "default" : "outline"} className="flex-1">
                    <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    {isFavorite ? "Favori" : "Ajouter"}
                  </Button>
                  {canInteract ? (
                    <ShareDialog title={event.title}>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </ShareDialog>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-disabled="true"
                      className="opacity-60"
                      title="Partage indisponible : événement en attente d'approbation"
                      onClick={() => showPendingActionMessage("partage")}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {bookingEnabled ? (
                  <a href={event.external_ticket_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full border-0 gradient-hero text-primary-foreground" size="lg">
                      <Ticket className="mr-2 h-4 w-4" /> {event.reservation_cta_label || "Réserver"}
                    </Button>
                  </a>
                ) : (
                  <Button
                    className="w-full border-0 gradient-hero text-primary-foreground"
                    size="lg"
                    aria-disabled={!canInteract}
                    onClick={() => {
                      if (!canInteract) {
                        showPendingActionMessage("billetterie");
                      }
                    }}
                  >
                    {canInteract ? "Participer" : "En attente d'approbation"}
                  </Button>
                )}
              </div>

              {/* QR Invitation notification */}
              {qrToken && (
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 text-center">
                  <p className="font-display text-lg font-bold text-foreground">🎫 Invitation QR valide</p>
                  <p className="font-body text-sm text-muted-foreground mt-1">Présentez ce code à l'organisateur à l'entrée pour être scanné.</p>
                  <p className="font-mono text-xs text-primary mt-2 break-all">{qrToken}</p>
                </div>
              )}

              {/* Contacts */}
              {hasContactInfo && (
                <div className="rounded-xl bg-card p-4 sm:p-6">
                  <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-foreground sm:text-xl">
                    <Phone className="h-5 w-5 text-primary" /> Contact & Réseaux
                  </h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    {event.whatsapp && (
                      <a href={`https://wa.me/${event.whatsapp.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 text-sm font-body text-foreground transition-colors hover:bg-muted hover:text-primary">
                        <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp
                      </a>
                    )}
                    {event.phone1 && (
                      <a href={`tel:${event.phone1}`} className="flex items-center gap-3 rounded-lg p-2 text-sm font-body text-foreground transition-colors hover:bg-muted hover:text-primary">
                        <Phone className="h-4 w-4 text-primary" /> {event.phone1}
                      </a>
                    )}
                    {event.phone2 && (
                      <a href={`tel:${event.phone2}`} className="flex items-center gap-3 rounded-lg p-2 text-sm font-body text-foreground transition-colors hover:bg-muted hover:text-primary">
                        <Phone className="h-4 w-4 text-primary" /> {event.phone2}
                      </a>
                    )}
                    {event.contact_email && (
                      <a href={`mailto:${event.contact_email}`} className="flex items-center gap-3 rounded-lg p-2 text-sm font-body text-foreground transition-colors hover:bg-muted hover:text-primary">
                        <Mail className="h-4 w-4 text-primary" /> {event.contact_email}
                      </a>
                    )}
                    {event.website_url && (
                      <a href={event.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 text-sm font-body text-foreground transition-colors hover:bg-muted hover:text-primary">
                        <Globe className="h-4 w-4 text-primary" /> Site web
                      </a>
                    )}
                    {event.facebook_url && (
                      <a href={event.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 text-sm font-body text-foreground transition-colors hover:bg-muted hover:text-primary">
                        <Facebook className="h-4 w-4 text-primary" /> Facebook
                      </a>
                    )}
                    {event.instagram_url && (
                      <a href={event.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 text-sm font-body text-foreground transition-colors hover:bg-muted hover:text-primary">
                        <Instagram className="h-4 w-4 text-primary" /> Instagram
                      </a>
                    )}
                    {event.twitter_url && (
                      <a href={event.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 text-sm font-body text-foreground transition-colors hover:bg-muted hover:text-primary">
                        <Twitter className="h-4 w-4 text-primary" /> Twitter / X
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Map with itinerary */}
              {event.latitude && event.longitude && (
                <div className="rounded-xl bg-card p-4 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground sm:text-xl">
                      <MapPin className="h-5 w-5 text-primary" /> Localisation
                    </h2>
                    {itineraryUrl && (
                      <a href={itineraryUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Navigation className="h-3.5 w-3.5" /> Itinéraire
                        </Button>
                      </a>
                    )}
                  </div>
                  <div className="h-48 overflow-hidden rounded-lg sm:h-64">
                    <LeafletMap
                      center={[event.latitude, event.longitude]}
                      zoom={14}
                      markers={[{
                        id: event.id,
                        lat: event.latitude,
                        lng: event.longitude,
                        popupHtml: `<strong>${event.venue_name || event.title}</strong><br />${event.location}, ${event.city}<br/><a href="${itineraryUrl}" target="_blank" style="color:#2563eb;">📍 Itinéraire</a>`,
                      }]}
                      className="z-0"
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                    />
                  </div>
                </div>
              )}

              {/* Invitation manager for organizer/admin */}
              {canManageInvitations && event.visibility === "private" && (
                isPending ? (
                  <button
                    type="button"
                    onClick={() => showPendingActionMessage("invitation")}
                    className="w-full rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-left text-sm text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-400"
                  >
                    <div className="font-medium">Invitations indisponibles</div>
                    <div className="mt-1 opacity-90">L'envoi d'invitations sera disponible une fois l'événement approuvé par la modération.</div>
                  </button>
                ) : (
                  <InvitationManager eventId={event.id} eventTitle={event.title} />
                )
              )}

              {/* Comments */}
              <div className="rounded-xl bg-card p-4 sm:p-6">
                <h2 className="mb-4 font-display text-lg font-bold text-foreground sm:text-xl">
                  Commentaires ({comments.length})
                </h2>
                {user && (
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addComment} className="self-end border-0 gradient-hero text-primary-foreground">
                      Envoyer
                    </Button>
                  </div>
                )}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground">Aucun commentaire pour le moment.</p>
                  ) : (
                    comments.map((comment) => {
                      const author = comment.author;
                      const authorName = author?.display_name || "Utilisateur";
                      const authorHref = author ? `/u/${author.slug || comment.user_id}` : null;
                      const canDelete = !!user && (
                        comment.user_id === user.id ||
                        isAdmin ||
                        isModerator ||
                        (event && event.organizer_id === user.id)
                      );
                      return (
                        <div key={comment.id} className="border-b border-border pb-3 last:border-0">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {author?.avatar_url ? (
                                <img src={author.avatar_url} alt={authorName} className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-primary" />
                                </div>
                              )}
                              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                {authorHref ? (
                                  <Link to={authorHref} className="font-body text-sm font-semibold text-foreground hover:text-primary truncate">
                                    {authorName}
                                  </Link>
                                ) : (
                                  <span className="font-body text-sm font-semibold text-foreground truncate">{authorName}</span>
                                )}
                                <span className="font-body text-xs text-muted-foreground">
                                  {format(new Date(comment.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                                </span>
                              </div>
                            </div>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                onClick={() => {
                                  if (confirm("Supprimer ce commentaire ?")) deleteComment(comment.id);
                                }}
                                aria-label="Supprimer le commentaire"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <p className="font-body text-sm text-foreground pl-8">{comment.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar — desktop only (mobile shows the same block above, before the Map) */}
            <div className="hidden lg:block space-y-4 sm:space-y-6 order-2">
              <div className="space-y-4 rounded-xl bg-card p-4 sm:p-6 lg:sticky lg:top-24">
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-foreground sm:text-2xl">{priceDisplay}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-body font-medium text-foreground">
                        {format(new Date(event.date), "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                      <p className="font-body text-muted-foreground">
                        {format(new Date(event.date), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                    <div>
                      {event.venue_name && (
                        <p className="font-body font-bold text-foreground">{event.venue_name}</p>
                      )}
                      <p className="font-body text-foreground">{event.location}</p>
                      <p className="font-body text-muted-foreground">{event.city}</p>
                    </div>
                  </div>
                  {(event.attendees_count ?? 0) > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-5 w-5 flex-shrink-0 text-primary" />
                      <p className="font-body text-foreground">{event.attendees_count} participants</p>
                    </div>
                  )}
                  {event.organizer_name && (
                    <div className="flex items-center gap-3 text-sm">
                      {organizerHref ? (
                        <Link to={organizerHref} className="flex items-center gap-3 hover:text-primary">
                          {event.organizer_logo_url ? (
                            <img src={event.organizer_logo_url} alt={event.organizer_name} className="h-8 w-8 shrink-0 rounded-md object-cover bg-muted" />
                          ) : organizerProfile?.avatar_url ? (
                            <img src={organizerProfile.avatar_url} alt={event.organizer_name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </span>
                          )}
                          <span className="font-body text-foreground underline-offset-2 hover:underline">{event.organizer_name}</span>
                        </Link>
                      ) : (
                        <>
                          {event.organizer_logo_url ? (
                            <img src={event.organizer_logo_url} alt={event.organizer_name} className="h-8 w-8 shrink-0 rounded-md object-cover bg-muted" />
                          ) : (
                            <User className="h-5 w-5 flex-shrink-0 text-primary" />
                          )}
                          <p className="font-body text-foreground">{event.organizer_name}</p>
                        </>
                      )}
                    </div>
                  )}
                  {authorProfile && authorProfile.id !== event.organizer_id && authorProfile.display_name && (
                    <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
                      <span>Par</span>
                      <Link to={`/u/${authorProfile.slug || authorProfile.id}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                        {authorProfile.avatar_url ? (
                          <img src={authorProfile.avatar_url} alt={authorProfile.display_name} className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted"><User className="h-3 w-3" /></span>
                        )}
                        <span className="font-medium underline-offset-2 hover:underline">{authorProfile.display_name}</span>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={toggleFavorite} variant={isFavorite ? "default" : "outline"} className="flex-1">
                    <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    {isFavorite ? "Favori" : "Ajouter"}
                  </Button>
                  {canInteract ? (
                    <ShareDialog title={event.title}>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </ShareDialog>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-disabled="true"
                      className="opacity-60"
                      title="Partage indisponible : événement en attente d'approbation"
                      onClick={() => showPendingActionMessage("partage")}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {event.whatsapp && (
                  <a href={`https://wa.me/${event.whatsapp.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="mr-2 h-4 w-4" /> Contacter via WhatsApp
                    </Button>
                  </a>
                )}

                {itineraryUrl && (
                  <a href={itineraryUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full gap-2">
                      <Navigation className="h-4 w-4" /> Voir l'itinéraire
                    </Button>
                  </a>
                )}

                {event.is_live && event.live_url && (
                  <a href={event.live_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      <Video className="h-4 w-4" /> Rejoindre le Live
                    </Button>
                  </a>
                )}

                {bookingEnabled ? (
                  <a href={event.external_ticket_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full border-0 gradient-hero text-primary-foreground" size="lg">
                      <Ticket className="mr-2 h-4 w-4" /> {event.reservation_cta_label || "Réserver"}
                    </Button>
                  </a>
                ) : (
                  <Button
                    className="w-full border-0 gradient-hero text-primary-foreground"
                    size="lg"
                    disabled={!canInteract}
                    onClick={() => {
                      if (!canInteract) {
                        toast({ title: "Action indisponible", description: "Billetterie et participation seront disponibles après l'approbation de l'événement.", variant: "destructive" });
                      }
                    }}
                  >
                    {canInteract ? "Participer" : "En attente d'approbation"}
                  </Button>
                )}
              </div>

              <AdSlotBanner slotCode="event-sidebar" compact />
            </div>
          </div>
        </div>
      </div>

      <ImageLightbox images={galleryImages} open={lightboxOpen} onOpenChange={setLightboxOpen} initialIndex={lightboxIndex} />
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default EventDetail;
