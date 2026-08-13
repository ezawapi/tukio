import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setIsRecovery(true);
        setChecking(false);
      }
    });

    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash") || hash.get("token_hash");
        const type = url.searchParams.get("type") || hash.get("type");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (code) {
          // PKCE / magic link flow
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && mounted) setIsRecovery(true);
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && mounted) setIsRecovery(true);
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "recovery",
          });
          if (!error && mounted) setIsRecovery(true);
        } else {
          const { data } = await supabase.auth.getSession();
          if (data.session && mounted) setIsRecovery(true);
        }
      } catch {
        /* lien invalide */
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast({ title: "Erreur", description: "8 caractères minimum, avec au moins une lettre et un chiffre.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: "Mot de passe mis à jour !" });
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-primary" />
            <h2 className="font-display text-xl font-bold">Mot de passe mis à jour</h2>
            <p className="text-muted-foreground font-body text-sm">Redirection en cours…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <h2 className="font-display text-xl font-bold">Lien invalide ou expiré</h2>
            <p className="text-muted-foreground font-body text-sm">
              Veuillez demander un nouveau lien de réinitialisation depuis la page de connexion.
            </p>
            <Button onClick={() => navigate("/auth")} className="mt-2">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="font-display text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription className="font-body">
            Choisissez un nouveau mot de passe sécurisé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-body">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="font-body">Confirmer le mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full gradient-hero text-primary-foreground border-0" disabled={loading}>
              {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
