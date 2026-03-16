import { Calendar, MapPin, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  category: string;
  image: string;
  attendees: number;
  price?: string;
  isLive?: boolean;
}

const EventCard = ({ title, date, location, category, image, attendees, price, isLive }: EventCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl overflow-hidden bg-card shadow-card hover:shadow-warm transition-shadow duration-300 cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground border-0 text-xs">{category}</Badge>
          {isLive && (
            <Badge className="bg-destructive text-destructive-foreground border-0 text-xs animate-pulse-live">
              🔴 LIVE
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground" aria-hidden="true">
          <Heart className="h-4 w-4" />
        </div>
        {price && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground font-semibold">
              {price}
            </Badge>
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-display font-semibold text-lg text-card-foreground line-clamp-2 leading-tight">{title}</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>{attendees} participants</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
