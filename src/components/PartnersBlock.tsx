import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
}

const fetchPartners = async (): Promise<Partner[]> => {
  const { data, error } = await supabase
    .from("partners")
    .select("id, name, logo_url, website_url")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data as Partner[]) || [];
};

const PartnersBlock = () => {
  const { data: partners = [] } = useQuery({
    queryKey: ["partners", "active"],
    queryFn: fetchPartners,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (partners.length === 0) return null;

  return (
    <section className="py-3">
      <div className="relative overflow-hidden rounded-lg bg-foreground px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative flex flex-col items-center text-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/10 px-3 py-1 text-[11px] font-medium text-background/70">
            <Handshake className="h-3.5 w-3.5" />
            Nos partenaires
          </span>
          <h3 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-background">
            Ils nous font confiance
          </h3>
          <p className="mt-1.5 max-w-md font-body text-sm text-background/60">
            Un écosystème d'acteurs qui soutiennent la vie événementielle.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
          {partners.map((p) => (
            <a
              key={p.id}
              href={p.website_url || undefined}
              target={p.website_url ? "_blank" : undefined}
              rel={p.website_url ? "noopener noreferrer" : undefined}
              className="group flex h-20 items-center justify-center rounded-md bg-background px-4 shadow-sm ring-1 ring-background/10 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:h-24"
              title={p.name}
            >
              <img
                src={p.logo_url}
                alt={p.name}
                loading="lazy"
                decoding="async"
                className="max-h-12 w-auto max-w-[120px] object-contain opacity-90 transition-opacity group-hover:opacity-100 sm:max-h-14"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersBlock;
