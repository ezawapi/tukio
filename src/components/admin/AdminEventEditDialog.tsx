import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EventFormFields from "@/components/EventFormFields";

interface AdminEventEditDialogProps {
  event: any;
  onSaved: () => void;
}

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60 * 1000);
  return normalized.toISOString().slice(0, 16);
};

const AdminEventEditDialog = ({ event, onSaved }: AdminEventEditDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const initialForm = useMemo(
    () => ({
      title: event.title || "",
      description: event.description || "",
      category_id: event.category_id || "",
      organizer_name: event.organizer_name || "",
      organizer_logo_url: event.organizer_logo_url || "",
      date: toDateTimeLocal(event.date),
      end_date: toDateTimeLocal(event.end_date),
      location: event.location || "",
      venue_name: event.venue_name || "",
      city: event.city || "",
      price: event.price || "",
      currency: event.currency || "FCFA",
      capacity: event.capacity?.toString() || "",
      visibility: event.visibility || "public",
      status: event.status || "pending",
      is_published: event.is_published || false,
      is_live: event.is_live || false,
      live_url: event.live_url || "",
      image_url: event.image_url || "",
      image_url2: event.image_url2 || "",
      ticketing_mode: event.ticketing_mode || "none",
      external_ticket_url: event.external_ticket_url || "",
      reservation_cta_label: event.reservation_cta_label || "Réserver",
      phone1: event.phone1 || "",
      phone2: event.phone2 || "",
      whatsapp: event.whatsapp || "",
      contact_email: event.contact_email || "",
      website_url: event.website_url || "",
      facebook_url: event.facebook_url || "",
      instagram_url: event.instagram_url || "",
      twitter_url: event.twitter_url || "",
      tiktok_url: event.tiktok_url || "",
      latitude: event.latitude?.toString() || "",
      longitude: event.longitude?.toString() || "",
    }),
    [event],
  );

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      setCategories(data || []);
    };
    fetchCategories();
  }, [initialForm, open]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const isFree = !form.price || form.price === "Gratuit" || form.price === "0";
    const { error } = await supabase
      .from("events")
      .update({
        title: form.title,
        description: form.description || null,
        category_id: form.category_id || null,
        organizer_name: form.organizer_name || null,
        organizer_logo_url: form.organizer_logo_url || null,
        date: new Date(form.date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        location: form.location,
        city: form.city,
        price: isFree ? "Gratuit" : form.price,
        currency: isFree ? "FCFA" : form.currency,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        visibility: form.visibility,
        status: form.status,
        is_published: form.is_published === true || form.is_published === "true",
        is_live: form.is_live === true || form.is_live === "true",
        image_url: form.image_url || null,
        image_url2: form.image_url2 || null,
        ticketing_mode: form.ticketing_mode,
        external_ticket_url: form.ticketing_mode === "external" ? form.external_ticket_url || null : null,
        reservation_cta_label: form.ticketing_mode === "external" ? form.reservation_cta_label || "Réserver" : "Réserver",
        phone1: form.phone1 || null,
        phone2: form.phone2 || null,
        whatsapp: form.whatsapp || null,
        contact_email: form.contact_email || null,
        website_url: form.website_url || null,
        facebook_url: form.facebook_url || null,
        instagram_url: form.instagram_url || null,
        twitter_url: form.twitter_url || null,
        tiktok_url: form.tiktok_url || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        updated_by_admin: true,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    setSaving(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Activité mise à jour" });
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Modifier l'activité">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-background">
        <DialogHeader>
          <DialogTitle>Modifier l'activité</DialogTitle>
          <DialogDescription>
            Corrigez les fautes, ajustez la publication, la visibilité et tous les détails de l'événement.
          </DialogDescription>
        </DialogHeader>

        <EventFormFields
          form={form}
          categories={categories}
          onChange={handleChange}
          showAdminFields
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" className="gradient-hero border-0 text-primary-foreground" onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEventEditDialog;
