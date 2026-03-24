import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, Bell, BellOff, Moon, Sun, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Settings = () => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({ title: "Application installée !", description: "Tukio a été ajoutée à votre écran d'accueil." });
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast({ title: "Installation en cours..." });
      }
      setDeferredPrompt(null);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto max-w-2xl px-4 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Paramètres</h1>
            <p className="font-body text-muted-foreground mt-1">Gérez vos préférences et installez l'application</p>
          </div>

          {/* Install App */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Smartphone className="h-5 w-5 text-primary" />
                Installer l'application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstalled || isStandalone ? (
                <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4">
                  <Download className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-body font-semibold text-foreground">Application installée ✓</p>
                    <p className="font-body text-sm text-muted-foreground">Tukio est déjà sur votre appareil.</p>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted-foreground">
                    Installez Tukio sur votre appareil pour un accès rapide, même hors ligne.
                  </p>
                  <Button onClick={handleInstall} className="w-full gradient-hero text-primary-foreground border-0 gap-2">
                    <Download className="h-4 w-4" /> Installer Tukio
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted-foreground">
                    Installez Tukio directement depuis votre navigateur pour un accès rapide.
                  </p>
                  {isIOS ? (
                    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
                      <p className="font-body text-sm font-semibold text-foreground">📱 Instructions pour iPhone / iPad :</p>
                      <ol className="font-body text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                        <li>Appuyez sur le bouton <strong>Partager</strong> (icône ↑) en bas de Safari</li>
                        <li>Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
                        <li>Confirmez en appuyant <strong>"Ajouter"</strong></li>
                      </ol>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
                      <p className="font-body text-sm font-semibold text-foreground">📱 Instructions :</p>
                      <ol className="font-body text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                        <li>Ouvrez le <strong>menu</strong> de votre navigateur (⋮ ou ⋯)</li>
                        <li>Appuyez sur <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong></li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-border p-3 text-center">
                  <Monitor className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-body text-xs text-muted-foreground">Ordinateur</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">Compatible</Badge>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <Smartphone className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-body text-xs text-muted-foreground">Mobile</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">Compatible</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Info className="h-5 w-5 text-primary" />
                À propos de l'application
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="text-foreground font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plateforme</span>
                  <span className="text-foreground font-medium">
                    {isStandalone ? "Application installée" : "Navigateur web"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connexion</span>
                  <span className="text-foreground font-medium">
                    {navigator.onLine ? "En ligne" : "Hors ligne"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
