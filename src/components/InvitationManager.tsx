import { useState, useEffect } from "react";
import { QrCode, Trash2, Send, UserPlus, Copy, Check, MessageCircle, Mail } from "lucide-react";
import QrScanner from "@/components/QrScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InvitationManagerProps {
  eventId: string;
  eventTitle: string;
}

const generateQrToken = () => {
  return `tukio-${crypto.randomUUID().slice(0, 12)}`;
};

const InvitationManager = ({ eventId, eventTitle }: InvitationManagerProps) => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [eventId]);

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from("event_invitations")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    setInvitations(data || []);
    setLoading(false);
  };

  const addInvitation = async () => {
    if (!name.trim()) {
      toast({ title: "Nom requis", variant: "destructive" });
      return;
    }

    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Connectez-vous", variant: "destructive" });
      setAdding(false);
      return;
    }

    const qrToken = generateQrToken();

    const { error } = await supabase.from("event_invitations").insert({
      event_id: eventId,
      invited_by: user.id,
      invited_name: name.trim(),
      invited_email: email.trim() || null,
      qr_code_token: qrToken,
      status: "pending",
    });

    setAdding(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation créée !" });
      setName("");
      setEmail("");
      fetchInvitations();
    }
  };

  const deleteInvitation = async (id: string) => {
    await supabase.from("event_invitations").delete().eq("id", id);
    toast({ title: "Invitation supprimée" });
    fetchInvitations();
  };

  const markAsPresent = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("event_invitations").update({
      attendance_status: "present",
      scanned_at: new Date().toISOString(),
      scanned_by: user?.id || null,
    }).eq("id", id);
    toast({ title: "Marqué comme présent !" });
    fetchInvitations();
  };

  const handleQrScan = async (token: string) => {
    const inv = invitations.find((i) => i.qr_code_token === token);
    if (!inv) {
      toast({ title: "QR non reconnu", description: "Ce code ne correspond à aucun invité.", variant: "destructive" });
      return;
    }
    if (inv.attendance_status === "present") {
      toast({ title: "Déjà scanné", description: `${inv.invited_name} est déjà marqué(e) comme présent(e).` });
      return;
    }
    await markAsPresent(inv.id);
  };

  const getQrUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/events/${eventId}?qr=${token}`;
  };

  const getQrImageUrl = (token: string) => {
    const url = encodeURIComponent(getQrUrl(token));
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
  };

  const copyQrLink = (token: string) => {
    navigator.clipboard.writeText(getQrUrl(token));
    setCopiedId(token);
    toast({ title: "Lien copié !" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareViaWhatsApp = (inv: any) => {
    const url = getQrUrl(inv.qr_code_token);
    const text = `🎉 Vous êtes invité(e) à "${eventTitle}" !\n\nVoici votre invitation avec QR code :\n${url}\n\nPrésentez ce lien/QR code à l'entrée.`;
    window.open(`https://wa.me/${inv.invited_email?.includes("@") ? "" : inv.invited_email || ""}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaMail = (inv: any) => {
    const url = getQrUrl(inv.qr_code_token);
    const subject = `Invitation : ${eventTitle}`;
    const body = `Bonjour ${inv.invited_name},\n\nVous êtes invité(e) à "${eventTitle}" !\n\nAccédez à votre invitation ici :\n${url}\n\nPrésentez ce lien ou le QR code à l'entrée.\n\nCordialement,\nL'organisateur`;
    window.open(`mailto:${inv.invited_email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const presentCount = invitations.filter((i) => i.attendance_status === "present").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 font-display text-lg">
          <QrCode className="h-5 w-5 text-primary" />
          Invitations privées ({invitations.length})
          {presentCount > 0 && (
            <Badge variant="secondary">{presentCount} présent(s)</Badge>
          )}
          <div className="ml-auto">
            <QrScanner onScan={handleQrScan} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add invitation form */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Nom de l'invité *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Dupont" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email ou téléphone</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email ou +243..." className="h-9" />
            </div>
          </div>
          <Button onClick={addInvitation} disabled={adding} size="sm" className="gap-2 border-0 gradient-hero text-primary-foreground">
            <UserPlus className="h-4 w-4" />
            {adding ? "Ajout..." : "Ajouter l'invité"}
          </Button>
        </div>

        {/* Invitation list */}
        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : invitations.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucune invitation pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-foreground truncate">{inv.invited_name}</p>
                  <p className="font-body text-xs text-muted-foreground truncate">{inv.invited_email || "Pas de contact"}</p>
                  <Badge
                    variant={inv.attendance_status === "present" ? "default" : "secondary"}
                    className="mt-1 text-[10px]"
                  >
                    {inv.attendance_status === "present" ? "✅ Présent" : "En attente"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* QR Code dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-8">
                        <QrCode className="h-3.5 w-3.5" /> QR
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="text-center">QR Code — {inv.invited_name}</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4 py-4">
                        <img src={getQrImageUrl(inv.qr_code_token)} alt="QR Code" className="h-48 w-48 rounded-lg border border-border" />
                        <p className="text-xs text-muted-foreground text-center max-w-[280px] break-all">{getQrUrl(inv.qr_code_token)}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => copyQrLink(inv.qr_code_token)} className="gap-1">
                            {copiedId === inv.qr_code_token ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            Copier
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => shareViaWhatsApp(inv)} className="gap-1">
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => shareViaMail(inv)} className="gap-1">
                            <Mail className="h-3.5 w-3.5" /> Email
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" onClick={() => shareViaWhatsApp(inv)} className="h-8 text-xs gap-1">
                    <Send className="h-3.5 w-3.5" />
                  </Button>

                  {inv.attendance_status !== "present" && (
                    <Button variant="outline" size="sm" onClick={() => markAsPresent(inv.id)} className="h-8 text-xs gap-1">
                      <Check className="h-3.5 w-3.5" /> Présent
                    </Button>
                  )}

                  <Button variant="ghost" size="sm" onClick={() => deleteInvitation(inv.id)} className="h-8 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvitationManager;
