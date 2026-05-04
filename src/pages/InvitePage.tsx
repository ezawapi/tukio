import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Lock, LogIn, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InvitePreview {
  event_id: string;
  event_title: string;
  event_date: string;
  event_end_date: string | null;
  event_location: string;
  event_city: string;
  event_image_url: string | null;
  organizer_name: string | null;
  invited_name: string | null;
  invited_email: string | null;
  expires_at: string | null;
  is_expired: boolean;
  is_used_up: boolean;
  is_revoked?: boolean;
}

const ERROR_LABELS: Record<string, { title: string; desc: string }> = {
  expired: { title: "Invitation expirée", desc: "La date limite de cette invitation est dépassée. Demandez une nouvelle invitation à l'organisateur." },
  used_up: { title: "Invitation utilisée", desc: "Cette invitation a atteint son nombre maximum d'utilisations." },
  revoked: { title: "Invitation révoquée", desc: "Cette invitation a été désactivée par l'organisateur." },
  already_claimed: { title: "Déjà utilisée", desc: "Cette invitation a déjà été liée à un autre compte." },
  email_mismatch: { title: "Email différent", desc: "Cette invitation est nominative. Connectez-vous avec l'email auquel elle a été envoyée." },
  not_found: { title: "Invitation introuvable", desc: "Le lien est invalide ou a été supprimé." },
  auth_required: { title: "Connexion requise", desc: "Connectez-vous pour accéder à l'événement." },
};

const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      const { data, error } = await supabase.rpc("get_invitation_preview", { _token: token });
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setErrorCode("not_found");
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        setPreview(row as InvitePreview);
        if ((row as any).is_revoked) setErrorCode("revoked");
        else if ((row as any).is_expired) setErrorCode("expired");
        else if ((row as any).is_used_up) setErrorCode("used_up");
      }
      setLoading(false);
    };
    load();
  }, [token]);

  // Auto-redeem when user is logged in
  useEffect(() => {
    const tryRedeem = async () => {
      if (authLoading || !user || !token || !preview) return;
      if (preview.is_expired || preview.is_used_up || preview.is_revoked) return;
      setRedeeming(true);
      const { data, error } = await supabase.rpc("redeem_invitation", { _token: token });
      setRedeeming(false);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.success) {
        toast({ title: "Invitation acceptée 🎉", description: "Vous avez accès à l'événement." });
        navigate(`/events/${row.event_id}`, { replace: true });
      } else {
        setErrorCode(row?.message || "not_found");
      }
    };
    tryRedeem();
  }, [user, authLoading, token, preview]);

  const goToAuth = () => {
    const target = `/invite/${token}`;
    sessionStorage.setItem("post_auth_redirect", target);
    navigate(`/auth?redirect=${encodeURIComponent(target)}`);
  };

  const switchAccount = async () => {
    await supabase.auth.signOut();
    setErrorCode(null);
    goToAuth();
  };

  const requestNewInvitation = () => {
    const subject = `Nouvelle invitation : ${preview?.event_title || ""}`;
    const body = `Bonjour,\n\nMon invitation pour "${preview?.event_title || ""}" n'est plus valable. Pourriez-vous m'envoyer une nouvelle invitation ?\n\nMerci !`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const renderAccessDenied = () => {
    if (!errorCode) return null;
    const meta = ERROR_LABELS[errorCode] || { title: "Accès refusé", desc: "Impossible d'accepter cette invitation." };
    return (
      <div className="rounded-lg bg-destructive/10 p-5 text-center space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <div>
          <p className="font-display text-base font-semibold text-foreground">{meta.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{meta.desc}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {errorCode === "email_mismatch" || errorCode === "already_claimed" ? (
            <Button onClick={switchAccount} size="sm" className="gap-2"><LogIn className="h-4 w-4" /> Changer de compte</Button>
          ) : !user ? (
            <Button onClick={goToAuth} size="sm" className="gap-2"><LogIn className="h-4 w-4" /> Se connecter</Button>
          ) : null}
          <Button onClick={requestNewInvitation} size="sm" variant="outline">Demander une nouvelle invitation</Button>
          <Link to="/"><Button size="sm" variant="ghost">Accueil</Button></Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !preview ? (
          <Card><CardContent className="py-12">{renderAccessDenied()}</CardContent></Card>
        ) : (
          <Card className="overflow-hidden">
            {preview.event_image_url && (
              <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                <img src={preview.event_image_url} alt={preview.event_title} className="h-full w-full object-cover" />
              </div>
            )}
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Événement privé</Badge>
                {preview.expires_at && !preview.is_expired && (
                  <Badge variant="outline" className="text-[10px]">
                    Expire le {format(new Date(preview.expires_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">{preview.event_title}</h1>
                {preview.organizer_name && (
                  <p className="mt-1 font-body text-sm text-muted-foreground">Par {preview.organizer_name}</p>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{format(new Date(preview.event_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <span>{[preview.event_location, preview.event_city].filter(Boolean).join(", ")}</span>
                </div>
              </div>

              {preview.invited_name && (
                <p className="rounded-lg bg-primary/5 p-3 text-sm">
                  <span className="text-muted-foreground">Invitation pour : </span>
                  <span className="font-semibold text-foreground">{preview.invited_name}</span>
                  {preview.invited_email && <span className="text-muted-foreground"> · {preview.invited_email}</span>}
                </p>
              )}

              {errorCode ? renderAccessDenied() : !user ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Pour accéder à cet événement privé, créez un compte ou connectez-vous. Votre invitation sera automatiquement liée à votre compte.
                  </p>
                  <Button onClick={goToAuth} className="w-full gap-2 gradient-hero border-0 text-primary-foreground">
                    <LogIn className="h-4 w-4" />
                    Se connecter / Créer un compte
                  </Button>
                </div>
              ) : redeeming ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Validation de votre invitation...
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Redirection en cours...
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default InvitePage;
