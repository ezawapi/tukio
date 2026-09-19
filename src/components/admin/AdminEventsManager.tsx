import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Trash2, Eye, Users, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EventFormFields from "@/components/EventFormFields";
import AdminEventEditDialog from "@/components/admin/AdminEventEditDialog";
import PaginationControls from "@/components/PaginationControls";

const PER_PAGE = 15;

const emptyForm = {
  title: "", description: "", category_id: "", organizer_name: "", organizer_logo_url: "",
  date: "", end_date: "", location: "", venue_name: "", city: "", price: "Gratuit", currency: "CDF",
  capacity: "", visibility: "public", status: "approved", is_published: true, is_live: false, live_url: "",
  image_url: "", image_url2: "", ticketing_mode: "none", external_ticket_url: "", reservation_cta_label: "Réserver",
  phone1: "", phone2: "", whatsapp: "", contact_email: "", website_url: "", facebook_url: "",
  instagram_url: "", twitter_url: "", tiktok_url: "", latitude: "", longitude: "",
};

const fmt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const AdminEventsManager = ({ userId }: { userId?: string }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [partEvent, setPartEvent] = useState<any | null>(null);

  const fetchAll = async () => {
    const [{ data: ev }, { data: cats }, { data: parts }] = await Promise.all([
      supabase.from("events").select("*").order("date", { ascending: false }),
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("event_participations").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setEvents(ev || []);
    setCategories(cats || []);
    setParticipations(parts || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleChange = (field: string, value: string | boolean) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  const createEvent = async () => {
    if (!form.title || !form.date || !form.location || !form.city) {
      toast({ title: "Champs requis", description: "Titre, date, adresse et ville sont obligatoires.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const isFree = !form.price || /^(gratuit|0)$/i.test(form.price);
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      category_id: form.category_id || null,
      date: new Date(form.date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      venue_name: form.venue_name || null,
      location: form.location,
      city: form.city,
      price: isFree ? "Gratuit" : form.price,
      currency: isFree ? "CDF" : form.currency,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      image_url: form.image_url || null,
      image_url2: form.image_url2 || null,
      organizer_name: form.organizer_name || null,
      organizer_logo_url: form.organizer_logo_url || null,
      organizer_id: userId || null,
      author_id: userId || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      phone1: form.phone1 || null,
      phone2: form.phone2 || null,
      whatsapp: form.whatsapp || null,
      contact_email: form.contact_email || null,
      website_url: form.website_url || null,
      facebook_url: form.facebook_url || null,
      instagram_url: form.instagram_url || null,
      twitter_url: form.twitter_url || null,
      tiktok_url: form.tiktok_url || null,
      visibility: form.visibility,
      status: form.status,
      is_published: form.is_published === true || form.is_published === "true",
      is_live: form.is_live === true || form.is_live === "true",
      live_url: form.is_live ? form.live_url || null : null,
      ticketing_mode: form.ticketing_mode,
      external_ticket_url: form.ticketing_mode === "external" ? form.external_ticket_url || null : null,
      reservation_cta_label: form.ticketing_mode === "external" ? form.reservation_cta_label || "Réserver" : "Réserver",
      updated_by_admin: true,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Événement créé" });
    setCreateOpen(false);
    setForm(emptyForm);
    fetchAll();
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Événement supprimé" });
    fetchAll();
  };

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => events.filter((e) => {
    const okSearch = !q || e.title?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q);
    const okDay = !selectedDay || sameDay(new Date(e.date), selectedDay);
    return okSearch && okDay;
  }), [events, q, selectedDay]);

  const eventDays = useMemo(() => events.map((e) => new Date(e.date)), [events]);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const partsFor = (eventId: string) => participations.filter((p) => p.event_id === eventId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
            <CalendarDays className="h-5 w-5 text-primary" /> Gestion des événements ({filtered.length})
          </CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-hero border-0 text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> Nouvel événement</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-background">
              <DialogHeader>
                <DialogTitle>Créer un événement</DialogTitle>
                <DialogDescription>Publié directement au nom de l'administration.</DialogDescription>
              </DialogHeader>
              <EventFormFields form={form} categories={categories} userId={userId} onChange={handleChange} showAdminFields />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                <Button className="gradient-hero border-0 text-primary-foreground" onClick={createEvent} disabled={saving}>
                  {saving ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={(d) => { setSelectedDay(d); setPage(1); }}
              modifiers={{ hasEvent: eventDays }}
              modifiersClassNames={{ hasEvent: "bg-primary/15 font-semibold text-primary rounded-md" }}
              className="rounded-xl border border-border p-2"
            />
            {selectedDay && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedDay(undefined)}>
                Voir toutes les dates
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input placeholder="Rechercher un événement ou une ville..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
            </div>

            {paginated.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3">
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-medium text-foreground">{event.title}</p>
                  <p className="font-body text-[11px] text-muted-foreground">
                    {fmt(event.date)} · {event.city} · {partsFor(event.id).length} participation(s)
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!event.is_published && <Badge variant="outline" className="text-[10px]">Non publié</Badge>}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Participations" onClick={() => setPartEvent(event)}>
                    <Users className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Voir" onClick={() => navigate(`/events/${event.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <AdminEventEditDialog event={event} onSaved={fetchAll} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
                        <AlertDialogDescription>« {event.title} » sera définitivement supprimé.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteEvent(event.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucun événement.</p>}
            <PaginationControls currentPage={page} totalPages={Math.ceil(filtered.length / PER_PAGE)} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} label="événements" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!partEvent} onOpenChange={(o) => !o && setPartEvent(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border-border bg-background">
          <DialogHeader>
            <DialogTitle>Participations — {partEvent?.title}</DialogTitle>
            <DialogDescription>Historique des inscriptions reçues pour cet événement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {partEvent && partsFor(partEvent.id).length === 0 && (
              <p className="py-6 text-center font-body text-sm text-muted-foreground">Aucune participation enregistrée.</p>
            )}
            {partEvent && partsFor(partEvent.id).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3">
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-medium text-foreground">{p.full_name}</p>
                  <p className="truncate font-body text-[11px] text-muted-foreground">
                    {p.email} · {p.guests} place(s) · {fmt(p.created_at)}
                  </p>
                </div>
                <Badge variant={p.status === "confirmed" ? "secondary" : "outline"} className="shrink-0 text-[10px]">{p.status}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventsManager;
