import { useEffect, useState } from "react";
import { Shield, ShieldCheck, ShieldPlus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";

type AppRole = "admin" | "moderator";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface RoleRow {
  user_id: string;
  role: AppRole | "user";
}

const ITEMS_PER_PAGE = 10;

const roleLabels: Record<AppRole, string> = {
  admin: "Administrateur",
  moderator: "Modérateur",
};

const AdminRolesManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [assignTarget, setAssignTarget] = useState<Record<string, AppRole>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = async () => {
    const [{ data: profs }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((profs as Profile[]) || []);
    setRoles((rs as RoleRow[]) || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const rolesByUser = (uid: string): AppRole[] =>
    roles.filter((r) => r.user_id === uid && (r.role === "admin" || r.role === "moderator"))
      .map((r) => r.role as AppRole);

  const assignRole = async (uid: string, role: AppRole) => {
    setBusyId(uid);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    setBusyId(null);
    if (error) {
      // unique constraint => already has it
      if (error.message.toLowerCase().includes("duplicate")) {
        toast.info("Rôle déjà attribué");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success(`Rôle ${roleLabels[role]} attribué`);
    fetchAll();
  };

  const revokeRole = async (uid: string, role: AppRole) => {
    setBusyId(uid);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Rôle ${roleLabels[role]} retiré`);
    fetchAll();
  };

  const filtered = profiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.display_name?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const adminCount = roles.filter((r) => r.role === "admin").length;
  const modCount = roles.filter((r) => r.role === "moderator").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
            <Shield className="h-5 w-5 text-primary" /> Rôles & permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="font-display text-xl font-bold text-primary">{adminCount}</p>
              <p className="text-xs text-muted-foreground">Administrateurs</p>
            </div>
            <div className="rounded-lg bg-accent/10 p-3 text-center">
              <p className="font-display text-xl font-bold text-accent">{modCount}</p>
              <p className="text-xs text-muted-foreground">Modérateurs</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Pouvoirs des modérateurs</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Approuver, rejeter, masquer les publications signalées</li>
              <li>Supprimer les contenus inappropriés</li>
              <li>Surveiller l'activité (notifications, signalements)</li>
              <li>❌ Pas d'accès à la gestion des utilisateurs, rôles, partenaires ou bannières</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto p-0"
            />
          </div>

          <div className="space-y-2">
            {paginated.map((p) => {
              const userRoles = rolesByUser(p.id);
              const selected = assignTarget[p.id] || "moderator";
              return (
                <div key={p.id} className="rounded-lg bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-medium text-foreground truncate">
                        {p.display_name || "Sans nom"}
                      </p>
                      <p className="font-body text-[10px] text-muted-foreground truncate">{p.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {userRoles.length === 0 && (
                        <Badge variant="outline" className="text-[10px]">Utilisateur</Badge>
                      )}
                      {userRoles.map((r) => (
                        <Badge
                          key={r}
                          className={`text-[10px] gap-1 ${r === "admin" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}
                        >
                          <ShieldCheck className="h-3 w-3" /> {roleLabels[r]}
                          <button
                            type="button"
                            onClick={() => revokeRole(p.id, r)}
                            className="ml-1 hover:opacity-70"
                            disabled={busyId === p.id}
                            aria-label={`Retirer ${roleLabels[r]}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={selected}
                      onValueChange={(v) => setAssignTarget((s) => ({ ...s, [p.id]: v as AppRole }))}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moderator">Modérateur</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs"
                      disabled={busyId === p.id || userRoles.includes(selected)}
                      onClick={() => assignRole(p.id, selected)}
                    >
                      <ShieldPlus className="h-3.5 w-3.5" />
                      Attribuer
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
            )}
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
            label="utilisateurs"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRolesManager;
