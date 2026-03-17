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
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-center shadow-card transition-all hover:shadow-warm sm:gap-3 sm:px-4 sm:py-5"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-background/30 shadow-sm transition-transform group-hover:scale-110 sm:h-14 sm:w-14 ${color}`}>
        <Icon className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
      </div>
      <div className="space-y-0.5">
        <p className="font-body text-sm font-semibold leading-tight text-card-foreground">{name}</p>
        <p className="font-body text-xs text-muted-foreground">{count} événements</p>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
