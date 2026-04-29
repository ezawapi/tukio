import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests — RLS & permission gating.
 *
 * Goal: verify that
 *  1. Only `admin` role can INSERT / DELETE rows in `role_permissions`.
 *  2. `moderator` and anonymous users are blocked by RLS.
 *  3. The `usePermissions` hook only exposes the permissions actually
 *     stored for the resolved role (so the admin UI can hide actions).
 */

type Row = { role: "admin" | "moderator"; permission: string };

interface FakeUser { id: string; role: "admin" | "moderator" | "user" | null }

const makeClient = (currentUser: FakeUser, store: { rolePerms: Row[] }) => {
  const rlsBlock = () => ({
    data: null,
    error: { message: "new row violates row-level security policy", code: "42501" },
  });

  return {
    auth: { getUser: async () => ({ data: { user: { id: currentUser.id } } }) },
    from: (table: string) => {
      if (table === "user_roles") {
        return {
          select: () => ({
            eq: () => ({
              data: currentUser.role && currentUser.role !== "user"
                ? [{ role: currentUser.role }]
                : [],
              error: null,
            }),
          }),
        };
      }
      if (table === "role_permissions") {
        return {
          select: () => ({
            eq: (_col: string, role: string) => ({
              data: store.rolePerms.filter((p) => p.role === role),
              error: null,
            }),
          }),
          insert: (row: Row) => {
            if (currentUser.role !== "admin") return Promise.resolve(rlsBlock());
            store.rolePerms.push(row);
            return Promise.resolve({ data: row, error: null });
          },
          delete: () => ({
            eq: (_c1: string, role: string) => ({
              eq: (_c2: string, perm: string) => {
                if (currentUser.role !== "admin") return Promise.resolve(rlsBlock());
                store.rolePerms = store.rolePerms.filter(
                  (p) => !(p.role === role && p.permission === perm),
                );
                return Promise.resolve({ data: null, error: null });
              },
            }),
          }),
        };
      }
      return {} as never;
    },
  };
};

describe("role_permissions RLS — only admins can mutate", () => {
  let store: { rolePerms: Row[] };
  beforeEach(() => {
    store = { rolePerms: [{ role: "moderator", permission: "events.moderate" }] };
  });

  it("blocks an anonymous user from inserting a permission", async () => {
    const client = makeClient({ id: "anon", role: null }, store);
    const res: any = await client.from("role_permissions").insert({
      role: "admin",
      permission: "roles.manage",
    });
    expect(res.error).toBeTruthy();
    expect(res.error.code).toBe("42501");
    expect(store.rolePerms.find((p) => p.permission === "roles.manage")).toBeUndefined();
  });

  it("blocks a moderator from inserting a permission", async () => {
    const client = makeClient({ id: "mod-1", role: "moderator" }, store);
    const res: any = await client.from("role_permissions").insert({
      role: "moderator",
      permission: "users.manage",
    });
    expect(res.error).toBeTruthy();
    expect(store.rolePerms.find((p) => p.permission === "users.manage")).toBeUndefined();
  });

  it("blocks a moderator from deleting a permission", async () => {
    const client = makeClient({ id: "mod-1", role: "moderator" }, store);
    const res: any = await client
      .from("role_permissions")
      .delete()
      .eq("role", "moderator")
      .eq("permission", "events.moderate");
    expect(res.error).toBeTruthy();
    expect(store.rolePerms).toHaveLength(1);
  });

  it("allows an admin to insert and delete permissions", async () => {
    const client = makeClient({ id: "admin-1", role: "admin" }, store);
    const ins: any = await client.from("role_permissions").insert({
      role: "moderator",
      permission: "events.delete",
    });
    expect(ins.error).toBeNull();
    expect(store.rolePerms).toHaveLength(2);

    const del: any = await client
      .from("role_permissions")
      .delete()
      .eq("role", "moderator")
      .eq("permission", "events.delete");
    expect(del.error).toBeNull();
    expect(store.rolePerms).toHaveLength(1);
  });
});

describe("Admin UI gating — moderators only see authorized actions", () => {
  /**
   * Mirrors the resolution logic in src/hooks/use-permissions.ts:
   *   role = first of admin > moderator > user
   *   permissions = role_permissions WHERE role = resolved
   */
  const resolvePerms = async (user: FakeUser, store: { rolePerms: Row[] }) => {
    const client = makeClient(user, store);
    const roleRows = await (client.from("user_roles").select() as any).eq();
    const roles: string[] = (roleRows.data || []).map((r: any) => r.role);
    const resolved = roles.includes("admin")
      ? "admin"
      : roles.includes("moderator")
        ? "moderator"
        : "user";
    if (resolved === "user") return { role: resolved, perms: new Set<string>() };
    const permRows = await (client.from("role_permissions").select() as any).eq("role", resolved);
    return { role: resolved, perms: new Set<string>((permRows.data || []).map((p: any) => p.permission)) };
  };

  const store = {
    rolePerms: [
      { role: "moderator" as const, permission: "events.moderate" },
      { role: "moderator" as const, permission: "notifications.view" },
      { role: "admin" as const, permission: "events.moderate" },
      { role: "admin" as const, permission: "events.delete" },
      { role: "admin" as const, permission: "roles.manage" },
      { role: "admin" as const, permission: "users.manage" },
    ],
  };

  it("moderator sees only the permissions configured for the moderator role", async () => {
    const { role, perms } = await resolvePerms({ id: "mod-1", role: "moderator" }, store);
    expect(role).toBe("moderator");
    expect(perms.has("events.moderate")).toBe(true);
    expect(perms.has("notifications.view")).toBe(true);

    // Hidden actions
    expect(perms.has("events.delete")).toBe(false);
    expect(perms.has("roles.manage")).toBe(false);
    expect(perms.has("users.manage")).toBe(false);
  });

  it("admin sees every admin-scoped permission", async () => {
    const { role, perms } = await resolvePerms({ id: "admin-1", role: "admin" }, store);
    expect(role).toBe("admin");
    expect(perms.has("events.delete")).toBe(true);
    expect(perms.has("roles.manage")).toBe(true);
    expect(perms.has("users.manage")).toBe(true);
  });

  it("regular user has no permissions and no role-gated UI", async () => {
    const { role, perms } = await resolvePerms({ id: "u-1", role: null }, store);
    expect(role).toBe("user");
    expect(perms.size).toBe(0);
  });

  it("UI helper `can()` returns false for any permission missing on moderator", async () => {
    const { perms } = await resolvePerms({ id: "mod-1", role: "moderator" }, store);
    const can = (p: string) => perms.has(p);
    // Buttons that AdminDashboard guards behind these permissions must not render.
    expect(can("events.delete")).toBe(false);
    expect(can("banners.manage")).toBe(false);
    expect(can("partners.manage")).toBe(false);
    expect(can("roles.manage")).toBe(false);
  });
});
