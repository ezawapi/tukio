import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, MapPin, Globe, Facebook, Instagram, Twitter, Linkedin,
  Building2, User as UserIcon, FileText, Download, Heart, HeartOff, Loader2, Info, Settings as SettingsIcon, Image as ImageIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import EventCard from "@/components/EventCard";
import PaginationControls from "@/components/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  resolvePublicProfile,
  getCachedProfile,
  prefetchPublicProfile,
  type CachedProfile,
} from "@/lib/profile-cache";

type Tab = "upcoming" | "ongoing" | "past";
const PAGE_SIZE = 9;

const PublicProfile = () => {
  const params = useParams<{ userId?: string; slug?: string }>();
  const identifier = params.slug || params.userId || "";
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  const { toast } = useToast();

  // Hydrate from cache for instant paint on mobile
  const [profile, setProfile] = useState<CachedProfile | null>(() => getCachedProfile(identifier));
  const [loading, setLoading] = useState(!getCachedProfile(identifier));
  const [notFound, setNotFound] = useState(false);

  const [tab, setTab] = useState<Tab>("upcoming");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [coverPreview, setCoverPreview] = useState<{ url: string; file: File; ratio: number; width: number; height: number } | null>(null);

  // Resolve profile (with cache)
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!identifier) return;
    let cancelled = false;
    const cached = getCachedProfile(identifier);
    if (cached) {
      setProfile(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    resolvePublicProfile(identifier).then((p) => {
      if (cancelled) return;
      if (!p) {
        setNotFound(true);
        setProfile(null);
      } else {
        setProfile(p);
        setNotFound(false);
        // Prefetch by both id and slug aliases for fast back-nav
        if (p.slug) prefetchPublicProfile(p.slug);
        if (p.id) prefetchPublicProfile(p.id);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [identifier]);

  // Reset pagination when tab changes
  useEffect(() => setPage(1), [tab, profile?.id]);

  // Fetch follower/following counts and follow state
  const refreshFollows = async (profileId: string) => {
    const [{ count: fCount }, { count: fingCount }, followingResp] = await Promise.all([
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("organizer_id", profileId),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", profileId),
      user
        ? supabase.from("follows").select("id").eq("organizer_id", profileId).eq("follower_id", user.id).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);
    setFollowersCount(fCount || 0);
    setFollowingCount(fingCount || 0);
    setIsFollowing(!!followingResp?.data);
  };

  useEffect(() => {
    if (!profile?.id) return;
    refreshFollows(profile.id);

    // Realtime updates on follows table
    const channel = supabase
      .channel(`follows:${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `organizer_id=eq.${profile.id}` },
        () => refreshFollows(profile.id),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `follower_id=eq.${profile.id}` },
        () => refreshFollows(profile.id),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, user?.id]);

  // Fetch paginated events for the active tab
  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      setEventsLoading(true);
      const nowIso = new Date().toISOString();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let q = supabase
        .from("events")
        .select(
          "id, title, date, end_date, location, city, image_url, price, currency, is_live, categories(name), attendees_count",
          { count: "exact" },
        )
        .eq("organizer_id", profile.id)
        .eq("is_published", true)
        .eq("visibility", "public");

      if (tab === "upcoming") {
        q = q.gt("date", nowIso).order("date", { ascending: true });
      } else if (tab === "ongoing") {
        q = q.lte("date", nowIso).or(`end_date.gte.${nowIso},end_date.is.null`).order("date", { ascending: false });
      } else {
        q = q.lt("end_date", nowIso).order("date", { ascending: false });
      }

      const { data, count } = await q.range(from, to);
      setEvents(data || []);
      setTotal(count || 0);
      setEventsLoading(false);
    };
    load();
  }, [profile?.id, tab, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleFollow = async () => {
    if (!user || !profile) {
      toast({ title: "Connectez-vous pour suivre cet organisateur", variant: "destructive" });
      return;
    }
    if (user.id === profile.id) return;
    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("organizer_id", profile.id)
        .eq("follower_id", user.id);
      if (!error) {
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
        toast({ title: "Vous ne suivez plus cet organisateur" });
      } else {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ organizer_id: profile.id, follower_id: user.id });
      if (!error) {
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        toast({ title: "Vous suivez maintenant cet organisateur ✨", description: "Vous recevrez ses futurs événements." });
      } else {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    }
    setFollowLoading(false);
  };

  // Fetch ALL public events of organizer for export (RLS enforces public+published only)
  const fetchPublicEventsForExport = async () => {
    if (!profile) return [];
    const { data } = await supabase
      .from("events")
      .select("id, title, date, end_date, location, city, price, currency, categories(name), attendees_count")
      .eq("organizer_id", profile.id)
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("date", { ascending: false })
      .limit(500);
    return data || [];
  };

  const exportCsv = async () => {
    if (!profile) return;
    const all = await fetchPublicEventsForExport();
    if (all.length === 0) {
      toast({ title: "Aucun événement public à exporter" });
      return;
    }
    const headers = ["Titre", "Date", "Fin", "Lieu", "Ville", "Prix", "Devise", "Catégorie", "Participants", "Lien"];
    const escape = (v: any) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
    const rows = all.map((e: any) => [
      e.title,
      format(new Date(e.date), "yyyy-MM-dd HH:mm"),
      e.end_date ? format(new Date(e.end_date), "yyyy-MM-dd HH:mm") : "",
      e.location || "",
      e.city || "",
      e.price || "",
      e.currency || "",
      e.categories?.name || "",
      e.attendees_count || 0,
      `${window.location.origin}/events/${e.id}`,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evenements-${profile.slug || profile.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export CSV téléchargé" });
  };

  const exportPdf = async () => {
    if (!profile) return;
    const all = await fetchPublicEventsForExport();
    if (all.length === 0) {
      toast({ title: "Aucun événement public à exporter" });
      return;
    }
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const margin = 14;
    let y = margin;

    doc.setFontSize(16);
    doc.text(`Événements de ${profile.display_name || "Organisateur"}`, margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Total : ${all.length} • Exporté le ${format(new Date(), "d MMM yyyy", { locale: fr })}`, margin, y);
    y += 8;
    doc.setTextColor(0);

    all.forEach((e: any, idx: number) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const title = doc.splitTextToSize(`${idx + 1}. ${e.title}`, 180);
      doc.text(title, margin, y);
      y += title.length * 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Date: ${format(new Date(e.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}`, margin, y);
      y += 5;
      doc.text(`Lieu: ${[e.location, e.city].filter(Boolean).join(", ")}`, margin, y);
      y += 5;
      const meta = `${e.categories?.name || "Activité"} • ${e.price || "Gratuit"} ${e.currency || ""}`.trim();
      doc.text(meta, margin, y);
      y += 7;
      doc.setTextColor(0);
    });

    doc.save(`evenements-${profile.slug || profile.id}.pdf`);
    toast({ title: "Export PDF téléchargé" });
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-xl bg-card" />
            <div className="h-8 w-1/3 rounded bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 pt-24 text-center">
          <h1 className="font-display text-2xl text-foreground">Profil introuvable</h1>
          <Link to="/events"><Button className="mt-4">Retour</Button></Link>
        </div>
      </div>
    );
  }

  const memberSince = format(new Date(profile.created_at), "MMMM yyyy", { locale: fr });
  const isSelf = user?.id === profile.id;

  const vis = (profile?.visibility_settings || {}) as Record<string, boolean>;
  const showField = (key: string, defaultVal = true) => (key in vis ? !!vis[key] : defaultVal);

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSelf || !user) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Format invalide", variant: "destructive" }); return; }
    if (file.size > 4 * 1024 * 1024) { toast({ title: "Image trop lourde (max 4 Mo)", variant: "destructive" }); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setCoverPreview({ url, file, ratio: img.width / img.height, width: img.width, height: img.height });
    };
    img.onerror = () => toast({ title: "Image illisible", variant: "destructive" });
    img.src = url;
  };

  const confirmCoverUpload = async () => {
    if (!coverPreview || !user) return;
    const file = coverPreview.file;
    setCoverUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/cover.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (upErr) { toast({ title: "Erreur", description: upErr.message, variant: "destructive" }); setCoverUploading(false); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
    const newUrl = urlData.publicUrl + "?t=" + Date.now();
    const { error: updErr } = await supabase.from("profiles").update({ cover_url: newUrl }).eq("id", user.id);
    if (updErr) { toast({ title: "Erreur", description: updErr.message, variant: "destructive" }); setCoverUploading(false); return; }
    setProfile((p) => p ? { ...p, cover_url: newUrl } : p);
    setCoverUploading(false);
    URL.revokeObjectURL(coverPreview.url);
    setCoverPreview(null);
    toast({ title: "Couverture mise à jour ✨" });
  };

  const renderCard = (e: any) => (
    <Link key={e.id} to={`/events/${e.id}`} className="block">
      <EventCard
        title={e.title}
        date={format(new Date(e.date), "d MMM yyyy · HH:mm", { locale: fr })}
        location={`${e.location || ""}${e.city ? ", " + e.city : ""}`}
        category={e.categories?.name || "Activité"}
        image={e.image_url}
        attendees={e.attendees_count || 0}
        price={e.price ? `${e.price} ${e.currency || ""}` : undefined}
        isLive={e.is_live}
        eventDate={e.date}
        endDate={e.end_date}
      />
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 pt-20">
        <div className="container mx-auto px-4">
          <Link to="/events" className="mb-4 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>

          {/* Header */}
          <Card className="mb-6 overflow-hidden">
            <div className="relative w-full overflow-hidden bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20" style={{ aspectRatio: "3 / 1" }}>
              {profile.cover_url && (
                <img src={profile.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              {isSelf && (
                <>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-background disabled:opacity-60"
                  >
                    {coverUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    {profile.cover_url ? "Changer la couverture" : "Ajouter une couverture"}
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </>
              )}
            </div>
            <CardContent className="relative pt-0">
              <div className="-mt-12 sm:-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-background bg-muted shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name || "Profil"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <UserIcon className="h-10 w-10 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground truncate">
                    {profile.display_name || "Organisateur"}
                  </h1>
                  {profile.organization_role && showField("organization_role") && (
                    <p className="text-sm text-muted-foreground">{profile.organization_role}</p>
                  )}
                  {profile.organization_name && showField("organization_name") && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{profile.organization_name}</span>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Membre depuis {memberSince}</span>
                    <Badge variant="outline" className="text-[10px]">{total} activités</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <span className="font-semibold text-foreground mr-1">{followersCount}</span> abonnés
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <span className="font-semibold text-foreground mr-1">{followingCount}</span> abonnements
                    </Badge>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                  {isSelf ? (
                    <Button asChild size="sm" className="gap-1.5">
                      <Link to="/my-events">
                        <SettingsIcon className="h-3.5 w-3.5" /> Mes événements
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={toggleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      className="gap-1.5"
                    >
                      {followLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isFollowing ? (
                        <HeartOff className="h-3.5 w-3.5" />
                      ) : (
                        <Heart className="h-3.5 w-3.5" />
                      )}
                      {isFollowing ? "Suivi" : "Suivre"}
                    </Button>
                  )}
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="h-3.5 w-3.5" /> Exporter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportCsv} className="gap-2">
                          <FileText className="h-4 w-4" /> Télécharger CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportPdf} className="gap-2">
                          <FileText className="h-4 w-4" /> Télécharger PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {profile.physical_address && showField("physical_address", false) && (
                <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{profile.physical_address}</span>
                </div>
              )}

              {/* Socials */}
              {((profile.website_url && showField("website_url")) || (profile.facebook_url && showField("facebook_url")) || (profile.instagram_url && showField("instagram_url")) || (profile.twitter_url && showField("twitter_url")) || (profile.linkedin_url && showField("linkedin_url"))) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.website_url && showField("website_url") && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Globe className="h-3.5 w-3.5" /> Site
                    </a>
                  )}
                  {profile.facebook_url && showField("facebook_url") && (
                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Facebook className="h-3.5 w-3.5" /> Facebook
                    </a>
                  )}
                  {profile.instagram_url && showField("instagram_url") && (
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Instagram className="h-3.5 w-3.5" /> Instagram
                    </a>
                  )}
                  {profile.twitter_url && showField("twitter_url") && (
                    <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Twitter className="h-3.5 w-3.5" /> Twitter
                    </a>
                  )}
                  {profile.linkedin_url && showField("linkedin_url") && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* About section */}
          {profile.bio && showField("bio") && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                  <Info className="h-5 w-5 text-primary" /> À propos
                </h2>
                <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {profile.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Events tabs with pagination */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">À venir</TabsTrigger>
              <TabsTrigger value="ongoing">En cours</TabsTrigger>
              <TabsTrigger value="past">Terminés</TabsTrigger>
            </TabsList>
            <TabsContent value={tab}>
              {eventsLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-56 animate-pulse rounded-lg bg-card" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {tab === "upcoming" && "Aucune activité à venir."}
                  {tab === "ongoing" && "Aucune activité en cours."}
                  {tab === "past" && "Aucune activité terminée."}
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map(renderCard)}
                </div>
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

export default PublicProfile;
