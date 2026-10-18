import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileClock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface DraftRow {
  id: string;
  draft_key: string;
  event_id: string | null;
  title: string | null;
  updated_at: string;
  expires_at: string;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const hoursLeft = (iso: string) => Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000));

const targetFor = (d: DraftRow) => {
  if (d.draft_key === "create") return "/create";
  if (d.draft_key === "admin-create") return "/admin";
  if (d.event_id) return `/events/${d.event_id}/edit`;
  return "/create";
};

/** Lists the user's unfinished event forms (auto-deleted 48h after first save). */
const MyDrafts = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("event_drafts")
      .select("id, draft_key, event_id, title, updated_at, expires_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    setDrafts((data as DraftRow[]) || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  const remove = async (id: string) => {
    await supabase.from("event_drafts").delete().eq("id", id);
    setDrafts((p) => p.filter((d) => d.id !== id));
  };

  if (drafts.length === 0) return null;

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="space-y-2 p-3 sm:p-4">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <FileClock className="h-4 w-4 text-primary" /> Mes brouillons ({drafts.length})
        </h2>
        <p className="font-body text-xs text-muted-foreground">
          Saisies non terminées, gardées 48 h puis supprimées automatiquement.
        </p>
        {drafts.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-2.5">
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-medium text-foreground">
                {d.title || "Sans titre"}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  · {d.draft_key.startsWith("edit:") ? "modification" : "nouvelle activité"}
                </span>
              </p>
              <p className="font-body text-[11px] text-muted-foreground">
                Modifié le {fmt(d.updated_at)} · supprimé dans {hoursLeft(d.expires_at)} h
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" className="h-8 gap-1" onClick={() => navigate(targetFor(d))}>
                <Pencil className="h-3.5 w-3.5" /> Reprendre
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Supprimer le brouillon" onClick={() => remove(d.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MyDrafts;
