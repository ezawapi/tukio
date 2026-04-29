-- Partners indexes (pagination/tri serveur)
CREATE INDEX IF NOT EXISTS idx_partners_display_order ON public.partners (display_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON public.partners (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partners_name_lower ON public.partners (lower(name));
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners (is_active);
CREATE INDEX IF NOT EXISTS idx_partners_active_order ON public.partners (is_active, display_order ASC);

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions (role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_role_perm_unique ON public.role_permissions (role, permission);

-- User roles index (resolve roles per user)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
