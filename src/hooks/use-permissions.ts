import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "moderator";

export type Permission =
  | "events.moderate"
  | "events.delete"
  | "events.publish"
  | "notifications.view"
  | "ads.manage"
  | "banners.manage"
  | "partners.manage"
  | "content.manage"
  | "categories.manage"
  | "users.manage"
  | "roles.manage"
  | "analytics.view";

interface PermissionsState {
  loading: boolean;
  role: AppRole | "user";
  permissions: Set<Permission>;
  can: (p: Permission) => boolean;
  refresh: () => Promise<void>;
}

export const usePermissions = (): PermissionsState => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | "user">("user");
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());

  const load = async () => {
    if (!user) {
      setRole("user");
      setPermissions(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (roleRows || []).map((r) => r.role as AppRole | "user");
    const resolved: AppRole | "user" = roles.includes("admin")
      ? "admin"
      : roles.includes("moderator")
        ? "moderator"
        : "user";
    setRole(resolved);

    if (resolved === "user") {
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    const { data: perms } = await supabase
      .from("role_permissions")
      .select("permission")
      .eq("role", resolved);
    setPermissions(new Set((perms || []).map((p) => p.permission as Permission)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    loading,
    role,
    permissions,
    can: (p) => permissions.has(p),
    refresh: load,
  };
};
