import { useEffect, useState, useCallback } from "react";
import { Mail, MailOpen, Flag, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AdminNotif {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  events?: { title: string } | null;
}

const AdminMessagesManager = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reports, setReports] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [source, setSource] = useState<"contact" | "reports">("contact");

  const load = useCallback(async () => {
    setLoading(true);
    const [msgRes, repRes] = await Promise.all([
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("admin_notifications").select("id, type, is_read, created_at, events(title)").order("created_at", { ascending: false }).limit(200),
    ]);
    setMessages((msgRes.data as ContactMessage[]) || []);
    setReports((repRes.data as unknown as AdminNotif[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRead = async (m: ContactMessage) => {
    const { error } = await supabase.from("contact_messages").update({ is_read: !m.is_read }).eq("id", m.id);
    if (error) { toast({ title: "Action impossible", variant: "destructive" }); return; }
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: !m.is_read } : x)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast({ title: "Suppression impossible", variant: "destructive" }); return; }
    setMessages((prev) => prev.filter((x) => x.id !== id));
  };

  const markReportRead = async (r: AdminNotif) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", r.id);
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_read: true } : x)));
  };

  const filteredMessages = messages.filter((m) => {
    if (filter === "unread" && m.is_read) return false;
    if (filter === "read" && !m.is_read) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [m.name, m.email, m.subject, m.message].some((v) => (v || "").toLowerCase().includes(q));
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const unreadReports = reports.filter((r) => !r.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <Button variant={source === "contact" ? "default" : "outline"} size="sm" onClick={() => setSource("contact")}>
            <Mail className="mr-1.5 h-4 w-4" /> Contact
            {unreadCount > 0 && <Badge className="ml-1.5 border-0 bg-destructive text-[10px] text-destructive-foreground">{unreadCount}</Badge>}
          </Button>
          <Button variant={source === "reports" ? "default" : "outline"} size="sm" onClick={() => setSource("reports")}>
            <Flag className="mr-1.5 h-4 w-4" /> Signalements
            {unreadReports > 0 && <Badge className="ml-1.5 border-0 bg-destructive text-[10px] text-destructive-foreground">{unreadReports}</Badge>}
          </Button>
        </div>
        <div className="flex flex-1 gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="max-w-xs" />
          {source === "contact" && (
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="unread">Non lus</SelectItem>
                <SelectItem value="read">Lus</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" onClick={load} aria-label="Rafraîchir"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />)}</div>
      ) : source === "contact" ? (
        filteredMessages.length === 0 ? (
          <Card><CardContent className="p-6 text-center font-body text-sm text-muted-foreground">Aucun message pour le moment.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filteredMessages.map((m) => (
              <Card key={m.id} className={m.is_read ? "opacity-70" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-body text-sm font-semibold text-foreground">{m.name}</p>
                        <a href={`mailto:${m.email}`} className="font-body text-xs text-primary hover:underline">{m.email}</a>
                        {!m.is_read && <Badge className="border-0 bg-primary text-[10px] text-primary-foreground">Nouveau</Badge>}
                      </div>
                      {m.subject && <p className="mt-0.5 font-body text-xs font-medium text-foreground">{m.subject}</p>}
                      <p className="mt-1 whitespace-pre-line font-body text-sm text-muted-foreground">{m.message}</p>
                      <p className="mt-1 font-body text-[11px] text-muted-foreground">
                        {new Date(m.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleRead(m)} aria-label={m.is_read ? "Marquer non lu" : "Marquer lu"}>
                        {m.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(m.id)} aria-label="Supprimer">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        reports.length === 0 ? (
          <Card><CardContent className="p-6 text-center font-body text-sm text-muted-foreground">Aucun signalement pour le moment.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <Card key={r.id} className={r.is_read ? "opacity-70" : ""}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{r.type}</Badge>
                      {!r.is_read && <Badge className="border-0 bg-primary text-[10px] text-primary-foreground">Nouveau</Badge>}
                    </div>
                    <p className="mt-1 font-body text-sm text-foreground">{r.events?.title || "Activité"}</p>
                    <p className="font-body text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!r.is_read && <Button variant="ghost" size="sm" onClick={() => markReportRead(r)}>Marquer lu</Button>}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default AdminMessagesManager;
