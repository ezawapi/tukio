import { type ChangeEvent, useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Upload, Pencil, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateBannerUrl } from "@/lib/url-validation";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminPartnersManager = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Partner>>({});
  const [editUploading, setEditUploading] = useState(false);

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("*").order("display_order");
    setPartners((data as Partner[]) || []);
  };

  useEffect(() => { fetchPartners(); }, []);

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) { toast.error("Sélectionnez une image"); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Logo > 5MB"); return null; }
    const ext = file.name.split(".").pop() || "png";
    const path = `partners/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from("event-images").getPublicUrl(path).data.publicUrl;
  };

  const uploadLocalLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const url = await uploadLogo(file);
    if (url) { setLogoUrl(url); toast.success("Logo importé"); }
    setUploadingLogo(false);
    event.target.value = "";
  };

  const uploadEditLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditUploading(true);
    const url = await uploadLogo(file);
    if (url) setEditForm((f) => ({ ...f, logo_url: url }));
    setEditUploading(false);
    event.target.value = "";
  };

  const addPartner = async () => {
    if (!name || !logoUrl) { toast.error("Nom et logo requis"); return; }
    const v = validateBannerUrl(websiteUrl);
    if (!v.valid) { toast.error(v.error!); return; }
    setLoading(true);
    const { error } = await supabase.from("partners").insert({
      name, logo_url: logoUrl, website_url: websiteUrl || null,
      display_order: partners.length,
    });
    if (error) toast.error(error.message);
    else { toast.success("Partenaire ajouté"); setName(""); setLogoUrl(""); setWebsiteUrl(""); fetchPartners(); }
    setLoading(false);
  };

  const startEdit = (p: Partner) => {
    setEditId(p.id);
    setEditForm({ name: p.name, logo_url: p.logo_url, website_url: p.website_url || "", display_order: p.display_order });
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editId) return;
    if (!editForm.name || !editForm.logo_url) { toast.error("Nom et logo requis"); return; }
    const v = validateBannerUrl(editForm.website_url || "");
    if (!v.valid) { toast.error(v.error!); return; }
    const { error } = await supabase.from("partners").update({
      name: editForm.name,
      logo_url: editForm.logo_url,
      website_url: editForm.website_url || null,
      display_order: editForm.display_order ?? 0,
    }).eq("id", editId);
    if (error) { toast.error(error.message); return; }
    toast.success("Partenaire mis à jour");
    cancelEdit();
    fetchPartners();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("partners").update({ is_active: !current }).eq("id", id);
    fetchPartners();
  };

  const deletePartner = async (id: string) => {
    await supabase.from("partners").delete().eq("id", id);
    toast.success("Partenaire supprimé");
    fetchPartners();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Ajouter un partenaire</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du partenaire" /></div>
            <div><Label>Logo (URL)</Label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." /></div>
            <div>
              <Label className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Logo local</Label>
              <Input type="file" accept="image/*" onChange={uploadLocalLogo} disabled={uploadingLogo} />
            </div>
            <div><Label>Site web</Label><Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." /></div>
          </div>
          {uploadingLogo ? <p className="text-xs text-muted-foreground">Import en cours...</p> : null}
          <Button onClick={addPartner} disabled={loading} className="gradient-hero border-0 text-primary-foreground">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Partenaires ({partners.length})</CardTitle></CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">Aucun partenaire enregistré.</p>
          ) : (
            <div className="space-y-3">
              {partners.map((p) => {
                const isEditing = editId === p.id;
                return (
                  <div key={p.id} className="rounded-xl border border-border p-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <Label className="text-xs">Nom</Label>
                            <Input value={editForm.name || ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                          </div>
                          <div>
                            <Label className="text-xs">Logo (URL)</Label>
                            <Input value={editForm.logo_url || ""} onChange={(e) => setEditForm((f) => ({ ...f, logo_url: e.target.value }))} />
                          </div>
                          <div>
                            <Label className="text-xs flex items-center gap-1"><Upload className="h-3 w-3" /> Logo local</Label>
                            <Input type="file" accept="image/*" onChange={uploadEditLogo} disabled={editUploading} />
                          </div>
                          <div>
                            <Label className="text-xs">Site web</Label>
                            <Input value={editForm.website_url || ""} onChange={(e) => setEditForm((f) => ({ ...f, website_url: e.target.value }))} placeholder="https://..." />
                          </div>
                          <div>
                            <Label className="text-xs">Ordre d'affichage</Label>
                            <Input type="number" value={editForm.display_order ?? 0} onChange={(e) => setEditForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {editForm.logo_url && (
                            <img src={editForm.logo_url} alt="preview" className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                          )}
                          <div className="ml-auto flex gap-2">
                            <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /> Annuler</Button>
                            <Button size="sm" onClick={saveEdit} disabled={editUploading} className="gradient-hero border-0 text-primary-foreground">
                              <Save className="h-4 w-4" /> Enregistrer
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <img src={p.logo_url} alt={p.name} className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-foreground truncate">{p.name}</p>
                          {p.website_url && (
                            <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-primary flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> {p.website_url}
                            </a>
                          )}
                        </div>
                        <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                        <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePartner(p.id)} title="Supprimer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPartnersManager;
