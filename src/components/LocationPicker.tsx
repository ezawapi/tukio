import { useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUserLocation, type UserLocation } from "@/hooks/use-user-location";

/** Preset cities (DRC focus + main diaspora hubs). */
const PRESET_CITIES: (UserLocation & { country: string })[] = [
  { label: "Kinshasa", country: "RDC", lat: -4.4419, lng: 15.2663 },
  { label: "Lubumbashi", country: "RDC", lat: -11.6876, lng: 27.5026 },
  { label: "Goma", country: "RDC", lat: -1.6792, lng: 29.2228 },
  { label: "Bukavu", country: "RDC", lat: -2.5083, lng: 28.8608 },
  { label: "Mbuji-Mayi", country: "RDC", lat: -6.15, lng: 23.6 },
  { label: "Kisangani", country: "RDC", lat: 0.5151, lng: 25.1908 },
  { label: "Matadi", country: "RDC", lat: -5.8167, lng: 13.45 },
  { label: "Kananga", country: "RDC", lat: -5.8964, lng: 22.4147 },
  { label: "Bunia", country: "RDC", lat: 1.5667, lng: 30.25 },
  { label: "Likasi", country: "RDC", lat: -10.9833, lng: 26.7833 },
  { label: "Brazzaville", country: "Congo", lat: -4.2634, lng: 15.2429 },
  { label: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { label: "Bruxelles", country: "Belgique", lat: 50.8503, lng: 4.3517 },
  { label: "Londres", country: "Royaume-Uni", lat: 51.5074, lng: -0.1278 },
  { label: "Montréal", country: "Canada", lat: 45.5017, lng: -73.5673 },
  { label: "New York", country: "États-Unis", lat: 40.7128, lng: -74.006 },
];

interface LocationPickerProps {
  /** Compact pill variant for inline use in headers */
  compact?: boolean;
}

const LocationPicker = ({ compact = false }: LocationPickerProps) => {
  const { location, source, setManual } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = PRESET_CITIES.filter(
    (c) =>
      !query.trim() ||
      c.label!.toLowerCase().includes(query.toLowerCase()) ||
      c.country.toLowerCase().includes(query.toLowerCase()),
  );

  const triggerLabel = location?.label
    ? location.label
    : source === "gps"
      ? "Ma position"
      : "Choisir une ville";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className="gap-1.5 font-body"
          aria-label="Choisir une ville ou zone"
        >
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="truncate max-w-[140px]">{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Choisir une ville ou zone</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground font-body">
          Sélectionnez une ville pour personnaliser les événements affichés selon votre proximité.
          Si la géolocalisation est refusée ou indisponible, votre choix sera utilisé.
        </p>

        {source === "manual" && location?.label && (
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span className="font-body">
              Ville actuelle : <strong>{location.label}</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setManual(null);
                setOpen(false);
              }}
            >
              <X className="mr-1 h-3 w-3" /> Effacer
            </Button>
          </div>
        )}

        <Input
          placeholder="Rechercher (Kinshasa, Paris, …)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="max-h-[320px] overflow-y-auto rounded-md border border-border divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground font-body">
              Aucune ville trouvée.
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setManual({ lat: c.lat, lng: c.lng, label: c.label });
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent transition-colors"
              >
                <span className="font-body text-sm text-foreground">{c.label}</span>
                <span className="font-body text-xs text-muted-foreground">{c.country}</span>
              </button>
            ))
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => {
            setManual(null);
            setOpen(false);
          }}
        >
          <Navigation className="h-3.5 w-3.5" />
          Utiliser ma position GPS
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPicker;
