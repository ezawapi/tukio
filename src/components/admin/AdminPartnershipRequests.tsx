import { useEffect, useState } from "react";
import { Check, X, Handshake } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Req = {
  id: string; organization_name: string; contact_name: string; email: string; phone: string | null;
  website_url: string | null; logo_url: string | null; message: string | null; status: string; created_at: string;
};

const AdminPartnershipRequests = () => {
  const [rows, setRows] = useState<Req[]>([]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const load = async () => {
    const { data } = await supabase.from("partnership_requests").select("*").order("created_at", { ascending: false }).limit(100);
    setRows((data as Req[]) || []);
  };
  useEffect(() => { load(); }, []);

  const decide = async (r: Req, approve: boolean) => {
    if (approve) {
      if (!r.logo_url) { toast({ title: "Logo manquant", description: "Ajoutez le partenaire manuellement avec un logo.", variant: "destructive" }); return; }
      const { error } = await supabase.from("partners").insert({ name: r.organization_name, logo_url: r.logo_url, website_url: r.website_url, is_active: true, display_order: 999 });
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      qc.invalidateQueries({ queryKey: ["partners"] });
    }
    await supabase.from("partnership_requests").update({ status: approve ? "approved" : "rejected" }).eq("id", r.id);
    toast({ title: approve ? "Partenaire ajouté à la carte" : "Demande refusée" });
    load();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Handshake className="h-5 w-5 text-primary" />Demandes de partenariat</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              {r.logo_url && <img src={r.logo_url} alt="" className="h-12 w-12 shrink-0 rounded bg-muted object-contain" />}
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-foreground">{r.organization_name} <Badge variant="secondary" className="ml-1">{r.status}</Badge></p>
                <p className="text-muted-foreground">{r.contact_name} · {r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                {r.website_url && <a href={r.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{r.website_url}</a>}
                {r.message && <p className="mt-1 whitespace-pre-line text-foreground">{r.message}</p>}
              </div>
            </div>
            {r.status === "pending" && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => decide(r, true)}><Check className="mr-1 h-4 w-4" />Valider</Button>
                <Button size="sm" variant="outline" onClick={() => decide(r, false)}><X className="mr-1 h-4 w-4" />Refuser</Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminPartnershipRequests;
