import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserCheck, X } from "lucide-react";

type P = { id: string; slug: string | null; display_name: string | null; organization_name: string | null; avatar_url: string | null };

interface Props {
  organizerUrl?: string;
  onPick: (name: string, url: string) => void;
  onClear: () => void;
}

const OrganizerAccountPicker = ({ organizerUrl, onPick, onClear }: Props) => {
  const [profiles, setProfiles] = useState<P[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.rpc("list_public_profiles").then(({ data }) => setProfiles(((data as P[]) || []).filter((p) => p.slug)));
  }, []);

  const linked = useMemo(() => {
    const m = organizerUrl?.match(/^\/u\/([^/?#]+)/);
    return m ? profiles.find((p) => p.slug === m[1]) : undefined;
  }, [organizerUrl, profiles]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return profiles
      .filter((p) => `${p.organization_name || ""} ${p.display_name || ""} ${p.slug}`.toLowerCase().includes(s))
      .slice(0, 8);
  }, [q, profiles]);

  const nameOf = (p: P) => p.organization_name || p.display_name || p.slug || "";

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label className="font-body">Compte organisateur sur Tukio (facultatif)</Label>
      {linked ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="flex-1 text-sm">Lié à <strong>{nameOf(linked)}</strong> (/u/{linked.slug})</span>
          <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground" aria-label="Retirer">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Rechercher un organisateur par nom…"
          />
          {open && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
              {results.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onPick(nameOf(p), `/u/${p.slug}`); setQ(""); setOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" /> : <div className="h-6 w-6 rounded-full bg-muted" />}
                  <span className="flex-1 truncate">{nameOf(p)}</span>
                  <span className="text-xs text-muted-foreground">/u/{p.slug}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Choisir un compte remplit automatiquement le nom et le lien : « Organisateur : Nom » mènera à sa page.</p>
    </div>
  );
};

export default OrganizerAccountPicker;
