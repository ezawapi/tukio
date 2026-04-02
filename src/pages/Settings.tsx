import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, Bell, BellOff, Info, MapPin, Calendar as CalendarIcon, Sun, Moon, Type, Languages } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const REMINDER_OPTIONS = [
  { value: "0", label: "Désactivé" },
  { value: "2", label: "2 jours avant" },
  { value: "3", label: "3 jours avant" },
  { value: "5", label: "5 jours avant" },
  { value: "7", label: "7 jours avant" },
];

const TEXT_SIZE_OPTIONS = [
  { value: "small", label: "Petit" },
  { value: "medium", label: "Moyen" },
  { value: "large", label: "Grand" },
];

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const Settings = () => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [nearbyNotif, setNearbyNotif] = useState(() => localStorage.getItem("tukio_notify_nearby") === "true");
  const [reminderDays, setReminderDays] = useState(() => localStorage.getItem("tukio_reminder_days") || "1");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("tukio_dark_mode") === "true" || document.documentElement.classList.contains("dark"));
  const [textSize, setTextSize] = useState(() => localStorage.getItem("tukio_text_size") || "medium");
  const [language, setLanguage] = useState(() => localStorage.getItem("tukio_language") || "fr");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({ title: "Application installée !", description: "Tukio a été ajoutée à votre écran d'accueil." });
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("tukio_dark_mode", String(darkMode));
  }, [darkMode]);

  // Apply text size
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-size-small", "text-size-large");
    if (textSize === "small") root.classList.add("text-size-small");
    else if (textSize === "large") root.classList.add("text-size-large");
    localStorage.setItem("tukio_text_size", textSize);
  }, [textSize]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") toast({ title: "Installation en cours..." });
      setDeferredPrompt(null);
    }
  };

  const toggleNearbyNotif = (checked: boolean) => {
    setNearbyNotif(checked);
    localStorage.setItem("tukio_notify_nearby", String(checked));
    toast({ title: checked ? "Notifications activées" : "Notifications désactivées" });
  };

  const changeReminderDays = (value: string) => {
    setReminderDays(value);
    localStorage.setItem("tukio_reminder_days", value);
    toast({ title: value === "0" ? "Rappels désactivés" : `Rappel activé : ${value} jour(s) avant` });
  };

  const changeLanguage = (value: string) => {
    setLanguage(value);
    localStorage.setItem("tukio_language", value);
    toast({ title: value === "fr" ? "Langue : Français" : "Language: English" });
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto max-w-2xl px-4 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Paramètres</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Gérez vos préférences et installez l'application</p>
          </div>

          {/* Appearance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Sun className="h-5 w-5 text-primary" />
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {darkMode ? <Moon className="h-4 w-4 text-primary shrink-0" /> : <Sun className="h-4 w-4 text-primary shrink-0" />}
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">Mode sombre</Label>
                    <p className="font-body text-xs text-muted-foreground">Basculer entre clair et sombre</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Type className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">Taille du texte</Label>
                    <p className="font-body text-xs text-muted-foreground">Ajuster la taille d'affichage</p>
                  </div>
                </div>
                <Select value={textSize} onValueChange={(v) => { setTextSize(v); toast({ title: `Taille : ${TEXT_SIZE_OPTIONS.find(o => o.value === v)?.label}` }); }}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXT_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Languages className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">Langue</Label>
                    <p className="font-body text-xs text-muted-foreground">Choisir la langue de l'interface</p>
                  </div>
                </div>
                <Select value={language} onValueChange={changeLanguage}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Install App */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Smartphone className="h-5 w-5 text-primary" />
                Installer l'application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstalled || isStandalone ? (
                <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-3">
                  <Download className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-body font-semibold text-foreground text-sm">Application installée ✓</p>
                    <p className="font-body text-xs text-muted-foreground">Tukio est déjà sur votre appareil.</p>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted-foreground">Installez Tukio pour un accès rapide, même hors ligne.</p>
                  <Button onClick={handleInstall} className="w-full gradient-hero text-primary-foreground border-0 gap-2">
                    <Download className="h-4 w-4" /> Installer Tukio
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted-foreground">Installez Tukio directement depuis votre navigateur.</p>
                  {isIOS ? (
                    <div className="rounded-xl border border-border bg-muted/50 p-3 space-y-2">
                      <p className="font-body text-sm font-semibold text-foreground">📱 iPhone / iPad :</p>
                      <ol className="font-body text-xs text-muted-foreground list-decimal pl-4 space-y-1">
                        <li>Appuyez sur <strong>Partager</strong> (↑) en bas de Safari</li>
                        <li>Appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
                        <li>Confirmez avec <strong>"Ajouter"</strong></li>
                      </ol>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/50 p-3 space-y-2">
                      <p className="font-body text-sm font-semibold text-foreground">📱 Android / Desktop :</p>
                      <ol className="font-body text-xs text-muted-foreground list-decimal pl-4 space-y-1">
                        <li>Ouvrez le <strong>menu</strong> du navigateur (⋮)</li>
                        <li>Appuyez sur <strong>"Installer l'application"</strong></li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg border border-border p-2 text-center">
                  <Monitor className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-body text-[10px] text-muted-foreground">Ordinateur</p>
                  <Badge variant="outline" className="mt-0.5 text-[9px]">Compatible</Badge>
                </div>
                <div className="rounded-lg border border-border p-2 text-center">
                  <Smartphone className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-body text-[10px] text-muted-foreground">Mobile</p>
                  <Badge variant="outline" className="mt-0.5 text-[9px]">Compatible</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">Activités à proximité</Label>
                    <p className="font-body text-xs text-muted-foreground">Être alerté des nouvelles activités proches</p>
                  </div>
                </div>
                <Switch checked={nearbyNotif} onCheckedChange={toggleNearbyNotif} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">Rappel d'événement</Label>
                    <p className="font-body text-xs text-muted-foreground">Me prévenir avant la date</p>
                  </div>
                </div>
                <Select value={reminderDays} onValueChange={changeReminderDays}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Info className="h-5 w-5 text-primary" />
                À propos
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
                  <span className="text-foreground font-medium">{isStandalone ? "App installée" : "Navigateur web"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connexion</span>
                  <span className="text-foreground font-medium">{navigator.onLine ? "En ligne" : "Hors ligne"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Settings;
