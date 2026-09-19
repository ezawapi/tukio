import { useEffect, useState } from "react";
import { CalendarDays, Flag, Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Holiday {
  date: string; // ISO yyyy-mm-dd
  name: string;
  type?: string;
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
      return { date: iso, name: d.name, type: d.type };
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

const OfficialHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [countryName, setCountryName] = useState<string>("");

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
            type: guessType(`${h.localName} ${h.name}`),
          }));
        }
      } catch {
        /* réseau indisponible */
      }
      if (list.length === 0) list = buildFallback(upper);
      if (cancelled) return;
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
              const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
              return (
                <div key={`${h.date}-${h.name}`} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10">
                    <span className="font-display text-sm font-bold leading-none text-primary">{d.getDate()}</span>
                    <span className="font-body text-[9px] uppercase text-primary/80">
                      {d.toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-foreground">{h.name}</p>
                    <p className="flex items-center gap-1 font-body text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {h.type} · {days <= 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J-${days}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfficialHolidays;
