import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Mic2, Palette, Trophy, Church, GraduationCap, PartyPopper, Globe, Landmark, Lock, LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, LucideIcon> = {
  music: Music,
  "mic-2": Mic2,
  palette: Palette,
  trophy: Trophy,
  church: Church,
  "graduation-cap": GraduationCap,
  "party-popper": PartyPopper,
  globe: Globe,
  landmark: Landmark,
  lock: Lock,
};

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cats } = await supabase.from("categories").select("*").order("name");
    if (cats) {
      setCategories(cats);
      // Get counts per category
      const counts: Record<string, number> = {};
      for (const cat of cats) {
        const { count } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("category_id", cat.id)
          .eq("is_published", true)
          .eq("visibility", "public");
        counts[cat.id] = count || 0;
      }
      setEventCounts(counts);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Catégories</h1>
            <p className="font-body text-muted-foreground mt-1">Explorez les événements par catégorie</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat, i) => {
              const Icon = iconMap[cat.icon] || Globe;
              return (
                <Link key={cat.id} to={`/events?category=${cat.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card shadow-card hover:shadow-warm transition-all cursor-pointer group"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${cat.color} transition-transform group-hover:scale-110`}>
                      <Icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-body font-semibold text-sm text-card-foreground">{cat.name}</p>
                      <p className="font-body text-xs text-muted-foreground">{eventCounts[cat.id] || 0} événements</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Categories;
