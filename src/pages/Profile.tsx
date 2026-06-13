import { getEventImage } from "@/lib/event-image";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Heart, MessageSquare, PlusCircle, Shield, Wifi, WifiOff, MapPin, Clock3, ArrowRight, Pencil, Archive, Bell, Trash2, Star, StarOff, CheckCheck, Briefcase, UserCircle2, LogOut, Mail, QrCode, Ban, Send, UserCheck, Download, Ticket, Settings as SettingsIcon, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import ProfileEditor from "@/components/ProfileEditor";
import PaginationControls from "@/components/PaginationControls";
import DashboardFilters, { type SortKey } from "@/components/DashboardFilters";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";
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
import { downloadReceiptPdf } from "@/lib/receipt-pdf";

const ITEMS_PER_PAGE = 15;
const NOTIFS_PAGE_SIZE = 15;

const invStatusRank = (inv: any) => {
  if (inv.revoked_at) return 4;
  if (inv.expires_at && new Date(inv.expires_at) <= new Date()) return 3;
  if (inv.attendance_status === "scanned") return 0;
  if (inv.claimed_at) return 1;
  return 2;
};
const eventStatusRank = (e: any) => {
  if (e.is_published) return 0;
  if (e.status === "pending") return 1;
  if (e.status === "rejected") return 3;
  return 2;
};

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
  promotion: "Promotion",
};

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const { role, isAdmin } = useUserRole(user?.id);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<"user" | "organizer">("user");
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<any[]>([]);
  const [sentInvitationsStats, setSentInvitationsStats] = useState<{ total: number; scanned: number }>({ total: 0, scanned: 0 });
  const [participations, setParticipations] = useState<any[]>([]);
  const [notifsTotal, setNotifsTotal] = useState(0);
  const [notifsLoadedCount, setNotifsLoadedCount] = useState(NOTIFS_PAGE_SIZE);
  const [notifsLoadingMore, setNotifsLoadingMore] = useState(false);
  const [eventsPage, setEventsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const [participationsPage, setParticipationsPage] = useState(1);
  const [selectedNotif, setSelectedNotif] = useState<UserNotification | null>(null);

  // Per-tab filters (persisted in URL + localStorage)
  const evF = usePersistedFilters("ev");
  const evSearch = evF.search, setEvSearch = evF.setSearch, evCity = evF.city, setEvCity = evF.setCity, evSort = evF.sort, setEvSort = evF.setSort;
  const invF = usePersistedFilters("inv", true);
  const invSearch = invF.search, setInvSearch = invF.setSearch, invCity = invF.city, setInvCity = invF.setCity, invSort = invF.sort, setInvSort = invF.setSort, invGroup = invF.group, setInvGroup = invF.setGroup;
  const favF = usePersistedFilters("fav");
  const favSearch = favF.search, setFavSearch = favF.setSearch, favCity = favF.city, setFavCity = favF.setCity, favSort = favF.sort, setFavSort = favF.setSort;
  const partF = usePersistedFilters("part", true);
  const partSearch = partF.search, setPartSearch = partF.setSearch, partCity = partF.city, setPartCity = partF.setCity, partSort = partF.sort, setPartSort = partF.setSort, partGroup = partF.group, setPartGroup = partF.setGroup;

  useEffect(() => {
    // Wait until Supabase has restored the session before redirecting;
    // otherwise the first click on the profile icon flashes /auth and
    // the user must click a second time.
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    const fetchDashboard = async () => {
      const userEmail = (user.email || "").toLowerCase();
      const [profileResult, eventsResult, commentsResult, favoritesResult, notifsResult, invitationsResult] = await Promise.all([
        supabase.from("profiles").select("account_type, display_name, avatar_url, phone_primary, physical_address, organization_name, organization_role").eq("id", user.id).maybeSingle(),
        supabase.from("events").select("id, title, city, date, created_at, status, is_published, attendees_count, categories(name)").eq("organizer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("comments").select("id, content, created_at, event_id, events(title)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("favorites").select("id, created_at, events(id, title, city, date, image_url)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_notifications").select("*", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).range(0, NOTIFS_PAGE_SIZE - 1),
        supabase.from("event_invitations")
          .select("id, status, attendance_status, claimed_at, scanned_at, expires_at, revoked_at, max_uses, uses_count, qr_code_token, invited_email, invited_name, created_at, last_sent_at, events(id, title, city, date, image_url)")
          .or(`invited_user_id.eq.${user.id}${userEmail ? `,invited_email.eq.${userEmail}` : ""}`)
          .order("created_at", { ascending: false }),
      ]);
      const acct = (profileResult.data as any)?.account_type;
      setAccountType(acct === "organizer" ? "organizer" : "user");
      setProfileInfo(profileResult.data || null);
      setEvents(eventsResult.data || []);
      setComments(commentsResult.data || []);
      setFavorites(favoritesResult.data || []);
      setNotifications((notifsResult.data as UserNotification[]) || []);
      setNotifsTotal(notifsResult.count || 0);
      setNotifsLoadedCount(NOTIFS_PAGE_SIZE);
      setReceivedInvitations(invitationsResult.data || []);

      // Organizer KPI: invitations sent + presents scanned
      const { data: sentInv } = await supabase
        .from("event_invitations")
        .select("id, attendance_status")
        .eq("invited_by", user.id);
      const sentList = sentInv || [];
      setSentInvitationsStats({
        total: sentList.length,
        scanned: sentList.filter((i: any) => i.attendance_status === "scanned").length,
      });

      // Participations (ticket orders)
      const { data: orders } = await supabase
        .from("ticket_orders")
        .select("id, created_at, quantity, unit_price_amount, total_amount, currency, payment_status, payment_provider, qr_code_token, buyer_name, buyer_email, attendance_status, ticket_types(name), events(id, title, city, location, date, image_url)")
        .eq("buyer_user_id", user.id)
        .order("created_at", { ascending: false });
      setParticipations(orders || []);

      setLoading(false);
    };
    fetchDashboard();

    // Real-time updates: just refresh first page
    if (user) {
      const channel = supabase
        .channel("profile-notifs")
        .on("postgres_changes", { event: "*", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` }, async () => {
          const { data, count } = await supabase.from("user_notifications").select("*", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).range(0, Math.max(NOTIFS_PAGE_SIZE, notifsLoadedCount) - 1);
          setNotifications((data as UserNotification[]) || []);
          setNotifsTotal(count || 0);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, navigate, authLoading]);

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
    setNotifsTotal((t) => Math.max(0, t - 1));
    if (selectedNotif?.id === id) setSelectedNotif(null);
  };
  const openNotif = (n: UserNotification) => {
    setSelectedNotif(n);
    if (!n.is_read) markAsRead(n.id);
  };

  const isOrganizer = accountType === "organizer" || isAdmin;
  const publishedCount = events.filter((event) => event.is_published).length;
  const pendingCount = events.filter((event) => event.status === "pending").length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ===== Filter / sort helpers =====
  const applyTextCity = <T,>(items: T[], getCity: (x: T) => string, getText: (x: T) => string, search: string, city: string) => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (city !== "all" && (getCity(it) || "") !== city) return false;
      if (q && !getText(it).toLowerCase().includes(q)) return false;
      return true;
    });
  };
  const groupBy = <T,>(items: T[], key: (x: T) => string) => {
    const map = new Map<string, T[]>();
    items.forEach((it) => {
      const k = key(it) || "—";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    });
    return Array.from(map.entries());
  };

  // Events tab
  const eventsCities = useMemo(() => Array.from(new Set(events.map((e) => e.city).filter(Boolean))) as string[], [events]);
  const filteredEvents = useMemo(() => {
    let arr = applyTextCity(events, (e) => e.city, (e) => `${e.title || ""} ${e.categories?.name || ""}`, evSearch, evCity);
    if (evSort === "date_desc") arr = [...arr].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    else if (evSort === "date_asc") arr = [...arr].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    else if (evSort === "popularity") arr = [...arr].sort((a, b) => (b.attendees_count || 0) - (a.attendees_count || 0));
    else if (evSort === "status") arr = [...arr].sort((a, b) => eventStatusRank(a) - eventStatusRank(b));
    return arr;
  }, [events, evSearch, evCity, evSort]);
  const eventsTotalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice((eventsPage - 1) * ITEMS_PER_PAGE, eventsPage * ITEMS_PER_PAGE);

  // Comments tab (search only)
  const commentsTotalPages = Math.ceil(comments.length / ITEMS_PER_PAGE);
  const paginatedComments = comments.slice((commentsPage - 1) * ITEMS_PER_PAGE, commentsPage * ITEMS_PER_PAGE);

  // Favorites tab
  const favCities = useMemo(() => Array.from(new Set(favorites.map((f) => f.events?.city).filter(Boolean))) as string[], [favorites]);
  const filteredFavorites = useMemo(() => {
    let arr = applyTextCity(favorites, (f) => f.events?.city || "", (f) => f.events?.title || "", favSearch, favCity);
    if (favSort === "date_desc") arr = [...arr].sort((a, b) => +new Date(b.events?.date || 0) - +new Date(a.events?.date || 0));
    else if (favSort === "date_asc") arr = [...arr].sort((a, b) => +new Date(a.events?.date || 0) - +new Date(b.events?.date || 0));
    return arr;
  }, [favorites, favSearch, favCity, favSort]);
  const favoritesTotalPages = Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE);
  const paginatedFavorites = filteredFavorites.slice((favoritesPage - 1) * ITEMS_PER_PAGE, favoritesPage * ITEMS_PER_PAGE);

  // Invitations tab
  const invCities = useMemo(() => Array.from(new Set(receivedInvitations.map((i) => i.events?.city).filter(Boolean))) as string[], [receivedInvitations]);
  const filteredInvitations = useMemo(() => {
    let arr = applyTextCity(receivedInvitations, (i) => i.events?.city || "", (i) => i.events?.title || "", invSearch, invCity);
    if (invSort === "date_desc") arr = [...arr].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (invSort === "date_asc") arr = [...arr].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (invSort === "status") arr = [...arr].sort((a, b) => invStatusRank(a) - invStatusRank(b));
    return arr;
  }, [receivedInvitations, invSearch, invCity, invSort]);
  const invitationsGrouped = useMemo(() => invGroup ? groupBy(filteredInvitations, (i) => i.events?.title || "Événement") : null, [filteredInvitations, invGroup]);
  const invitationsTotalPages = Math.ceil(filteredInvitations.length / ITEMS_PER_PAGE);
  const paginatedInvitations = filteredInvitations.slice((invitationsPage - 1) * ITEMS_PER_PAGE, invitationsPage * ITEMS_PER_PAGE);
  const pendingInvitationsCount = receivedInvitations.filter((i) => !i.revoked_at && !i.claimed_at && (!i.expires_at || new Date(i.expires_at) > new Date())).length;

  // Participations tab
  const partCities = useMemo(() => Array.from(new Set(participations.map((p) => p.events?.city).filter(Boolean))) as string[], [participations]);
  const filteredParticipations = useMemo(() => {
    let arr = applyTextCity(participations, (p) => p.events?.city || "", (p) => p.events?.title || "", partSearch, partCity);
    if (partSort === "date_desc") arr = [...arr].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (partSort === "date_asc") arr = [...arr].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (partSort === "status") arr = [...arr].sort((a, b) => (a.payment_status || "").localeCompare(b.payment_status || ""));
    return arr;
  }, [participations, partSearch, partCity, partSort]);
  const participationsGrouped = useMemo(() => partGroup ? groupBy(filteredParticipations, (p) => p.events?.title || "Événement") : null, [filteredParticipations, partGroup]);
  const participationsTotalPages = Math.ceil(filteredParticipations.length / ITEMS_PER_PAGE);
  const paginatedParticipations = filteredParticipations.slice((participationsPage - 1) * ITEMS_PER_PAGE, participationsPage * ITEMS_PER_PAGE);

  const hasMoreNotifs = notifications.length < notifsTotal;

  const loadMoreNotifs = async () => {
    if (!user || notifsLoadingMore || !hasMoreNotifs) return;
    setNotifsLoadingMore(true);
    const from = notifications.length;
    const to = from + NOTIFS_PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);
    setNotifications((prev) => [...prev, ...((data as UserNotification[]) || [])]);
    if (typeof count === "number") setNotifsTotal(count);
    setNotifsLoadedCount((c) => c + NOTIFS_PAGE_SIZE);
    setNotifsLoadingMore(false);
  };

  const invitationStatus = (inv: any): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (inv.revoked_at) return { label: "Révoquée", variant: "destructive" };
    if (inv.expires_at && new Date(inv.expires_at) <= new Date()) return { label: "Expirée", variant: "destructive" };
    if (inv.attendance_status === "scanned") return { label: "✅ Scannée (présent)", variant: "default" };
    if (inv.claimed_at) return { label: "Ouverte", variant: "default" };
    return { label: "Reçue · non ouverte", variant: "secondary" };
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

  const tabsList = [
    ...(isOrganizer ? [{ value: "events", label: "Mes activités" }] : []),
    { value: "notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { value: "invitations", label: `Invitations${pendingInvitationsCount > 0 ? ` (${pendingInvitationsCount})` : ""}` },
    { value: "participations", label: `Participations${participations.length > 0 ? ` (${participations.length})` : ""}` },
    { value: "comments", label: "Commentaires" },
    { value: "favorites", label: "Favoris" },
  ];

  const handleDownloadReceipt = (order: any) => {
    downloadReceiptPdf({
      orderId: order.id,
      buyerName: order.buyer_name,
      buyerEmail: order.buyer_email,
      quantity: order.quantity,
      unitPrice: Number(order.unit_price_amount),
      total: Number(order.total_amount),
      currency: order.currency,
      paymentStatus: order.payment_status,
      paymentProvider: order.payment_provider,
      qrToken: order.qr_code_token,
      createdAt: order.created_at,
      eventTitle: order.events?.title || "Événement",
      eventDate: order.events?.date,
      eventLocation: order.events?.location,
      eventCity: order.events?.city,
      ticketTypeName: order.ticket_types?.name,
    });
    toast({ title: "Reçu téléchargé" });
  };

  const participationStatusBadge = (p: any) => {
    if (p.payment_status === "paid") return <Badge className="text-[10px]">Payée</Badge>;
    if (p.payment_status === "pending") return <Badge variant="secondary" className="text-[10px]">En attente</Badge>;
    if (p.payment_status === "failed" || p.payment_status === "canceled") return <Badge variant="destructive" className="text-[10px]">{p.payment_status}</Badge>;
    return <Badge variant="outline" className="text-[10px]">{p.payment_status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Profile header — EzaWapi-style card */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col items-center text-center gap-3">
                {/* Avatar with online dot */}
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      {profileInfo?.avatar_url ? (
                        <img src={profileInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle2 className="w-12 h-12 text-primary/60" />
                      )}
                    </div>
                  </div>
                  <span
                    className={`absolute bottom-1 left-1 w-4 h-4 rounded-full border-2 border-card ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`}
                    title={isOnline ? "En ligne" : "Hors ligne"}
                  />
                </div>

                {/* Name + admin badge */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <h1 className="font-display text-lg sm:text-xl font-bold text-foreground break-all">
                    {profileInfo?.display_name || user.email}
                  </h1>
                  {isAdmin && (
                    <Badge className="gap-1 text-[10px]"><Shield className="h-3 w-3" /> Admin</Badge>
                  )}
                  {!isAdmin && isOrganizer && (
                    <Badge variant="secondary" className="gap-1 text-[10px]"><Briefcase className="h-3 w-3" /> Organisateur</Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground break-all -mt-1">{user.email}</p>

                {/* Info row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground justify-center">
                  {profileInfo?.phone_primary && (
                    <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{profileInfo.phone_primary}</span>
                  )}
                  {profileInfo?.physical_address && (
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{profileInfo.physical_address}</span>
                  )}
                  {profileInfo?.organization_role && (
                    <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" />{profileInfo.organization_role}</span>
                  )}
                  {user.created_at && (
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />Depuis {format(new Date(user.created_at), "MMMM yyyy", { locale: fr })}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditProfileOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Link to="/settings">
                    <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Paramètres">
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Dashboard admin">
                        <Shield className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  {isOrganizer && (
                    <Link to="/create">
                      <Button size="sm" className="gradient-hero text-primary-foreground border-0 gap-1.5">
                        <PlusCircle className="h-4 w-4" /> Nouvelle activité
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                    aria-label="Déconnexion"
                    onClick={async () => { await signOut(); navigate("/"); }}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 pt-4 border-t border-border">
                {(isOrganizer
                  ? [
                      { label: "Activités", value: events.length, icon: Calendar, color: "primary" },
                      { label: "Favoris", value: favorites.length, icon: Heart, color: "destructive" },
                      { label: "Commentaires", value: comments.length, icon: MessageSquare, color: "accent" },
                      { label: "Notifications", value: unreadCount, icon: Bell, color: "emerald" },
                    ]
                  : [
                      { label: "Notifications", value: unreadCount, icon: Bell, color: "primary" },
                      { label: "Favoris", value: favorites.length, icon: Heart, color: "destructive" },
                      { label: "Commentaires", value: comments.length, icon: MessageSquare, color: "accent" },
                      { label: "Invitations", value: receivedInvitations.length, icon: Mail, color: "emerald" },
                    ]
                ).map((stat: any) => {
                  const bg = stat.color === "destructive" ? "bg-destructive/5" : stat.color === "accent" ? "bg-accent/5" : stat.color === "emerald" ? "bg-emerald-500/5" : "bg-primary/5";
                  const iconBg = stat.color === "destructive" ? "bg-destructive/10" : stat.color === "accent" ? "bg-accent/10" : stat.color === "emerald" ? "bg-emerald-500/10" : "bg-primary/10";
                  const iconColor = stat.color === "destructive" ? "text-destructive" : stat.color === "accent" ? "text-accent" : stat.color === "emerald" ? "text-emerald-600" : "text-primary";
                  return (
                    <div key={stat.label} className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-xl ${bg}`}>
                      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                        <stat.icon className={`w-4 h-4 ${iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-base font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Edit profile dialog */}
          <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="px-6 pt-5">
                <DialogTitle className="font-display">Modifier le profil</DialogTitle>
                <DialogDescription>Mettez à jour vos informations et préférences de visibilité.</DialogDescription>
              </DialogHeader>
              <div className="px-2 sm:px-4 pb-2">
                <ProfileEditor
                  userId={user.id}
                  email={user.email || ""}
                  autoEdit
                  hideChrome
                  onClose={() => setEditProfileOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>


          <Tabs defaultValue={tabsList[0].value} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto w-full gap-1 p-1 justify-start">
              {tabsList.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="whitespace-nowrap text-xs sm:text-sm px-3 py-1.5 flex-grow sm:flex-grow-0 basis-[calc(33.333%-0.25rem)] sm:basis-auto"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {isOrganizer && (
              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-xl">Mes publications ({filteredEvents.length}{filteredEvents.length !== events.length ? `/${events.length}` : ""})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DashboardFilters
                      search={evSearch} onSearch={setEvSearch}
                      city={evCity} onCity={setEvCity} cities={eventsCities}
                      sort={evSort} onSort={setEvSort}
                    />
                    {filteredEvents.length === 0 ? (
                      <p className="font-body text-sm text-muted-foreground">Aucune activité ne correspond à ces filtres.</p>
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
                                {event.categories?.name && <Badge variant="outline" className="text-[10px]">{event.categories.name}</Badge>}
                              </div>
                              <p className="font-body text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {event.city || "Ville non précisée"}</span>
                                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {format(new Date(event.date), "d MMM yyyy", { locale: fr })}</span>
                                {typeof event.attendees_count === "number" && <span className="inline-flex items-center gap-1"><UserCheck className="h-3.5 w-3.5 text-primary" /> {event.attendees_count}</span>}
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
                    <PaginationControls currentPage={eventsPage} totalPages={eventsTotalPages} totalItems={filteredEvents.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setEventsPage} label="activités" />
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
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="font-body text-sm text-muted-foreground">Aucune notification.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`group w-full rounded-xl border p-3 flex gap-3 items-start transition-colors ${n.is_read ? "border-border bg-card hover:bg-muted/60" : "border-primary/30 bg-primary/5 hover:bg-primary/10"}`}
                      >
                        <button
                          type="button"
                          onClick={() => openNotif(n)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="secondary" className="text-[9px]">{typeLabels[n.type] || n.type}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                            </span>
                            {!n.is_read && <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />}
                          </div>
                          <p className="font-body text-sm font-medium text-foreground truncate">{n.title}</p>
                          {n.body && <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                        </button>
                        <div className="flex flex-col gap-1 shrink-0">
                          {!n.is_read && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Marquer comme lue" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}>
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Supprimer" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  {hasMoreNotifs && (
                    <div className="pt-3 flex justify-center">
                      <Button variant="outline" size="sm" onClick={loadMoreNotifs} disabled={notifsLoadingMore} className="gap-1.5">
                        {notifsLoadingMore ? "Chargement…" : `Charger plus (${notifsTotal - notifications.length} restantes)`}
                      </Button>
                    </div>
                  )}
                  {notifications.length > 0 && !hasMoreNotifs && notifsTotal > NOTIFS_PAGE_SIZE && (
                    <p className="pt-2 text-center text-[11px] text-muted-foreground">Toutes les notifications affichées ({notifsTotal}).</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invitations">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" /> Invitations reçues ({receivedInvitations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DashboardFilters
                    search={invSearch} onSearch={setInvSearch}
                    city={invCity} onCity={setInvCity} cities={invCities}
                    sort={invSort} onSort={setInvSort}
                    showPopularitySort={false}
                    groupByEvent={invGroup} onGroupByEvent={setInvGroup}
                  />
                  {(() => {
                    const renderItem = (inv: any) => {
                      const event = inv.events;
                      const status = invitationStatus(inv);
                      const blocked = inv.revoked_at || (inv.expires_at && new Date(inv.expires_at) <= new Date());
                      return (
                        <div key={inv.id} className="rounded-xl border border-border bg-muted/40 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-body font-semibold text-foreground truncate">{event?.title || "Événement"}</h3>
                                <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                                {inv.revoked_at && <Badge variant="outline" className="text-[10px] gap-1"><Ban className="h-3 w-3" />Lien invalide</Badge>}
                              </div>
                              <p className="font-body text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                                {event?.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {event.city}</span>}
                                {event?.date && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {format(new Date(event.date), "d MMM yyyy", { locale: fr })}</span>}
                                <span className="text-xs">Reçue {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true, locale: fr })}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Link to={`/my-invitations/${inv.id}`}>
                                <Button variant="outline" size="sm">Détails</Button>
                              </Link>
                              {!blocked && event?.id && (
                                <Link to={`/invite/${inv.qr_code_token}`}>
                                  <Button size="sm" className="gap-1 gradient-hero text-primary-foreground border-0">
                                    <QrCode className="h-3.5 w-3.5" /> {inv.claimed_at ? "Rouvrir" : "Ouvrir l'invitation"}
                                  </Button>
                                </Link>
                              )}
                              {event?.id && inv.claimed_at && (
                                <Link to={`/events/${event.id}`}>
                                  <Button variant="outline" size="sm">Voir</Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    };
                    if (filteredInvitations.length === 0) {
                      return <p className="font-body text-sm text-muted-foreground">Aucune invitation ne correspond.</p>;
                    }
                    if (invitationsGrouped) {
                      return invitationsGrouped.map(([title, items]) => (
                        <div key={title} className="space-y-2">
                          <div className="flex items-center gap-2 pt-2">
                            <h4 className="font-display font-semibold text-foreground">{title}</h4>
                            <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                          </div>
                          {items.map(renderItem)}
                        </div>
                      ));
                    }
                    return paginatedInvitations.map(renderItem);
                  })()}
                  {!invitationsGrouped && (
                    <PaginationControls currentPage={invitationsPage} totalPages={invitationsTotalPages} totalItems={filteredInvitations.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setInvitationsPage} label="invitations" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participations">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" /> Mes participations ({filteredParticipations.length}{filteredParticipations.length !== participations.length ? `/${participations.length}` : ""})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DashboardFilters
                    search={partSearch} onSearch={setPartSearch}
                    city={partCity} onCity={setPartCity} cities={partCities}
                    sort={partSort} onSort={setPartSort}
                    showPopularitySort={false}
                    groupByEvent={partGroup} onGroupByEvent={setPartGroup}
                  />
                  {(() => {
                    const renderItem = (p: any) => {
                      const event = p.events;
                      return (
                        <div key={p.id} className="rounded-xl border border-border bg-muted/40 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-body font-semibold text-foreground truncate">{event?.title || "Événement"}</h3>
                                {participationStatusBadge(p)}
                                {p.attendance_status === "scanned" && <Badge className="text-[10px]">Présent</Badge>}
                                {p.ticket_types?.name && <Badge variant="outline" className="text-[10px]">{p.ticket_types.name}</Badge>}
                              </div>
                              <p className="font-body text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                                {event?.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {event.city}</span>}
                                {event?.date && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {format(new Date(event.date), "d MMM yyyy", { locale: fr })}</span>}
                                <span className="text-xs">{p.quantity} × {p.unit_price_amount} {p.currency} · Total {p.total_amount} {p.currency}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownloadReceipt(p)}>
                                <Download className="h-3.5 w-3.5" /> Reçu PDF
                              </Button>
                              {event?.id && (
                                <Link to={`/events/${event.id}`}>
                                  <Button variant="ghost" size="sm">Voir</Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    };
                    if (participations.length === 0) {
                      return <p className="font-body text-sm text-muted-foreground">Vous n'avez encore acheté aucun billet.</p>;
                    }
                    if (filteredParticipations.length === 0) {
                      return <p className="font-body text-sm text-muted-foreground">Aucune participation ne correspond aux filtres.</p>;
                    }
                    if (participationsGrouped) {
                      return participationsGrouped.map(([title, items]) => (
                        <div key={title} className="space-y-2">
                          <div className="flex items-center gap-2 pt-2">
                            <h4 className="font-display font-semibold text-foreground">{title}</h4>
                            <Badge variant="outline" className="text-[10px]">{items.length} billet{items.length > 1 ? "s" : ""}</Badge>
                          </div>
                          {items.map(renderItem)}
                        </div>
                      ));
                    }
                    return paginatedParticipations.map(renderItem);
                  })()}
                  {!participationsGrouped && (
                    <PaginationControls currentPage={participationsPage} totalPages={participationsTotalPages} totalItems={filteredParticipations.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setParticipationsPage} label="participations" />
                  )}
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
                  <CardTitle className="font-display text-xl">Mes favoris ({filteredFavorites.length}{filteredFavorites.length !== favorites.length ? `/${favorites.length}` : ""})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DashboardFilters
                    search={favSearch} onSearch={setFavSearch}
                    city={favCity} onCity={setFavCity} cities={favCities}
                    sort={favSort} onSort={setFavSort}
                    showPopularitySort={false}
                    showStatusSort={false}
                  />
                  {favorites.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground">Aucun favori pour le moment.</p>
                  ) : filteredFavorites.length === 0 ? (
                    <p className="font-body text-sm text-muted-foreground">Aucun favori ne correspond aux filtres.</p>
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
                  <PaginationControls currentPage={favoritesPage} totalPages={favoritesTotalPages} totalItems={filteredFavorites.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setFavoritesPage} label="favoris" />
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
