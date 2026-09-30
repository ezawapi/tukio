import { useState, useEffect } from "react";
import { Trash2, ShieldOff, ShieldCheck, Search, Users, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PaginationControls from "@/components/PaginationControls";
import AdminUserProfileDialog from "@/components/admin/AdminUserProfileDialog";

const ITEMS_PER_PAGE = 15;

const AdminUsersManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "user" | "organizer">("all");

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(data || []);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const toggleBlock = async (profile: any) => {
    const newBlocked = !profile.is_blocked;
    const { error } = await supabase.from("profiles").update({ is_blocked: newBlocked }).eq("id", profile.id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: newBlocked ? "Utilisateur bloqué" : "Utilisateur débloqué" });
    fetchProfiles();
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Profil supprimé" });
    fetchProfiles();
  };

  const viewProfile = (id: string) => {
    setSelectedUserId(id);
    setProfileDialogOpen(true);
  };

  const filtered = profiles.filter(p => {
    if (typeFilter !== "all" && (p.account_type || "user") !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [p.display_name, p.id, p.contact_email, p.phone_primary, p.organization_name].some((v: any) => v?.toLowerCase?.().includes(q));
  });

  const exportCsv = () => {
    const cols = ["id", "account_type", "display_name", "contact_email", "phone_primary", "phone_secondary", "organization_name", "organization_role", "physical_address", "facebook_url", "instagram_url", "linkedin_url", "tiktok_url", "twitter_url", "website_url", "blog_url", "onboarding_completed", "is_blocked", "created_at"];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(";"), ...filtered.map(p => cols.map(c => esc(p[c])).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tukio-utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 font-display text-base sm:text-lg">
          <span className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Utilisateurs ({filtered.length})</span>
          <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1"><Download className="h-4 w-4" /> Exporter CSV</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-2">
          {([["all", "Tous"], ["user", "Utilisateurs"], ["organizer", "Organisateurs"]] as const).map(([v, l]) => (
            <Button key={v} size="sm" variant={typeFilter === v ? "default" : "ghost"} onClick={() => { setTypeFilter(v); setPage(1); }}>{l}</Button>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input placeholder="Rechercher par nom, email, téléphone..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto p-0" />
        </div>
        <div className="space-y-2">
          {paginated.map(profile => (
            <div key={profile.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">
                    {profile.display_name || "Sans nom"}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground truncate">{[profile.contact_email, profile.phone_primary].filter(Boolean).join(" · ") || profile.id}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{profile.account_type === "organizer" ? "Organisateur" : "Utilisateur"}</Badge>
                {!profile.onboarding_completed && <Badge variant="secondary" className="text-[10px] shrink-0">Incomplet</Badge>}
                {profile.is_blocked && <Badge variant="destructive" className="text-[10px]">Bloqué</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => viewProfile(profile.id)} className="h-8 w-8 p-0" title="Voir le profil">
                  <Eye className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleBlock(profile)} className="h-8 w-8 p-0"
                  title={profile.is_blocked ? "Débloquer" : "Bloquer"}>
                  {profile.is_blocked ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                      <AlertDialogDescription>Le profil « {profile.display_name || profile.id} » sera supprimé. Cette action est irréversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteUser(profile.id)} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>}
        </div>
        <PaginationControls currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPage} label="utilisateurs" />
      </CardContent>
      <AdminUserProfileDialog profileId={selectedUserId} open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </Card>
  );
};

export default AdminUsersManager;
