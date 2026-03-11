import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  count: number;
  color: string;
}

const CategoryCard = ({ name, icon: Icon, count, color }: CategoryCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card shadow-card hover:shadow-warm transition-all cursor-pointer group"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="text-center">
        <p className="font-body font-semibold text-sm text-card-foreground">{name}</p>
        <p className="font-body text-xs text-muted-foreground">{count} événements</p>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
