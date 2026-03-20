import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
}

const PartnersBlock = () => {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    supabase.from("partners").select("id, name, logo_url, website_url").eq("is_active", true).order("display_order").then(({ data }) => {
      setPartners((data as Partner[]) || []);
    });
  }, []);

  if (partners.length === 0) return null;

  return (
    <div className="border-t border-border pt-8 mt-8">
      <h4 className="font-display font-semibold text-foreground mb-4 text-center">Nos partenaires</h4>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {partners.map((p) => (
          <a key={p.id} href={p.website_url || "#"} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
            <img src={p.logo_url} alt={p.name} className="h-10 w-auto max-w-[120px] object-contain grayscale hover:grayscale-0 transition-all sm:h-12" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default PartnersBlock;
