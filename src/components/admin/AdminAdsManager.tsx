import { useEffect, useMemo, useState } from "react";
import { Trash2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdMedia from "@/components/AdMedia";

interface AdminAdsManagerProps {
  userId?: string;
}

const defaultForm = {
  title: "",
  image_url: "",
  target_url: "",
  display_order: "0",
  starts_at: "",
  ends_at: "",
  is_active: "true",
};

const AdminAdsManager = ({ userId }: AdminAdsManagerProps) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  const fetchData = async () => {
    const [{ data: slotData }, { data: adData }] = await Promise.all([
      supabase.from("ad_slots").select("id, name, code, placement, recommended_width, recommended_height").order("name"),
      supabase
        .from("ads")
        .select("id, title, image_url, target_url, display_order, starts_at, ends_at, is_active, ad_slots(name, code, recommended_width, recommended_height)")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

    setSlots(slotData || []);
    setAds(adData || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedSlots = useMemo(
    () => slots.filter((slot) => selectedSlotIds.includes(slot.id)),
    [slots, selectedSlotIds],
  );

  const handleSlotCheckedChange = (slotId: string, checked: boolean) => {
    setSelectedSlotIds((prev) => {
      if (checked) return [...new Set([...prev, slotId])];
      return prev.filter((id) => id !== slotId);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedSlotIds.length === 0) {
      toast({ title: "Emplacement requis", description: "Choisissez un espace publicitaire.", variant: "destructive" });
      return;
    }
    if (!form.image_url.trim()) {
      toast({ title: "Image requise", description: "Ajoutez une URL d'image (PNG, JPG, GIF) ou un lien YouTube.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = selectedSlotIds.map((slotId) => ({
      slot_id: slotId,
      title: form.title || "Publicité",
      body: null,
      image_url: form.image_url.trim(),
      target_url: form.target_url.trim() || null,
      cta_label: null,
      display_order: Number(form.display_order || 0),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active === "true",
      created_by: userId || null,
    }));

    const { error } = await supabase.from("ads").insert(payload);
    setSaving(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Publicité ajoutée" });
    setForm(defaultForm);
    setSelectedSlotIds([]);
    fetchData();
  };

  const toggleAd = async (adId: string, nextValue: boolean) => {
    const { error } = await supabase.from("ads").update({ is_active: nextValue }).eq("id", adId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    fetchData();
  };

  const deleteAd = async (adId: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", adId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Publicité supprimée" });
    fetchData();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base sm:text-lg">Nouvelle publicité</CardTitle>
          <p className="text-xs text-muted-foreground">Seules les images (PNG, JPG, GIF) ou vidéos YouTube sont affichées.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Emplacements (multi-choix)</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {slots.map((slot) => {
                  const checked = selectedSlotIds.includes(slot.id);

                  return (
                    <label
                      key={slot.id}
                      htmlFor={`slot-${slot.id}`}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`slot-${slot.id}`}
                        checked={checked}
                        onCheckedChange={(value) => handleSlotCheckedChange(slot.id, value === true)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{slot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.recommended_width || "?"}×{slot.recommended_height || "?"} px · {slot.placement}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {selectedSlots.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sélection : {selectedSlots.map((slot) => slot.code).join(", ")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Cochez un ou plusieurs emplacements selon leurs tailles recommandées.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Titre (interne)</Label>
              <Input value={form.title} onChange={(event) => handleChange("title", event.target.value)} placeholder="Nom de la pub" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> Image ou vidéo YouTube *</Label>
              <Input value={form.image_url} onChange={(event) => handleChange("image_url", event.target.value)} placeholder="https://... (.png, .jpg, .gif ou youtube)" required />
            </div>

            <div className="space-y-2">
              <Label>Lien cible (clic)</Label>
              <Input value={form.target_url} onChange={(event) => handleChange("target_url", event.target.value)} placeholder="https://..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Début</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(event) => handleChange("starts_at", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(event) => handleChange("ends_at", event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ordre</Label>
                <Input type="number" value={form.display_order} onChange={(event) => handleChange("display_order", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.is_active} onValueChange={(value) => handleChange("is_active", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full gradient-hero border-0 text-primary-foreground" disabled={saving}>
              {saving ? "Enregistrement..." : "Ajouter la publicité"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base sm:text-lg">Publicités en base ({ads.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ads.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">Aucune publicité pour le moment.</p>
          ) : (
            ads.map((ad) => (
              <div key={ad.id} className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-body text-sm font-semibold text-foreground">{ad.title}</h3>
                      <Badge variant={ad.is_active ? "default" : "secondary"} className="text-[10px]">{ad.is_active ? "Active" : "Inactive"}</Badge>
                      <Badge variant="outline" className="text-[10px]">{ad.ad_slots?.name || "Emplacement"}</Badge>
                    </div>
                    {ad.image_url && (
                      <AdMedia src={ad.image_url} title={ad.title} className="max-w-sm" />
                    )}
                    <p className="font-body text-xs text-muted-foreground">
                      Format : {ad.ad_slots?.recommended_width || "?"}×{ad.ad_slots?.recommended_height || "?"}px
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleAd(ad.id, !ad.is_active)} className="text-xs h-8">
                      {ad.is_active ? "Désactiver" : "Activer"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteAd(ad.id)} className="h-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAdsManager;
