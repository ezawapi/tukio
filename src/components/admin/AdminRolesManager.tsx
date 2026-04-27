import { useEffect, useState } from "react";
import { Shield, ShieldCheck, ShieldPlus, Search, Trash2, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";
import type { Permission } from "@/hooks/use-permissions";

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

interface PermissionRow {
  role: AppRole;
  permission: Permission;
}

const ITEMS_PER_PAGE = 10;

const roleLabels: Record<AppRole, string> = {
  admin: "Administrateur",
  moderator: "Modérateur",
};

const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: "events.moderate", label: "Modérer les activités (approuver/rejeter)", group: "Activités" },
  { key: "events.publish", label: "Publier / dépublier", group: "Activités" },
  { key: "events.delete", label: "Supprimer une activité", group: "Activités" },
  { key: "notifications.view", label: "Voir les notifications admin", group: "Modération" },
  { key: "ads.manage", label: "Gérer les publicités", group: "Contenu" },
  { key: "banners.manage", label: "Gérer les bannières", group: "Contenu" },
  { key: "partners.manage", label: "Gérer les partenaires", group: "Contenu" },
  { key: "content.manage", label: "Gérer le contenu du site", group: "Contenu" },
  { key: "categories.manage", label: "Gérer les catégories", group: "Contenu" },
  { key: "users.manage", label: "Gérer les utilisateurs", group: "Système" },
  { key: "roles.manage", label: "Gérer les rôles & permissions", group: "Système" },
  { key: "analytics.view", label: "Voir les analytiques", group: "Système" },
];

const AdminRolesManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [assignTarget, setAssignTarget] = useState<Record<string, AppRole>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingPerm, setSavingPerm] = useState<string | null>(null);

  const fetchAll = async () => {
    const [{ data: profs }, { data: rs }, { data: ps }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("role_permissions").select("role, permission"),
    ]);
    setProfiles((profs as Profile[]) || []);
    setRoles((rs as RoleRow[]) || []);
    setPermissions((ps as PermissionRow[]) || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const rolesByUser = (uid: string): AppRole[] =>
    roles.filter((r) => r.user_id === uid && (r.role === "admin" || r.role === "moderator"))
      .map((r) => r.role as AppRole);

  const hasPerm = (role: AppRole, perm: Permission) =>
    permissions.some((p) => p.role === role && p.permission === perm);

  const togglePerm = async (role: AppRole, perm: Permission, currently: boolean) => {
    const key = `${role}:${perm}`;
    setSavingPerm(key);
    if (currently) {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role", role)
        .eq("permission", perm);
      if (error) toast.error(error.message);
      else setPermissions((p) => p.filter((x) => !(x.role === role && x.permission === perm)));
    } else {
      const { error } = await supabase.from("role_permissions").insert({ role, permission: perm });
      if (error) toast.error(error.message);
      else setPermissions((p) => [...p, { role, permission: perm }]);
    }
    setSavingPerm(null);
  };

  const assignRole = async (uid: string, role: AppRole) => {
    setBusyId(uid);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    setBusyId(null);
    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) toast.info("Rôle déjà attribué");
      else toast.error(error.message);
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

  const renderPermissionMatrix = (role: AppRole) => {
    const groups = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.group)));
    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {group}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => {
                const enabled = hasPerm(role, p.key);
                const key = `${role}:${p.key}`;
                return (
                  <label
                    key={p.key}
                    className={`flex items-start gap-2 rounded-lg border border-border p-2 cursor-pointer transition-colors ${
                      enabled ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                    } ${savingPerm === key ? "opacity-60" : ""}`}
                  >
                    <Checkbox
                      checked={enabled}
                      disabled={savingPerm === key}
                      onCheckedChange={() => togglePerm(role, p.key, enabled)}
                      className="mt-0.5"
                    />
                    <span className="font-body text-xs text-foreground leading-snug">{p.label}</span>
                    {enabled && <Check className="h-3 w-3 text-primary ml-auto shrink-0 mt-0.5" />}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Permissions matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
            <Settings2 className="h-5 w-5 text-primary" /> Permissions par rôle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="moderator">
            <TabsList className="mb-4">
              <TabsTrigger value="moderator" className="text-xs">Modérateur</TabsTrigger>
              <TabsTrigger value="admin" className="text-xs">Administrateur</TabsTrigger>
            </TabsList>
            <TabsContent value="moderator">
              <p className="text-xs text-muted-foreground mb-3">
                Cochez les actions autorisées pour les modérateurs. L'UI s'adapte automatiquement (boutons et onglets masqués).
              </p>
              {renderPermissionMatrix("moderator")}
            </TabsContent>
            <TabsContent value="admin">
              <p className="text-xs text-muted-foreground mb-3">
                Capacités des administrateurs. Garde au moins <strong>roles.manage</strong> active sinon plus aucun admin ne pourra modifier les permissions.
              </p>
              {renderPermissionMatrix("admin")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
            <Shield className="h-5 w-5 text-primary" /> Attribution des rôles
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
