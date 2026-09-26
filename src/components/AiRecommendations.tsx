import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Loader2, MapPin, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Rec {
  id: string; title: string; date: string; city?: string; price?: string; currency?: string;
  score: number; reason: string;
}

const STORAGE = "tukio_ai_prefs";

const AiRecommendations = () => {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE) || "{}"); } catch { return {}; } })();
  const [tastes, setTastes] = useState<string>(saved.tastes || "");
  const [constraints, setConstraints] = useState<string>(saved.constraints || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Rec[] | null>(null);

  const submit = async () => {
    if (!tastes.trim() || loading) return;
    setLoading(true); setError(null);
    localStorage.setItem(STORAGE, JSON.stringify({ tastes, constraints }));
    const { data, error } = await supabase.functions.invoke("recommend-events", { body: { tastes, constraints } });
    setLoading(false);
    if (error || data?.error) {
      let msg = data?.error;
      try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
      setError(msg || "Impossible d'obtenir des recommandations.");
      return;
    }
    setRecs(data?.recommendations ?? []);
  };

  return (
    <section className="py-5 sm:py-7">
      <div className="container mx-auto w-full max-w-6xl px-4 md:w-[80%] md:px-0">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Recommandations pour vous</h2>
            <Badge variant="secondary" className="text-[10px]">IA</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-body text-sm font-medium">Vos goûts</label>
              <Textarea value={tastes} maxLength={1000} onChange={(e) => setTastes(e.target.value)}
                placeholder="Ex. rumba, concerts live, conférences tech, art contemporain…" rows={3} />
            </div>
            <div>
              <label className="mb-1 block font-body text-sm font-medium">Vos contraintes</label>
              <Textarea value={constraints} maxLength={1000} onChange={(e) => setConstraints(e.target.value)}
                placeholder="Ex. Kinshasa uniquement, budget max 20 000 CDF, le week-end…" rows={3} />
            </div>
          </div>
          <Button onClick={submit} disabled={!tastes.trim() || loading} className="mt-3">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? "Analyse en cours…" : "Obtenir mes recommandations"}
          </Button>
          {error && <p className="mt-3 font-body text-sm text-destructive">{error}</p>}
          {recs && recs.length === 0 && !error && (
            <p className="mt-3 font-body text-sm text-muted-foreground">Aucun événement ne correspond pour l'instant.</p>
          )}
          {recs && recs.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {recs.map((r) => (
                <Link key={r.id} to={`/events/${r.id}`} className="rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted/70">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-body text-sm font-semibold text-foreground">{r.title}</p>
                    <Badge className="shrink-0 border-0 bg-primary text-[10px] text-primary-foreground">{r.score}%</Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-2 font-body text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                    {r.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}</span>}
                  </p>
                  <p className="mt-1 font-body text-xs text-foreground/80">{r.reason}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AiRecommendations;
