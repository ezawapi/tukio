import { motion } from "framer-motion";
import { icons as lucideIcons } from "lucide-react";

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
  variant?: "pill" | "grid";
  className?: string;
}

const toPascal = (kebab: string) => 
  kebab.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");

const DynIcon = ({ name, className }: { name: string; className?: string }) => {
  const Comp = (lucideIcons as any)[toPascal(name)];
  if (!Comp) {
    const Globe = (lucideIcons as any)["Globe"];
    return Globe ? <Globe className={className} /> : null;
  }
  return <Comp className={className} />;
};

const CategoryCard = ({ name, icon, count, color, variant = "pill", className = "" }: CategoryCardProps) => {
  const categoryColorMap: Record<string, string> = {
    "bg-emerald": "hsl(160,60%,38%)", "bg-amber": "hsl(38,90%,50%)",
    "bg-blue": "hsl(210,70%,50%)", "bg-green": "hsl(142,55%,38%)",
    "bg-purple": "hsl(270,55%,50%)", "bg-pink": "hsl(330,65%,50%)",
    "bg-orange": "hsl(25,90%,50%)", "bg-indigo": "hsl(240,50%,50%)",
    "bg-slate": "hsl(215,20%,42%)", "bg-cyan": "hsl(190,65%,38%)",
    "bg-red": "hsl(0,70%,50%)", "bg-rose": "hsl(350,60%,50%)",
    "bg-teal": "hsl(170,50%,38%)", "bg-primary": "hsl(205,65%,45%)",
    "bg-secondary": "hsl(35,70%,52%)", "bg-accent": "hsl(38,80%,50%)",
    "bg-lime": "hsl(84,60%,45%)", "bg-fuchsia": "hsl(292,60%,50%)",
    "bg-sky": "hsl(200,80%,50%)", "bg-yellow": "hsl(50,90%,50%)",
    "bg-violet": "hsl(258,60%,55%)", "bg-stone": "hsl(30,10%,40%)",
    "bg-zinc": "hsl(240,5%,35%)", "bg-brown": "hsl(20,50%,35%)",
  };

  const bgColor = categoryColorMap[color] || color || "hsl(205,65%,45%)";

  if (variant === "grid") {
    return (
      <motion.div
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:shadow-lg sm:gap-4 sm:p-6 ${className}`}
      >
        <div 
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform group-hover:scale-110 sm:h-14 sm:w-14"
          style={{ backgroundColor: bgColor }}
        >
          <DynIcon name={icon} className="h-6 w-6 text-white sm:h-7 sm:w-7" />
        </div>
        <div className="space-y-1">
          <p className="font-body text-sm font-bold text-card-foreground sm:text-base">{name}</p>
          <p className="font-body text-xs text-muted-foreground sm:text-sm">
            {count} {count <= 1 ? "événement" : "événements"}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-2.5 py-1 shadow-sm transition-all hover:shadow-md sm:pl-1.5 sm:pr-3 sm:py-1.5 ${className}`}
    >
      <div 
        className="flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110 sm:h-7 sm:w-7"
        style={{ backgroundColor: bgColor }}
      >
        <DynIcon name={icon} className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
      </div>
      <span className="font-body text-[10px] font-medium text-card-foreground whitespace-nowrap sm:text-xs">{name}</span>
      <div className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary/20 px-1 text-[8px] font-bold text-secondary-foreground sm:h-5 sm:text-[10px]">
        {count}
      </div>
    </motion.div>
  );
};

export default CategoryCard;
