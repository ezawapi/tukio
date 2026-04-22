import { useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { renderBannerCard } from "@/components/PromotionalBanner";

interface Props {
  bannerId: string;
  onRestored: () => void;
}

const BannerHistoryDialog = ({ bannerId, onRestored }: Props) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("banner_history")
      .select("*")
      .eq("banner_id", bannerId)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open, bannerId]);

  const restore = async (snapshot: any) => {
    const { id, created_at, updated_at, ...payload } = snapshot;
    const { error } = await supabase.from("promotional_banners").update(payload).eq("id", bannerId);
    if (error) { toast.error(error.message); return; }
    toast.success("Version restaurée");
    setOpen(false);
    onRestored();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Historique">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Historique des modifications</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-3">
          {loading && <p className="text-center text-sm text-muted-foreground py-6">Chargement…</p>}
          {!loading && items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">Aucun historique pour cette bannière.</p>
          )}
          <div className="space-y-3">
            {items.map((h) => (
              <div key={h.id} className="rounded-lg border p-3 flex gap-3 items-center">
                <div className="w-40 flex-shrink-0">
                  {renderBannerCard(h.snapshot)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{h.snapshot.title || "(sans titre)"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => restore(h.snapshot)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurer
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BannerHistoryDialog;
