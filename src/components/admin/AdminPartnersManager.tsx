import { type ChangeEvent, useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("*").order("display_order");
    setPartners((data as Partner[]) || []);
  };

  useEffect(() => { fetchPartners(); }, []);

  const uploadLocalLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Sélectionnez une image (PNG, JPG, GIF, WEBP)");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le logo ne doit pas dépasser 5MB");
      event.target.value = "";
      return;
    }

    setUploadingLogo(true);
    const extension = file.name.split(".").pop() || "png";
    const path = `partners/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("event-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error(error.message);
      setUploadingLogo(false);
      event.target.value = "";
      return;
    }

    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    toast.success("Logo local importé");
    setUploadingLogo(false);
    event.target.value = "";
  };

  const addPartner = async () => {
    if (!name || !logoUrl) { toast.error("Nom et URL du logo requis"); return; }
    setLoading(true);
    const { error } = await supabase.from("partners").insert({
      name, logo_url: logoUrl, website_url: websiteUrl || null,
      display_order: partners.length,
    });
    if (error) toast.error(error.message);
    else { toast.success("Partenaire ajouté"); setName(""); setLogoUrl(""); setWebsiteUrl(""); fetchPartners(); }
    setLoading(false);
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
              <p className="mt-1 text-xs text-muted-foreground">Téléversez une image locale ou utilisez une URL.</p>
            </div>
            <div><Label>Site web</Label><Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." /></div>
          </div>
          {uploadingLogo ? <p className="text-xs text-muted-foreground">Import du logo en cours...</p> : null}
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
              {partners.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border p-3">
                  <img src={p.logo_url} alt={p.name} className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-foreground truncate">{p.name}</p>
                    {p.website_url && (
                      <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-primary flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Site web
                      </a>
                    )}
                  </div>
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                  <Button variant="ghost" size="icon" onClick={() => deletePartner(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPartnersManager;
