import { useState } from "react";
import { Smartphone, Tablet, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderBannerCard } from "@/components/PromotionalBanner";

type Size = "mobile" | "tablet" | "desktop";

const SIZES: Record<Size, { width: string; cols: string; label: string; icon: any }> = {
  mobile: { width: "375px", cols: "grid-cols-2", label: "Mobile (375px)", icon: Smartphone },
  tablet: { width: "768px", cols: "grid-cols-4", label: "Tablette (768px)", icon: Tablet },
  desktop: { width: "1280px", cols: "grid-cols-4", label: "Desktop (1280px)", icon: Monitor },
};

interface Props {
  current: any;
  others: any[];
}

const BannerPreviewMultiSize = ({ current, others }: Props) => {
  const [size, setSize] = useState<Size>("desktop");
  const cfg = SIZES[size];
  const filler = [current, ...others].slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {(Object.keys(SIZES) as Size[]).map((s) => {
          const Icon = SIZES[s].icon;
          return (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={size === s ? "default" : "outline"}
              onClick={() => setSize(s)}
              className="gap-1.5 h-8"
            >
              <Icon className="h-3.5 w-3.5" /> {SIZES[s].label}
            </Button>
          );
        })}
      </div>
      <div className="rounded-lg bg-muted/40 p-3 overflow-x-auto">
        <div className="mx-auto transition-all duration-300" style={{ width: cfg.width, maxWidth: "100%" }}>
          <div className={`grid gap-3 items-stretch ${cfg.cols}`}>
            {filler.map((b, i) => (
              <div key={b.id || `slot-${i}`} className={i === 0 ? "ring-2 ring-primary/60 rounded-2xl" : "opacity-60"}>
                {renderBannerCard(b)}
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Votre bannière est encadrée. Hauteur identique sur toutes les tailles d'écran.
        </p>
      </div>
    </div>
  );
};

export default BannerPreviewMultiSize;
