import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, Bell, Info, MapPin, Calendar as CalendarIcon, Sun, Moon, Type, Languages } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationPicker from "@/components/LocationPicker";
import { useUserLocation } from "@/hooks/use-user-location";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, LANGUAGES } from "@/contexts/I18nContext";
import type { Lang } from "@/contexts/I18nContext";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Settings = () => {
  const { toast } = useToast();
  const { t, lang, setLang } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [nearbyNotif, setNearbyNotif] = useState(() => localStorage.getItem("tukio_notify_nearby") === "true");
  const [reminderDays, setReminderDays] = useState(() => localStorage.getItem("tukio_reminder_days") || "1");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("tukio_dark_mode") === "true" || document.documentElement.classList.contains("dark"));
  const [textSize, setTextSize] = useState(() => localStorage.getItem("tukio_text_size") || "medium");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({ title: t("settings.installed") });
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("tukio_dark_mode", String(darkMode));
  }, [darkMode]);

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
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const toggleNearbyNotif = (checked: boolean) => {
    setNearbyNotif(checked);
    localStorage.setItem("tukio_notify_nearby", String(checked));
  };

  const changeReminderDays = (value: string) => {
    setReminderDays(value);
    localStorage.setItem("tukio_reminder_days", value);
  };

  const changeLanguage = (value: string) => {
    setLang(value as Lang);
    toast({ title: LANGUAGES.find(l => l.value === value)?.label || value });
  };

  const REMINDER_OPTIONS = [
    { value: "0", label: t("settings.reminder_off") },
    { value: "2", label: t("settings.reminder_2d") },
    { value: "3", label: t("settings.reminder_3d") },
    { value: "5", label: t("settings.reminder_5d") },
    { value: "7", label: t("settings.reminder_7d") },
  ];

  const TEXT_SIZE_OPTIONS = [
    { value: "small", label: t("settings.size_small") },
    { value: "medium", label: t("settings.size_medium") },
    { value: "large", label: t("settings.size_large") },
  ];

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto max-w-2xl px-4 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t("settings.title")}</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
          </div>

          {/* Appearance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Sun className="h-5 w-5 text-primary" /> {t("settings.appearance")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {darkMode ? <Moon className="h-4 w-4 text-primary shrink-0" /> : <Sun className="h-4 w-4 text-primary shrink-0" />}
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">{t("settings.dark_mode")}</Label>
                    <p className="font-body text-xs text-muted-foreground">{t("settings.dark_mode_desc")}</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Type className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">{t("settings.text_size")}</Label>
                    <p className="font-body text-xs text-muted-foreground">{t("settings.text_size_desc")}</p>
                  </div>
                </div>
                <Select value={textSize} onValueChange={setTextSize}>
                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
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
                    <Label className="font-body text-sm font-medium text-foreground">{t("settings.language")}</Label>
                    <p className="font-body text-xs text-muted-foreground">{t("settings.language_desc")}</p>
                  </div>
                </div>
                <Select value={lang} onValueChange={changeLanguage}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((opt) => (
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
                <Smartphone className="h-5 w-5 text-primary" /> {t("settings.install")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstalled || isStandalone ? (
                <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-3">
                  <Download className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-body font-semibold text-foreground text-sm">{t("settings.installed")}</p>
                    <p className="font-body text-xs text-muted-foreground">{t("settings.installed_desc")}</p>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted-foreground">{t("settings.install_desc")}</p>
                  <Button onClick={handleInstall} className="w-full gradient-hero text-primary-foreground border-0 gap-2">
                    <Download className="h-4 w-4" /> {t("settings.install_btn")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted-foreground">{t("settings.install_browser")}</p>
                  {isIOS ? (
                    <div className="rounded-xl border border-border bg-muted/50 p-3 space-y-2">
                      <p className="font-body text-sm font-semibold text-foreground">📱 iPhone / iPad</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/50 p-3 space-y-2">
                      <p className="font-body text-sm font-semibold text-foreground">📱 Android / Desktop</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg border border-border p-2 text-center">
                  <Monitor className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-body text-[10px] text-muted-foreground">{t("settings.computer")}</p>
                  <Badge variant="outline" className="mt-0.5 text-[9px]">{t("settings.compatible")}</Badge>
                </div>
                <div className="rounded-lg border border-border p-2 text-center">
                  <Smartphone className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-body text-[10px] text-muted-foreground">{t("settings.mobile")}</p>
                  <Badge variant="outline" className="mt-0.5 text-[9px]">{t("settings.compatible")}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Bell className="h-5 w-5 text-primary" /> {t("settings.notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">{t("settings.nearby_notif")}</Label>
                    <p className="font-body text-xs text-muted-foreground">{t("settings.nearby_notif_desc")}</p>
                  </div>
                </div>
                <Switch checked={nearbyNotif} onCheckedChange={toggleNearbyNotif} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-body text-sm font-medium text-foreground">{t("settings.reminder")}</Label>
                    <p className="font-body text-xs text-muted-foreground">{t("settings.reminder_desc")}</p>
                  </div>
                </div>
                <Select value={reminderDays} onValueChange={changeReminderDays}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
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
                <Info className="h-5 w-5 text-primary" /> {t("settings.about")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("settings.version")}</span>
                  <span className="text-foreground font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("settings.platform")}</span>
                  <span className="text-foreground font-medium">{isStandalone ? t("settings.platform_app") : t("settings.platform_web")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("settings.connection")}</span>
                  <span className="text-foreground font-medium">{navigator.onLine ? t("settings.online") : t("settings.offline")}</span>
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
