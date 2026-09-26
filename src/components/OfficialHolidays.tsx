import { useEffect, useState } from "react";
import { CalendarDays, Flag, Globe2, ExternalLink, Info, MapPin, Share2, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import ShareDialog from "@/components/ShareDialog";
import AddToCalendar from "@/components/AddToCalendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Holiday {
  date: string; // ISO yyyy-mm-dd
  name: string;
  type?: string;
  /** true = observé dans tout le pays / international, false = régional */
  global?: boolean;
  counties?: string[] | null;
  /** libellé anglais si disponible (utile pour la source) */
  internationalName?: string;
}

const FALLBACK: Record<string, { country: string; days: { md: string; name: string; type: string }[] }> = {
  CD: {
    country: "République Démocratique du Congo",
    days: [
      { md: "01-01", name: "Nouvel An", type: "Fête nationale" },
      { md: "01-04", name: "Journée des Martyrs de l'Indépendance", type: "Commémoration" },
      { md: "01-16", name: "Journée des Héros nationaux (L.-D. Kabila)", type: "Commémoration" },
      { md: "01-17", name: "Journée Patrice Emery Lumumba", type: "Commémoration" },
      { md: "05-01", name: "Fête du Travail", type: "Fête nationale" },
      { md: "05-17", name: "Journée de la Libération", type: "Commémoration" },
      { md: "06-30", name: "Fête de l'Indépendance", type: "Fête nationale" },
      { md: "08-01", name: "Fête des Parents", type: "Fête nationale" },
      { md: "12-25", name: "Noël", type: "Fête religieuse" },
    ],
  },
  CG: {
    country: "République du Congo",
    days: [
      { md: "01-01", name: "Nouvel An", type: "Fête nationale" },
      { md: "05-01", name: "Fête du Travail", type: "Fête nationale" },
      { md: "06-10", name: "Fête de la Réconciliation", type: "Commémoration" },
      { md: "08-15", name: "Fête de l'Indépendance", type: "Fête nationale" },
      { md: "11-01", name: "Toussaint", type: "Fête religieuse" },
      { md: "11-28", name: "Jour de la République", type: "Commémoration" },
      { md: "12-25", name: "Noël", type: "Fête religieuse" },
    ],
  },
};

const guessType = (name: string): string => {
  const n = name.toLowerCase();
  if (/(noël|noel|christmas|pâques|paques|easter|ascension|pentecôte|assomption|toussaint|aïd|aid|eid|ramadan|good friday|all saints)/.test(n)) return "Fête religieuse";
  if (/(independ|indépend)/.test(n)) return "Fête de l'Indépendance";
  if (/(martyr|héros|heros|memorial|commémor|commemor|liberation|libération|victory)/.test(n)) return "Commémoration";
  return "Fête nationale";
};

const buildFallback = (code: string): Holiday[] => {
  const entry = FALLBACK[code];
  if (!entry) return [];
  const now = new Date();
  const year = now.getFullYear();
  return entry.days
    .map((d) => {
      let iso = `${year}-${d.md}`;
      if (new Date(`${iso}T23:59:59`) < now) iso = `${year + 1}-${d.md}`;
      return { date: iso, name: d.name, type: d.type, global: true };
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
};

const COUNTRY_NAMES: Record<string, string> = {
  CD: "République Démocratique du Congo",
  CG: "République du Congo",
  FR: "France",
  BE: "Belgique",
  CA: "Canada",
  US: "États-Unis",
};

const formatFullDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const wikiSource = (h: Holiday) =>
  `https://fr.wikipedia.org/wiki/Sp%C3%A9cial:Recherche?search=${encodeURIComponent(h.name)}`;

const officialSource = (code: string, iso: string) =>
  `https://date.nager.at/PublicHoliday/Country/${code}/${iso.slice(0, 4)}`;

const OfficialHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [countryName, setCountryName] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("CD");
  const [selected, setSelected] = useState<Holiday | null>(null);
  const [source, setSource] = useState<"api" | "fallback">("api");
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(null);
  const [sourceOk, setSourceOk] = useState<boolean | null>(null);

  // Lien public : /?holiday=CD-2026-06-30 ouvre la fiche
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("holiday");
    if (!q || holidays.length === 0) return;
    const date = q.slice(3);
    const h = holidays.find((x) => x.date === date);
    if (h) setSelected(h);
  }, [holidays]);

  useEffect(() => {
    if (!selected) return;
    setSourceOk(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    fetch(`https://date.nager.at/api/v3/PublicHolidays/${selected.date.slice(0, 4)}/${countryCode}`, { signal: ctrl.signal })
      .then((r) => setSourceOk(r.ok))
      .catch(() => setSourceOk(false))
      .finally(() => clearTimeout(t));
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [selected, countryCode]);

  useEffect(() => {
    let cancelled = false;

    const load = async (code: string, name?: string) => {
      const upper = (code || "CD").toUpperCase();
      let list: Holiday[] = [];
      try {
        const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${upper}`);
        if (res.ok) {
          const data = await res.json();
          list = (Array.isArray(data) ? data : []).slice(0, 6).map((h: any) => ({
            date: h.date,
            name: h.localName || h.name,
            internationalName: h.name,
            type: guessType(`${h.localName} ${h.name}`),
            global: h.global !== false,
            counties: h.counties ?? null,
          }));
        }
      } catch {
        /* réseau indisponible */
      }
      const fromApi = list.length > 0;
      if (!fromApi) list = buildFallback(upper);
      if (cancelled) return;
      setSource(fromApi ? "api" : "fallback");
      setVerifiedAt(new Date());
      setCountryCode(upper);
      setCountryName(name || COUNTRY_NAMES[upper] || upper);
      setHolidays(list);
    };

    const fallbackCountry = () => load("CD");

    if (!("geolocation" in navigator)) {
      fallbackCountry();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`,
          );
          const data = await res.json();
          const code = data?.address?.country_code?.toUpperCase();
          await load(code || "CD", data?.address?.country);
        } catch {
          fallbackCountry();
        }
      },
      () => fallbackCountry(),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (holidays.length === 0) return null;

  const daysLeft = (iso: string) =>
    Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000);

  const countdownLabel = (iso: string) => {
    const d = daysLeft(iso);
    return d <= 0 ? "Aujourd'hui" : d === 1 ? "Demain" : `J-${d}`;
  };

  const scopeLabel = (h: Holiday) =>
    h.type === "Fête religieuse" || h.global === false
      ? h.global === false
        ? "Locale / régionale"
        : "Internationale"
      : "Nationale";

  return (
    <section className="py-5 sm:py-7">
      <div className="container mx-auto w-full max-w-6xl px-4 md:w-[80%] md:px-0">
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Jours officiels & fêtes</h2>
            </div>
            {countryName && (
              <Badge variant="secondary" className="flex items-center gap-1 font-body text-[11px]">
                <Globe2 className="h-3 w-3" /> {countryName}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {holidays.map((h) => {
              const d = new Date(`${h.date}T00:00:00`);
              return (
                <button
                  key={`${h.date}-${h.name}`}
                  type="button"
                  onClick={() => setSelected(h)}
                  className="flex w-full items-center gap-3 rounded-xl bg-muted/40 p-3 text-left transition-colors hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10">
                    <span className="font-display text-sm font-bold leading-none text-primary">{d.getDate()}</span>
                    <span className="font-body text-[9px] uppercase text-primary/80">
                      {d.toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-foreground">{h.name}</p>
                    <p className="font-body text-[11px] text-muted-foreground">{formatFullDate(h.date)}</p>
                    <p className="flex items-center gap-1 font-body text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {h.type} · {countdownLabel(h.date)}
                    </p>
                  </div>
                  <Info className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl leading-snug">{selected.name}</DialogTitle>
                <DialogDescription className="font-body">
                  {formatFullDate(selected.date)} · {countdownLabel(selected.date)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-body text-[11px]">{selected.type}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1 font-body text-[11px]">
                    <MapPin className="h-3 w-3" /> {scopeLabel(selected)}
                  </Badge>
                  {countryName && (
                    <Badge variant="outline" className="flex items-center gap-1 font-body text-[11px]">
                      <Globe2 className="h-3 w-3" /> {countryName}
                    </Badge>
                  )}
                </div>

                {selected.internationalName && selected.internationalName !== selected.name && (
                  <p className="font-body text-sm text-muted-foreground">
                    Nom international : <span className="text-foreground">{selected.internationalName}</span>
                  </p>
                )}

                <div className="rounded-lg border border-border bg-muted/40 p-3 font-body text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    {source === "api" && sourceOk !== false ? (
                      <><ShieldCheck className="h-4 w-4 text-primary" /> Fiabilité élevée — source officielle en ligne</>
                    ) : (
                      <><ShieldAlert className="h-4 w-4 text-secondary" /> Fiabilité moyenne — données de référence Tukio</>
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Dernière vérification : {verifiedAt ? verifiedAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    {sourceOk === null && " · vérification de la source…"}
                  </p>
                  {sourceOk === false && (
                    <p className="mt-1 flex items-start gap-1 text-destructive">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      La source officielle est momentanément inaccessible. La date affichée provient de notre référentiel et peut varier (fêtes mobiles, décrets). Consultez « En savoir plus ».
                    </p>
                  )}
                </div>

                {selected.counties?.length ? (
                  <p className="font-body text-sm text-muted-foreground">
                    Régions concernées : <span className="text-foreground">{selected.counties.join(", ")}</span>
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <AddToCalendar className="flex-1" item={{ title: selected.name, description: `${selected.type ?? ""} — ${countryName}`, location: countryName, start: new Date(`${selected.date}T00:00:00`), allDay: true, url: `${window.location.origin}/?holiday=${countryCode}-${selected.date}` }} />
                  <ShareDialog heading="Partager cette fête" title={`${selected.name} — ${formatFullDate(selected.date)}`} url={`${window.location.origin}/?holiday=${countryCode}-${selected.date}`}>
                    <Button variant="outline" className="flex-1"><Share2 className="mr-2 h-4 w-4" /> Partager</Button>
                  </ShareDialog>
                </div>

                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <Button asChild variant="default" className="flex-1">
                    <a href={officialSource(countryCode, selected.date)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Source officielle
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <a href={wikiSource(selected)} target="_blank" rel="noopener noreferrer">
                      <Info className="mr-2 h-4 w-4" /> En savoir plus
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default OfficialHolidays;
