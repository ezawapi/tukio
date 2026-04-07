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
  "bg-emerald": "bg-[hsl(160,60%,38%)]", "bg-amber": "bg-[hsl(38,90%,50%)]",
  "bg-blue": "bg-primary", "bg-green": "bg-[hsl(142,55%,38%)]",
  "bg-purple": "bg-[hsl(270,55%,50%)]", "bg-pink": "bg-[hsl(330,65%,50%)]",
  "bg-orange": "bg-secondary", "bg-indigo": "bg-[hsl(240,50%,50%)]",
  "bg-slate": "bg-[hsl(215,20%,42%)]", "bg-cyan": "bg-[hsl(190,65%,38%)]",
  "bg-red": "bg-accent", "bg-rose": "bg-[hsl(350,60%,50%)]",
  "bg-teal": "bg-[hsl(170,50%,38%)]", "bg-primary": "bg-primary",
  "bg-secondary": "bg-secondary", "bg-accent": "bg-accent",
};

const categoryBgMap: Record<string, string> = {
  "bg-emerald": "bg-[hsl(160,60%,38%,0.08)]", "bg-amber": "bg-[hsl(38,90%,50%,0.08)]",
  "bg-blue": "bg-primary/5", "bg-green": "bg-[hsl(142,55%,38%,0.08)]",
  "bg-purple": "bg-[hsl(270,55%,50%,0.08)]", "bg-pink": "bg-[hsl(330,65%,50%,0.08)]",
  "bg-orange": "bg-secondary/5", "bg-indigo": "bg-[hsl(240,50%,50%,0.08)]",
  "bg-slate": "bg-[hsl(215,20%,42%,0.08)]", "bg-cyan": "bg-[hsl(190,65%,38%,0.08)]",
  "bg-red": "bg-accent/5", "bg-rose": "bg-[hsl(350,60%,50%,0.08)]",
  "bg-teal": "bg-[hsl(170,50%,38%,0.08)]", "bg-primary": "bg-primary/5",
  "bg-secondary": "bg-secondary/5", "bg-accent": "bg-accent/5",
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
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{t("home.categories")}</h1>
            <p className="font-body text-muted-foreground mt-2 text-sm sm:text-base">{t("home.categories_sub")}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl sm:h-48" />
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4"
            >
              {categories.map((cat) => {
                const Icon = iconMap[cat.icon] || Globe;
                const colorClass = categoryColorMap[cat.color] || "bg-primary";
                const bgTint = categoryBgMap[cat.color] || "bg-primary/5";
                const count = eventCounts[cat.id] || 0;
                return (
                  <motion.div key={cat.id} variants={itemVariants}>
                    <Link to={`/events?category=${cat.id}`}>
                      <div className={`group relative flex flex-col items-center gap-4 rounded-2xl border border-border ${bgTint} p-5 text-center shadow-card transition-all hover:shadow-warm hover:-translate-y-1 sm:gap-5 sm:p-7`}>
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorClass} shadow-md transition-transform group-hover:scale-110 sm:h-16 sm:w-16`}>
                          <Icon className="h-7 w-7 text-primary-foreground sm:h-8 sm:w-8" />
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
