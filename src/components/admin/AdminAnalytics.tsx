import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  CalendarPlus,
  UserCheck,
  Eye,
  MousePointerClick,
  TrendingUp,
  Download,
  Ticket,
} from "lucide-react";

type Period = "7d" | "30d" | "90d" | "365d";

const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 };

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#e07a5f",
  "#3d5a80",
  "#f2cc8f",
  "#81b29a",
  "#9c6644",
  "#6d597a",
];

const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

const buildDayRange = (days: number) => {
  const out: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
};

const labelDay = (key: string) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};

const toCsv = (rows: Record<string, any>[]) => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};

const KpiCard = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <Card className="border-border/60">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-body text-xs text-muted-foreground truncate">{label}</p>
          <p className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">{value}</p>
          {hint && <p className="font-body text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
        </div>
        <span className="rounded-xl bg-primary/10 p-2 text-primary flex-shrink-0">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="border-border/60">
    <CardHeader className="pb-2">
      <CardTitle className="font-display text-sm sm:text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="h-[260px] px-2 sm:px-4">{children}</CardContent>
  </Card>
);

const AdminAnalytics = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [adRows, setAdRows] = useState<any[]>([]);
  const [bannerRows, setBannerRows] = useState<any[]>([]);
  const [notifRows, setNotifRows] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - PERIOD_DAYS[period]);
      const iso = since.toISOString();

      const [p, e, part, ads, banners, notifs, ords] = await Promise.all([
        supabase.from("profiles").select("id, created_at, account_type").gte("created_at", iso),
        supabase
          .from("events")
          .select("id, created_at, status, is_published, city, category_id, attendees_count, categories(name)")
          .gte("created_at", iso),
        supabase.from("event_participations").select("id, created_at, guests, status").gte("created_at", iso),
        supabase.from("ad_analytics").select("ad_id, event_type, created_at, ads(title)").gte("created_at", iso),
        supabase.from("banner_analytics").select("banner_id, event_type, created_at").gte("created_at", iso),
        supabase.from("notification_analytics").select("event_type, created_at").gte("created_at", iso),
        supabase.from("ticket_orders").select("id, created_at, total_amount, currency, payment_status").gte("created_at", iso),
      ]);

      if (cancelled) return;
      setProfiles(p.data || []);
      setEvents(e.data || []);
      setParticipations(part.data || []);
      setAdRows(ads.data || []);
      setBannerRows(banners.data || []);
      setNotifRows(notifs.data || []);
      setOrders(ords.data || []);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const days = useMemo(() => buildDayRange(PERIOD_DAYS[period]), [period]);

  const timeline = useMemo(() => {
    const base = new Map(days.map((d) => [d, { day: labelDay(d), key: d, users: 0, events: 0, participations: 0 }]));
    profiles.forEach((r) => {
      const b = base.get(dayKey(r.created_at));
      if (b) b.users += 1;
    });
    events.forEach((r) => {
      const b = base.get(dayKey(r.created_at));
      if (b) b.events += 1;
    });
    participations.forEach((r) => {
      const b = base.get(dayKey(r.created_at));
      if (b) b.participations += 1;
    });
    return Array.from(base.values());
  }, [days, profiles, events, participations]);

  const adTotals = useMemo(() => {
    let impressions = 0;
    let clicks = 0;
    const perAd = new Map<string, { title: string; impressions: number; clicks: number }>();
    adRows.forEach((r: any) => {
      const cur = perAd.get(r.ad_id) || { title: r.ads?.title || "Publicité", impressions: 0, clicks: 0 };
      if (r.event_type === "click") {
        cur.clicks += 1;
        clicks += 1;
      } else {
        cur.impressions += 1;
        impressions += 1;
      }
      perAd.set(r.ad_id, cur);
    });
    const top = Array.from(perAd.values())
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 6)
      .map((a) => ({ ...a, ctr: a.impressions ? +((a.clicks / a.impressions) * 100).toFixed(1) : 0 }));
    return { impressions, clicks, top };
  }, [adRows]);

  const bannerTotals = useMemo(() => {
    const impressions = bannerRows.filter((r) => r.event_type !== "click").length;
    const clicks = bannerRows.filter((r) => r.event_type === "click").length;
    return { impressions, clicks };
  }, [bannerRows]);

  const notifFunnel = useMemo(() => {
    const count = (t: string) => notifRows.filter((r) => r.event_type === t).length;
    return [
      { step: "Envoyées", value: count("sent") },
      { step: "Ouvertes", value: count("opened") },
      { step: "Cliquées", value: count("clicked") },
      { step: "Échecs", value: count("failed") },
    ];
  }, [notifRows]);

  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e: any) => {
      const name = e.categories?.name || "Sans catégorie";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [events]);

  const topCities = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e: any) => {
      const name = (e.city || "—").trim();
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [events]);

  const guestsTotal = useMemo(
    () => participations.reduce((sum, p: any) => sum + (p.guests || 1), 0),
    [participations]
  );

  const revenue = useMemo(() => {
    const paid = orders.filter((o: any) => o.payment_status === "paid");
    const total = paid.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
    return { total, count: paid.length };
  }, [orders]);

  const ctr = adTotals.impressions ? ((adTotals.clicks / adTotals.impressions) * 100).toFixed(1) : "0.0";

  const exportCsv = () => {
    const csv = toCsv(
      timeline.map((t) => ({
        date: t.key,
        nouveaux_utilisateurs: t.users,
        evenements_crees: t.events,
        participations: t.participations,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tukio-statistiques-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Statistiques d'utilisation
        </h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px] h-9 font-body text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="365d">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-9">
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Nouveaux utilisateurs" value={profiles.length} />
        <KpiCard icon={CalendarPlus} label="Événements créés" value={events.length} hint={`${events.filter((e) => e.is_published).length} publiés`} />
        <KpiCard icon={UserCheck} label="Participations" value={participations.length} hint={`${guestsTotal} places réservées`} />
        <KpiCard icon={Ticket} label="Billets payés" value={revenue.count} hint={revenue.total ? `${revenue.total.toLocaleString("fr-FR")} au total` : undefined} />
        <KpiCard icon={Eye} label="Impressions pub" value={adTotals.impressions} />
        <KpiCard icon={MousePointerClick} label="Clics pub" value={adTotals.clicks} hint={`CTR ${ctr}%`} />
        <KpiCard icon={Eye} label="Vues bannières" value={bannerTotals.impressions} />
        <KpiCard
          icon={MousePointerClick}
          label="Clics bannières"
          value={bannerTotals.clicks}
          hint={`CTR ${bannerTotals.impressions ? ((bannerTotals.clicks / bannerTotals.impressions) * 100).toFixed(1) : "0.0"}%`}
        />
      </div>

      {loading && <p className="font-body text-sm text-muted-foreground">Chargement des données…</p>}

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Croissance quotidienne">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e07a5f" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#e07a5f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="users" name="Utilisateurs" stroke="hsl(var(--primary))" fill="url(#gUsers)" />
              <Area type="monotone" dataKey="events" name="Événements" stroke="#e07a5f" fill="url(#gEvents)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Participations par jour">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="participations" name="Participations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Répartition par catégorie">
          {topCategories.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground py-10 text-center">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topCategories} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {topCategories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Villes les plus actives">
          {topCities.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground py-10 text-center">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCities} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Événements" fill="#3d5a80" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Performance des publicités">
          {adTotals.top.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground py-10 text-center">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adTotals.top} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="title" tick={{ fontSize: 9 }} interval={0} height={40} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="impressions" name="Impressions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" name="Clics" fill="#e07a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Entonnoir des notifications">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={notifFunnel} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="step" width={80} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" name="Notifications" fill="#81b29a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm sm:text-base">Détail des publicités</CardTitle>
        </CardHeader>
        <CardContent>
          {adTotals.top.length === 0 ? (
            <p className="py-6 text-center font-body text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 border-b border-border pb-2 font-body text-xs font-semibold text-muted-foreground">
                <span>Publicité</span>
                <span className="text-center">Impressions</span>
                <span className="text-center">Clics</span>
                <span className="text-center">CTR</span>
              </div>
              {adTotals.top.map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 rounded-lg bg-muted/30 p-3 font-body text-sm">
                  <span className="truncate text-foreground">{row.title}</span>
                  <span className="text-center text-muted-foreground">{row.impressions}</span>
                  <span className="text-center text-muted-foreground">{row.clicks}</span>
                  <span className="text-center font-semibold text-primary">{row.ctr}%</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
