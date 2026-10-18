import { CloudCheck, History, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DraftState } from "@/hooks/use-event-draft";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Small banner showing the autosaved draft state of an event form. */
const DraftStatus = ({ draft }: { draft: DraftState }) => {
  if (!draft.restoredAt && !draft.savedAt && !draft.saving) {
    return (
      <p className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2 font-body text-xs text-muted-foreground">
        <History className="h-3.5 w-3.5 shrink-0" />
        Vos saisies sont enregistrées automatiquement en brouillon pendant 48 h.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
      <p className="flex items-center gap-1.5 font-body text-xs text-foreground">
        {draft.saving ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Enregistrement du brouillon…</>
        ) : (
          <>
            <CloudCheck className="h-3.5 w-3.5 text-primary" />
            {draft.restoredAt ? "Brouillon restauré" : "Brouillon enregistré"}
            {draft.savedAt && <> · {fmt(draft.savedAt)}</>}
            {draft.expiresAt && <span className="text-muted-foreground"> · supprimé le {fmt(draft.expiresAt)}</span>}
          </>
        )}
      </p>
      {(draft.restoredAt || draft.savedAt) && (
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => draft.discard()}>
          <RotateCcw className="h-3.5 w-3.5" /> Annuler le brouillon
        </Button>
      )}
    </div>
  );
};

export default DraftStatus;
