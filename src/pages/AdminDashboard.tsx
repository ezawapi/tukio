import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Trash2, Eye, Bell, BellOff, AlertTriangle, CheckCircle, XCircle, BarChart3, Calendar, TrendingUp, Video, MousePointerClick, Search, Users, Tags, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import AdminAdsManager from "@/components/admin/AdminAdsManager";
import AdminPartnersManager from "@/components/admin/AdminPartnersManager";
import AdminContentManager from "@/components/admin/AdminContentManager";
import AdminEventEditDialog from "@/components/admin/AdminEventEditDialog";
import AdminCategoriesManager from "@/components/admin/AdminCategoriesManager";
import AdminUsersManager from "@/components/admin/AdminUsersManager";
import AdminBannersManager from "@/components/admin/AdminBannersManager";
import AdminRolesManager from "@/components/admin/AdminRolesManager";
import PaginationControls from "@/components/PaginationControls";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/I18nContext";
import { usePermissions } from "@/hooks/use-permissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ITEMS_PER_PAGE = 15;
const NOTIF_PER_PAGE = 15;

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { role, can, loading: permLoading } = usePermissions();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [adStats, setAdStats] = useState({ total: 0, active: 0 });
  const [adAnalytics, setAdAnalytics] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [allEventsPage, setAllEventsPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [notifPage, setNotifPage] = useState(1);
  const [promoEventId, setPromoEventId] = useState<string>("all");
  const [promoTarget, setPromoTarget] = useState<"all" | "favorites">("all");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoBody, setPromoBody] = useState("");
  const [promoSending, setPromoSending] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (permLoading) return;
    if (role === "user") {
      toast({ title: "Accès refusé", variant: "destructive" });
      navigate("/");
      return;
    }
    setHasAccess(true);
    setLoading(false);
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, permLoading, role]);


  const fetchAll = () => { fetchEvents(); fetchPendingEvents(); fetchNotifications(); fetchAdStats(); fetchAdAnalytics(); fetchCategories(); fetchCampaigns(); };
  const fetchCampaigns = async () => {
    const { data: camps } = await supabase
      .from("notification_campaigns")
      .select("id, title, body, target, event_id, recipients_count, created_at, events:event_id(title)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!camps || camps.length === 0) { setCampaigns([]); return; }
    const ids = camps.map((c: any) => c.id);
    const { data: analytics } = await supabase
      .from("notification_analytics")
      .select("campaign_id, event_type")
      .in("campaign_id", ids);
    const stats = new Map<string, { sent: number; opened: number; clicked: number; failed: number }>();
    (analytics || []).forEach((a: any) => {
      const s = stats.get(a.campaign_id) || { sent: 0, opened: 0, clicked: 0, failed: 0 };
      if (a.event_type in s) (s as any)[a.event_type]++;
      stats.set(a.campaign_id, s);
    });
    setCampaigns(camps.map((c: any) => ({ ...c, stats: stats.get(c.id) || { sent: 0, opened: 0, clicked: 0, failed: 0 } })));
  };
  const fetchCategories = async () => { const { data } = await supabase.from("categories").select("id, name").order("name"); setCategories(data || []); };
  const fetchEvents = async () => { const { data } = await supabase.from("events").select("*, categories(name)").order("created_at", { ascending: false }); setEvents(data || []); };
  const fetchPendingEvents = async () => { const { data } = await supabase.from("events").select("*, categories(name)").eq("status", "pending").order("created_at", { ascending: false }); setPendingEvents(data || []); };
  const fetchNotifications = async () => { const { data } = await supabase.from("admin_notifications").select("*, events(title, organizer_name)").eq("is_read", false).order("created_at", { ascending: false }); setNotifications(data || []); };
  const fetchAdStats = async () => { const { count: total } = await supabase.from("ads").select("*", { count: "exact", head: true }); const { count: active } = await supabase.from("ads").select("*", { count: "exact", head: true }).eq("is_active", true); setAdStats({ total: total || 0, active: active || 0 }); };
  const fetchAdAnalytics = async () => {
    const { data } = await supabase.from("ad_analytics").select("ad_id, event_type, created_at, ads(title)").order("created_at", { ascending: false }).limit(200);
    if (data) {
      const map = new Map<string, { title: string; impressions: number; clicks: number }>();
      data.forEach((row: any) => { const key = row.ad_id; if (!map.has(key)) map.set(key, { title: row.ads?.title || "Pub supprimée", impressions: 0, clicks: 0 }); const entry = map.get(key)!; if (row.event_type === "impression") entry.impressions++; else if (row.event_type === "click") entry.clicks++; });
      setAdAnalytics(Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats })));
    }
  };

  const markAsRead = async (notifId: string) => { await supabase.from("admin_notifications").update({ is_read: true }).eq("id", notifId); fetchNotifications(); };
  const deleteEvent = async (eventId: string) => { const { error } = await supabase.from("events").delete().eq("id", eventId); if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" }); else { toast({ title: "Événement supprimé" }); fetchAll(); } };
  const approveEvent = async (eventId: string) => { await supabase.from("events").update({ status: "approved", is_published: true, last_reviewed_at: new Date().toISOString(), updated_by_admin: true }).eq("id", eventId); toast({ title: "Événement approuvé !" }); fetchAll(); };
  const rejectEvent = async (eventId: string) => { await supabase.from("events").update({ status: "rejected", is_published: false, last_reviewed_at: new Date().toISOString(), updated_by_admin: true }).eq("id", eventId); toast({ title: "Événement rejeté" }); fetchAll(); };
  const togglePublish = async (eventId: string, cur: boolean) => { await supabase.from("events").update({ is_published: !cur, updated_by_admin: true }).eq("id", eventId); toast({ title: cur ? "Dépublié" : "Republié" }); fetchEvents(); };
  const toggleLive = async (eventId: string, cur: boolean) => { await supabase.from("events").update({ is_live: !cur, updated_by_admin: true }).eq("id", eventId); toast({ title: cur ? "Live off" : "Live on" }); fetchEvents(); };
  const sendPromotionalNotification = async () => {
    if (promoEventId === "all") {
      toast({ title: "Sélectionnez une activité", variant: "destructive" });
      return;
    }
    if (!promoTitle.trim()) {
      toast({ title: "Ajoutez un titre", variant: "destructive" });
      return;
    }

    setPromoSending(true);
    const { data, error } = await supabase.rpc("send_promotional_notification", {
      _event_id: promoEventId,
      _title: promoTitle.trim(),
      _body: promoBody.trim(),
      _target: promoTarget,
    });
    setPromoSending(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    // Fetch fresh campaign to display recipients count
    await fetchCampaigns();
    const created = data ? await supabase.from("notification_campaigns").select("recipients_count").eq("id", data as string).maybeSingle() : null;
    toast({ title: "Notification envoyée", description: `${created?.data?.recipients_count ?? 0} destinataire(s)` });
    setPromoTitle("");
    setPromoBody("");
  };

  const filteredAllEvents = useMemo(() => {
    let list = events;
    if (filterCategory !== "all") list = list.filter(e => e.category_id === filterCategory);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); list = list.filter(e => e.title?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q) || e.organizer_name?.toLowerCase().includes(q)); }
    return list;
  }, [events, filterCategory, searchQuery]);

  const filteredPendingEvents = useMemo(() => {
    let list = pendingEvents;
    if (filterCategory !== "all") list = list.filter(e => e.category_id === filterCategory);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); list = list.filter(e => e.title?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q)); }
    return list;
  }, [pendingEvents, filterCategory, searchQuery]);

  const totalEvents = events.length;
  const publishedEvents = events.filter(e => e.is_published).length;
  const pendingCount = pendingEvents.length;
  const liveEventsCount = events.filter(e => e.is_live).length;

  const allTotalPages = Math.ceil(filteredAllEvents.length / ITEMS_PER_PAGE);
  const paginatedAll = filteredAllEvents.slice((allEventsPage - 1) * ITEMS_PER_PAGE, allEventsPage * ITEMS_PER_PAGE);
  const pendingTotalPages = Math.ceil(filteredPendingEvents.length / ITEMS_PER_PAGE);
  const paginatedPending = filteredPendingEvents.slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE);
  const notifTotalPages = Math.ceil(notifications.length / NOTIF_PER_PAGE);
  const paginatedNotifs = notifications.slice((notifPage - 1) * NOTIF_PER_PAGE, notifPage * NOTIF_PER_PAGE);

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 pt-20"><div className="animate-pulse space-y-4"><div className="h-8 w-1/3 rounded bg-card" /><div className="h-64 rounded-xl bg-card" /></div></div></div>
  );
  if (!hasAccess) return null;

  // Build the visible tabs list based on permissions
  const tabConfig: { value: string; label: string; show: boolean }[] = [
    { value: "pending", label: t("admin.pending"), show: can("events.moderate") },
    { value: "all", label: t("admin.all"), show: can("events.moderate") || can("events.delete") },
    { value: "notifications", label: t("admin.notifs"), show: can("notifications.view") },
    { value: "ads", label: t("admin.ads"), show: can("ads.manage") },
    { value: "banners", label: "Bannières", show: can("banners.manage") },
    { value: "analytics", label: t("admin.analytics"), show: can("analytics.view") },
    { value: "partners", label: t("admin.partners"), show: can("partners.manage") },
    { value: "content", label: t("admin.content"), show: can("content.manage") },
    { value: "categories", label: t("admin.categories"), show: can("categories.manage") },
    { value: "users", label: t("admin.users"), show: can("users.manage") },
    { value: "roles", label: "Rôles", show: can("roles.manage") },
  ];
  const visibleTabs = tabConfig.filter((tab) => tab.show);
  const defaultTab = visibleTabs[0]?.value || "pending";
  const isVisible = (v: string) => visibleTabs.some((tab) => tab.value === v);

  if (visibleTabs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <Card><CardContent className="p-6 text-center font-body text-sm text-muted-foreground">
            Votre rôle ({role === "moderator" ? "Modérateur" : "Utilisateur"}) ne dispose d'aucune permission active.
            Contactez un administrateur.
          </CardContent></Card>
        </div>
        <Footer />
        <MobileTabBar />
      </div>
    );
  }

  const FilterBar = () => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
      <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg bg-muted">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input placeholder={t("admin.search")} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setAllEventsPage(1); setPendingPage(1); }}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto p-0" />
      </div>
      <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setAllEventsPage(1); setPendingPage(1); }}>
        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Catégorie" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("events.all_categories")}</SelectItem>
          {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 pt-20">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center gap-3 sm:mb-8">
            <Shield className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl md:text-3xl">{t("admin.title")}</h1>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-5">
            {[
              { label: t("admin.total"), value: totalEvents, icon: BarChart3 },
              { label: t("admin.published"), value: publishedEvents, icon: CheckCircle },
              { label: t("admin.pending"), value: pendingCount, icon: Calendar },
              { label: t("admin.live"), value: liveEventsCount, icon: TrendingUp },
              { label: t("admin.active_ads"), value: adStats.active, icon: BarChart3 },
            ].map((stat) => (
              <Card key={stat.label}><CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                <div className="rounded-xl bg-muted p-2 sm:rounded-2xl sm:p-3"><stat.icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" /></div>
                <div><p className="font-display text-lg font-bold text-foreground sm:text-2xl">{stat.value}</p><p className="font-body text-[10px] text-muted-foreground sm:text-xs">{stat.label}</p></div>
              </CardContent></Card>
            ))}
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-4 sm:space-y-6">
            <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted p-1">
              {visibleTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">{tab.label}</TabsTrigger>
              ))}
            </TabsList>

            {isVisible("pending") && (
              <TabsContent value="pending">
                <Card><CardHeader><CardTitle className="font-display text-base sm:text-lg">{t("admin.pending")} ({filteredPendingEvents.length})</CardTitle></CardHeader>
                  <CardContent>
                    <FilterBar />
                    {paginatedPending.length === 0 ? <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucun événement en attente.</p> : (
                      <div className="space-y-2 sm:space-y-3">
                        {paginatedPending.map(event => (
                          <EventRow key={event.id} event={event} actions={
                            <div className="flex flex-wrap items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)} className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                              {can("events.moderate") && <AdminEventEditDialog event={event} onSaved={fetchAll} />}
                              {can("events.moderate") && <Button variant="ghost" size="sm" onClick={() => approveEvent(event.id)} className="h-8 w-8 p-0" title="Approuver"><CheckCircle className="h-4 w-4 text-primary" /></Button>}
                              {can("events.moderate") && <Button variant="ghost" size="sm" onClick={() => rejectEvent(event.id)} className="h-8 w-8 p-0" title="Rejeter"><XCircle className="h-4 w-4 text-destructive" /></Button>}
                            </div>
                          } />
                        ))}
                      </div>
                    )}
                    <PaginationControls currentPage={pendingPage} totalPages={pendingTotalPages} totalItems={filteredPendingEvents.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPendingPage} label="activités" />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {isVisible("all") && (
              <TabsContent value="all">
                <Card><CardHeader><CardTitle className="font-display text-base sm:text-lg">{t("admin.all")} ({filteredAllEvents.length})</CardTitle></CardHeader>
                  <CardContent>
                    <FilterBar />
                    <div className="space-y-2 sm:space-y-3">
                      {paginatedAll.map(event => (
                        <EventRow key={event.id} event={event} actions={
                          <div className="flex flex-wrap items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)} className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                            {can("events.moderate") && <AdminEventEditDialog event={event} onSaved={fetchAll} />}
                            {can("events.publish") && <Button variant="ghost" size="sm" onClick={() => togglePublish(event.id, event.is_published)} className="h-8 w-8 p-0" title={event.is_published ? "Dépublier" : "Republier"}><AlertTriangle className="h-4 w-4 text-primary" /></Button>}
                            {can("events.publish") && <Button variant="ghost" size="sm" onClick={() => toggleLive(event.id, event.is_live)} className="h-8 w-8 p-0" title="Live"><Video className={`h-4 w-4 ${event.is_live ? "text-destructive" : "text-muted-foreground"}`} /></Button>}
                            {can("events.delete") && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle><AlertDialogDescription>« {event.title} » sera supprimé.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteEvent(event.id)} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        } />
                      ))}
                      {filteredAllEvents.length === 0 && <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucun événement trouvé.</p>}
                    </div>
                    <PaginationControls currentPage={allEventsPage} totalPages={allTotalPages} totalItems={filteredAllEvents.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setAllEventsPage} label="activités" />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {isVisible("notifications") && (
              <TabsContent value="notifications">
                <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg"><SendHorizonal className="h-5 w-5 text-primary" /> Notification promotionnelle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Activité liée</Label>
                        <Select value={promoEventId} onValueChange={setPromoEventId}>
                          <SelectTrigger><SelectValue placeholder="Choisir une activité" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Choisir une activité</SelectItem>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Destinataires</Label>
                        <Select value={promoTarget} onValueChange={(value) => setPromoTarget(value as "all" | "favorites")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les utilisateurs</SelectItem>
                            <SelectItem value="favorites">Uniquement les favoris de l’activité</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} placeholder="Ex: Places limitées ce week-end" />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea value={promoBody} onChange={(e) => setPromoBody(e.target.value)} rows={4} placeholder="Ajoutez un message promotionnel avec appel à l’action." />
                    </div>
                    <Button onClick={sendPromotionalNotification} disabled={promoSending} className="gap-2">
                      <SendHorizonal className="h-4 w-4" /> {promoSending ? "Envoi..." : "Envoyer la notification"}
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
                      <BarChart3 className="h-5 w-5 text-primary" /> Suivi des campagnes promotionnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaigns.length === 0 ? (
                      <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucune campagne envoyée pour le moment.</p>
                    ) : (
                      <div className="space-y-3">
                        {campaigns.map((c) => {
                          const openRate = c.stats.sent > 0 ? Math.round((c.stats.opened / c.stats.sent) * 100) : 0;
                          const clickRate = c.stats.sent > 0 ? Math.round((c.stats.clicked / c.stats.sent) * 100) : 0;
                          return (
                            <div key={c.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-body text-sm font-semibold text-foreground truncate">{c.title}</p>
                                  <p className="font-body text-xs text-muted-foreground truncate">
                                    {c.events?.title || "Activité supprimée"} • {format(new Date(c.created_at), "d MMM yyyy HH:mm", { locale: fr })} • cible: {c.target === "favorites" ? "favoris" : "tous"}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">{c.recipients_count} envoyé(s)</Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="rounded bg-muted/50 py-1.5">
                                  <p className="font-display text-sm font-bold text-foreground">{c.stats.sent}</p>
                                  <p className="text-[10px] text-muted-foreground">Envois</p>
                                </div>
                                <div className="rounded bg-muted/50 py-1.5">
                                  <p className="font-display text-sm font-bold text-foreground">{c.stats.opened}</p>
                                  <p className="text-[10px] text-muted-foreground">Ouvertures {openRate}%</p>
                                </div>
                                <div className="rounded bg-muted/50 py-1.5">
                                  <p className="font-display text-sm font-bold text-foreground">{c.stats.clicked}</p>
                                  <p className="text-[10px] text-muted-foreground">Clics {clickRate}%</p>
                                </div>
                                <div className="rounded bg-muted/50 py-1.5">
                                  <p className="font-display text-sm font-bold text-destructive">{c.stats.failed}</p>
                                  <p className="text-[10px] text-muted-foreground">Échecs</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                <Card><CardHeader><CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg"><Bell className="h-5 w-5 text-primary" /> {t("admin.notifs")} ({notifications.length})</CardTitle></CardHeader>
                  <CardContent>
                    {paginatedNotifs.length === 0 ? <p className="py-8 text-center font-body text-sm text-muted-foreground">{t("notif.empty")}</p> : (
                      <div className="space-y-2 sm:space-y-3">
                        {paginatedNotifs.map(notif => (
                          <div key={notif.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                            <div><p className="font-body text-sm text-foreground"><span className="font-semibold">{notif.type === "event_modified" ? "Modifié :" : "Nouveau :"}</span> {notif.events?.title || "Supprimé"}</p>
                              <p className="font-body text-xs text-muted-foreground">{notif.events?.organizer_name || "Inconnu"} • {format(new Date(notif.created_at), "d MMM yyyy HH:mm", { locale: fr })}</p></div>
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)} className="h-8 w-8 p-0"><BellOff className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <PaginationControls currentPage={notifPage} totalPages={notifTotalPages} totalItems={notifications.length} itemsPerPage={NOTIF_PER_PAGE} onPageChange={setNotifPage} label="notifications" />
                  </CardContent>
                </Card>
                </div>
              </TabsContent>
            )}

            {isVisible("ads") && <TabsContent value="ads"><AdminAdsManager userId={user?.id} /></TabsContent>}

            {isVisible("analytics") && (
              <TabsContent value="analytics">
                <Card><CardHeader><CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg"><MousePointerClick className="h-5 w-5 text-primary" /> {t("admin.analytics")}</CardTitle></CardHeader>
                  <CardContent>
                    {adAnalytics.length === 0 ? <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucune donnée.</p> : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-2 border-b border-border pb-2 font-body text-xs font-semibold text-muted-foreground"><span>Publicité</span><span className="text-center">Impressions</span><span className="text-center">Clics</span><span className="text-center">CTR</span></div>
                        {adAnalytics.map(row => (
                          <div key={row.id} className="grid grid-cols-4 gap-2 rounded-lg bg-muted/30 p-3 font-body text-sm">
                            <span className="truncate text-foreground">{row.title}</span><span className="text-center text-muted-foreground">{row.impressions}</span><span className="text-center text-muted-foreground">{row.clicks}</span>
                            <span className="text-center font-semibold text-primary">{row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(1) : "0.0"}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {isVisible("banners") && <TabsContent value="banners"><AdminBannersManager /></TabsContent>}
            {isVisible("partners") && <TabsContent value="partners"><AdminPartnersManager /></TabsContent>}
            {isVisible("content") && <TabsContent value="content"><AdminContentManager /></TabsContent>}
            {isVisible("categories") && <TabsContent value="categories"><AdminCategoriesManager /></TabsContent>}
            {isVisible("users") && <TabsContent value="users"><AdminUsersManager /></TabsContent>}
            {isVisible("roles") && <TabsContent value="roles"><AdminRolesManager /></TabsContent>}
          </Tabs>
        </div>

      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

const EventRow = ({ event, actions }: { event: any; actions: React.ReactNode }) => {
  const statusBadge = () => {
    switch (event.status) {
      case "approved": return <Badge className="text-[10px]">Approuvé</Badge>;
      case "rejected": return <Badge variant="destructive" className="text-[10px]">Rejeté</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">En attente</Badge>;
    }
  };
  return (
    <div className="flex flex-col justify-between gap-2 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <h3 className="truncate font-body text-sm font-semibold text-foreground">{event.title}</h3>
          {statusBadge()}
          <Badge variant={event.is_published ? "default" : "secondary"} className="text-[10px]">{event.is_published ? "Publié" : "Non publié"}</Badge>
          {event.is_live && <Badge className="text-[10px] bg-destructive text-destructive-foreground">LIVE</Badge>}
          {event.visibility === "private" && <Badge variant="outline" className="text-[10px]">Privé</Badge>}
          {event.categories?.name && <Badge variant="outline" className="text-[10px]">{event.categories.name}</Badge>}
        </div>
        <p className="font-body text-xs text-muted-foreground">{event.organizer_name || "Anonyme"} • {event.city} • {format(new Date(event.created_at), "d MMM yyyy", { locale: fr })}</p>
      </div>
      {actions}
    </div>
  );
};

export default AdminDashboard;
