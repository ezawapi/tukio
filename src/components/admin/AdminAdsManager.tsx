import { useEffect, useMemo, useState } from "react";
import { Trash2, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdMedia from "@/components/AdMedia";
import ImageUpload from "@/components/ImageUpload";

interface AdminAdsManagerProps {
  userId?: string;
}

const TEXT_ANIMATIONS = [
  { value: "none", label: "Aucune" },
  { value: "fade-in", label: "Fondu" },
  { value: "slide-up", label: "Glisser vers le haut" },
  { value: "slide-left", label: "Glisser depuis la gauche" },
  { value: "pulse", label: "Pulsation" },
  { value: "bounce", label: "Rebond" },
  { value: "typewriter", label: "Machine à écrire" },
];

const GRADIENT_PRESETS = [
  { value: "", label: "Aucun" },
  { value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", label: "Violet → Indigo" },
  { value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", label: "Rose → Rouge" },
  { value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", label: "Bleu → Cyan" },
  { value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", label: "Vert → Turquoise" },
  { value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", label: "Rose → Or" },
  { value: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", label: "Lavande → Rose" },
  { value: "linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)", label: "Bleu profond" },
  { value: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)", label: "Or → Rouge" },
  { value: "linear-gradient(135deg, #2b5876 0%, #4e4376 100%)", label: "Sombre élégant" },
];

const defaultForm = {
  title: "",
  body: "",
  cta_label: "",
  image_url: "",
  target_url: "",
  display_order: "0",
  starts_at: "",
  ends_at: "",
  is_active: "true",
  text_color: "#ffffff",
  bg_color: "",
  bg_gradient: "",
  text_animation: "none",
};

const getAnimationClass = (anim: string) => {
  switch (anim) {
    case "fade-in": return "animate-[fade-in_1.5s_ease-out]";
    case "slide-up": return "animate-[slideUp_1s_ease-out]";
    case "slide-left": return "animate-[slideLeft_1s_ease-out]";
    case "pulse": return "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]";
    case "bounce": return "animate-bounce";
    case "typewriter": return "animate-[typewriter_3s_steps(40)]";
    default: return "";
  }
};

const AdminAdsManager = ({ userId }: AdminAdsManagerProps) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  const fetchData = async () => {
    const [{ data: slotData }, { data: adData }] = await Promise.all([
      supabase.from("ad_slots").select("id, name, code, placement, recommended_width, recommended_height").order("name"),
      supabase
        .from("ads")
        .select("id, title, body, cta_label, image_url, target_url, display_order, starts_at, ends_at, is_active, text_color, bg_color, bg_gradient, text_animation, slot_id, ad_slots(name, code, recommended_width, recommended_height)")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);
    setSlots(slotData || []);
    setAds(adData || []);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedSlots = useMemo(
    () => slots.filter((slot) => selectedSlotIds.includes(slot.id)),
    [slots, selectedSlotIds],
  );

  const handleSlotCheckedChange = (slotId: string, checked: boolean) => {
    setSelectedSlotIds((prev) => checked ? [...new Set([...prev, slotId])] : prev.filter((id) => id !== slotId));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setSelectedSlotIds([]);
    setEditingAdId(null);
  };

  const startEdit = (ad: any) => {
    setEditingAdId(ad.id);
    setForm({
      title: ad.title || "",
      body: ad.body || "",
      cta_label: ad.cta_label || "",
      image_url: ad.image_url || "",
      target_url: ad.target_url || "",
      display_order: String(ad.display_order || 0),
      starts_at: ad.starts_at ? new Date(ad.starts_at).toISOString().slice(0, 16) : "",
      ends_at: ad.ends_at ? new Date(ad.ends_at).toISOString().slice(0, 16) : "",
      is_active: ad.is_active ? "true" : "false",
      text_color: ad.text_color || "#ffffff",
      bg_color: ad.bg_color || "",
      bg_gradient: ad.bg_gradient || "",
      text_animation: ad.text_animation || "none",
    });
    setSelectedSlotIds(ad.slot_id ? [ad.slot_id] : []);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedSlotIds.length === 0) {
      toast({ title: "Emplacement requis", variant: "destructive" });
      return;
    }
    if (!form.image_url.trim() && !form.body.trim()) {
      toast({ title: "Contenu requis", description: "Ajoutez une image/vidéo ou un texte.", variant: "destructive" });
      return;
    }

    setSaving(true);

    const basePayload = {
      title: form.title || "Publicité",
      body: form.body.trim() || null,
      cta_label: form.cta_label.trim() || null,
      image_url: form.image_url.trim() || null,
      target_url: form.target_url.trim() || null,
      display_order: Number(form.display_order || 0),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active === "true",
      text_color: form.text_color || "#ffffff",
      bg_color: form.bg_color || null,
      bg_gradient: form.bg_gradient || null,
      text_animation: form.text_animation || "none",
    };

    let error: any;

    if (editingAdId) {
      // Update existing ad
      ({ error } = await supabase.from("ads").update({ ...basePayload, slot_id: selectedSlotIds[0] }).eq("id", editingAdId));
    } else {
      // Insert new ad(s)
      const payload = selectedSlotIds.map((slotId) => ({
        ...basePayload,
        slot_id: slotId,
        created_by: userId || null,
      }));
      ({ error } = await supabase.from("ads").insert(payload));
    }

    setSaving(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: editingAdId ? "Publicité modifiée" : "Publicité ajoutée" });
    resetForm();
    fetchData();
  };

  const toggleAd = async (adId: string, nextValue: boolean) => {
    const { error } = await supabase.from("ads").update({ is_active: nextValue }).eq("id", adId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    fetchData();
  };

  const deleteAd = async (adId: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", adId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Publicité supprimée" });
    if (editingAdId === adId) resetForm();
    fetchData();
  };

  const previewStyle: React.CSSProperties = {
    backgroundColor: form.bg_gradient ? undefined : (form.bg_color || "#1a1a2e"),
    backgroundImage: form.bg_gradient || undefined,
    color: form.text_color || "#ffffff",
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base sm:text-lg">
            {editingAdId ? "✏️ Modifier la publicité" : "Nouvelle publicité / annonce"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">Image, vidéo YouTube, ou zone texte stylisée avec animation.</p>
          {editingAdId && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={resetForm}>
              ← Annuler la modification
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Slots */}
            <div className="space-y-2">
              <Label>Emplacements {editingAdId ? "(1 seul en modification)" : "(multi-choix)"}</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {slots.map((slot) => (
                  <label key={slot.id} htmlFor={`slot-${slot.id}`} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                    <Checkbox id={`slot-${slot.id}`} checked={selectedSlotIds.includes(slot.id)}
                      onCheckedChange={(v) => {
                        if (editingAdId) {
                          setSelectedSlotIds(v === true ? [slot.id] : []);
                        } else {
                          handleSlotCheckedChange(slot.id, v === true);
                        }
                      }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{slot.name}</p>
                      <p className="text-xs text-muted-foreground">{slot.recommended_width || "?"}×{slot.recommended_height || "?"} px</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Titre (interne)</Label>
              <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="Nom interne" />
            </div>

            {/* Image */}
            <ImageUpload value={form.image_url} onChange={(url) => handleChange("image_url", url)}
              userId={userId || "admin"} label="Image ou vidéo YouTube" />

            {/* Body text */}
            <div className="space-y-2">
              <Label>Texte affiché (optionnel)</Label>
              <Textarea value={form.body} onChange={(e) => handleChange("body", e.target.value)}
                placeholder="Texte de l'annonce, slogan, promotion..." rows={3} />
            </div>

            {/* CTA label */}
            <div className="space-y-2">
              <Label>Bouton CTA (optionnel)</Label>
              <Input value={form.cta_label} onChange={(e) => handleChange("cta_label", e.target.value)}
                placeholder="Ex: En savoir plus, Acheter, S'inscrire..." />
            </div>

            {/* Styling section */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-semibold text-foreground">🎨 Style & Animation</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Couleur du texte</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.text_color} onChange={(e) => handleChange("text_color", e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-border" />
                    <Input value={form.text_color} onChange={(e) => handleChange("text_color", e.target.value)}
                      className="h-8 text-xs flex-1" placeholder="#ffffff" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Couleur de fond</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.bg_color || "#1a1a2e"} onChange={(e) => handleChange("bg_color", e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-border" />
                    <Input value={form.bg_color} onChange={(e) => handleChange("bg_color", e.target.value)}
                      className="h-8 text-xs flex-1" placeholder="#1a1a2e" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Dégradé de fond</Label>
                <Select value={form.bg_gradient} onValueChange={(v) => handleChange("bg_gradient", v === "none" ? "" : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Choisir un dégradé" /></SelectTrigger>
                  <SelectContent>
                    {GRADIENT_PRESETS.map((g) => (
                      <SelectItem key={g.value || "none"} value={g.value || "none"}>
                        <div className="flex items-center gap-2">
                          {g.value && <div className="h-4 w-8 rounded" style={{ backgroundImage: g.value }} />}
                          <span>{g.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Animation du texte</Label>
                <Select value={form.text_animation} onValueChange={(v) => handleChange("text_animation", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEXT_ANIMATIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview button */}
            {(form.body || form.image_url) && (
              <Button type="button" variant="outline" size="sm" className="gap-2 w-full" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4" /> Aperçu
              </Button>
            )}

            {/* Link / dates / order */}
            <div className="space-y-2">
              <Label>Lien cible (clic)</Label>
              <Input value={form.target_url} onChange={(e) => handleChange("target_url", e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Début</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => handleChange("starts_at", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => handleChange("ends_at", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ordre</Label>
                <Input type="number" value={form.display_order} onChange={(e) => handleChange("display_order", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.is_active} onValueChange={(v) => handleChange("is_active", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full gradient-hero border-0 text-primary-foreground" disabled={saving}>
              {saving ? "Enregistrement..." : editingAdId ? "Enregistrer les modifications" : "Ajouter la publicité"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Aperçu de l'annonce</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="overflow-hidden rounded-2xl" style={previewStyle}>
              {form.image_url && <AdMedia src={form.image_url} title={form.title} className="h-44" />}
              {form.body && (
                <div className="p-5 space-y-3">
                  <p className={`text-base font-semibold leading-snug ${getAnimationClass(form.text_animation)}`} style={{ color: form.text_color }}>
                    {form.body}
                  </p>
                  {form.cta_label && (
                    <button className="rounded-full bg-white/20 px-5 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
                      style={{ color: form.text_color }}>
                      {form.cta_label}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ads list */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base sm:text-lg">Publicités en base ({ads.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ads.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">Aucune publicité pour le moment.</p>
          ) : (
            ads.map((ad) => (
              <div key={ad.id} className={`rounded-xl border bg-muted/30 p-3 sm:p-4 ${editingAdId === ad.id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-body text-sm font-semibold text-foreground">{ad.title}</h3>
                      <Badge variant={ad.is_active ? "default" : "secondary"} className="text-[10px]">{ad.is_active ? "Active" : "Inactive"}</Badge>
                      <Badge variant="outline" className="text-[10px]">{ad.ad_slots?.name || "Emplacement"}</Badge>
                      {ad.text_animation && ad.text_animation !== "none" && (
                        <Badge variant="outline" className="text-[10px]">✨ {ad.text_animation}</Badge>
                      )}
                    </div>
                    {/* Mini preview */}
                    <div className="overflow-hidden rounded-lg max-w-sm" style={{
                      backgroundColor: ad.bg_gradient ? undefined : (ad.bg_color || undefined),
                      backgroundImage: ad.bg_gradient || undefined,
                    }}>
                      {ad.image_url && <AdMedia src={ad.image_url} title={ad.title} className="max-w-sm" />}
                      {ad.body && (
                        <div className="p-3">
                          <p className={`text-sm font-medium ${getAnimationClass(ad.text_animation || "none")}`}
                            style={{ color: ad.text_color || "#ffffff" }}>{ad.body}</p>
                          {ad.cta_label && (
                            <span className="inline-block mt-1 text-xs px-3 py-1 rounded-full bg-white/20"
                              style={{ color: ad.text_color || "#ffffff" }}>{ad.cta_label}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(ad)} className="text-xs h-8 gap-1">
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </Button>
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
