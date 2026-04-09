import { useState, useEffect } from "react";
import { Trash2, ShieldOff, ShieldCheck, Search, Users, Eye } from "lucide-react";
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
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.display_name?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
          <Users className="h-5 w-5 text-primary" /> Utilisateurs ({filtered.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input placeholder="Rechercher par nom..." value={search}
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
                  <p className="font-body text-[10px] text-muted-foreground truncate">{profile.id}</p>
                </div>
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
