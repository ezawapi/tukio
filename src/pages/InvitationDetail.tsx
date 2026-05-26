import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  QrCode, ArrowLeft, Calendar, MapPin, Mail, Ban, Clock, Copy, Check,
  MessageCircle, RefreshCw, Trash2, Camera, ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import QrScanner from "@/components/QrScanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const InvitationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inv, setInv] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("event_invitations")
      .select("*, events(id, title, date, end_date, location, city, image_url, organizer_id, organizer_name, visibility, is_published, status)")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      toast({ title: "Invitation introuvable", variant: "destructive" });
      navigate("/profile");
      return;
    }
    setInv(data);
    setEvent(data.events);
    setIsOrganizer(!!user && data.events?.organizer_id === user.id);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user?.id]);

  if (loading || !inv) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-10 text-center text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  const expired = inv.expires_at && new Date(inv.expires_at) <= new Date();
  const usedUp = inv.max_uses != null && (inv.uses_count || 0) >= inv.max_uses;
  const revoked = !!inv.revoked_at;
  const scanned = inv.attendance_status === "scanned";
  const blocked = expired || usedUp || revoked;

  const inviteUrl = `${window.location.origin}/invite/${inv.qr_code_token}`;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(inviteUrl)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast({ title: "Lien copié" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWA = () => {
    const text = `🎉 Invitation : "${event?.title}"\n${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareMail = () => {
    const subj = `Invitation : ${event?.title}`;
    const body = `Bonjour ${inv.invited_name || ""},\n\nVous êtes invité(e) à "${event?.title}".\nLien : ${inviteUrl}`;
    window.open(`mailto:${inv.invited_email || ""}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`);
  };

  const cancel = async () => {
    if (!confirm("Annuler/révoquer cette invitation ? Le lien sera invalide.")) return;
    const { error } = await (supabase.from("event_invitations") as any)
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", inv.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Invitation annulée" }); load(); }
  };

  const regenerate = async () => {
    if (!confirm("Régénérer le lien ? L'ancien QR code deviendra invalide.")) return;
    const newToken = `tukio-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    const { error } = await supabase
      .from("event_invitations")
      .update({ qr_code_token: newToken, uses_count: 0, claimed_at: null, invited_user_id: null, revoked_at: null })
      .eq("id", inv.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Lien régénéré" }); load(); }
  };

  const markPresent = async () => {
    const { error } = await supabase.from("event_invitations").update({
      attendance_status: "scanned",
      scanned_at: new Date().toISOString(),
      scanned_by: user?.id || null,
    }).eq("id", inv.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Marqué présent" }); load(); }
  };

  const handleScan = async (token: string) => {
    if (token !== inv.qr_code_token) {
      toast({ title: "QR non lié à cette invitation", variant: "destructive" });
      return;
    }
    if (scanned) { toast({ title: "Déjà scanné" }); return; }
    await markPresent();
  };

  const deleteInv = async () => {
    if (!confirm("Supprimer définitivement cette invitation ?")) return;
    const { error } = await supabase.from("event_invitations").delete().eq("id", inv.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Supprimée" }); navigate("/profile"); }
  };

  const statusBadge = () => {
    if (revoked) return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Révoquée</Badge>;
    if (scanned) return <Badge className="bg-green-600 hover:bg-green-600">✅ Présent</Badge>;
    if (usedUp) return <Badge variant="destructive">Utilisée</Badge>;
    if (expired) return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />Expirée</Badge>;
    if (inv.claimed_at) return <Badge>Acceptée</Badge>;
    return <Badge variant="secondary">En attente</Badge>;
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      <main className="container max-w-3xl py-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="font-display text-2xl truncate">{event?.title || "Événement"}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  {statusBadge()}
                  {inv.expires_at && !blocked && (
                    <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Exp. {format(new Date(inv.expires_at), "d MMM yyyy", { locale: fr })}</Badge>
                  )}
                  {inv.max_uses != null && (
                    <Badge variant="outline">{inv.uses_count || 0}/{inv.max_uses} utilisations</Badge>
                  )}
                </div>
              </div>
              {event?.image_url && (
                <img src={event.image_url} alt="" className="h-20 w-20 rounded-lg object-cover border border-border" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid sm:grid-cols-2 gap-3 text-muted-foreground">
              {event?.date && (
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{format(new Date(event.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}</div>
              )}
              {(event?.city || event?.location) && (
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{event.city || event.location}</div>
              )}
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />Invité : {inv.invited_name || inv.invited_email || "—"}</div>
              <div className="text-xs">Reçue {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true, locale: fr })}</div>
            </div>
            {event?.id && (
              <Link to={`/events/${event.id}`} className="inline-flex items-center gap-1 text-primary text-sm hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Voir la page de l'événement
              </Link>
            )}
          </CardContent>
        </Card>

        {!blocked && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> Votre QR code d'accès
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <img src={qrImg} alt="QR code invitation" className="h-64 w-64 rounded-lg border border-border bg-white p-2" />
              <p className="text-xs text-muted-foreground text-center break-all max-w-md">{inviteUrl}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="outline" onClick={copyLink} className="gap-1">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copier le lien
                </Button>
                <Button size="sm" variant="outline" onClick={shareWA} className="gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={shareMail} className="gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
                <Link to={`/invite/${inv.qr_code_token}`}>
                  <Button size="sm" className="gap-1 gradient-hero text-primary-foreground border-0">
                    <QrCode className="h-3.5 w-3.5" /> Ouvrir l'invitation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {isOrganizer && !scanned && !revoked && (
              <>
                <QrScanner onScan={handleScan} />
                <Button variant="outline" size="sm" onClick={markPresent} className="gap-1">
                  <Check className="h-4 w-4" /> Marquer présent
                </Button>
              </>
            )}
            {isOrganizer && !revoked && (
              <Button variant="outline" size="sm" onClick={regenerate} className="gap-1">
                <RefreshCw className="h-4 w-4" /> Régénérer le lien
              </Button>
            )}
            {!revoked && (
              <Button variant="destructive" size="sm" onClick={cancel} className="gap-1">
                <Ban className="h-4 w-4" /> Annuler l'invitation
              </Button>
            )}
            {isOrganizer && (
              <Button variant="ghost" size="sm" onClick={deleteInv} className="gap-1 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" /> Supprimer
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default InvitationDetail;
