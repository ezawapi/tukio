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
}

const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      const { data, error } = await supabase.rpc("get_invitation_preview", { _token: token });
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setError("Cette invitation est introuvable ou a été supprimée.");
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        setPreview(row as InvitePreview);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  // Auto-redeem when user is logged in
  useEffect(() => {
    const tryRedeem = async () => {
      if (authLoading || !user || !token || !preview) return;
      if (preview.is_expired || preview.is_used_up) return;
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
        const msg: Record<string, string> = {
          expired: "Cette invitation a expiré.",
          used_up: "Cette invitation a atteint son nombre maximum d'utilisations.",
          already_claimed: "Cette invitation a déjà été utilisée par un autre compte.",
          email_mismatch: "Cette invitation est nominative : connectez-vous avec l'email auquel elle a été envoyée.",
          not_found: "Invitation introuvable.",
          auth_required: "Connexion requise.",
        };
        setError(msg[row?.message || ""] || "Impossible d'accepter cette invitation.");
      }
    };
    tryRedeem();
  }, [user, authLoading, token, preview]);

  const goToAuth = () => {
    // Preserve invite link to redirect back after sign-in
    const target = `/invite/${token}`;
    sessionStorage.setItem("post_auth_redirect", target);
    navigate(`/auth?redirect=${encodeURIComponent(target)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
              <p className="font-body text-sm text-muted-foreground">{error}</p>
              <Link to="/">
                <Button variant="outline" size="sm">Retour à l'accueil</Button>
              </Link>
            </CardContent>
          </Card>
        ) : preview ? (
          <Card className="overflow-hidden">
            {preview.event_image_url && (
              <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                <img src={preview.event_image_url} alt={preview.event_title} className="h-full w-full object-cover" />
              </div>
            )}
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
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

              {preview.is_expired ? (
                <div className="rounded-lg bg-destructive/10 p-4 text-center">
                  <AlertTriangle className="mx-auto h-6 w-6 text-destructive mb-2" />
                  <p className="font-body text-sm text-destructive">Cette invitation a expiré.</p>
                </div>
              ) : preview.is_used_up ? (
                <div className="rounded-lg bg-destructive/10 p-4 text-center">
                  <AlertTriangle className="mx-auto h-6 w-6 text-destructive mb-2" />
                  <p className="font-body text-sm text-destructive">Cette invitation a atteint son nombre maximum d'utilisations.</p>
                </div>
              ) : !user ? (
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
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default InvitePage;
