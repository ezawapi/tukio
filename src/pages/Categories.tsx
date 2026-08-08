import CategoryCard from "@/components/CategoryCard";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/contexts/I18nContext";
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
    try {
      // Parallel fetch for categories and event counts
      const [{ data: cats }, { data: evRows }] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase
          .from("events")
          .select("category_id")
          .eq("is_published", true)
          .eq("visibility", "public")
          .gte("date", new Date().toISOString())
      ]);

      if (cats) {
        setCategories(cats);
        const counts: Record<string, number> = {};
        (evRows || []).forEach((row: any) => {
          if (row.category_id) counts[row.category_id] = (counts[row.category_id] || 0) + 1;
        });
        setEventCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching categories data:", error);
    } finally {
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
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={itemVariants}>
                  <Link to={`/events?category=${cat.id}`}>
                    <CategoryCard 
                      id={cat.id}
                      name={cat.name}
                      icon={cat.icon}
                      color={cat.color}
                      count={eventCounts[cat.id] || 0}
                      variant="grid"
                    />
                  </Link>
                </motion.div>
              ))}
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
