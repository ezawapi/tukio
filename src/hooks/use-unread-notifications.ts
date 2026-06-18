import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeChannel } from "@/lib/realtime-guard";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadNotifications() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }

    const fetch = async () => {
      const { count: c } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setCount(c || 0);
    };

    fetch();

    const channel = safeChannel("unread-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return count;
}
