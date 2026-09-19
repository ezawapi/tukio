import { useEffect, useMemo, useState } from "react";
import { UserCog, LogIn, ShieldAlert, Search, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import PaginationControls from "@/components/PaginationControls";

const PER_PAGE = 15;

interface LoginEvent {
  id: string;
  user_id: string | null;
  email: string | null;
  success: boolean;
  reason: string | null;
  provider: string;
  created_at: string;
}

const fmt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const AdminAccountsManager = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [logins, setLogins] = useState<LoginEvent[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [okPage, setOkPage] = useState(1);
  const [failPage, setFailPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: l }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url, created_at, is_blocked, account_type").order("created_at", { ascending: false }),
        supabase.from("login_events").select("id, user_id, email, success, reason, provider, created_at").order("created_at", { ascending: false }).limit(500),
      ]);
      setProfiles(p || []);
      setLogins((l as LoginEvent[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const match = (...vals: (string | null | undefined)[]) => !q || vals.some((v) => v?.toLowerCase().includes(q));

  const filteredProfiles = useMemo(
    () => profiles.filter((p) => match(p.display_name, p.id)),
    [profiles, q],
  );
  const successLogins = useMemo(() => logins.filter((l) => l.success && match(l.email, l.user_id)), [logins, q]);
  const failedLogins = useMemo(() => logins.filter((l) => !l.success && match(l.email, l.reason)), [logins, q]);

  const lastLoginFor = (userId: string) => logins.find((l) => l.user_id === userId && l.success)?.created_at;

  const slice = (arr: any[], p: number) => arr.slice((p - 1) * PER_PAGE, p * PER_PAGE);

  const LoginRow = ({ l }: { l: LoginEvent }) => (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 p-3">
      <div className="min-w-0">
        <p className="truncate font-body text-sm font-medium text-foreground">{l.email || "—"}</p>
        <p className="font-body text-[11px] text-muted-foreground">
          {fmt(l.created_at)} · {l.provider === "google" ? "Google" : "Email"}
          {l.reason ? ` · ${l.reason}` : ""}
        </p>
      </div>
      {l.success ? (
        <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" /> Réussie</Badge>
      ) : (
        <Badge variant="destructive" className="shrink-0 gap-1 text-[10px]"><XCircle className="h-3 w-3" /> Échouée</Badge>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
          <UserCog className="h-5 w-5 text-primary" /> Comptes inscrits & connexions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Comptes", value: profiles.length },
            { label: "Connexions réussies", value: logins.filter((l) => l.success).length },
            { label: "Tentatives échouées", value: logins.filter((l) => !l.success).length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/40 p-3">
              <p className="font-display text-lg font-bold text-foreground">{s.value}</p>
              <p className="font-body text-[10px] text-muted-foreground sm:text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Rechercher un nom ou un email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); setOkPage(1); setFailPage(1); }}
            className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <Tabs defaultValue="accounts" className="space-y-3">
          <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted p-1">
            <TabsTrigger value="accounts" className="text-xs sm:text-sm">Comptes ({filteredProfiles.length})</TabsTrigger>
            <TabsTrigger value="logins" className="text-xs sm:text-sm">Connexions ({successLogins.length})</TabsTrigger>
            <TabsTrigger value="failures" className="text-xs sm:text-sm">Échecs ({failedLogins.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-2">
            {loading && <p className="py-6 text-center font-body text-sm text-muted-foreground">Chargement...</p>}
            {slice(filteredProfiles, page).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10">
                    {p.avatar_url && <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-foreground">{p.display_name || "Sans nom"}</p>
                    <p className="font-body text-[11px] text-muted-foreground">
                      Inscrit le {fmt(p.created_at)} · Dernière connexion : {lastLoginFor(p.id) ? fmt(lastLoginFor(p.id)!) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {p.account_type && <Badge variant="outline" className="text-[10px]">{p.account_type}</Badge>}
                  {p.is_blocked && <Badge variant="destructive" className="text-[10px]">Bloqué</Badge>}
                </div>
              </div>
            ))}
            {!loading && filteredProfiles.length === 0 && (
              <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucun compte trouvé.</p>
            )}
            <PaginationControls currentPage={page} totalPages={Math.ceil(filteredProfiles.length / PER_PAGE)} totalItems={filteredProfiles.length} itemsPerPage={PER_PAGE} onPageChange={setPage} label="comptes" />
          </TabsContent>

          <TabsContent value="logins" className="space-y-2">
            <div className="flex items-center gap-2 font-body text-xs text-muted-foreground"><LogIn className="h-4 w-4" /> Historique des connexions réussies</div>
            {slice(successLogins, okPage).map((l) => <LoginRow key={l.id} l={l} />)}
            {successLogins.length === 0 && <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucune connexion enregistrée.</p>}
            <PaginationControls currentPage={okPage} totalPages={Math.ceil(successLogins.length / PER_PAGE)} totalItems={successLogins.length} itemsPerPage={PER_PAGE} onPageChange={setOkPage} label="connexions" />
          </TabsContent>

          <TabsContent value="failures" className="space-y-2">
            <div className="flex items-center gap-2 font-body text-xs text-muted-foreground"><ShieldAlert className="h-4 w-4" /> Tentatives de connexion échouées</div>
            {slice(failedLogins, failPage).map((l) => <LoginRow key={l.id} l={l} />)}
            {failedLogins.length === 0 && <p className="py-8 text-center font-body text-sm text-muted-foreground">Aucune tentative échouée.</p>}
            <PaginationControls currentPage={failPage} totalPages={Math.ceil(failedLogins.length / PER_PAGE)} totalItems={failedLogins.length} itemsPerPage={PER_PAGE} onPageChange={setFailPage} label="tentatives" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminAccountsManager;
