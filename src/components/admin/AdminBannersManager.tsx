import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, Megaphone, Eye, MousePointerClick } from "lucide-react";
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
import { validateBannerUrl } from "@/lib/url-validation";
import BannerPreviewMultiSize from "@/components/admin/BannerPreviewMultiSize";
import BannerHistoryDialog from "@/components/admin/BannerHistoryDialog";

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

const defaultForm = {
  title: "", subtitle: "", body: "", image_url: "", button_label: "", button_url: "",
  bg_color: "#f59e0b", bg_gradient: "", text_color: "#ffffff",
  title_font_size: "2xl", subtitle_font_size: "base", text_animation: "none",
  display_order: 0, is_active: true, is_draft: false,
  width_percent: 100, height_px: null as number | null,
  border_width: 0, border_color: "#000000",
};

const AdminBannersManager = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, { impressions: number; clicks: number }>>({});
  const [form, setForm] = useState({ ...defaultForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchBanners = async () => {
    const { data } = await supabase.from("promotional_banners").select("*").order("display_order");
    setBanners(data || []);
  };

  const fetchStats = async () => {
    const { data } = await supabase.from("banner_analytics").select("banner_id, event_type");
    const acc: Record<string, { impressions: number; clicks: number }> = {};
    (data || []).forEach((row: any) => {
      acc[row.banner_id] = acc[row.banner_id] || { impressions: 0, clicks: 0 };
      if (row.event_type === "click") acc[row.banner_id].clicks++;
      else acc[row.banner_id].impressions++;
    });
    setStats(acc);
  };

  useEffect(() => {
    fetchBanners();
    fetchStats();

    // Realtime analytics
    const channel = supabase
      .channel("banner-analytics-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "banner_analytics" }, (payload: any) => {
        const bid = payload.new.banner_id;
        const type = payload.new.event_type;
        setStats((prev) => {
          const cur = prev[bid] || { impressions: 0, clicks: 0 };
          return { ...prev, [bid]: { impressions: cur.impressions + (type === "click" ? 0 : 1), clicks: cur.clicks + (type === "click" ? 1 : 0) } };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeCount = banners.filter(b => b.is_active && !b.is_draft).length;
  const MAX_ACTIVE = 4;

  const saveSnapshot = async (bannerId: string, snapshot: any) => {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("banner_history").insert({
      banner_id: bannerId,
      snapshot,
      changed_by: u?.user?.id || null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Le titre est requis"); return; }

    const urlCheck = validateBannerUrl(form.button_url);
    if (!urlCheck.valid) { toast.error(urlCheck.error || "URL du bouton invalide"); return; }

    const willBeVisible = form.is_active && !form.is_draft;
    const currentVisibleExcludingSelf = banners.filter(b => b.is_active && !b.is_draft && b.id !== editingId).length;
    if (willBeVisible && currentVisibleExcludingSelf >= MAX_ACTIVE) {
      toast.error(`Maximum ${MAX_ACTIVE} bannières publiées. Désactivez-en une ou passez en brouillon.`);
      return;
    }

    const payload = { ...form };
    let error;
    let savedId = editingId;
    if (editingId) {
      // snapshot previous version before update
      const prev = banners.find(b => b.id === editingId);
      if (prev) await saveSnapshot(editingId, prev);
      ({ error } = await supabase.from("promotional_banners").update(payload).eq("id", editingId));
    } else {
      const { data, error: insErr } = await supabase.from("promotional_banners").insert(payload).select().single();
      error = insErr;
      if (data) savedId = data.id;
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
      text_animation: b.text_animation || "none", display_order: b.display_order || 0,
      is_active: b.is_active, is_draft: b.is_draft || false,
      width_percent: b.width_percent ?? 100, height_px: b.height_px ?? null,
      border_width: b.border_width ?? 0, border_color: b.border_color || "#000000",
    });
    setEditingId(b.id);
    setDialogOpen(true);
  };

  const duplicateBanner = async (b: any) => {
    const { id, created_at, updated_at, ...rest } = b;
    const { error } = await supabase.from("promotional_banners").insert({ ...rest, title: `${rest.title} (copie)`, is_active: false, is_draft: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Bannière dupliquée (en brouillon)");
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from("promotional_banners").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Bannière supprimée");
    fetchBanners();
  };

  const toggleActive = async (id: string, val: boolean) => {
    const banner = banners.find(b => b.id === id);
    if (val && !banner?.is_draft && activeCount >= MAX_ACTIVE) {
      toast.error(`Maximum ${MAX_ACTIVE} bannières publiées.`);
      return;
    }
    await supabase.from("promotional_banners").update({ is_active: val }).eq("id", id);
    fetchBanners();
  };

  const toggleDraft = async (id: string, isDraft: boolean) => {
    if (!isDraft) {
      // publishing a draft → check active count
      const banner = banners.find(b => b.id === id);
      if (banner?.is_active && activeCount >= MAX_ACTIVE) {
        toast.error(`Maximum ${MAX_ACTIVE} bannières publiées. Désactivez-en une d'abord.`);
        return;
      }
    }
    await supabase.from("promotional_banners").update({ is_draft: isDraft }).eq("id", id);
    toast.success(isDraft ? "Passée en brouillon" : "Bannière publiée");
    fetchBanners();
  };

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const otherActiveBanners = banners.filter(b => b.is_active && !b.is_draft && b.id !== editingId).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-display text-base sm:text-lg">
          <span className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Bannières promotionnelles
            <Badge variant={activeCount >= MAX_ACTIVE ? "destructive" : "secondary"} className="text-[10px]">
              {activeCount}/{MAX_ACTIVE} publiées
            </Badge>
          </span>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm({ ...defaultForm }); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Modifier la bannière" : "Nouvelle bannière"}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum 4 bannières publiées. Les brouillons ne s'affichent pas sur l'accueil.
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Titre principal * <span className="text-[10px] text-muted-foreground">({form.title.length}/40)</span></Label>
                    <Input maxLength={40} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Créez votre événement" />
                  </div>
                  <div>
                    <Label>Sous-titre <span className="text-[10px] text-muted-foreground">({form.subtitle.length}/25)</span></Label>
                    <Input maxLength={25} value={form.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="Ex: Organisateurs" />
                  </div>
                </div>

                <div>
                  <Label>Texte du corps <span className="text-[10px] text-muted-foreground">({form.body.length}/140)</span></Label>
                  <Textarea maxLength={140} value={form.body} onChange={e => set("body", e.target.value)} rows={2} placeholder="Description courte (3 lignes max)..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Libellé du bouton <span className="text-[10px] text-muted-foreground">({form.button_label.length}/20)</span></Label>
                    <Input maxLength={20} value={form.button_label} onChange={e => set("button_label", e.target.value)} placeholder="Ex: Commencer" />
                  </div>
                  <div>
                    <Label>Lien du bouton</Label>
                    <Input value={form.button_url} onChange={e => set("button_url", e.target.value)} placeholder="/events ou https://..." />
                    {form.button_url && !validateBannerUrl(form.button_url).valid && (
                      <p className="text-[11px] text-destructive mt-1">{validateBannerUrl(form.button_url).error}</p>
                    )}
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

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label>Largeur (%)</Label>
                    <Input type="number" min={20} max={100} value={form.width_percent} onChange={e => set("width_percent", Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Hauteur (px)</Label>
                    <Input type="number" min={0} value={form.height_px ?? ""} onChange={e => set("height_px", e.target.value ? Number(e.target.value) : null)} placeholder="Auto" />
                  </div>
                  <div>
                    <Label>Bordure (px)</Label>
                    <Input type="number" min={0} max={10} value={form.border_width} onChange={e => set("border_width", Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Couleur bordure</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <input type="color" value={form.border_color} onChange={e => set("border_color", e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Active + draft switches */}
                <div className="flex items-center gap-6 rounded-lg bg-muted/30 p-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Switch checked={form.is_draft} onCheckedChange={(v) => set("is_draft", v)} />
                    Brouillon (non visible sur l'accueil)
                  </label>
                </div>

                {/* Multi-size preview */}
                <div>
                  <Label className="mb-2 block">Aperçu temps réel — multi-écrans</Label>
                  <BannerPreviewMultiSize current={form} others={otherActiveBanners} />
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
          {banners.map(b => {
            const s = stats[b.id] || { impressions: 0, clicks: 0 };
            const ctr = s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(1) : "0.0";
            return (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-16 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: b.bg_gradient ? undefined : (b.bg_color || "#f59e0b"), backgroundImage: b.bg_gradient || undefined }}>
                    {b.image_url && <img src={b.image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">{b.title}</p>
                    <p className="font-body text-[10px] text-muted-foreground truncate">{b.button_url || "Pas de lien"}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {s.impressions}
                      </span>
                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" /> {s.clicks}
                      </span>
                      <span className="text-[10px] text-muted-foreground">CTR {ctr}%</span>
                    </div>
                  </div>
                  {b.is_draft ? (
                    <Badge variant="outline" className="text-[10px] border-secondary text-muted-foreground">Brouillon</Badge>
                  ) : (
                    <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px]">{b.is_active ? "Publiée" : "Inactive"}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground mr-1">
                    <Switch checked={!b.is_draft} onCheckedChange={(v) => toggleDraft(b.id, !v)} />
                    Publié
                  </label>
                  <Switch checked={b.is_active} onCheckedChange={(v) => toggleActive(b.id, v)} />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(b)} title="Modifier"><Edit2 className="h-4 w-4" /></Button>
                  <BannerHistoryDialog bannerId={b.id} onRestored={fetchBanners} />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => duplicateBanner(b)} title="Dupliquer"><Plus className="h-4 w-4 text-primary" /></Button>
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBannersManager;
