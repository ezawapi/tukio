import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "moderator" | "user";

export const useUserRole = (userId?: string) => {
  const [role, setRole] = useState<AppRole>("user");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      if (!userId) {
        setRole("user");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (cancelled) return;

      const roles = data?.map((item) => item.role) ?? [];
      const resolvedRole: AppRole = roles.includes("admin")
        ? "admin"
        : roles.includes("moderator")
          ? "moderator"
          : "user";

      setRole(resolvedRole);
      setIsAdmin(roles.includes("admin"));
      setLoading(false);
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { role, isAdmin, loading };
};
