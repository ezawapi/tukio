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
  const { data } = await supabase
    .from("partners")
    .select("id, name, logo_url, website_url")
    .eq("is_active", true)
    .order("display_order");
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
    <section className="mt-10">
      <div className="relative overflow-hidden rounded-3xl bg-[#0b1220] px-6 py-10 sm:px-10 sm:py-12">
        {/* subtle radial glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative flex flex-col items-center text-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-sm">
            <Handshake className="h-3.5 w-3.5" />
            Nos partenaires
          </span>
          <h3 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-white">
            Ils nous font confiance
          </h3>
          <p className="mt-1.5 max-w-md font-body text-sm text-white/60">
            Un écosystème d'acteurs qui soutiennent la vie événementielle.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
          {partners.map((p) => (
            <a
              key={p.id}
              href={p.website_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-20 items-center justify-center rounded-xl bg-white/95 px-4 shadow-sm ring-1 ring-white/10 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg sm:h-24"
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
