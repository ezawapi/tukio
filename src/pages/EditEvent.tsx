import { normalizeOrganizerUrl } from "@/lib/organizer-link";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import EventFormFields from "@/components/EventFormFields";
import DraftStatus from "@/components/DraftStatus";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEventDraft } from "@/hooks/use-event-draft";

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const normalized = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return normalized.toISOString().slice(0, 16);
};

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const loadedFor = useRef<string | null>(null);

  const draft = useEventDraft({
    draftKey: `edit:${id}`,
    userId,
    form,
    setForm,
    ready: !loading,
    eventId: id,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { navigate("/auth"); return; }
    // Load once per event: auth refreshes must never reset the form.
    const key = `${id}:${userId}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId, authLoading]);

  const load = async () => {
    if (!id || !userId) return;
    const [{ data, error }, { data: roles }, { data: cats }] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("public_categories").select("id, name").order("name"),
    ]);
    setCategories((cats as any) || []);
    const admin = (roles || []).some((r) => r.role === "admin");
    setIsAdmin(admin);

    if (error || !data) {
      toast({ title: "Événement introuvable", variant: "destructive" });
      navigate("/profile");
      return;
    }
    if (data.organizer_id !== userId && (data as any).author_id !== userId && !admin) {
      toast({ title: "Accès refusé", description: "Vous ne pouvez modifier que vos propres événements.", variant: "destructive" });
      navigate("/profile");
      return;
    }

    setForm({
      title: data.title || "",
      description: data.description || "",
      category_id: data.category_id || "",
      sub_category_ids: (data as any).sub_category_ids || [],
      organizer_name: data.organizer_name || "",
      organizer_logo_url: data.organizer_logo_url || "",
      organizer_url: (data as any).organizer_url || "",
      date: toDateTimeLocal(data.date),
      end_date: toDateTimeLocal(data.end_date),
      venue_name: data.venue_name || "",
      location: data.location || "",
      city: data.city || "",
      price: data.price || "Gratuit",
      currency: data.currency || "FCFA",
      capacity: data.capacity?.toString() || "",
      visibility: data.visibility || "public",
      status: data.status || "pending",
      is_published: !!data.is_published,
      is_live: !!data.is_live,
      live_url: data.live_url || "",
      image_url: data.image_url || "",
      image_url2: data.image_url2 || "",
      ticketing_mode: data.ticketing_mode || "none",
      external_ticket_url: data.external_ticket_url || "",
      reservation_cta_label: data.reservation_cta_label || "Réserver",
      phone1: data.phone1 || "",
      phone2: data.phone2 || "",
      whatsapp: data.whatsapp || "",
      contact_email: data.contact_email || "",
      website_url: data.website_url || "",
      facebook_url: data.facebook_url || "",
      instagram_url: data.instagram_url || "",
      twitter_url: data.twitter_url || "",
      tiktok_url: data.tiktok_url || "",
      latitude: data.latitude?.toString() || "",
      longitude: data.longitude?.toString() || "",
    });
    setLoading(false);
  };

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !userId) return;

    const logo = (form.organizer_logo_url || "").trim();
    if (logo && !/^https?:\/\/.+/i.test(logo)) {
      toast({ title: "Logo invalide", description: "L'URL du logo doit commencer par http:// ou https://", variant: "destructive" });
      return;
    }
    if (form.ticketing_mode === "external" && !(form.external_ticket_url || "").trim()) {
      toast({ title: "Lien requis", description: "Ajoutez un lien vers votre plateforme de réservation.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const isFree = !form.price || /^(gratuit|0)$/i.test(form.price);
    const payload: Record<string, any> = {
      title: form.title,
      description: form.description || null,
      category_id: form.category_id || null,
      sub_category_ids: form.category_id ? form.sub_category_ids || [] : [],
      date: new Date(form.date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      venue_name: form.venue_name || null,
      location: form.location,
      city: form.city,
      price: isFree ? "Gratuit" : form.price,
      currency: isFree ? "FCFA" : form.currency,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      visibility: form.visibility,
      image_url: form.image_url || null,
      image_url2: form.image_url2 || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      organizer_name: form.organizer_name || null,
      organizer_logo_url: logo || null,
      organizer_url: normalizeOrganizerUrl(form.organizer_url),
      phone1: form.phone1 || null,
      phone2: form.phone2 || null,
      contact_email: form.contact_email || null,
      website_url: form.website_url || null,
      facebook_url: form.facebook_url || null,
      instagram_url: form.instagram_url || null,
      twitter_url: form.twitter_url || null,
      tiktok_url: form.tiktok_url || null,
      whatsapp: form.whatsapp || null,
      is_live: !!form.is_live,
      live_url: form.is_live ? form.live_url || null : null,
      ticketing_mode: form.ticketing_mode,
      external_ticket_url: form.ticketing_mode === "external" ? form.external_ticket_url.trim() : null,
      reservation_cta_label: form.ticketing_mode === "external" ? form.reservation_cta_label || "Réserver" : "Réserver",
      updated_at: new Date().toISOString(),
    };
    if (isAdmin) {
      payload.status = form.status;
      payload.is_published = form.is_published === true || form.is_published === "true";
      payload.updated_by_admin = true;
      payload.last_reviewed_at = new Date().toISOString();
    } else {
      // Modifying an event sends it back for admin review
      payload.status = "pending";
      payload.is_published = false;
    }

    const { error } = await supabase.from("events").update(payload as any).eq("id", id);

    if (error) {
      setSaving(false);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    await draft.clear();
    if (!isAdmin) {
      await supabase.from("admin_notifications").insert({ event_id: id, type: "event_modified" });
    }
    setSaving(false);
    toast(isAdmin
      ? { title: "Activité mise à jour" }
      : { title: "Modification soumise !", description: "Votre modification sera revue par l'administrateur." });
    navigate(`/events/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Modifier l'activité</h1>
        <p className="mb-4 font-body text-sm text-muted-foreground">
          {isAdmin
            ? "En tant qu'administrateur, vos modifications sont publiées directement."
            : "Après modification, votre activité sera soumise à validation par l'administrateur."}
        </p>
        <div className="mb-6"><DraftStatus draft={draft} /></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <EventFormFields form={form} categories={categories} userId={userId} onChange={handleChange} showAdminFields={isAdmin} />

          <Button type="submit" disabled={saving} className="w-full gap-2 gradient-hero text-primary-foreground border-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAdmin ? "Enregistrer" : "Soumettre la modification"}
          </Button>
        </form>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default EditEvent;
