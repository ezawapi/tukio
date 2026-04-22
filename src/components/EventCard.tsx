import { Calendar, MapPin, Users, Heart, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCountdown } from "@/lib/countdown";
import { getEventImage } from "@/lib/event-image";

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
  eventDate?: string;
  endDate?: string | null;
}

const EventCard = ({ title, date, location, category, image, attendees, price, isLive, compact = false, eventDate, endDate }: EventCardProps) => {
  const countdown = eventDate ? getCountdown(eventDate, endDate) : null;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-xl bg-card shadow-card transition-shadow duration-300 hover:shadow-warm"
    >
      <div className={cn("relative overflow-hidden", compact ? "h-28 sm:h-36" : "h-40 sm:h-48")}>
        <img src={getEventImage(image)} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute left-2 top-2 flex max-w-[70%] flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
          <Badge className="border-0 bg-primary text-[10px] text-primary-foreground sm:text-xs">{category}</Badge>
          {isLive && (
            <Badge className="animate-pulse-live border-0 bg-destructive text-[10px] text-destructive-foreground sm:text-xs">
              🔴 LIVE
            </Badge>
          )}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1.5 sm:right-3 sm:top-3">
          {countdown && (
            <Badge className={cn(
              "border-0 text-[10px] font-bold backdrop-blur-sm sm:text-xs",
              countdown === "Aujourd'hui" ? "bg-destructive/90 text-destructive-foreground" :
              countdown === "Demain" ? "bg-secondary/90 text-secondary-foreground" :
              countdown === "En cours" ? "bg-destructive/90 text-destructive-foreground animate-pulse-live" :
              "bg-muted/90 text-foreground"
            )}>
              <Clock className="mr-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {countdown}
            </Badge>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm sm:h-8 sm:w-8" aria-hidden="true">
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        {price && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
            <Badge variant="secondary" className="bg-background/90 text-[10px] font-semibold text-foreground backdrop-blur-sm sm:text-xs">
              {price}
            </Badge>
          </div>
        )}
      </div>
      <div className={cn("space-y-1.5 sm:space-y-2", compact ? "p-2.5 sm:p-3" : "p-3 sm:p-4")}>
        <h3 className={cn("font-display font-semibold leading-tight text-card-foreground line-clamp-2", compact ? "text-sm sm:text-base" : "text-base sm:text-lg")}>
          {title}
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
            <Calendar className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
            <span className="truncate">{date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
            <MapPin className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        {attendees > 0 && (
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:gap-1.5 sm:text-xs">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{attendees} participants</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
