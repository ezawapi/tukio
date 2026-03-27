import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook that checks user's favorite events and shows toast notifications
 * when an event is approaching based on user's reminder setting (localStorage).
 * Default: J-1. Runs once per session.
 */
export function useFavoriteAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user || checkedRef.current) return;
    checkedRef.current = true;

    const checkFavorites = async () => {
      const reminderDays = parseInt(localStorage.getItem("tukio_reminder_days") || "1", 10);
      if (reminderDays === 0) return; // disabled

      const { data: favorites } = await supabase
        .from("favorites")
        .select("events(id, title, date)")
        .eq("user_id", user.id);

      if (!favorites?.length) return;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      favorites.forEach((fav: any) => {
        const event = fav.events;
        if (!event?.date) return;

        const eventDate = new Date(event.date);
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          toast({
            title: "🎉 C'est aujourd'hui !",
            description: `« ${event.title} » commence aujourd'hui !`,
          });
        } else if (diffDays === 1) {
          toast({
            title: "🔔 Demain !",
            description: `« ${event.title} » a lieu demain. Ne le manquez pas !`,
          });
        } else if (diffDays > 1 && diffDays <= reminderDays) {
          toast({
            title: `📅 Dans ${diffDays} jours`,
            description: `« ${event.title} » approche. Préparez-vous !`,
          });
        }
      });
    };

    const timer = setTimeout(checkFavorites, 2000);
    return () => clearTimeout(timer);
  }, [user]);
}
