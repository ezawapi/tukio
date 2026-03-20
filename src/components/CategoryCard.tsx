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
      whileTap={{ scale: 0.97 }}
      className="group flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3 text-center shadow-card transition-all hover:shadow-warm sm:gap-2 sm:px-3 sm:py-4"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border border-background/30 shadow-sm transition-transform group-hover:scale-110 sm:h-11 sm:w-11 sm:rounded-2xl ${color}`}>
        <Icon className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
      </div>
      <div className="space-y-0.5">
        <p className="font-body text-[11px] font-semibold leading-tight text-card-foreground sm:text-xs">{name}</p>
        <p className="font-body text-[10px] text-muted-foreground sm:text-xs">{count} évén.</p>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
