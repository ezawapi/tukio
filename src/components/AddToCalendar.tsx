import { CalendarPlus, Download, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarItem, downloadIcs, googleCalendarUrl } from "@/lib/calendar-export";

interface Props {
  item: CalendarItem;
  className?: string;
  iconOnly?: boolean;
}

const AddToCalendar = ({ item, className, iconOnly }: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size={iconOnly ? "icon" : "default"} className={className} aria-label="Ajouter au calendrier">
        <CalendarPlus className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} />
        {!iconOnly && "Calendrier"}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem asChild>
        <a href={googleCalendarUrl(item)} target="_blank" rel="noopener noreferrer">
          <CalendarPlus className="mr-2 h-4 w-4" /> Google Calendar
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => downloadIcs(item)}>
        <Apple className="mr-2 h-4 w-4" /> Apple Calendar
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => downloadIcs(item)}>
        <Download className="mr-2 h-4 w-4" /> Fichier .ics (Outlook…)
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default AddToCalendar;
