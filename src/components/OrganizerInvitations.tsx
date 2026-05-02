import { useEffect, useState } from "react";
import { QrCode, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import InvitationManager from "@/components/InvitationManager";

interface OrganizerInvitationsProps {
  userId: string;
}

const OrganizerInvitations = ({ userId }: OrganizerInvitationsProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date, city")
        .eq("organizer_id", userId)
        .eq("visibility", "private")
        .order("date", { ascending: false });
      setEvents(data || []);
      if (data && data.length === 1) setOpenId(data[0].id);
    };
    load();
  }, [userId]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" /> Mes événements privés & invitations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">
            Vous n'avez aucun événement privé. Créez un événement avec la visibilité « Privé & Exclusif » pour gérer les invitations ici.
          </p>
        ) : (
          events.map((ev) => {
            const open = openId === ev.id;
            return (
              <div key={ev.id} className="rounded-xl border border-border">
                <Button
                  variant="ghost"
                  onClick={() => setOpenId(open ? null : ev.id)}
                  className="w-full justify-between rounded-xl px-4 py-3 h-auto"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-body font-semibold text-foreground truncate">{ev.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ev.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      {ev.city && ` · ${ev.city}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Privé</Badge>
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </Button>
                {open && (
                  <div className="border-t border-border p-3">
                    <InvitationManager eventId={ev.id} eventTitle={ev.title} />
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
