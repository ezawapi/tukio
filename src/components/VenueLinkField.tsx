import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeVenueUrl, VENUE_URL_ERROR } from "@/lib/venue-link";

const VenueLinkField = ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => {
  const invalid = !!value?.trim() && !normalizeVenueUrl(value);
  return (
    <div className="space-y-2">
      <Label htmlFor="venue-ezawapi-link" className="font-body">Lien du lieu sur EzaWapi (facultatif)</Label>
      <Input id="venue-ezawapi-link" value={value || ""} onChange={(e) => onChange(e.target.value)}
        placeholder="https://ezawapi.cd/…" aria-invalid={invalid} aria-describedby={invalid ? "venue-ezawapi-error" : undefined} />
      {invalid && <p id="venue-ezawapi-error" role="alert" className="text-xs text-destructive">{VENUE_URL_ERROR}</p>}
    </div>
  );
};

export default VenueLinkField;