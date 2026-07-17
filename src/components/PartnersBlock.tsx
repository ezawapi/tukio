import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

/**
 * Build a lightweight srcSet when the logo is served through Supabase Storage.
 * Supabase Image Transformation accepts `width` / `quality` query params on
 * `/storage/v1/render/image/...`. For any other host we simply return the
 * original URL — browsers will just use the `src` fallback.
 */
const buildLogoSources = (url: string) => {
  try {
    const u = new URL(url, window.location.origin);
    const isSupabaseRender = u.pathname.includes("/storage/v1/render/image/");
    const isSupabaseObject = u.pathname.includes("/storage/v1/object/");
    if (!isSupabaseRender && !isSupabaseObject) {
      return { src: url, srcSet: undefined as string | undefined };
    }
    // Promote object → render endpoint for on-the-fly resize
    if (isSupabaseObject) {
      u.pathname = u.pathname.replace("/storage/v1/object/", "/storage/v1/render/image/");
    }
    const make = (w: number) => {
      const cloned = new URL(u.toString());
      cloned.searchParams.set("width", String(w));
      cloned.searchParams.set("quality", "70");
      cloned.searchParams.set("resize", "contain");
      return `${cloned.toString()} ${w}w`;
    };
    return {
      src: (() => {
        const c = new URL(u.toString());
        c.searchParams.set("width", "240");
        c.searchParams.set("quality", "70");
        c.searchParams.set("resize", "contain");
        return c.toString();
      })(),
      srcSet: [make(120), make(240), make(360)].join(", "),
    };
  } catch {
    return { src: url, srcSet: undefined };
  }
};

const PartnersSkeleton = () => (
  <section className="mt-10">
    <div className="relative overflow-hidden rounded-3xl bg-[#0b1220] px-6 py-10 sm:px-10 sm:py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <Skeleton className="h-6 w-32 rounded-full bg-white/10" />
        <Skeleton className="mt-3 h-8 w-64 bg-white/10" />
        <Skeleton className="mt-2 h-4 w-80 bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/10 sm:h-24" />
        ))}
      </div>
    </div>
  </section>
);

const PartnersBlock = () => {
  const { data: partners, isLoading } = useQuery({
    queryKey: ["partners", "active"],
    queryFn: fetchPartners,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) return <PartnersSkeleton />;
  if (!partners || partners.length === 0) return null;

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
          {partners.map((p) => {
            const { src, srcSet } = buildLogoSources(p.logo_url);
            return (
              <a
                key={p.id}
                href={p.website_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-20 items-center justify-center rounded-xl bg-white/95 px-4 shadow-sm ring-1 ring-white/10 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg sm:h-24"
                title={p.name}
              >
                <img
                  src={src}
                  srcSet={srcSet}
                  sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 45vw"
                  alt={p.name}
                  width={240}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  className="max-h-12 w-auto max-w-[120px] object-contain opacity-90 transition-opacity group-hover:opacity-100 sm:max-h-14"
                />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PartnersBlock;
