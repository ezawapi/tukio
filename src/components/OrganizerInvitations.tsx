import { useEffect, useState } from "react";
import { QrCode, Users, CheckCircle, Clock3, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrganizerInvitationsProps {
  userId: string;
}

const OrganizerInvitations = ({ userId }: OrganizerInvitationsProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<Record<string, any[]>>({});
  const [newEmail, setNewEmail] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPrivateEvents();
  }, [userId]);

  const fetchPrivateEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, date, city")
      .eq("organizer_id", userId)
      .eq("visibility", "private")
      .order("date", { ascending: false });

    setEvents(data || []);
    if (data && data.length > 0) {
      const invMap: Record<string, any[]> = {};
      await Promise.all(
        data.map(async (ev) => {
          const { data: inv } = await supabase
            .from("event_invitations")
            .select("*")
            .eq("event_id", ev.id)
            .order("created_at", { ascending: false });
          invMap[ev.id] = inv || [];
        }),
      );
      setInvitations(invMap);
    }
  };

  const addInvitation = async (eventId: string) => {
    const email = newEmail[eventId]?.trim();
    const name = newName[eventId]?.trim();
    if (!email && !name) { toast.error("Email ou nom requis"); return; }

    const token = crypto.randomUUID();
    const { error } = await supabase.from("event_invitations").insert({
      event_id: eventId,
      invited_by: userId,
      invited_email: email || null,
      invited_name: name || null,
      qr_code_token: token,
    });

    if (error) { toast.error(error.message); return; }
    toast.success("Invitation créée !");
    setNewEmail((prev) => ({ ...prev, [eventId]: "" }));
    setNewName((prev) => ({ ...prev, [eventId]: "" }));
    fetchPrivateEvents();
  };

  const deleteInvitation = async (id: string) => {
    await supabase.from("event_invitations").delete().eq("id", id);
    toast.success("Invitation supprimée");
    fetchPrivateEvents();
  };

  const shareViaWhatsApp = (inv: any, eventTitle: string) => {
    const url = `${window.location.origin}/events/${inv.event_id}?qr=${inv.qr_code_token}`;
    const text = `Vous êtes invité(e) à "${eventTitle}" sur Tukio. Votre code QR : ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaEmail = (inv: any, eventTitle: string) => {
    const url = `${window.location.origin}/events/${inv.event_id}?qr=${inv.qr_code_token}`;
    const subject = `Invitation : ${eventTitle}`;
    const body = `Bonjour,\n\nVous êtes invité(e) à "${eventTitle}" sur Tukio.\n\nAccédez à votre invitation : ${url}\n\nÀ bientôt !`;
    window.open(`mailto:${inv.invited_email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" /> Mes événements privés & invitations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">
            Vous n'avez aucun événement privé. Créez un événement avec la visibilité « Privé & Exclusif » pour gérer les invitations ici.
          </p>
        ) : (
          events.map((ev) => {
            const evInvs = invitations[ev.id] || [];
            const scanned = evInvs.filter((i) => i.attendance_status === "scanned").length;
            return (
              <div key={ev.id} className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-body font-semibold text-foreground truncate">{ev.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 text-[10px]"><Users className="h-3 w-3" />{evInvs.length}</Badge>
                    <Badge variant="secondary" className="gap-1 text-[10px]"><CheckCircle className="h-3 w-3" />{scanned} présents</Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Nom" value={newName[ev.id] || ""} onChange={(e) => setNewName((p) => ({ ...p, [ev.id]: e.target.value }))} className="text-sm" />
                  <Input placeholder="Email" value={newEmail[ev.id] || ""} onChange={(e) => setNewEmail((p) => ({ ...p, [ev.id]: e.target.value }))} className="text-sm" />
                  <Button size="sm" onClick={() => addInvitation(ev.id)} className="gradient-hero border-0 text-primary-foreground whitespace-nowrap">
                    Inviter
                  </Button>
                </div>

                {evInvs.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {evInvs.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <span className="font-body font-medium text-foreground">{inv.invited_name || inv.invited_email || "Invité"}</span>
                          {inv.invited_email && <span className="ml-2 text-xs text-muted-foreground">{inv.invited_email}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {inv.attendance_status === "scanned" ? (
                            <Badge className="text-[10px] bg-[hsl(142,55%,38%)] text-primary-foreground">Présent</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1"><Clock3 className="h-3 w-3" />En attente</Badge>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shareViaWhatsApp(inv, ev.title)}><Send className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shareViaEmail(inv, ev.title)}><Send className="h-3 w-3 rotate-45" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteInvitation(inv.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizerInvitations;
