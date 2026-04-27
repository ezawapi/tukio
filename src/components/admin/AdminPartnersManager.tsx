import { type ChangeEvent, useEffect, useState, useCallback } from "react";
import { Plus, Trash2, ExternalLink, Upload, Pencil, X, Save, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateBannerUrl } from "@/lib/url-validation";
import PaginationControls from "@/components/PaginationControls";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

type SortKey = "order" | "name" | "recent";
type StatusFilter = "all" | "active" | "inactive";
const ITEMS_PER_PAGE = 10;

interface FormErrors {
  name?: string;
  logo?: string;
  website?: string;
  order?: string;
}

const SORT_COLUMN: Record<SortKey, { col: string; asc: boolean }> = {
  order: { col: "display_order", asc: true },
  name: { col: "name", asc: true },
  recent: { col: "created_at", asc: false },
};

const validatePartnerForm = (data: {
  name?: string;
  logo_url?: string;
  website_url?: string;
  display_order?: number | string;
}): FormErrors => {
  const errs: FormErrors = {};
  if (!data.name || !data.name.trim()) errs.name = "Le nom est requis.";
  else if (data.name.length > 80) errs.name = "Maximum 80 caractères.";

  if (!data.logo_url || !data.logo_url.trim()) errs.logo = "Le logo est requis.";
  else {
    const v = validateBannerUrl(data.logo_url);
    if (!v.valid) errs.logo = v.error;
  }

  if (data.website_url && data.website_url.trim()) {
    const v = validateBannerUrl(data.website_url);
    if (!v.valid) errs.website = v.error;
  }

  const order = typeof data.display_order === "string" ? Number(data.display_order) : data.display_order;
  if (order !== undefined && order !== null) {
    if (!Number.isFinite(order) || Number.isNaN(order)) errs.order = "L'ordre doit être un nombre.";
    else if (order < 0) errs.order = "L'ordre doit être positif.";
    else if (!Number.isInteger(order)) errs.order = "L'ordre doit être un entier.";
  }
  return errs;
};

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[11px] text-destructive mt-1">{msg}</p> : null;

/**
 * Map a server-side validation error from the partners trigger to a per-field
 * FormErrors object. Falls back to a generic toast.
 */
const mapServerError = (error: { message?: string } | null | undefined): FormErrors | null => {
  if (!error?.message) return null;
  const msg = error.message;
  const m = msg.match(/Champ\s+(\w+)\s+invalide\s*:\s*([^]+)$/i);
  if (!m) return null;
  const field = m[1];
  const reason = m[2].trim();
  if (field === "logo_url") return { logo: reason };
  if (field === "website_url") return { website: reason };
  return null;
};

const AdminPartnersManager = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // Create form
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Partner>>({});
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [editUploading, setEditUploading] = useState(false);

  // Filters & sort & pagination (server-side)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(false);

  const fetchPartners = useCallback(async () => {
    setFetching(true);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    const { col, asc } = SORT_COLUMN[sortKey];

    let query = supabase
      .from("partners")
      .select("*", { count: "exact" })
      .order(col, { ascending: asc })
      .range(from, to);

    if (statusFilter === "active") query = query.eq("is_active", true);
    else if (statusFilter === "inactive") query = query.eq("is_active", false);

    const { data, count, error } = await query;
    if (error) toast.error(error.message);
    setPartners((data as Partner[]) || []);
    setTotalCount(count || 0);
    setFetching(false);
  }, [page, sortKey, statusFilter]);

  const fetchCounts = useCallback(async () => {
    const [{ count: total }, { count: active }] = await Promise.all([
      supabase.from("partners").select("*", { count: "exact", head: true }),
      supabase.from("partners").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setTotalCount(total || 0);
    setActiveCount(active || 0);
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const refreshAll = () => { fetchPartners(); fetchCounts(); };

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
    if (url) {
      setLogoUrl(url);
      setCreateErrors((e) => ({ ...e, logo: undefined }));
      toast.success("Logo importé");
    }
    setUploadingLogo(false);
    event.target.value = "";
  };

  const uploadEditLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditUploading(true);
    const url = await uploadLogo(file);
    if (url) {
      setEditForm((f) => ({ ...f, logo_url: url }));
      setEditErrors((e) => ({ ...e, logo: undefined }));
    }
    setEditUploading(false);
    event.target.value = "";
  };

  const addPartner = async () => {
    const errs = validatePartnerForm({ name, logo_url: logoUrl, website_url: websiteUrl, display_order: totalCount });
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Corrigez les erreurs du formulaire.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("partners").insert({
      name: name.trim(),
      logo_url: logoUrl.trim(),
      website_url: websiteUrl.trim() || null,
      display_order: totalCount,
    });
    if (error) {
      const mapped = mapServerError(error);
      if (mapped) {
        setCreateErrors((prev) => ({ ...prev, ...mapped }));
        toast.error("URL rejetée par la validation serveur");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Partenaire ajouté");
      setName(""); setLogoUrl(""); setWebsiteUrl(""); setCreateErrors({});
      refreshAll();
    }
    setLoading(false);
  };

  const startEdit = (p: Partner) => {
    setEditId(p.id);
    setEditForm({ name: p.name, logo_url: p.logo_url, website_url: p.website_url || "", display_order: p.display_order });
    setEditErrors({});
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); setEditErrors({}); };

  const saveEdit = async () => {
    if (!editId) return;
    const errs = validatePartnerForm({
      name: editForm.name,
      logo_url: editForm.logo_url,
      website_url: editForm.website_url || "",
      display_order: editForm.display_order ?? 0,
    });
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Corrigez les erreurs du formulaire.");
      return;
    }
    const { error } = await supabase.from("partners").update({
      name: (editForm.name || "").trim(),
      logo_url: (editForm.logo_url || "").trim(),
      website_url: (editForm.website_url || "").trim() || null,
      display_order: editForm.display_order ?? 0,
    }).eq("id", editId);
    if (error) {
      const mapped = mapServerError(error);
      if (mapped) {
        setEditErrors((prev) => ({ ...prev, ...mapped }));
        toast.error("URL rejetée par la validation serveur");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Partenaire mis à jour");
    cancelEdit();
    refreshAll();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("partners").update({ is_active: !current }).eq("id", id);
    refreshAll();
  };

  const deletePartner = async (id: string) => {
    await supabase.from("partners").delete().eq("id", id);
    toast.success("Partenaire supprimé");
    refreshAll();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Ajouter un partenaire</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label>Nom *</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); setCreateErrors((er) => ({ ...er, name: undefined })); }} placeholder="Nom du partenaire" />
              <FieldError msg={createErrors.name} />
            </div>
            <div>
              <Label>Logo (URL) *</Label>
              <Input
                value={logoUrl}
                onChange={(e) => { setLogoUrl(e.target.value); setCreateErrors((er) => ({ ...er, logo: undefined })); }}
                placeholder="https://..."
                aria-invalid={Boolean(createErrors.logo)}
              />
              <FieldError msg={createErrors.logo} />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Logo local</Label>
              <Input type="file" accept="image/*" onChange={uploadLocalLogo} disabled={uploadingLogo} />
            </div>
            <div>
              <Label>Site web</Label>
              <Input
                value={websiteUrl}
                onChange={(e) => { setWebsiteUrl(e.target.value); setCreateErrors((er) => ({ ...er, website: undefined })); }}
                placeholder="https://..."
                aria-invalid={Boolean(createErrors.website)}
              />
              <FieldError msg={createErrors.website} />
            </div>
          </div>
          {uploadingLogo ? <p className="text-xs text-muted-foreground">Import en cours...</p> : null}
          <Button onClick={addPartner} disabled={loading} className="gradient-hero border-0 text-primary-foreground">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg">
              Partenaires ({totalCount} total · {activeCount} actifs)
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
                <SelectTrigger className="h-9 w-36 text-xs"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortKey} onValueChange={(v) => { setSortKey(v as SortKey); setPage(1); }}>
                <SelectTrigger className="h-9 w-44 text-xs"><ArrowUpDown className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Ordre d'affichage</SelectItem>
                  <SelectItem value="name">Nom (A-Z)</SelectItem>
                  <SelectItem value="recent">Plus récents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fetching && partners.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">Chargement...</p>
          ) : partners.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">Aucun partenaire à afficher.</p>
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
                            <Label className="text-xs">Nom *</Label>
                            <Input value={editForm.name || ""} onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); setEditErrors((er) => ({ ...er, name: undefined })); }} />
                            <FieldError msg={editErrors.name} />
                          </div>
                          <div>
                            <Label className="text-xs">Logo (URL) *</Label>
                            <Input
                              value={editForm.logo_url || ""}
                              onChange={(e) => { setEditForm((f) => ({ ...f, logo_url: e.target.value })); setEditErrors((er) => ({ ...er, logo: undefined })); }}
                              aria-invalid={Boolean(editErrors.logo)}
                            />
                            <FieldError msg={editErrors.logo} />
                          </div>
                          <div>
                            <Label className="text-xs flex items-center gap-1"><Upload className="h-3 w-3" /> Logo local</Label>
                            <Input type="file" accept="image/*" onChange={uploadEditLogo} disabled={editUploading} />
                          </div>
                          <div>
                            <Label className="text-xs">Site web</Label>
                            <Input
                              value={editForm.website_url || ""}
                              onChange={(e) => { setEditForm((f) => ({ ...f, website_url: e.target.value })); setEditErrors((er) => ({ ...er, website: undefined })); }}
                              placeholder="https://..."
                              aria-invalid={Boolean(editErrors.website)}
                            />
                            <FieldError msg={editErrors.website} />
                          </div>
                          <div>
                            <Label className="text-xs">Ordre d'affichage</Label>
                            <Input
                              type="number"
                              min={0}
                              value={editForm.display_order ?? 0}
                              onChange={(e) => { setEditForm((f) => ({ ...f, display_order: parseInt(e.target.value) || 0 })); setEditErrors((er) => ({ ...er, order: undefined })); }}
                            />
                            <FieldError msg={editErrors.order} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {editForm.logo_url && (
                            <img src={editForm.logo_url} alt="preview" className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                          )}
                          <div className="ml-auto flex gap-2">
                            <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /> Annuler</Button>
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              disabled={editUploading || Object.keys(editErrors).some((k) => editErrors[k as keyof FormErrors])}
                              className="gradient-hero border-0 text-primary-foreground"
                            >
                              <Save className="h-4 w-4" /> Enregistrer
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <img src={p.logo_url} alt={p.name} className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-foreground truncate">
                            {p.name} <span className="text-[10px] text-muted-foreground">#{p.display_order}</span>
                          </p>
                          {p.website_url && (
                            <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-primary flex items-center gap-1 truncate">
                              <ExternalLink className="h-3 w-3 shrink-0" /> {p.website_url}
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
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
            label="partenaires"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPartnersManager;
