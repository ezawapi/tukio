import { useState } from "react";
import { Download, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { detectNativePlatform, getReleaseUrl, nativeReleases } from "@/lib/native-releases";

export default function NativeInstaller() {
  const [open, setOpen] = useState(false);
  const platform = detectNativePlatform(navigator.userAgent, navigator.maxTouchPoints);
  const releases = [...nativeReleases].sort((a, b) => Number(b.platform === platform) - Number(a.platform === platform));
  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full gap-2"><Download /> Installer Tukio</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Installer Tukio</DialogTitle>
            <DialogDescription>Les versions natives ne sont pas encore disponibles au téléchargement.</DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border">
            {releases.map(release => {
              const url = getReleaseUrl(release);
              const Icon = release.platform === "android" || release.platform === "ios" ? Smartphone : Monitor;
              return (
                <div key={release.platform} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{release.label}</p>
                      {release.platform === platform && <p className="text-xs text-muted-foreground">Votre appareil</p>}
                    </div>
                  </div>
                  {url ? <Button asChild size="sm"><a href={url} download={url.startsWith("/downloads/") ? release.filename : undefined} rel="noopener noreferrer"><Download /> Télécharger</a></Button>
                    : <Badge variant="outline" className="shrink-0 text-xs">À venir</Badge>}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}