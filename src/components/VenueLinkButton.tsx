import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeVenueUrl } from "@/lib/venue-link";

const VenueLinkButton = ({ url, venueName }: { url?: string | null; venueName?: string | null }) => {
  const href = normalizeVenueUrl(url);
  if (!href) return null;
  return (
    <Button asChild variant="outline" size="sm" className="mt-2 gap-2 max-w-full">
      <a href={href} target="_blank" rel="noopener noreferrer" title={venueName ? `Voir ${venueName} sur EzaWapi` : "Voir le lieu sur EzaWapi"}>
        <MapPin className="h-4 w-4 shrink-0" /> EzaWapi <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    </Button>
  );
};

export default VenueLinkButton;