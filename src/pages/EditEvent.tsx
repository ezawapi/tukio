import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = ["FCFA", "USD", "EUR", "XAF", "XOF"];

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchEvent();
    fetchCategories();
  }, [id, user]);

  const fetchEvent = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Événement introuvable", variant: "destructive" });
      navigate("/profile");
      return;
    }
    if (data.organizer_id !== user?.id) {
      toast({ title: "Accès refusé", description: "Vous ne pouvez modifier que vos propres événements.", variant: "destructive" });
      navigate("/profile");
      return;
    }

    setForm({
      title: data.title || "",
      description: data.description || "",
      date: data.date ? data.date.slice(0, 16) : "",
      end_date: data.end_date ? data.end_date.slice(0, 16) : "",
      location: data.location || "",
      city: data.city || "",
      category_id: data.category_id || "",
      price: data.price || "Gratuit",
      currency: data.currency || "FCFA",
      image_url: data.image_url || "",
      image_url2: data.image_url2 || "",
      latitude: data.latitude?.toString() || "",
      longitude: data.longitude?.toString() || "",
      organizer_name: data.organizer_name || "",
      phone1: data.phone1 || "",
      phone2: data.phone2 || "",
      contact_email: data.contact_email || "",
      website_url: data.website_url || "",
      facebook_url: data.facebook_url || "",
      instagram_url: data.instagram_url || "",
      twitter_url: data.twitter_url || "",
      tiktok_url: data.tiktok_url || "",
      whatsapp: data.whatsapp || "",
      is_live: data.is_live || false,
      external_ticket_url: data.external_ticket_url || "",
      ticketing_mode: data.ticketing_mode || "none",
      capacity: data.capacity?.toString() || "",
    });
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    setCategories(data || []);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev: Record<string, any>) => ({ ...prev, [field]: value }));
  };

  const isFree = !form.price || form.price === "Gratuit" || form.price === "0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setSaving(true);

    const { error } = await supabase
      .from("events")
      .update({
        title: form.title,
        description: form.description || null,
        date: new Date(form.date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        location: form.location,
        city: form.city,
        category_id: form.category_id || null,
        price: isFree ? "Gratuit" : form.price,
        currency: isFree ? "FCFA" : form.currency,
        image_url: form.image_url || null,
        image_url2: form.image_url2 || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        organizer_name: form.organizer_name || null,
        phone1: form.phone1 || null,
        phone2: form.phone2 || null,
        contact_email: form.contact_email || null,
        website_url: form.website_url || null,
        facebook_url: form.facebook_url || null,
        instagram_url: form.instagram_url || null,
        twitter_url: form.twitter_url || null,
        tiktok_url: form.tiktok_url || null,
        whatsapp: form.whatsapp || null,
        is_live: form.is_live,
        external_ticket_url: form.ticketing_mode === "external" ? form.external_ticket_url : null,
        ticketing_mode: form.ticketing_mode,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        updated_at: new Date().toISOString(),
        // Reset to pending so admin re-validates
        status: "pending",
        is_published: false,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      // Create admin notification for the modification
      await supabase.from("admin_notifications").insert({
        event_id: id,
        type: "event_modified",
      });

      toast({ title: "Modification soumise !", description: "Votre modification sera revue par l'administrateur." });
      navigate(`/events/${id}`);
    }
    setSaving(false);
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
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Modifier l'activité</h1>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Après modification, votre activité sera soumise à validation par l'administrateur.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Informations générales</h2>
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Titre *</label>
              <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Catégorie</label>
              <Select value={form.category_id} onValueChange={(v) => handleChange("category_id", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Date/Location */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Date & Lieu</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Date de début *</label>
                <Input type="datetime-local" value={form.date} onChange={(e) => handleChange("date", e.target.value)} required />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Date de fin</label>
                <Input type="datetime-local" value={form.end_date} onChange={(e) => handleChange("end_date", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Lieu *</label>
                <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} required />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Ville *</label>
                <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Latitude</label>
                <Input value={form.latitude} onChange={(e) => handleChange("latitude", e.target.value)} placeholder="-4.3250" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Longitude</label>
                <Input value={form.longitude} onChange={(e) => handleChange("longitude", e.target.value)} placeholder="15.3222" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Tarification</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Prix</label>
                <Input value={form.price} onChange={(e) => handleChange("price", e.target.value)} placeholder="Gratuit" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Devise</label>
                <Select value={isFree ? "" : form.currency} onValueChange={(v) => handleChange("currency", v)} disabled={isFree}>
                  <SelectTrigger><SelectValue placeholder={isFree ? "—" : "Devise"} /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Capacité</label>
              <Input type="number" value={form.capacity} onChange={(e) => handleChange("capacity", e.target.value)} placeholder="Illimitée" />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Images</h2>
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Image principale</label>
              <ImageUpload value={form.image_url} onChange={(url) => handleChange("image_url", url)} userId={user?.id || ""} />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Image secondaire</label>
              <ImageUpload value={form.image_url2} onChange={(url) => handleChange("image_url2", url)} userId={user?.id || ""} />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Organisateur</label>
                <Input value={form.organizer_name} onChange={(e) => handleChange("organizer_name", e.target.value)} />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Email</label>
                <Input value={form.contact_email} onChange={(e) => handleChange("contact_email", e.target.value)} />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Téléphone 1</label>
                <Input value={form.phone1} onChange={(e) => handleChange("phone1", e.target.value)} />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">WhatsApp</label>
                <Input value={form.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Live */}
          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <Switch checked={form.is_live} onCheckedChange={(v) => handleChange("is_live", v)} />
            <label className="font-body text-sm font-medium text-foreground">Événement en direct (Live)</label>
          </div>

          <Button type="submit" disabled={saving} className="w-full gap-2 gradient-hero text-primary-foreground border-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Soumettre la modification
          </Button>
        </form>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default EditEvent;
