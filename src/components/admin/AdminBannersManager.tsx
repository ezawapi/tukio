import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, Eye, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TEXT_ANIMATIONS = [
  { value: "none", label: "Aucune" },
  { value: "fade-in", label: "Fondu" },
  { value: "slide-up", label: "Glissement haut" },
  { value: "slide-left", label: "Glissement gauche" },
  { value: "pulse", label: "Pulsation" },
  { value: "bounce", label: "Rebond" },
];

const GRADIENT_PRESETS = [
  { label: "Aucun", value: "" },
  { label: "Or chaud", value: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
  { label: "Bleu océan", value: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
  { label: "Coucher de soleil", value: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" },
  { label: "Forêt", value: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)" },
  { label: "Violet royal", value: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" },
  { label: "Rose doux", value: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" },
  { label: "Nuit étoilée", value: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" },
  { label: "Turquoise", value: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" },
];

const FONT_SIZES = [
  { value: "lg", label: "Petit" },
  { value: "xl", label: "Moyen" },
  { value: "2xl", label: "Grand" },
  { value: "3xl", label: "Très grand" },
  { value: "4xl", label: "Extra grand" },
];

const getAnimationClass = (anim: string) => {
  switch (anim) {
    case "fade-in": return "animate-[fade-in_1.5s_ease-out]";
    case "slide-up": return "animate-[slideUp_1s_ease-out]";
    case "slide-left": return "animate-[slideLeft_1s_ease-out]";
    case "pulse": return "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]";
    case "bounce": return "animate-bounce";
    default: return "";
  }
};

const defaultForm = {
  title: "", subtitle: "", body: "", image_url: "", button_label: "", button_url: "",
  bg_color: "#f59e0b", bg_gradient: "", text_color: "#ffffff",
  title_font_size: "2xl", subtitle_font_size: "base", text_animation: "none",
  display_order: 0, is_active: true,
  width_percent: 100, height_px: null as number | null,
  border_width: 0, border_color: "#000000",
};

const AdminBannersManager = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [form, setForm] = useState({ ...defaultForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchBanners = async () => {
    const { data } = await supabase.from("promotional_banners").select("*").order("display_order");
    setBanners(data || []);
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Le titre est requis"); return; }

    const payload = { ...form };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("promotional_banners").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("promotional_banners").insert(payload));
    }
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Bannière modifiée" : "Bannière créée");
    setForm({ ...defaultForm });
    setEditingId(null);
    setDialogOpen(false);
    fetchBanners();
  };

  const startEdit = (b: any) => {
    setForm({
      title: b.title || "", subtitle: b.subtitle || "", body: b.body || "",
      image_url: b.image_url || "", button_label: b.button_label || "", button_url: b.button_url || "",
      bg_color: b.bg_color || "#f59e0b", bg_gradient: b.bg_gradient || "", text_color: b.text_color || "#ffffff",
      title_font_size: b.title_font_size || "2xl", subtitle_font_size: b.subtitle_font_size || "base",
      text_animation: b.text_animation || "none", display_order: b.display_order || 0, is_active: b.is_active,
      width_percent: b.width_percent ?? 100, height_px: b.height_px ?? null,
      border_width: b.border_width ?? 0, border_color: b.border_color || "#000000",
    });
    setEditingId(b.id);
    setDialogOpen(true);
  };

  const duplicateBanner = async (b: any) => {
    const { id, created_at, updated_at, ...rest } = b;
    const { error } = await supabase.from("promotional_banners").insert({ ...rest, title: `${rest.title} (copie)`, is_active: false });
    if (error) { toast.error(error.message); return; }
    toast.success("Bannière dupliquée");
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from("promotional_banners").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Bannière supprimée");
    fetchBanners();
  };

  const toggleActive = async (id: string, val: boolean) => {
    await supabase.from("promotional_banners").update({ is_active: val }).eq("id", id);
    fetchBanners();
  };

  const bannerStyle: React.CSSProperties = {
    backgroundColor: form.bg_gradient ? undefined : (form.bg_color || "#f59e0b"),
    backgroundImage: form.bg_gradient || undefined,
    color: form.text_color || "#ffffff",
  };

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-display text-base sm:text-lg">
          <span className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Bannières promotionnelles ({banners.length})</span>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm({ ...defaultForm }); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Modifier la bannière" : "Nouvelle bannière"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Titre principal *</Label>
                    <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Votre titre ici" />
                  </div>
                  <div>
                    <Label>Sous-titre</Label>
                    <Input value={form.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="Sous-titre optionnel" />
                  </div>
                </div>

                <div>
                  <Label>Texte du corps</Label>
                  <Textarea value={form.body} onChange={e => set("body", e.target.value)} rows={2} placeholder="Description ou texte promotionnel..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Libellé du bouton</Label>
                    <Input value={form.button_label} onChange={e => set("button_label", e.target.value)} placeholder="Ex: Découvrir" />
                  </div>
                  <div>
                    <Label>Lien du bouton</Label>
                    <Input value={form.button_url} onChange={e => set("button_url", e.target.value)} placeholder="/events ou https://..." />
                  </div>
                </div>

                <div>
                  <Label>Image (optionnelle)</Label>
                  <Input value={form.image_url} onChange={e => set("image_url", e.target.value)} placeholder="URL de l'image" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Couleur de fond</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.bg_color} onChange={e => set("bg_color", e.target.value)} className="h-8 w-10 rounded cursor-pointer" />
                      <Input value={form.bg_color} onChange={e => set("bg_color", e.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Couleur du texte</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.text_color} onChange={e => set("text_color", e.target.value)} className="h-8 w-10 rounded cursor-pointer" />
                      <Input value={form.text_color} onChange={e => set("text_color", e.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Ordre</Label>
                    <Input type="number" value={form.display_order} onChange={e => set("display_order", Number(e.target.value))} className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label>Dégradé de fond</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {GRADIENT_PRESETS.map(g => (
                      <button key={g.label} type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${form.bg_gradient === g.value ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                        style={{ background: g.value || form.bg_color }}
                        title={g.label}
                        onClick={() => set("bg_gradient", g.value)} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Taille du titre</Label>
                    <Select value={form.title_font_size} onValueChange={v => set("title_font_size", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Taille sous-titre</Label>
                    <Select value={form.subtitle_font_size} onValueChange={v => set("subtitle_font_size", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Animation texte</Label>
                    <Select value={form.text_animation} onValueChange={v => set("text_animation", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TEXT_ANIMATIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <Label className="mb-2 block">Aperçu</Label>
                  <div className="overflow-hidden rounded-2xl p-6 relative" style={bannerStyle}>
                    {form.bg_gradient && <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />}
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        {form.subtitle && <p className={`text-sm opacity-80 ${getAnimationClass(form.text_animation)}`}>{form.subtitle}</p>}
                        <h3 className={`font-display font-bold text-${form.title_font_size} ${getAnimationClass(form.text_animation)}`}>{form.title || "Titre"}</h3>
                        {form.body && <p className={`text-${form.subtitle_font_size} opacity-90 ${getAnimationClass(form.text_animation)}`}>{form.body}</p>}
                        {form.button_label && (
                          <span className="inline-block mt-2 px-5 py-2 rounded-lg font-semibold text-sm border-2 border-current/30" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                            {form.button_label}
                          </span>
                        )}
                      </div>
                      {form.image_url && (
                        <img src={form.image_url} alt="" className="h-20 w-20 rounded-xl object-cover shadow-lg flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setForm({ ...defaultForm }); setEditingId(null); }}>Annuler</Button>
                  <Button type="submit" className="gap-1"><Save className="h-4 w-4" /> {editingId ? "Modifier" : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {banners.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucune bannière créée.</p>}
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-10 w-16 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: b.bg_gradient ? undefined : (b.bg_color || "#f59e0b"), backgroundImage: b.bg_gradient || undefined }}>
                  {b.image_url && <img src={b.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">{b.title}</p>
                  <p className="font-body text-[10px] text-muted-foreground truncate">{b.button_url || "Pas de lien"}</p>
                </div>
                <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px]">{b.is_active ? "Actif" : "Inactif"}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={b.is_active} onCheckedChange={(v) => toggleActive(b.id, v)} />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(b)}><Edit2 className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cette bannière ?</AlertDialogTitle>
                      <AlertDialogDescription>La bannière « {b.title} » sera supprimée définitivement.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteBanner(b.id)} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBannersManager;
