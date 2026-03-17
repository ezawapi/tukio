import { Calendar, MapPin, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  category: string;
  image: string;
  attendees: number;
  price?: string;
  isLive?: boolean;
  compact?: boolean;
}

const EventCard = ({ title, date, location, category, image, attendees, price, isLive, compact = false }: EventCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-xl bg-card shadow-card transition-shadow duration-300 hover:shadow-warm"
    >
      <div className={cn("relative overflow-hidden", compact ? "h-36 sm:h-40" : "h-48")}>
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-2">
          <Badge className="border-0 bg-primary text-xs text-primary-foreground">{category}</Badge>
          {isLive && (
            <Badge className="animate-pulse-live border-0 bg-destructive text-xs text-destructive-foreground">
              🔴 LIVE
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm" aria-hidden="true">
          <Heart className="h-4 w-4" />
        </div>
        {price && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-background/90 font-semibold text-foreground backdrop-blur-sm">
              {price}
            </Badge>
          </div>
        )}
      </div>
      <div className={cn("space-y-2.5", compact ? "p-3" : "p-4")}>
        <h3 className={cn("font-display font-semibold leading-tight text-card-foreground line-clamp-2", compact ? "text-base" : "text-lg")}>
          {title}
        </h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{attendees} participants</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
