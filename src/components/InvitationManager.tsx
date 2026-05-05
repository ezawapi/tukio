import { useState, useEffect } from "react";
import { QrCode, Trash2, UserPlus, Copy, Check, MessageCircle, Mail, Clock, Infinity as InfinityIcon, RefreshCw, Ban } from "lucide-react";
import QrScanner from "@/components/QrScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InvitationManagerProps {
  eventId: string;
  eventTitle: string;
}

const generateQrToken = () => `tukio-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

type ExpiryPreset = "24h" | "7d" | "30d" | "event" | "never";

const InvitationManager = ({ eventId, eventTitle }: InvitationManagerProps) => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expiry, setExpiry] = useState<ExpiryPreset>("event");
  const [maxUses, setMaxUses] = useState<string>("1");
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

  const computeExpiresAt = async (preset: ExpiryPreset): Promise<string | null> => {
    const now = new Date();
    if (preset === "never") return null;
    if (preset === "24h") return new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    if (preset === "7d") return new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
    if (preset === "30d") return new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
    if (preset === "event") {
      const { data } = await supabase
        .from("events")
        .select("end_date, date")
        .eq("id", eventId)
        .maybeSingle();
      const target = (data?.end_date || data?.date) as string | undefined;
      return target ? new Date(target).toISOString() : null;
    }
    return null;
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
    const expires_at = await computeExpiresAt(expiry);
    const max_uses = maxUses === "" || maxUses === "0" ? null : Math.max(1, parseInt(maxUses, 10) || 1);

    const { error } = await supabase.from("event_invitations").insert({
      event_id: eventId,
      invited_by: user.id,
      invited_name: name.trim(),
      invited_email: email.trim() || null,
      qr_code_token: qrToken,
      status: "pending",
      expires_at,
      max_uses,
    });

    setAdding(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation créée !", description: "Partagez le lien ou le QR code." });
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

  const regenerateToken = async (id: string) => {
    const newToken = generateQrToken();
    const { error } = await supabase
      .from("event_invitations")
      .update({ qr_code_token: newToken, uses_count: 0, claimed_at: null, invited_user_id: null })
      .eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Lien régénéré" }); fetchInvitations(); }
  };

  const markAsPresent = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("event_invitations").update({
      attendance_status: "scanned",
      scanned_at: new Date().toISOString(),
      scanned_by: user?.id || null,
    }).eq("id", id);
    toast({ title: "Marqué comme présent !" });
    fetchInvitations();
  };

  const handleQrScan = async (token: string) => {
    const inv = invitations.find((i) => i.qr_code_token === token);
    if (!inv) {
      toast({ title: "QR non reconnu", variant: "destructive" });
      return;
    }
    if (inv.attendance_status === "scanned") {
      toast({ title: "Déjà scanné", description: `${inv.invited_name} déjà présent(e).` });
      return;
    }
    await markAsPresent(inv.id);
  };

  const getInviteUrl = (token: string) => `${window.location.origin}/invite/${token}`;
  const getQrImageUrl = (token: string) => {
    const url = encodeURIComponent(getInviteUrl(token));
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getInviteUrl(token));
    setCopiedId(token);
    toast({ title: "Lien copié !" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareViaWhatsApp = (inv: any) => {
    const url = getInviteUrl(inv.qr_code_token);
    const text = `🎉 Vous êtes invité(e) à "${eventTitle}".\n\nAccédez à votre invitation (un compte sera demandé) :\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaMail = (inv: any) => {
    const url = getInviteUrl(inv.qr_code_token);
    const subject = `Invitation : ${eventTitle}`;
    const body = `Bonjour ${inv.invited_name || ""},\n\nVous êtes invité(e) à "${eventTitle}".\n\nPour accéder à l'événement, ouvrez ce lien et créez un compte (ou connectez-vous) :\n${url}\n\nÀ bientôt !`;
    window.open(`mailto:${inv.invited_email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const isExpired = (inv: any) => inv.expires_at && new Date(inv.expires_at) <= new Date();
  const isUsedUp = (inv: any) => inv.max_uses != null && (inv.uses_count || 0) >= inv.max_uses;
  const isRevoked = (inv: any) => !!inv.revoked_at;
  const remainingUses = (inv: any) => inv.max_uses != null ? Math.max(0, inv.max_uses - (inv.uses_count || 0)) : null;

  const RESEND_COOLDOWN_MS = 60_000;
  const resendCooldownLeft = (inv: any) => {
    if (!inv.last_sent_at) return 0;
    const left = RESEND_COOLDOWN_MS - (Date.now() - new Date(inv.last_sent_at).getTime());
    return Math.max(0, left);
  };

  const resendByEmail = async (inv: any) => {
    if (!inv.invited_email) {
      toast({ title: "Aucun email enregistré", description: "Ajoutez un email à l'invitation pour la renvoyer.", variant: "destructive" });
      return;
    }
    const left = resendCooldownLeft(inv);
    if (left > 0) {
      toast({ title: "Patientez", description: `Vous pourrez renvoyer dans ${Math.ceil(left / 1000)}s.`, variant: "destructive" });
      return;
    }
    // Server-side rate limit (defense in depth, beyond UI cooldown)
    const { data, error } = await supabase.rpc("mark_invitation_resent" as any, { _invitation_id: inv.id });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    const row: any = Array.isArray(data) ? data[0] : data;
    if (!row?.success) {
      if (row?.message === "cooldown") {
        toast({ title: "Trop de renvois", description: `Veuillez patienter ${row.wait_seconds || 60}s avant de renvoyer.`, variant: "destructive" });
      } else {
        toast({ title: "Action refusée", description: row?.message || "Impossible de renvoyer.", variant: "destructive" });
      }
      fetchInvitations();
      return;
    }
    shareViaMail(inv);
    toast({ title: "Email préparé", description: `Renvoi à ${inv.invited_email}` });
    fetchInvitations();
  };

  const revokeInvitation = async (id: string) => {
    if (!confirm("Révoquer cette invitation ? Le lien et le QR code seront immédiatement invalides. L'historique est conservé.")) return;
    const { error } = await (supabase.from("event_invitations") as any)
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Invitation révoquée" }); fetchInvitations(); }
  };

  const presentCount = invitations.filter((i) => i.attendance_status === "scanned").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 font-display text-lg">
          <QrCode className="h-5 w-5 text-primary" />
          Invitations privées ({invitations.length})
          {presentCount > 0 && <Badge variant="secondary">{presentCount} présent(s)</Badge>}
          <div className="ml-auto">
            <QrScanner onScan={handleQrScan} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Nom de l'invité *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Dupont" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email (optionnel)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expiration du lien</Label>
              <Select value={expiry} onValueChange={(v) => setExpiry(v as ExpiryPreset)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 heures</SelectItem>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="event">Jusqu'à la fin de l'événement</SelectItem>
                  <SelectItem value="never">Jamais (lien ouvert)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Utilisations max (vide = illimité)</Label>
              <Input type="number" min="0" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="1" className="h-9" />
            </div>
          </div>
          <Button onClick={addInvitation} disabled={adding} size="sm" className="gap-2 border-0 gradient-hero text-primary-foreground">
            <UserPlus className="h-4 w-4" />
            {adding ? "Ajout..." : "Créer l'invitation"}
          </Button>
        </div>

        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : invitations.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucune invitation pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {invitations.map((inv) => {
              const expired = isExpired(inv);
              const usedUp = isUsedUp(inv);
              const revoked = isRevoked(inv);
              const blocked = expired || usedUp || revoked;
              const cooldownLeft = resendCooldownLeft(inv);
              return (
                <div key={inv.id} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-semibold text-foreground truncate">{inv.invited_name}</p>
                    {inv.invited_email && <p className="font-body text-xs text-muted-foreground truncate">{inv.invited_email}</p>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {revoked ? (
                        <>
                          <Badge variant="destructive" className="text-[10px] gap-1"><Ban className="h-3 w-3" />Révoquée</Badge>
                          <Badge variant="outline" className="text-[10px]">
                            le {new Date(inv.revoked_at).toLocaleDateString("fr-FR")} · {inv.uses_count || 0} util.
                          </Badge>
                        </>
                      ) : usedUp ? (
                        <Badge variant="destructive" className="text-[10px]">Utilisé</Badge>
                      ) : expired ? (
                        <Badge variant="destructive" className="text-[10px] gap-1"><Clock className="h-3 w-3" />Expiré</Badge>
                      ) : (
                        <Badge variant={inv.attendance_status === "scanned" ? "default" : "secondary"} className="text-[10px]">
                          {inv.attendance_status === "scanned" ? "✅ Présent" : inv.invited_user_id ? "Compte lié" : "En attente"}
                        </Badge>
                      )}
                      {!expired && !usedUp && !revoked && inv.expires_at && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Clock className="h-3 w-3" />Exp. {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
                        </Badge>
                      )}
                      {!inv.expires_at && !revoked && (
                        <Badge variant="outline" className="text-[10px] gap-1"><InfinityIcon className="h-3 w-3" />Lien ouvert</Badge>
                      )}
                      {inv.max_uses != null && (
                        <Badge variant={usedUp ? "destructive" : "outline"} className="text-[10px]">
                          {remainingUses(inv)} restant(s) · {inv.uses_count || 0}/{inv.max_uses}
                        </Badge>
                      )}
                      {inv.invited_email && (
                        <Badge variant="outline" className="text-[10px]">Email vérifié requis</Badge>
                      )}
                      {inv.last_sent_at && (
                        <Badge variant="outline" className="text-[10px]">Envoyé {new Date(inv.last_sent_at).toLocaleDateString("fr-FR")}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => copyLink(inv.qr_code_token)} className="h-8 text-xs gap-1" title="Copier le lien d'invitation" disabled={blocked}>
                      {copiedId === inv.qr_code_token ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">Copier</span>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-8" disabled={blocked}>
                          <QrCode className="h-3.5 w-3.5" /> QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="text-center">QR Code — {inv.invited_name}</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          <img src={getQrImageUrl(inv.qr_code_token)} alt="QR Code" className="h-48 w-48 rounded-lg border border-border" />
                          <p className="text-xs text-muted-foreground text-center max-w-[280px] break-all">{getInviteUrl(inv.qr_code_token)}</p>
                          <p className="text-[11px] text-center text-muted-foreground">
                            L'invité devra créer un compte ou se connecter pour accéder à l'événement.
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => copyLink(inv.qr_code_token)} className="gap-1">
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

                    {inv.invited_email && (
                      <Button
                        variant="outline" size="sm"
                        onClick={() => resendByEmail(inv)}
                        className="h-8 text-xs gap-1"
                        title={cooldownLeft > 0 ? `Réessayez dans ${Math.ceil(cooldownLeft / 1000)}s` : "Renvoyer par email"}
                        disabled={blocked || cooldownLeft > 0}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {cooldownLeft > 0 ? `${Math.ceil(cooldownLeft / 1000)}s` : "Renvoyer"}
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => regenerateToken(inv.id)} className="h-8 text-xs gap-1" title="Régénérer le lien (invalide l'ancien)" disabled={revoked}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>

                    {!revoked && (
                      <Button variant="ghost" size="sm" onClick={() => revokeInvitation(inv.id)} className="h-8 text-xs gap-1 text-destructive hover:text-destructive" title="Révoquer immédiatement (invalide le lien et le QR)">
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {inv.attendance_status !== "scanned" && !revoked && (
                      <Button variant="outline" size="sm" onClick={() => markAsPresent(inv.id)} className="h-8 text-xs gap-1">
                        <Check className="h-3.5 w-3.5" /> Présent
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => deleteInvitation(inv.id)} className="h-8 text-xs text-destructive hover:text-destructive" title="Supprimer définitivement">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvitationManager;
