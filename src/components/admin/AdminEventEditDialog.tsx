import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      date: toDateTimeLocal(event.date),
      end_date: toDateTimeLocal(event.end_date),
      location: event.location || "",
      city: event.city || "",
      price: event.price || "",
      currency: event.currency || "FCFA",
      visibility: event.visibility || "public",
      status: event.status || "pending",
      is_published: event.is_published ? "true" : "false",
      is_live: event.is_live ? "true" : "false",
      image_url: event.image_url || "",
      image_url2: event.image_url2 || "",
      ticketing_mode: event.ticketing_mode || "none",
      external_ticket_url: event.external_ticket_url || "",
      reservation_cta_label: event.reservation_cta_label || "Réserver",
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

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("events")
      .update({
        title: form.title,
        description: form.description || null,
        category_id: form.category_id || null,
        organizer_name: form.organizer_name || null,
        date: new Date(form.date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        location: form.location,
        city: form.city,
        price: form.price || null,
        currency: form.currency,
        visibility: form.visibility,
        status: form.status,
        is_published: form.is_published === "true",
        is_live: form.is_live === "true",
        image_url: form.image_url || null,
        image_url2: form.image_url2 || null,
        ticketing_mode: form.ticketing_mode,
        external_ticket_url: form.ticketing_mode === "external" ? form.external_ticket_url || null : null,
        reservation_cta_label: form.ticketing_mode === "external" ? form.reservation_cta_label || "Réserver" : "Réserver",
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
            Corrigez les fautes, ajustez la publication, la visibilité et le lien de réservation externe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Titre</Label>
            <Input value={form.title} onChange={(event) => handleChange("title", event.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(event) => handleChange("description", event.target.value)} rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={form.category_id || "none"} onValueChange={(value) => handleChange("category_id", value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Organisateur</Label>
            <Input value={form.organizer_name} onChange={(event) => handleChange("organizer_name", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Date début</Label>
            <Input type="datetime-local" value={form.date} onChange={(event) => handleChange("date", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Date fin</Label>
            <Input type="datetime-local" value={form.end_date} onChange={(event) => handleChange("end_date", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Lieu</Label>
            <Input value={form.location} onChange={(event) => handleChange("location", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Ville</Label>
            <Input value={form.city} onChange={(event) => handleChange("city", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Prix affiché</Label>
            <Input value={form.price} onChange={(event) => handleChange("price", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Devise</Label>
            <Input value={form.currency} onChange={(event) => handleChange("currency", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Visibilité</Label>
            <Select value={form.visibility} onValueChange={(value) => handleChange("visibility", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Publique</SelectItem>
                <SelectItem value="private">Privée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvée</SelectItem>
                <SelectItem value="rejected">Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Publication</Label>
            <Select value={form.is_published} onValueChange={(value) => handleChange("is_published", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Publiée</SelectItem>
                <SelectItem value="false">Non publiée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Live</Label>
            <Select value={form.is_live} onValueChange={(value) => handleChange("is_live", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Image principale (URL)</Label>
            <Input value={form.image_url} onChange={(event) => handleChange("image_url", event.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Image secondaire (URL)</Label>
            <Input value={form.image_url2} onChange={(event) => handleChange("image_url2", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Réservation</Label>
            <Select value={form.ticketing_mode} onValueChange={(value) => handleChange("ticketing_mode", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Pas de réservation</SelectItem>
                <SelectItem value="external">Lien externe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Libellé du bouton</Label>
            <Input value={form.reservation_cta_label} onChange={(event) => handleChange("reservation_cta_label", event.target.value)} />
          </div>

          {form.ticketing_mode === "external" && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Lien de réservation externe</Label>
              <Input value={form.external_ticket_url} onChange={(event) => handleChange("external_ticket_url", event.target.value)} placeholder="https://www.eventbrite.com/..." />
            </div>
          )}
        </div>

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
