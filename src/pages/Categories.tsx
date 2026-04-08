import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { icons as lucideIcons } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/contexts/I18nContext";

const toPascal = (kebab: string) => kebab.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
const DynIcon = ({ name, className }: { name: string; className?: string }) => {
  const Comp = (lucideIcons as any)[toPascal(name)];
  if (!Comp) {
    const Globe = (lucideIcons as any)["Globe"];
    return Globe ? <Globe className={className} /> : null;
  }
  return <Comp className={className} />;
};

const categoryColorMap: Record<string, string> = {
  "bg-emerald": "hsl(160,60%,38%)", "bg-amber": "hsl(38,90%,50%)",
  "bg-blue": "hsl(205,65%,45%)", "bg-green": "hsl(142,55%,38%)",
  "bg-purple": "hsl(270,55%,50%)", "bg-pink": "hsl(330,65%,50%)",
  "bg-orange": "hsl(25,90%,50%)", "bg-indigo": "hsl(240,50%,50%)",
  "bg-slate": "hsl(215,20%,42%)", "bg-cyan": "hsl(190,65%,38%)",
  "bg-red": "hsl(0,70%,50%)", "bg-rose": "hsl(350,60%,50%)",
  "bg-teal": "hsl(170,50%,38%)", "bg-primary": "hsl(205,65%,45%)",
  "bg-secondary": "hsl(35,70%,52%)", "bg-accent": "hsl(38,80%,50%)",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const Categories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from("categories").select("*").order("name");
    if (cats) {
      setCategories(cats);
      setLoading(false);
      const counts: Record<string, number> = {};
      await Promise.all(
        cats.map(async (cat) => {
          const { count } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("is_published", true)
            .eq("visibility", "public");
          counts[cat.id] = count || 0;
        }),
      );
      setEventCounts(counts);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 md:w-[80%] md:px-0 max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{t("home.categories")}</h1>
            <p className="font-body text-muted-foreground mt-2 text-sm sm:text-base">{t("home.categories_sub")}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl sm:h-40" />
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4"
            >
              {categories.map((cat) => {
                const color = categoryColorMap[cat.color] || "hsl(205,65%,45%)";
                const count = eventCounts[cat.id] || 0;
                return (
                  <motion.div key={cat.id} variants={itemVariants}>
                    <Link to={`/events?category=${cat.id}`}>
                      <div className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 sm:gap-4 sm:p-6">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform group-hover:scale-110 sm:h-14 sm:w-14"
                          style={{ backgroundColor: color }}
                        >
                          <DynIcon name={cat.icon} className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-body text-sm font-bold text-card-foreground sm:text-base">{cat.name}</p>
                          <p className="font-body text-xs text-muted-foreground sm:text-sm">
                            {count} {count <= 1 ? "événement" : "événements"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Categories;
